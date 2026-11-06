import { useSyncExternalStore } from 'react';

import { shareStore } from '@/lib/device-sync';

/**
 * Consent recorded on a visit before recording may start. UI-only: kept in memory until
 * there's a backend. Only the method and time are kept — never the audio or transcript.
 */
export type ConsentMethod = 'spoken' | 'manual';
export type ConsentRecord = { method: ConsentMethod; at: Date };

let records = new Map<string, ConsentRecord>();
const listeners = new Set<() => void>();

const publish = shareStore<[string, ConsentRecord][]>('consent-log', () => [...records], (entries) => {
  records = new Map(entries);
  listeners.forEach((listener) => listener());
});

export function logConsent(visitId: string, method: ConsentMethod): ConsentRecord {
  const record = { method, at: new Date() };
  records.set(visitId, record);
  listeners.forEach((listener) => listener());
  publish();
  return record;
}

export function getConsent(visitId: string | undefined): ConsentRecord | undefined {
  return visitId ? records.get(visitId) : undefined;
}

export function useConsent(visitId: string | undefined): ConsentRecord | undefined {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => getConsent(visitId),
    () => getConsent(visitId),
  );
}

/** "Spoken consent · 10:42 AM" */
export function describeConsent(record: ConsentRecord): string {
  const hours = record.at.getHours();
  const minutes = String(record.at.getMinutes()).padStart(2, '0');
  const time = `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
  return `${record.method === 'spoken' ? 'Spoken consent' : 'Consent confirmed manually'} · ${time}`;
}
