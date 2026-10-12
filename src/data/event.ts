/**
 * Single source of truth for event content. Edit here — the animation code
 * never hard-codes dates, links or copy.
 */

type RegistrationStatus = 'open' | 'coming-soon' | 'closed';

const registrationUrl = (import.meta.env.VITE_REGISTRATION_URL as string | undefined)?.trim() || null;
/** Registrations for CO5 are closed; VITE_REGISTRATION_STATUS=open (with a URL) re-opens them. */
const reopen = (import.meta.env.VITE_REGISTRATION_STATUS as string | undefined)?.trim().toLowerCase() === 'open';
const REGISTRATION_CLOSED = !(reopen && registrationUrl);

export const EVENT = {
  name: 'Code Odyssey 5.0',
  shortName: 'CO5',
  edition: '5.0',
  theme: 'An Epic Odyssey',

  organizer: {
    name: 'Computer Society of India (CSI)',
    chapter: 'Student Chapter',
    institute: 'K. J. Somaiya Institute of Technology (KJSIT)',
    shortName: 'CSI KJSIT',
    /** Path inside /public, e.g. 'assets/logos/csi-kjsit-logo.png'. null → typographic mark. */
    logo: null as string | null,
    /** Where the navbar mark links. null → top of this page. */
    url: null as string | null,
  },

  dates: {
    display: '17–18 October 2026',
    startISO: '2026-10-17',
    endISO: '2026-10-18',
  },
  format: '30-hour offline hackathon',
  durationHours: 30,

  prizePool: 'Worth ₹50,000',
  winnerOpportunity:
    'Winners get an opportunity for a TATA STRIVE internship, subject to applicable terms and conditions.',

  rules: {
    eligibility: 'Strictly open to KJSIT students in TY (Third Year) and LY (Last Year).',
    teamSize: 'Exactly four members per team.',
    diversity: 'At least one female participant is compulsory in every team.',
  },

  registration: {
    /** Set VITE_REGISTRATION_URL (see .env.example) to open registration. */
    url: REGISTRATION_CLOSED ? null : registrationUrl,
    status: (REGISTRATION_CLOSED ? 'closed' : 'open') as RegistrationStatus,
    deadline: 'Saturday, 12:00 AM (midnight)',
  },

  shortlist: {
    title: 'Shortlisted Teams',
    status: 'Onboarding teams — to be announced soon',
  },

  problemStatements: {
    title: 'Problem Statements',
    status: 'To be released soon',
    /** Add the statements here when they are released; the page lists them in order. */
    statements: [] as { id: string; title: string; track?: string; summary: string }[],
    /** A page of its own, beside index.html (see vite.config.ts). */
    href: 'problem-statements.html',
    submission: {
      deadlineISO: '2026-10-13T23:59:00+05:30',
      display: 'Tuesday, 13 October 2026 · 11:59 PM IST',
      /** when the hourglass was turned; the sand drains from here to the deadline */
      openedISO: '2026-10-11T00:00:00+05:30',
    },
  },

  social: {
    instagram: { handle: '@csi_kjsit', url: 'https://www.instagram.com/csi_kjsit/' },
  },
} as const;

export const registrationLabel = () => {
  switch (EVENT.registration.status) {
    case 'open':
      return 'Register now';
    case 'closed':
      return 'Registration';
    default:
      return 'Registrations opening soon';
  }
};
