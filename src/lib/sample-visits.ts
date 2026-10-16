// Sample data shown after a simulated sync. Names and IDs are fictional.

/** Appointment status, shown as the colored bar from design.md's `status-color ring`. */
export type VisitStatus =
  | 'Scheduled'
  | 'Arrived'
  | 'Waiting'
  | 'Rooming'
  | 'Consultation'
  | 'Complete'
  | 'No-show';

/** Note status, shown as the `Recording Status` badge from design.md. */
export type NoteStatus = 'Draft' | 'In Progress' | 'In-review' | 'Imported' | 'Canceled';

export type Visit = {
  id: string;
  patient: string;
  age: number;
  patientId: string;
  reason: string;
  time: string;
  day: 'Yesterday' | 'Today' | 'Tomorrow';
  status: VisitStatus;
  note?: NoteStatus;
};

export const SAMPLE_VISITS: Visit[] = [
  { id: '1', patient: 'Maria Alvarez', age: 54, patientId: '1029347', reason: 'Follow-up', time: '8:30 AM', day: 'Today', status: 'Complete', note: 'Imported' },
  { id: '2', patient: 'James Okafor', age: 47, patientId: '1031582', reason: 'Annual physical', time: '9:15 AM', day: 'Today', status: 'Complete', note: 'In-review' },
  { id: '3', patient: 'Priya Raman', age: 36, patientId: '1027716', reason: 'Knee pain', time: '10:00 AM', day: 'Today', status: 'Consultation', note: 'In Progress' },
  { id: '4', patient: 'Daniel Brooks', age: 68, patientId: '1018840', reason: 'Medication review', time: '10:45 AM', day: 'Today', status: 'Rooming' },
  { id: '5', patient: 'Hannah Lee', age: 29, patientId: '1040263', reason: 'New patient', time: '11:30 AM', day: 'Today', status: 'Waiting' },
  { id: '6', patient: 'Omar Haddad', age: 61, patientId: '1022394', reason: 'Lab results', time: '1:00 PM', day: 'Today', status: 'Arrived' },
  { id: '7', patient: 'Grace Kim', age: 43, patientId: '1035507', reason: 'Follow-up', time: '2:15 PM', day: 'Today', status: 'Scheduled' },
  { id: '8', patient: 'Lucas Moreau', age: 39, patientId: '1029981', reason: 'Back pain', time: '3:30 PM', day: 'Today', status: 'Scheduled' },
  { id: '9', patient: 'Aisha Bello', age: 31, patientId: '1041126', reason: 'Prenatal check', time: '9:00 AM', day: 'Tomorrow', status: 'Scheduled' },
  { id: '10', patient: 'Ethan Walsh', age: 23, patientId: '1038419', reason: 'Allergy consult', time: '11:00 AM', day: 'Tomorrow', status: 'Scheduled' },
  { id: '11', patient: 'Sofia Rossi', age: 58, patientId: '1016735', reason: 'Follow-up', time: '2:00 PM', day: 'Yesterday', status: 'Complete', note: 'Draft' },
  { id: '12', patient: 'Noah Fischer', age: 50, patientId: '1024658', reason: 'Skin check', time: '3:45 PM', day: 'Yesterday', status: 'No-show', note: 'Canceled' },
];

const PAST: VisitStatus[] = ['Complete', 'No-show'];

export function isPast(visit: Visit) {
  return PAST.includes(visit.status);
}

export function getVisit(id: string | undefined): Visit | undefined {
  return SAMPLE_VISITS.find((visit) => visit.id === id);
}

/** "Emily Johnson" → "EJ". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}
