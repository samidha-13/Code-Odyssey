import { useRef } from 'react';
import { RegisterButton } from '../components/RegisterButton';
import { SectionTransition } from '../components/SectionTransition';
import { asset } from '../data/asset';
import { EVENT } from '../data/event';
import { useReveal } from '../hooks/useReveal';

/**
 * Landfall — the voyage ends where it began, on the shore beneath the
 * citadel. The invitation to register, stated plainly.
 */
export function RegisterSection() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  const { status, deadline } = EVENT.registration;

  return (
    <section id="register" ref={ref} className="relative overflow-hidden bg-[#070f1a]" aria-labelledby="register-title">
      <div className="absolute inset-0" aria-hidden="true">
        <div
          data-reveal="parallax"
          data-speed="0.18"
          className="absolute inset-[-8%] bg-cover bg-[50%_45%]"
          style={{ backgroundImage: `url(${asset('assets/sand/sand-background.webp')})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070f1a] via-[#070f1a]/55 to-[#140b06]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_55%,transparent,rgb(7_15_26/0.6))]" />
      </div>
      <SectionTransition variant="deck-to-shore" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-[64rem] flex-col items-center justify-center px-5 py-28 text-center sm:px-8 sm:py-36">
        <p className="eyebrow justify-center text-bronze-light" data-reveal="drift">
          Landfall
        </p>
        <h2 id="register-title" className="mt-8" data-reveal="mask">
          <span className="reveal-line font-serif text-[clamp(1.6rem,3vw,2.6rem)] font-light italic text-ivory/85">
            <span>The shore of the unknown</span>
          </span>
          <span className="reveal-line font-display text-[clamp(2.6rem,6.6vw,6rem)] leading-[1] tracking-[0.04em] text-ivory">
            <span>awaits your crew</span>
          </span>
        </h2>

        <div className="mt-10" data-reveal="drift">
          <RegisterButton />
        </div>

        <p className="mt-10 max-w-xl text-[0.98rem] leading-relaxed text-ivory/80" data-reveal="drift">
          {EVENT.format} · {EVENT.dates.display}. {EVENT.rules.teamSize} {EVENT.rules.diversity}
        </p>

        <dl className="mt-14 grid w-full max-w-2xl gap-6 border-y border-ivory/15 py-7 text-left sm:grid-cols-2" data-reveal="drift">
          <div>
            <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-bronze-light">Registration</dt>
            <dd className="mt-2 font-serif text-xl text-ivory">
              {status === 'open' ? 'Open now' : status === 'closed' ? 'Closed' : 'Opening soon'}
            </dd>
          </div>
          <div>
            <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-bronze-light">Deadline</dt>
            <dd className="mt-2 font-serif text-xl text-ivory">{deadline}</dd>
          </div>
        </dl>

        <div className="mt-12 w-full max-w-2xl px-1 text-center" data-reveal="drift">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-bronze-light">{EVENT.shortlist.title}</p>
          <p className="mt-3 font-display text-[clamp(1.15rem,3.6vw,1.9rem)] uppercase leading-tight tracking-[0.05em] text-ivory [overflow-wrap:anywhere]">
            {EVENT.shortlist.status}
          </p>
        </div>

        <p className="mt-8 text-sm text-ivory/70" data-reveal="drift">
          Follow{' '}
          <a
            href={EVENT.social.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ivory underline decoration-bronze-light/60 underline-offset-4 transition-colors hover:text-bronze-light"
          >
            {EVENT.social.instagram.handle}
          </a>{' '}
          on Instagram for announcements.
        </p>
      </div>
    </section>
  );
}
