import type { TextRefs } from '../cinematic/director';
import { RegisterButton } from '../components/RegisterButton';
import { EVENT } from '../data/event';
import { POWERED_BY } from '../data/sponsors';

type Props = { refFn: (k: keyof TextRefs) => (node: HTMLElement | null) => void };

/**
 * The ship's log: while the CSI ship sails, the hackathon's story rises
 * beside it — about, the facts, the articles, the allies and the invitation —
 * in the same rhythm as the voyage log beside the barrel.
 */
export function HeroSection({ refFn }: Props) {
  const { url, status, deadline } = EVENT.registration;
  return (
    <>
      <div ref={refFn('deckScrim')} className="deck-scrim" style={{ opacity: 0 }} aria-hidden="true" />
      <ol ref={refFn('deckTrack')} className="deck-track" style={{ visibility: 'hidden' }} aria-label="About Code Odyssey 5.0">
        <li data-item="" data-chapter="about" data-side="l" className="deck-item">
          <p className="deck-eyebrow">About the voyage</p>
          <h2 className="deck-title">
            Welcome to Code Odyssey <em>{EVENT.edition}</em>
          </h2>
          <p className="deck-body">
            Code Odyssey 5 (CO5) is organized by the {EVENT.organizer.name} student chapter of {EVENT.organizer.institute}.
          </p>
          <p className="deck-body deck-body--dim">
            It is a {EVENT.format} taking place on {EVENT.dates.display}.
          </p>
        </li>

        <li data-item="" data-side="r" className="deck-item">
          <p className="deck-eyebrow">The voyage in numbers</p>
          <dl className="deck-facts">
            <div>
              <dt>Prize pool</dt>
              <dd>₹50,000</dd>
              <dd className="deck-fact-note">{EVENT.prizePool}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>
                {EVENT.durationHours} <small>hours</small>
              </dd>
              <dd className="deck-fact-note">Offline hackathon</dd>
            </div>
            <div>
              <dt>Set sail</dt>
              <dd>17–18</dd>
              <dd className="deck-fact-note">October 2026</dd>
            </div>
          </dl>
        </li>

        <li data-item="" data-side="l" className="deck-item">
          <p className="deck-eyebrow">Articles of the voyage</p>
          <ol className="deck-articles">
            <li>
              <span>I</span>
              <strong>Eligibility</strong>
              {EVENT.rules.eligibility}
            </li>
            <li>
              <span>II</span>
              <strong>The crew</strong>
              {EVENT.rules.teamSize}
            </li>
            <li>
              <span>III</span>
              <strong>Diversity</strong>
              {EVENT.rules.diversity}
            </li>
          </ol>
        </li>

        <li data-item="" data-chapter="sponsors" data-side="r" className="deck-item">
          <p className="deck-eyebrow">Allies of the voyage</p>
          {POWERED_BY && (
            <div className="deck-sponsor">
              <img src={POWERED_BY.logo} width={POWERED_BY.width} height={POWERED_BY.height} alt={POWERED_BY.name} />
              <span>
                <small>{POWERED_BY.tier ?? 'Sponsor'}</small>
                <strong>{POWERED_BY.name}</strong>
              </span>
            </div>
          )}
          <p className="deck-body">{EVENT.winnerOpportunity}</p>
        </li>

        <li data-item="" data-chapter="register" data-side="l" className="deck-item">
          <p className="deck-eyebrow">Join the crew</p>
          <h2 className="deck-title">
            Code Odyssey <em>{EVENT.edition}</em>
          </h2>
          <p className="deck-meta">
            {EVENT.dates.display} · {EVENT.format}
          </p>
          <dl className="deck-reg">
            <div>
              <dt>Registration</dt>
              <dd>{status === 'open' && url ? 'Open now' : status === 'closed' ? 'Closed' : 'Opening soon'}</dd>
            </div>
            <div>
              <dt>Deadline</dt>
              <dd>{deadline}</dd>
            </div>
          </dl>
          <div className="deck-cta">
            <RegisterButton />
          </div>
          <p className="deck-follow">
            Follow{' '}
            <a href={EVENT.social.instagram.url} target="_blank" rel="noopener noreferrer">
              {EVENT.social.instagram.handle}
            </a>{' '}
            for announcements.
          </p>
        </li>
      </ol>
    </>
  );
}
