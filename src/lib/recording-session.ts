import { RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

/**
 * The visit recording on a device: real microphone capture with metering for the live visual.
 * The browser preview uses `recording-session.web.ts`, which simulates the level and records nothing.
 */
export type RecordingSession = {
  /** Time actually recorded, so it stops while paused. */
  elapsedMs: number;
  /** Microphone level, 0 (quiet) to 1 (loud). 0 while paused. */
  level: number;
  paused: boolean;
  error: string | null;
  pause: () => void;
  resume: () => void;
  /** Stops for good and returns the saved file, if any. */
  stop: () => Promise<string | null>;
};

export const IS_SIMULATED_MIC = false;

const LEVEL_INTERVAL_MS = 100;
// Metering is in dBFS. Below QUIET_DB counts as silence; LOUD_DB and above is full scale.
const QUIET_DB = -50;
const LOUD_DB = -10;

type Options = {
  /** Only true once consent is logged. Nothing is captured otherwise. */
  enabled: boolean;
  /** Browser preview only; ignored on devices. */
  sim?: string;
};

export function useRecordingSession({ enabled }: Options): RecordingSession {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const state = useAudioRecorderState(recorder, LEVEL_INTERVAL_MS);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      try {
        // Keeps recording when the app goes to the background (also needs the expo-audio
        // plugin's enableBackgroundRecording in app.json).
        await setAudioModeAsync({ allowsRecording: true, allowsBackgroundRecording: true, shouldPlayInBackground: true });
        await recorder.prepareToRecordAsync();
        if (cancelled) return;
        recorder.record();
        active.current = true;
      } catch {
        if (!cancelled) setError('Recording couldn’t start. Check microphone access and try again.');
      }
    })();

    return () => {
      cancelled = true;
      if (active.current) {
        active.current = false;
        recorder.stop().catch(() => {});
      }
    };
  }, [enabled, recorder]);

  const db = state.metering ?? QUIET_DB;
  const level = state.isRecording ? Math.min(Math.max((db - QUIET_DB) / (LOUD_DB - QUIET_DB), 0), 1) : 0;

  return {
    elapsedMs: state.durationMillis,
    level: paused ? 0 : level,
    paused,
    error,
    pause() {
      if (!active.current) return;
      recorder.pause();
      setPaused(true);
    },
    resume() {
      if (!active.current) return;
      recorder.record();
      setPaused(false);
    },
    async stop() {
      if (!active.current) return recorder.uri;
      active.current = false;
      await recorder.stop().catch(() => {});
      await setAudioModeAsync({ allowsRecording: false, allowsBackgroundRecording: false }).catch(() => {});
      return recorder.uri;
    },
  };
}
