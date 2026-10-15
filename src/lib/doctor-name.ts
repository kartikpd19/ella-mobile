export const FALLBACK_DOCTOR_NAME = 'Dr. Stephen Strange';

/**
 * Builds a display name from a work email until real profile data exists.
 * john.smith@mayo.edu → "Dr. John Smith". Falls back to FALLBACK_DOCTOR_NAME.
 */
export function doctorNameFromEmail(email?: string): string {
  const local = email?.trim().split('@')[0] ?? '';
  const words = local
    .split(/[._\-+\s]+/)
    .map((w) => w.replace(/\d+/g, ''))
    .filter(Boolean)
    // Avoid "Dr. Dr Smith" for addresses like dr.smith@mayo.edu.
    .filter((w, i) => !(i === 0 && w.toLowerCase() === 'dr'));

  if (words.length === 0) return FALLBACK_DOCTOR_NAME;

  const name = words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return `Dr. ${name}`;
}
