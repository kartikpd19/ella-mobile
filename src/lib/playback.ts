import { useEffect, useRef, useState } from 'react';

/**
 * Simulated audio playback for the visit transcript: a clock that runs, pauses and seeks like a
 * player. UI-only until recordings are stored with a backend; nothing is actually played.
 */
export type Playback = {
  positionMs: number;
  playing: boolean;
  toggle: () => void;
  seek: (ms: number) => void;
  skip: (deltaMs: number) => void;
};

const TICK_MS = 100;

export function useSimulatedPlayback(durationMs: number): Playback {
  const [positionMs, setPositionMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const position = useRef(0);

  function moveTo(ms: number) {
    position.current = Math.min(Math.max(ms, 0), durationMs);
    setPositionMs(position.current);
  }

  useEffect(() => {
    if (!playing) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      moveTo(position.current + now - last);
      last = now;
      if (position.current >= durationMs) setPlaying(false);
    }, TICK_MS);
    return () => clearInterval(timer);
    // moveTo only reads the ref and the duration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, durationMs]);

  return {
    positionMs,
    playing,
    toggle() {
      // Playing from the very end starts over.
      if (!playing && position.current >= durationMs) moveTo(0);
      setPlaying(!playing);
    },
    seek: moveTo,
    skip: (deltaMs) => moveTo(position.current + deltaMs),
  };
}
