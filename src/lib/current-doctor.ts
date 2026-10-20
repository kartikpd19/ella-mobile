import { doctorNameFromEmail } from '@/lib/doctor-name';

/**
 * The signed-in doctor's name for screens that don't get the email in their URL.
 * UI-only: Home remembers the email it was opened with until there's real authentication.
 */
let email: string | undefined;

export function rememberDoctorEmail(next: string | undefined) {
  if (next) email = next;
}

export function currentDoctorName(): string {
  return doctorNameFromEmail(email);
}
