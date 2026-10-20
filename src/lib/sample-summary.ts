import type { SummarySection } from '@/lib/visit-summary';

/**
 * Sample visit summary shown after a recording until summaries come from a backend.
 * Fictional data only: a 42-year-old woman on adjuvant chemotherapy, at an oncology follow-up
 * before her next cycle. The patient isn't named, because any visit can show this summary.
 *
 * `\u00A0` (non-breaking space) keeps a date on one line.
 *
 * Sections follow the Figma frame "iPhone 16 - 79" (293:6174). A section has `text`, `bullets`, or both.
 */
export const SAMPLE_SUMMARY: SummarySection[] = [
  {
    title: 'Reason For Visit',
    text:
      'Scheduled oncology follow-up before cycle 4 of adjuvant chemotherapy. Last infusion (cycle 3) was 3 weeks ago. ' +
      'Here to review side effects, recent labs, and readiness to proceed.',
  },
  {
    title: 'What the patient shared',
    bullets: [
      'Fatigue for 3 to 4 days after each infusion, then back to near baseline',
      'Mild nausea on days 1 to 3, controlled with ondansetron; no vomiting',
      'Appetite reduced; eating smaller, more frequent meals. Weight stable at 61 kg',
      'Sleep interrupted for 1 to 2 nights after infusion; melatonin helps',
      'Mild leg and lower back aching for 1 to 2 days after pegfilgrastim; no numbness or tingling',
      'Mood generally good; some anxiety in the days before an infusion',
      'Walking 20 minutes most days and working part-time from home',
      'Asked whether she can have the flu vaccine and when hair regrowth usually starts',
    ],
  },
  {
    title: 'Assessment',
    text:
      'Tolerating treatment well; side effects are expected and manageable with current supportive care. ' +
      'CBC and CMP within normal limits, with an adequate neutrophil count to proceed. ' +
      'Tumor marker (CA 15-3) continues to trend down from baseline. ' +
      'ECOG performance status 1. No dose modification needed; cleared for cycle 4 as planned.',
  },
  {
    title: 'Medications',
    bullets: [
      'Ondansetron 8 mg every 8 hours as needed for nausea',
      'Prochlorperazine 10 mg every 6 hours as needed for breakthrough nausea',
      'Dexamethasone 8 mg once daily on days 2 and 3 after infusion',
      'Loratadine 10 mg once daily for 5 days after pegfilgrastim, for bone pain',
      'Melatonin 3 mg at bedtime as needed for sleep',
    ],
  },
  {
    title: 'Follow-up',
    bullets: [
      'Cycle 4 infusion on November\u00A09,\u00A02026',
      'CBC with differential, CMP, and CA 15-3 one to two days before the infusion',
      'Call the clinic for a temperature of 100.4°F (38°C) or higher, vomiting for more than 24 hours, or trouble keeping fluids down',
      'Inactivated flu vaccine is fine during treatment; avoid live vaccines. Return visit before cycle 5',
    ],
  },
];
