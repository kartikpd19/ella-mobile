import { useEffect, useState } from 'react';

/**
 * Browser preview of the visit recording: nothing is captured, the mic level is simulated.
 * `sim` picks the preview: `quiet`, `speaking` or `paused`. Without it, speech comes and goes
 * so both states of the visual show up.
 */
export type RecordingSession = {
  elapsedMs: number;
  level: number;
  paused: boolean;
  error: string | null;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<string | null>;
};

export const IS_SIMULATED_MIC = true;

const TICK_MS = 100;
// The preview variants start at the time shown in the Figma frames (00:23:12).
const PREVIEW_START_MS = (23 * 60 + 12) * 1000;

type Options = {
  enabled: boolean;
  sim?: string;
};

type Sim = { elapsedMs: number; level: number; speaking: boolean; switchAt: number };

export function useRecordingSession({ enabled, sim }: Options): RecordingSession {
  const preset = sim === 'quiet' || sim === 'speaking' || sim === 'paused';
  const [paused, setPaused] = useState(sim === 'paused');
  const [state, setState] = useState<Sim>({
    elapsedMs: preset ? PREVIEW_START_MS : 0,
    level: 0,
    speaking: false,
    switchAt: 1500,
  });

  useEffect(() => {
    if (!enabled || paused) return;
    const timer = setInterval(() => {
      setState((prev) => {
        const elapsedMs = prev.elapsedMs + TICK_MS;
        let { speaking, switchAt } = prev;
        if (sim === 'speaking' || sim === 'quiet') {
          speaking = sim === 'speaking';
        } else if (elapsedMs >= switchAt) {
          // Talk for 2.5–4 s, then pause for 1.5–2.5 s.
          speaking = !speaking;
          switchAt = elapsedMs + (speaking ? 2500 + Math.random() * 1500 : 1500 + Math.random() * 1000);
        }
        const target = speaking ? 0.35 + Math.random() * 0.6 : 0;
        return { elapsedMs, level: prev.level * 0.4 + target * 0.6, speaking, switchAt };
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [enabled, paused, sim]);

  return {
    elapsedMs: state.elapsedMs,
    level: paused || !enabled ? 0 : state.level,
    paused,
    error: null,
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    stop: async () => null,
  };
}
