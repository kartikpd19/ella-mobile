import { useSyncExternalStore } from 'react';

/**
 * Whether the mobile app has been linked and synced. UI-only: there is no backend,
 * so a successful scan simulates a short sync and then shows sample visits.
 */
export type SyncState = 'empty' | 'syncing' | 'synced';

const SYNC_DURATION_MS = 1500;

let state: SyncState = 'empty';
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function set(next: SyncState) {
  state = next;
  listeners.forEach((listener) => listener());
}

/** Starts the simulated sync; it finishes on its own after a short delay. */
export function startSync() {
  clearTimeout(timer);
  set('syncing');
  timer = setTimeout(() => set('synced'), SYNC_DURATION_MS);
}

/** Jumps straight to a state, e.g. from the preview page's `?state=` link. */
export function setSyncState(next: SyncState) {
  if (next === 'syncing') {
    startSync();
  } else {
    clearTimeout(timer);
    set(next);
  }
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
}
