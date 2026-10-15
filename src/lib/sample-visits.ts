// Sample data shown after a simulated sync. Names are fictional.

/** Appointment status, shown as the `status-color ring` from design.md. */
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
  reason: string;
  time: string;
  day: 'Yesterday' | 'Today' | 'Tomorrow';
  status: VisitStatus;
  note?: NoteStatus;
};

export const SAMPLE_VISITS: Visit[] = [
  { id: '1', patient: 'Maria Alvarez', reason: 'Follow-up', time: '8:30 AM', day: 'Today', status: 'Complete', note: 'Imported' },
  { id: '2', patient: 'James Okafor', reason: 'Annual physical', time: '9:15 AM', day: 'Today', status: 'Complete', note: 'In-review' },
  { id: '3', patient: 'Priya Raman', reason: 'Knee pain', time: '10:00 AM', day: 'Today', status: 'Consultation', note: 'In Progress' },
  { id: '4', patient: 'Daniel Brooks', reason: 'Medication review', time: '10:45 AM', day: 'Today', status: 'Rooming' },
  { id: '5', patient: 'Hannah Lee', reason: 'New patient', time: '11:30 AM', day: 'Today', status: 'Waiting' },
  { id: '6', patient: 'Omar Haddad', reason: 'Lab results', time: '1:00 PM', day: 'Today', status: 'Arrived' },
  { id: '7', patient: 'Grace Kim', reason: 'Follow-up', time: '2:15 PM', day: 'Today', status: 'Scheduled' },
  { id: '8', patient: 'Lucas Moreau', reason: 'Back pain', time: '3:30 PM', day: 'Today', status: 'Scheduled' },
  { id: '9', patient: 'Aisha Bello', reason: 'Prenatal check', time: '9:00 AM', day: 'Tomorrow', status: 'Scheduled' },
  { id: '10', patient: 'Ethan Walsh', reason: 'Allergy consult', time: '11:00 AM', day: 'Tomorrow', status: 'Scheduled' },
  { id: '11', patient: 'Sofia Rossi', reason: 'Follow-up', time: '2:00 PM', day: 'Yesterday', status: 'Complete', note: 'Draft' },
  { id: '12', patient: 'Noah Fischer', reason: 'Skin check', time: '3:45 PM', day: 'Yesterday', status: 'No-show', note: 'Canceled' },
];

const PAST: VisitStatus[] = ['Complete', 'No-show'];

export function isPast(visit: Visit) {
  return PAST.includes(visit.status);
}
