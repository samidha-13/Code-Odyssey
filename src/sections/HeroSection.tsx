import type { TextRefs } from '../cinematic/director';
import { RegisterButton } from '../components/RegisterButton';
import { EVENT } from '../data/event';
import { POWERED_BY } from '../data/sponsors';

type Props = { refFn: (k: keyof TextRefs) => (node: HTMLElement | null) => void };

/**
 * The last scene of the voyage: the CSI ship under its TATA STRIVE sail.
 * Sponsor details and the invitation surface one by one as the ship sails in.
 */
export function HeroSection({ refFn }: Props) {
  return (
    <>
      <div ref={refFn('finaleScrim')} className="finale-scrim" style={{ opacity: 0 }} aria-hidden="true" />

      <div ref={refFn('finale')} className="finale" style={{ visibility: 'hidden' }}>
        <div className="finale-col finale-col--left">
          <p ref={refFn('fEyebrow')} className="finale-eyebrow">
            Allies of the Voyage
          </p>
          {POWERED_BY && (
            <div ref={refFn('fLogo')} className="finale-sponsor">
              <img src={POWERED_BY.logo} width={POWERED_BY.width} height={POWERED_BY.height} alt={POWERED_BY.name} />
              <span>
                <small>{POWERED_BY.tier ?? 'Sponsor'}</small>
                <strong>{POWERED_BY.name}</strong>
              </span>
            </div>
          )}
          <p ref={refFn('fCopy')} className="finale-copy">
            {EVENT.winnerOpportunity}
            <span>Prize pool {EVENT.prizePool.toLowerCase()}.</span>
          </p>
        </div>

        <div className="finale-col finale-col--right">
          <div ref={refFn('fIdentity')} className="finale-identity">
            <span className="fi-name">
              Code Odyssey <em>{EVENT.edition}</em>
            </span>
            <span className="fi-meta">{EVENT.dates.display}</span>
            <span className="fi-meta fi-meta--dim">{EVENT.format}</span>
          </div>
          <div ref={refFn('fCta')} className="finale-cta" style={{ visibility: 'hidden' }}>
            <RegisterButton />
          </div>
        </div>
      </div>

      <div ref={refFn('cue')} className="scroll-cue" style={{ opacity: 0 }} aria-hidden="true">
        Continue the voyage
        <i />
      </div>
    </>
  );
}
