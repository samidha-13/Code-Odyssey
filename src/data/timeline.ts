/**
 * Voyage milestones. Only information that has been announced is listed.
 * `confirmed` marks calendar-confirmed dates; everything else is shown
 * exactly as announced (relative days) with an explicit "to be announced" note.
 */
export type Milestone = {
  id: string;
  title: string;
  when: string;
  confirmed: boolean;
  note?: string;
  detail: string;
};

export const TIMELINE: Milestone[] = [
  {
    id: 'registrations-close',
    title: 'Registrations Closed',
    when: 'Saturday, 10 October · 12:00 AM',
    confirmed: false,
    detail: 'Registrations are now closed.',
  },
  {
    id: 'briefing',
    title: 'Mandatory College Briefing',
    when: 'Monday, 12 October',
    confirmed: false,
    note: 'Calendar date and time to be announced',
    detail: 'Shortlisted teams must report to college in formal attire.',
  },
  {
    id: 'shortlist',
    title: 'Shortlisted Teams Announced',
    when: 'Wednesday night, 14 October',
    confirmed: true,
    note: '15 teams shortlisted',
    detail: 'Announced on the official website and on Instagram @csi_kjsit.',
  },
  {
    id: 'set-sail',
    title: 'Code Odyssey Begins',
    when: '17 October 2026',
    confirmed: true,
    note: 'Start time to be announced',
    detail: 'The voyage begins — Code Odyssey 5.0 opens its 30-hour offline hackathon.',
  },
  {
    id: 'voyage',
    title: 'The 30-Hour Voyage',
    when: '17–18 October 2026',
    confirmed: true,
    detail: 'Thirty hours of continuous, offline building.',
  },
  {
    id: 'landfall',
    title: 'Final Submissions & Evaluation',
    when: 'At the close of the 30 hours',
    confirmed: false,
    note: 'Timings to be announced',
    detail: 'Teams submit their work for evaluation.',
  },
];
