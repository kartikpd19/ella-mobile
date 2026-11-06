import { shareStore } from '@/lib/device-sync';
import { doctorNameFromEmail } from '@/lib/doctor-name';

/**
 * The signed-in doctor's name for screens that don't get the email in their URL.
 * UI-only: Home remembers the email it was opened with until there's real authentication.
 */
let email: string | undefined;

const publish = shareStore<string | undefined>('current-doctor', () => email, (next) => {
  if (next) email = next;
});

export function rememberDoctorEmail(next: string | undefined) {
  if (!next || next === email) return;
  email = next;
  publish();
}

export function currentDoctorName(): string {
  return doctorNameFromEmail(email);
}
