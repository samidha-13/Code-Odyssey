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
    logo: 'assets/logos/csi-kjsit-logo.png' as string | null,
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
    deadline: 'Saturday, 10 October · 12:00 AM',
  },

  shortlist: {
    title: 'Shortlisted Teams',
    status: '15 Teams Shortlisted',
    teams: [
      'Epoch zero',
      'Oasis',
      '3 Girls and 1 Bug',
      'Apex',
      'Hackie Chan',
      'Reboot',
      'The Turing Mirage',
      'Proxima Brains',
      'Spacebar',
      'FWB',
      'Fast and Curious',
      'Straw Hat Pirates',
      'Techhives',
      'Equinox',
      'Magicians',
    ],
  },

  problemStatements: {
    title: 'Problem Statements',
    status: 'To be released soon',
    /** Add the statements here when they are released; the page lists them in order. */
    theme: 'Driving Innovation to Support Youth in Need',
    statements: [
      {
        id: 'social-pulse',
        title: 'Social Pulse',
        track: 'Challenge: Scattered audience insights',
        summary:
          'Audience conversations are spread across many platforms and tracked manually, so engagement opportunities get missed. Build a tool that monitors brand mentions, identifies trending topics and recommends relevant content for the comms team.',
      },
      {
        id: 'content-catalyst',
        title: 'Content Catalyst',
        track: 'Challenge: Outdated course material',
        summary:
          'Industry practices evolve fast, and spotting outdated curriculum through manual feedback review is slow and inconsistent. Build a system that analyzes course content, ingests feedback, validates it against industry trends and recommends updates.',
      },
      {
        id: 'smart-project-allocation',
        title: 'Smart Project Allocation',
        track: 'Challenge: Manual project assignment',
        summary:
          'Projects are assigned generically and submissions tracked by hand, which gets harder as student numbers grow. Build an AI solution that matches students to projects based on their profiles, with a unified dashboard to track submissions.',
      },
      {
        id: 'partnership-management',
        title: 'Partnership Management',
        track: 'Challenge: Fragmented partner oversight',
        summary:
          'Partner data lives in scattered spreadsheets, causing missed reporting deadlines and heavy admin work. Build a consolidated partner view with AI alerts for upcoming deadlines and suggested follow-up actions.',
      },
      {
        id: 'ai-idea-screening',
        title: 'AI Idea Screening',
        track: 'Challenge: Multi-format language barriers',
        summary:
          'Entrepreneur pitches arrive as audio, text and PDFs in multiple regional languages, making evaluation slow. Build a tool that ingests any format, auto-translates, scores viability and adds local market context for assessors.',
      },
    ] as { id: string; title: string; track?: string; summary: string }[],
    /** A page of its own, beside index.html (see vite.config.ts). */
    href: 'problem-statements.html',
    submission: {
      deadlineISO: '2026-10-14T09:00:00+05:30',
      display: 'Wednesday, 14 October 2026 · 9:00 AM IST',
      /** when the hourglass was turned; the sand drains from here to the deadline */
      openedISO: '2026-10-11T00:00:00+05:30',
      /** Round 1 deliverables go in here */
      formUrl:
        'https://docs.google.com/forms/d/e/1FAIpQLSeDwcVxfKwFgRzELa3El0YmpRWvxfmlnoxK_lkJzwqDXTju2Q/viewform?usp=preview',
      policy: 'Any form of plagiarism or AI-generated content will lead to immediate disqualification of the team.',
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
