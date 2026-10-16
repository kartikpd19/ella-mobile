// Listens for the patient's spoken answer to the consent question.
// The speech module is loaded lazily: it isn't in Expo Go, and importing it there crashes.
// Audio is never saved (recordingOptions.persist is off) and transcripts stay in memory.

export const IS_SIMULATED_LISTENER = false;

export type ListenerHandlers = {
  /** Called with each partial or final transcript. */
  onTranscript: (text: string) => void;
  /** Recognition stopped by itself (silence timeout, error); call start() again to resume. */
  onEnd: () => void;
};

export type StartResult = 'started' | 'denied' | 'unavailable';

type SpeechModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

function loadModule(): SpeechModule | null {
  try {
    // Lazy on purpose: a static import would crash Expo Go, which lacks this native module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-speech-recognition').ExpoSpeechRecognitionModule as SpeechModule;
  } catch {
    return null; // e.g. Expo Go, which doesn't include this native module
  }
}

export function createConsentListener(handlers: ListenerHandlers) {
  const speech = loadModule();
  let subscriptions: { remove: () => void }[] = [];
  let active = false;

  function detach() {
    subscriptions.forEach((s) => s.remove());
    subscriptions = [];
  }

  async function start(): Promise<StartResult> {
    if (!speech || !speech.isRecognitionAvailable()) return 'unavailable';
    const permission = await speech.requestPermissionsAsync();
    if (!permission.granted) return 'denied';

    detach();
    subscriptions = [
      speech.addListener('result', (event) => {
        const text = event.results[0]?.transcript;
        if (text) handlers.onTranscript(text);
      }),
      speech.addListener('end', () => {
        if (active) handlers.onEnd();
      }),
    ];

    active = true;
    speech.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
      // Consent audio is only used to detect yes/no; never keep it.
      recordingOptions: { persist: false },
    });
    return 'started';
  }

  function stop() {
    active = false;
    detach();
    speech?.abort();
  }

  return { start, stop };
}
