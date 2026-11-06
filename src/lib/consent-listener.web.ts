// Web preview: listens with the browser's speech recognition (Chrome and Edge; Safari partly).
// Where the browser has none, the sheet says listening isn't available and offers manual confirm.
// Privacy: no audio is saved and transcripts are only used to detect yes/no. Chrome may send
// audio to its speech service unless on-device recognition is available, which is used when it is,
// so treat the browser as a preview with fictional patients only.

export const IS_SIMULATED_LISTENER = false;

export type ListenerHandlers = {
  /** Called with each partial or final transcript. */
  onTranscript: (text: string) => void;
  /** Recognition stopped by itself (silence timeout, error); call start() again to resume. */
  onEnd: () => void;
  /** Listening failed after it seemed to start; it won't restart until start() is called again. */
  onProblem?: (problem: ListenerProblem) => void;
};

/** network: the browser's speech service can't be reached. no-start: recognition keeps ending
 * before it starts. denied: microphone or speech recognition blocked. */
export type ListenerProblem = 'network' | 'no-start' | 'denied';

export type StartResult = 'started' | 'denied' | 'unavailable';

// The Web Speech API isn't in TypeScript's DOM types yet; this is the part used here.
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  processLocally?: boolean;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};
type RecognitionConstructor = {
  new (): Recognition;
  available?: (options: { langs: string[]; processLocally: boolean }) => Promise<string>;
};

const LANG = 'en-US';
const START_TIMEOUT_MS = 4000;
const RESTART_DELAY_MS = 300;
const MAX_RESTART_DELAY_MS = 4000;
const MAX_FAILED_STARTS = 3;
const LOCAL_CHECK_MS = 1000;

function recognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** True when the browser can recognize speech on the device, so audio doesn't leave it. */
async function canProcessLocally(Ctor: RecognitionConstructor): Promise<boolean> {
  if (!Ctor.available) return false;
  try {
    // Capped, so a slow check never holds up listening.
    const answer = await Promise.race([
      Ctor.available({ langs: [LANG], processLocally: true }),
      new Promise<string>((resolve) => setTimeout(() => resolve('timeout'), LOCAL_CHECK_MS)),
    ]);
    return answer === 'available';
  } catch {
    return false;
  }
}

/**
 * Asks for the real microphone and waits for the answer. Speech recognition started while
 * Chrome's permission is still "prompt" can end at once without an error, and restarting it
 * cancels Chrome's prompt, so the browser is asked properly first. Nothing is recorded: the
 * stream is closed straight away.
 */
async function requestMicrophone(): Promise<StartResult> {
  const media = typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
  if (!media?.getUserMedia) return 'started'; // let recognition ask for itself
  try {
    const state = await navigator.permissions?.query({ name: 'microphone' as PermissionName }).then((s) => s.state);
    if (state === 'granted') return 'started';
    if (state === 'denied') return 'denied';
  } catch {
    // Permissions API without "microphone" (Firefox, Safari): just ask.
  }
  try {
    const stream = await media.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return 'started';
  } catch (error) {
    const name = (error as { name?: string }).name;
    if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
    return 'unavailable';
  }
}

export function createConsentListener(handlers: ListenerHandlers) {
  const Ctor = recognitionConstructor();
  let recognition: Recognition | null = null;
  let active = false;
  let generation = 0; // bumped by stop(), so a start that was waiting can tell it's stale
  let micChecked = false;
  let failedStarts = 0; // sessions that ended without starting; backs off the restarts

  async function start(): Promise<StartResult> {
    if (!Ctor) return 'unavailable';
    const mine = ++generation;
    if (!active) failedStarts = 0; // a fresh start (not a restart after a pause) gets new tries
    active = true;

    if (!micChecked) {
      const mic = await requestMicrophone();
      if (mine !== generation) return 'started'; // stopped while the prompt was open
      if (mic !== 'started') {
        active = false;
        return mic;
      }
      micChecked = true;
    }

    const local = await canProcessLocally(Ctor);
    if (mine !== generation) return 'started';

    recognition?.abort();
    const next = new Ctor();
    recognition = next;
    next.lang = LANG;
    next.continuous = true;
    next.interimResults = true;
    if (local) next.processLocally = true;

    next.onresult = (event) => {
      const latest = event.results[event.results.length - 1];
      const text = latest?.[0]?.transcript;
      if (text) handlers.onTranscript(text);
    };
    let started = false;
    let resolved = false;
    function fail(problem: ListenerProblem) {
      if (!active || recognition !== next) return;
      active = false;
      console.warn(`[consent] listening stopped: ${problem}`);
      handlers.onProblem?.(problem);
    }
    next.onend = () => {
      // Pause before the sheet restarts it. Sessions that never started back off further, so a
      // lasting problem can't spin in a loop; after a few it's reported instead.
      if (!active || recognition !== next) return; // stopped, or replaced by a newer session
      failedStarts = started ? 0 : failedStarts + 1;
      if (failedStarts >= MAX_FAILED_STARTS) return fail('no-start');
      const delay = Math.min(RESTART_DELAY_MS * 2 ** failedStarts, MAX_RESTART_DELAY_MS);
      setTimeout(() => active && recognition === next && handlers.onEnd(), delay);
    };

    return new Promise<StartResult>((resolve) => {
      const timeout = setTimeout(() => settle('started'), START_TIMEOUT_MS);
      const settle = (result: StartResult) => {
        clearTimeout(timeout);
        if (!resolved) resolve(result);
        resolved = true;
      };
      next.onstart = () => {
        started = true;
        settle('started');
      };
      next.onerror = (event) => {
        console.warn(`[consent] speech recognition error: ${event.error}`);
        if (event.error === 'network') {
          // Chrome's speech service can't be reached (offline, blocked, or a browser without it).
          settle('started');
          fail('network');
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          if (resolved) return fail('denied');
          active = false;
          settle('denied');
        } else if (event.error === 'audio-capture' || event.error === 'language-not-supported') {
          active = false;
          settle('unavailable');
        }
        // Others ("no-speech", "aborted") end the session; onend restarts it.
      };
      try {
        next.start();
      } catch {
        clearTimeout(timeout);
        active = false;
        resolve('unavailable');
      }
    });
  }

  function stop() {
    generation++;
    active = false;
    recognition?.abort();
    recognition = null;
  }

  return { start, stop };
}
