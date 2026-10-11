import { asset } from './asset';

/**
 * Allies of the voyage. Add a sponsor by appending an entry — the Sponsors
 * section and the hero acknowledgement read from this list.
 */
export type Sponsor = {
  name: string;
  /** Path inside /public. Keep the original artwork; it is never cropped. */
  logo: string;
  /** Optional tier label, e.g. 'Powered by', 'Gold'. */
  tier?: string;
  /** Optional website. When omitted the logo is not a link. */
  url?: string;
  /** Natural logo size, used to reserve space and preserve proportions. */
  width: number;
  height: number;
};

export const SPONSORS: Sponsor[] = [
  {
    name: 'TATA STRIVE',
    logo: asset('assets/logos/tata-strive-logo.png'),
    tier: 'Powered by',
    width: 225,
    height: 225,
  },
];

export const POWERED_BY = SPONSORS.find((s) => s.tier === 'Powered by') ?? null;
