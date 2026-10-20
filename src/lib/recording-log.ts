import { useSyncExternalStore } from 'react';

/**
 * Recordings and quick notes per visit. UI-only: kept in memory until there's a backend.
 * A note's `atMs` is the recording time it was taken at, so it lines up with the audio.
 */
export type RecordingNote = { text: string; atMs: number };
export type RecordingRecord = { uri: string | null; durationMs: number; notes: RecordingNote[]; endedAt?: Date };

const records = new Map<string, RecordingRecord>();
const listeners = new Set<() => void>();

function update(visitId: string, change: (record: RecordingRecord) => RecordingRecord) {
  records.set(visitId, change(records.get(visitId) ?? { uri: null, durationMs: 0, notes: [] }));
  listeners.forEach((listener) => listener());
}

export function addNote(visitId: string, text: string, atMs: number) {
  update(visitId, (record) => ({ ...record, notes: [...record.notes, { text, atMs }] }));
}

export function finishRecording(visitId: string, uri: string | null, durationMs: number) {
  update(visitId, (record) => ({ ...record, uri, durationMs, endedAt: new Date() }));
}

export function useRecording(visitId: string | undefined): RecordingRecord | undefined {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => (visitId ? records.get(visitId) : undefined),
    () => (visitId ? records.get(visitId) : undefined),
  );
}

/** 83_512 ms → "00:01:23" */
export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const parts = [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60];
  return parts.map((n) => String(n).padStart(2, '0')).join(':');
}
