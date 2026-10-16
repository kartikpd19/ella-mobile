/**
 * Classifies a patient's spoken answer to the consent question.
 * Refusals are checked first, so "no, that's not okay" counts as no.
 */
export type ConsentAnswer = 'yes' | 'no';

const NO_PATTERNS = [
  /\bno\b/,
  /\bnope\b/,
  /\bnah\b/,
  /rather not/,
  /\b(don'?t|do not)\b.*\brecord/,
  /\bnot\s+(okay|ok|fine|comfortable)\b/,
  /\b(don'?t|do not)\s+(consent|agree|want)\b/,
  /\bi\s+(refuse|decline)\b/,
];

const YES_PATTERNS = [
  /\byes\b/,
  /\byeah\b/,
  /\byep\b/,
  /\byou can record\b/,
  /\bi\s+(give\s+(my\s+)?consent|consent|agree)\b/,
  /\bthat'?s\s+(fine|okay|ok|alright|all right)\b/,
  /\bthat is\s+(fine|okay|ok|alright|all right)\b/,
  /\bsure\b/,
  /\b(okay|ok|alright|all right)\b/,
  /\bgo ahead\b/,
  /\bof course\b/,
];

export function classifyConsent(transcript: string): ConsentAnswer | null {
  const text = transcript.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z' ]/g, ' ');
  if (NO_PATTERNS.some((pattern) => pattern.test(text))) return 'no';
  if (YES_PATTERNS.some((pattern) => pattern.test(text))) return 'yes';
  return null;
}
