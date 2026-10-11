import { useRef } from 'react';
import { asset } from '../data/asset';
import { SPONSORS, type Sponsor } from '../data/sponsors';
import { useReveal } from '../hooks/useReveal';

function Banner({ s, size }: { s: Sponsor; size: 'lead' | 'ally' }) {
  const logoH = size === 'lead' ? 'h-[clamp(8rem,16vw,12.5rem)]' : 'h-[clamp(4.5rem,8vw,6.5rem)]';
  const body = (
    <>
      {/* the yard and its lashings */}
      <span className="absolute -inset-x-6 top-0 block h-[3px] rounded-full bg-gradient-to-r from-bronze-deep via-bronze-light to-bronze-deep shadow-[0_2px_6px_rgb(0_0_0/0.5)]" />
      <span className="absolute left-[12%] top-[-3px] block h-2.5 w-1.5 rounded-sm bg-bronze-deep" />
      <span className="absolute right-[12%] top-[-3px] block h-2.5 w-1.5 rounded-sm bg-bronze-deep" />
      <span data-reveal="unfurl" className="mt-[3px] block">
      <span
        className={`sail flex flex-col items-center px-8 text-ink ${size === 'lead' ? 'pb-20 pt-12 sm:px-16' : 'pb-14 pt-8'}`}
      >
        {s.tier && (
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.42em] text-bronze-deep">{s.tier}</span>
        )}
        <img
          src={s.logo}
          width={s.width}
          height={s.height}
          alt={s.name}
          loading="lazy"
          className={`${logoH} mt-6 w-auto rounded-[3px] shadow-[0_14px_30px_-14px_rgb(0_0_0/0.55)]`}
        />
        <span className={`mt-6 font-display tracking-[0.18em] ${size === 'lead' ? 'text-xl' : 'text-base'}`}>{s.name}</span>
      </span>
      </span>
    </>
  );
  const cls = `relative block ${size === 'lead' ? 'w-[min(26rem,100%)]' : 'w-[min(17rem,100%)]'}`;
  return s.url ? (
    <a href={s.url} target="_blank" rel="noopener noreferrer" className={`${cls} transition-transform duration-500 hover:-translate-y-1`}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/**
 * Chapter III — allies of the voyage. Sponsors are hoisted as sail-cloth
 * banners on the night deck; add more in src/data/sponsors.ts.
 */
export function SponsorsSection() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  const lead = SPONSORS.filter((s) => s.tier === 'Powered by');
  const allies = SPONSORS.filter((s) => s.tier !== 'Powered by');
  const tiers = Array.from(new Set(allies.map((s) => s.tier ?? '')));

  return (
    <section id="sponsors" ref={ref} className="relative overflow-hidden bg-[#070f1a]" aria-labelledby="sponsors-title">
      {/* the allied fleet sails in the dark behind the banners */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          data-reveal="parallax"
          data-speed="0.2"
          className="absolute inset-[-10%] bg-cover bg-[center_70%] opacity-[0.17] blur-[3px] saturate-[0.6]"
          style={{ backgroundImage: `url(${asset('assets/ship/csi-fleet.webp')})` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_45%,rgb(7_15_26/0.35),rgb(7_15_26/0.92)_75%)]" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#070f1a] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#070f1a] to-transparent" />
        {/* lantern light */}
        <div className="absolute left-1/2 top-[38%] h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(220_181_124/0.16),transparent_65%)]" />
      </div>

      <div className="relative mx-auto max-w-[78rem] px-5 pb-32 pt-36 text-center sm:px-8 md:pb-44 md:pt-48">
        <p className="eyebrow justify-center text-bronze-light" data-reveal="drift">
          Chapter III · The Allies
        </p>
        <h2 id="sponsors-title" className="mt-8" data-reveal="mask">
          <span className="reveal-line font-serif text-[clamp(1.5rem,2.6vw,2.3rem)] font-light italic text-ivory/75">
            <span>Allies of the</span>
          </span>
          <span className="reveal-line font-display text-[clamp(2.6rem,6vw,5.4rem)] leading-[1] tracking-[0.04em] text-ivory">
            <span>Voyage</span>
          </span>
        </h2>

        <div className="mt-20 flex justify-center md:mt-28">
          {lead.map((s) => (
            <Banner key={s.name} s={s} size="lead" />
          ))}
        </div>

        {tiers.map((tier) => (
          <div key={tier} className="mt-24">
            {tier && (
              <p className="eyebrow justify-center text-ivory/60" data-reveal="drift">
                {tier}
              </p>
            )}
            <div className="mt-12 flex flex-wrap justify-center gap-10">
              {allies
                .filter((s) => (s.tier ?? '') === tier)
                .map((s) => (
                  <Banner key={s.name} s={s} size="ally" />
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
