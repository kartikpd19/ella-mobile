import { useSyncExternalStore } from 'react';

import { SAMPLE_SUMMARY } from '@/lib/sample-summary';
import type { NoteStatus } from '@/lib/sample-visits';

/**
 * The visit summary Ella writes after a recording ends. UI-only: generated from the sample in
 * `sample-summary.ts` and kept in memory until there's a backend.
 */
export type SummarySection = { title: string; text?: string; bullets?: string[] };
export type VisitSummary = {
  sections: SummarySection[];
  /** False until the summary has been shown once; the reveal animation plays only then. */
  revealed: boolean;
  status: NoteStatus;
};

const summaries = new Map<string, VisitSummary>();
const listeners = new Set<() => void>();

function update(visitId: string, change: (summary: VisitSummary | undefined) => VisitSummary) {
  summaries.set(visitId, change(summaries.get(visitId)));
  listeners.forEach((listener) => listener());
}

/** Called when a recording is saved. The next visit to the summary plays the reveal. */
export function generateSummary(visitId: string) {
  update(visitId, () => ({ sections: SAMPLE_SUMMARY, revealed: false, status: 'Draft' }));
}

/** The summary has been shown in full: no more reveal, and it now needs review. */
export function markSummaryShown(visitId: string) {
  update(visitId, (summary) => ({
    sections: SAMPLE_SUMMARY,
    ...summary,
    revealed: true,
    status: summary?.status === 'Imported' ? 'Imported' : 'In-review',
  }));
}

export function markSummaryImported(visitId: string) {
  update(visitId, (summary) => ({ sections: SAMPLE_SUMMARY, revealed: true, ...summary, status: 'Imported' }));
}

export function useSummary(visitId: string | undefined): VisitSummary | undefined {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => (visitId ? summaries.get(visitId) : undefined),
    () => (visitId ? summaries.get(visitId) : undefined),
  );
}
