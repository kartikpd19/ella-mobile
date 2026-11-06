/**
 * Classifies a patient's spoken answer to the consent question.
 * Refusals are checked first, so "no, that's not okay" counts as no.
 */
export type ConsentAnswer = 'yes' | 'no';

/**
 * Phrases from the consent script itself. The doctor reads it aloud while Ella listens, so
 * "…if you say no. Is that okay with you?" must not count as the patient's answer.
 */
const SCRIPT_PHRASES = [/\bsay no\b/g, /\bis that (okay|ok|alright|all right)( with you)?\b/g];

const NO_PATTERNS = [
  /\bno\b/, // also "no consent"
  /\bnope\b/,
  /\bnah\b/,
  /rather not/,
  /\b(don'?t|do not)\b.*\brecord/,
  /\bnot\s+(okay|ok|fine|comfortable)\b/,
  /\b(don'?t|do not)\s+(consent|agree|want)\b/,
  /\b(don'?t|do not|won'?t|will not|can'?t|cannot)\s+give\b.*\bconsent\b/,
  /\bi\s+(refuse|decline|deny)\b/,
  /\bconsent\s+(is\s+)?(denied|refused|declined|not given)\b/,
  /\b(deny|denies|denied)\b.*\bconsent\b/,
];

const YES_PATTERNS = [
  /\byes\b/,
  /\byeah\b/,
  /\byep\b/,
  /\byou can record\b/,
  /\bi\s+(give\s+(my\s+)?consent|consent|agree)\b/,
  /\bgive\s+(my\s+)?consent\b/,
  /\bconsent\s+(is\s+)?given\b/,
  /\bthat'?s\s+(fine|okay|ok|alright|all right)\b/,
  /\bthat is\s+(fine|okay|ok|alright|all right)\b/,
  /\bsure\b/,
  /\b(okay|ok|alright|all right)\b/,
  /\bgo ahead\b/,
  /\bof course\b/,
];

export function classifyConsent(transcript: string): ConsentAnswer | null {
  let text = transcript.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z' ]/g, ' ');
  for (const phrase of SCRIPT_PHRASES) text = text.replace(phrase, ' ');
  if (NO_PATTERNS.some((pattern) => pattern.test(text))) return 'no';
  if (YES_PATTERNS.some((pattern) => pattern.test(text))) return 'yes';
  return null;
}
