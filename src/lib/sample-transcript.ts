/**
 * Sample visit transcript shown for recorded visits until transcripts come from a backend.
 * Fictional data only, matching `sample-summary.ts`: an oncology follow-up before chemo cycle 4.
 * `{patient}` is replaced with the patient's first name. `keyPoints` are exact phrases from the
 * line, highlighted when Key Points is on; their lines also mark the audio waveform.
 */
export type TranscriptSpeaker = 'doctor' | 'patient';
export type TranscriptLine = {
  speaker: TranscriptSpeaker;
  /** Offset into the recording, "m:ss". */
  at: string;
  text: string;
  keyPoints?: string[];
};

/** Clock time the sample recording started at. */
export const SAMPLE_RECORDING_START = { hours: 10, minutes: 3 };

export const SAMPLE_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'doctor', at: '0:00', text: 'Good morning, {patient}. How have you been feeling since your last chemo cycle?' },
  {
    speaker: 'patient',
    at: '0:27',
    text: 'Mostly okay. The nausea is better with the new medication, but I’ve been really tired.',
    keyPoints: ['The nausea is better with the new medication'],
  },
  { speaker: 'doctor', at: '1:00', text: 'Fatigue is common at this stage. How long does it last after each infusion?' },
  {
    speaker: 'patient',
    at: '1:24',
    text: 'About three or four days. Then I’m mostly back to normal.',
    keyPoints: ['About three or four days'],
  },
  { speaker: 'doctor', at: '1:51', text: 'That fits the usual pattern. Any vomiting?' },
  {
    speaker: 'patient',
    at: '2:09',
    text: 'No, none this time. Just queasy the first couple of days, and the ondansetron takes care of it.',
    keyPoints: ['No, none this time'],
  },
  { speaker: 'doctor', at: '2:54', text: 'Good. How’s your appetite?' },
  {
    speaker: 'patient',
    at: '3:09',
    text: 'Not great. I’m eating smaller meals more often. My weight’s been about the same.',
    keyPoints: ['My weight’s been about the same'],
  },
  { speaker: 'doctor', at: '3:54', text: 'You’re at 61 kilos today, which is stable. Small, frequent meals are exactly right.' },
  { speaker: 'doctor', at: '4:36', text: 'How are you sleeping?' },
  { speaker: 'patient', at: '4:48', text: 'The first night or two after an infusion are rough. Melatonin helps.' },
  { speaker: 'doctor', at: '5:30', text: 'Any pain?' },
  { speaker: 'patient', at: '5:42', text: 'Some aching in my legs and lower back for a day or two after the injection.' },
  {
    speaker: 'doctor',
    at: '6:18',
    text: 'That’s a common reaction to pegfilgrastim. Loratadine for five days afterward usually helps.',
    keyPoints: ['Loratadine for five days afterward'],
  },
  { speaker: 'doctor', at: '7:06', text: 'Any numbness or tingling in your hands or feet?' },
  { speaker: 'patient', at: '7:24', text: 'No, nothing like that.' },
  { speaker: 'doctor', at: '7:39', text: 'And how’s your mood been?' },
  {
    speaker: 'patient',
    at: '7:51',
    text: 'Generally good. I get anxious in the days before an infusion.',
    keyPoints: ['I get anxious in the days before an infusion'],
  },
  { speaker: 'patient', at: '8:30', text: 'I’m still walking about twenty minutes most days, and working part-time from home.' },
  {
    speaker: 'patient',
    at: '9:48',
    text: 'Can I get the flu shot this year? And when does hair usually start growing back?',
    keyPoints: ['Can I get the flu shot this year?'],
  },
  {
    speaker: 'doctor',
    at: '10:30',
    text: 'Yes, the inactivated flu vaccine is safe during treatment, but avoid live vaccines. Hair usually starts to regrow a few weeks after the last cycle.',
  },
  {
    speaker: 'doctor',
    at: '11:36',
    text: 'Your blood counts and chemistry panel look normal, and your tumor marker is still trending down.',
    keyPoints: ['your tumor marker is still trending down'],
  },
  {
    speaker: 'doctor',
    at: '12:24',
    text: 'You’re cleared for cycle four on November 9th. We’ll check labs a day or two before.',
    keyPoints: ['cleared for cycle four on November 9th'],
  },
  {
    speaker: 'doctor',
    at: '13:06',
    text: 'Call us if your temperature reaches 100.4 or higher, or if you can’t keep fluids down.',
    keyPoints: ['Call us if your temperature reaches 100.4 or higher'],
  },
  { speaker: 'patient', at: '13:48', text: 'Okay, thank you, Doctor.' },
];

/** Length of the sample recording: a little past the last line. */
export const SAMPLE_DURATION_MS = (13 * 60 + 58) * 1000;

/** "1:24" → 84 000 ms */
export function offsetMs(at: string): number {
  const [minutes, seconds] = at.split(':').map(Number);
  return (minutes * 60 + seconds) * 1000;
}

/** Clock time of an offset into the sample recording: "10:05 AM". */
export function clockTime(ms: number): string {
  const total = SAMPLE_RECORDING_START.hours * 60 + SAMPLE_RECORDING_START.minutes + Math.floor(ms / 60000);
  const hours = Math.floor(total / 60) % 24;
  const minutes = String(total % 60).padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
}

/** How long a key point moment lasts on the waveform, at most (it also ends at the next line). */
const KEY_MOMENT_MS = 15000;

/** Moments of the recording with key points: from a key line's start, up to KEY_MOMENT_MS. */
export function keyPointRanges(lines: TranscriptLine[] = SAMPLE_TRANSCRIPT): { start: number; end: number }[] {
  return lines.flatMap((line, i) => {
    if (!line.keyPoints?.length) return [];
    const start = offsetMs(line.at);
    const next = i + 1 < lines.length ? offsetMs(lines[i + 1].at) : SAMPLE_DURATION_MS;
    return [{ start, end: Math.min(next, start + KEY_MOMENT_MS) }];
  });
}
