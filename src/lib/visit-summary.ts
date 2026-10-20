import { useSyncExternalStore } from 'react';

import type { NoteStatus } from '@/lib/sample-visits';

/**
 * The visit summary Ella writes after a recording ends. UI-only: generated from sample content
 * and kept in memory until there's a backend.
 */
export type SummarySection = { title: string; text?: string; bullets?: string[] };
export type VisitSummary = {
  sections: SummarySection[];
  /** False until the summary has been shown once; the reveal animation plays only then. */
  revealed: boolean;
  status: NoteStatus;
};

/** Sample content from the Figma frame "iPhone 16 - 79" (293:6174), one of each section. */
export const SAMPLE_SUMMARY: SummarySection[] = [
  { title: 'Reason For Visit', text: 'Good morning, Alex. How have you been feeling since our last appointment?' },
  {
    title: 'What the patient shared',
    bullets: [
      'Tired for 3 to 4 days after each infusion',
      'Mild nausea, eased by current medication',
      'Eating less, weight steady',
    ],
  },
  { title: 'Assessment', text: 'Tolerating treatment well. Side effects expected and manageable.' },
  { title: 'Medications', bullets: ['Ondansetron 8 mg', '[Medication name]'] },
  { title: 'Follow-up', text: 'Return in 3 weeks, before cycle 5.' },
];

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
