import { useRef } from 'react';
import { ScrollText } from '../components/ScrollText';
import { asset } from '../data/asset';
import { EVENT } from '../data/event';
import { useReveal } from '../hooks/useReveal';

const ARTICLES = [
  { n: 'I', title: 'Eligibility', text: EVENT.rules.eligibility },
  { n: 'II', title: 'The Crew', text: EVENT.rules.teamSize },
  { n: 'III', title: 'Diversity', text: EVENT.rules.diversity },
];

/**
 * Chapter I — the ship's ocean continues behind the page while the event's
 * facts are laid out like a voyage log.
 */
export function AboutSection() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <section id="about" ref={ref} className="relative overflow-hidden bg-deep" aria-labelledby="about-title">
      {/* the same sea the ship sails on, sinking away into deep water */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[120vh]" aria-hidden="true">
        <div
          data-reveal="parallax"
          data-speed="0.25"
          className="absolute inset-0 bg-cover bg-top"
          style={{
            backgroundImage: `url(${asset('assets/ocean/ocean-open-sea.webp')})`,
            maskImage: 'linear-gradient(180deg, #000 0%, rgb(0 0 0 / 0.55) 35%, transparent 85%)',
            WebkitMaskImage: 'linear-gradient(180deg, #000 0%, rgb(0 0 0 / 0.55) 35%, transparent 85%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2440]/40 via-deep/70 to-deep" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{ backgroundImage: `url(${asset('assets/textures/grain.png')})`, backgroundSize: '160px' }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[84rem] px-5 pb-28 pt-32 sm:px-8 md:pb-40 md:pt-44">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <header className="lg:col-span-7">
            <p className="eyebrow text-bronze-light" data-reveal="drift">
              Chapter I · The Call
            </p>
            <h2 id="about-title" className="mt-8" data-reveal="mask">
              <span className="reveal-line font-serif text-[clamp(1.6rem,3vw,2.6rem)] font-light italic text-ivory/80">
                <span>Welcome to</span>
              </span>
              <span className="reveal-line font-display text-[clamp(2.6rem,6.4vw,6rem)] leading-[0.98] tracking-[0.02em] text-ivory">
                <span>Code Odyssey</span>
              </span>
              <span className="reveal-line font-serif text-[clamp(2.6rem,6vw,5.6rem)] font-light italic leading-[1] text-bronze-light">
                <span>{EVENT.edition}</span>
              </span>
            </h2>
          </header>

          <div className="flex flex-col justify-end lg:col-span-5 lg:pb-3">
            <ScrollText
              variant="read"
              className="font-serif text-[clamp(1.25rem,1.9vw,1.6rem)] font-light leading-[1.5] text-ivory"
              lines={[
                `Code Odyssey 5 (CO5) is organized by the ${EVENT.organizer.name} student chapter of ${EVENT.organizer.institute}.`,
              ]}
            />
            <p className="mt-6 max-w-xl text-[0.98rem] leading-relaxed text-ivory-dim" data-reveal="drift">
              It is a {EVENT.format} taking place on {EVENT.dates.display}.
            </p>
          </div>
        </div>

        {/* the log: three facts, read like coordinates */}
        <dl className="mt-24 grid border-t border-ivory/10 md:mt-32 md:grid-cols-3">
          <div className="relative border-b border-ivory/10 py-10 md:border-b-0 md:border-r md:pr-10">
            <span data-reveal="rule" className="absolute left-0 top-[-1px] block h-px w-full origin-left bg-bronze-light/70" />
            <dt className="flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.34em] text-bronze-light">
              <span className="font-serif text-sm normal-case italic tracking-normal">i.</span> Prize pool
            </dt>
            <dd className="mt-5">
              <span className="font-display text-[clamp(2.4rem,4.4vw,4rem)] leading-none text-ivory" aria-label="Worth ₹50,000">
                <span aria-hidden="true">₹</span>
                <span data-reveal="count" data-count="50000" aria-hidden="true">
                  50,000
                </span>
              </span>
              <span className="mt-3 block text-sm text-ivory-dim">{EVENT.prizePool}</span>
            </dd>
          </div>
          <div className="relative border-b border-ivory/10 py-10 md:border-b-0 md:border-r md:px-10">
            <span data-reveal="rule" className="absolute left-0 top-[-1px] block h-px w-full origin-left bg-bronze-light/70" />
            <dt className="flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.34em] text-bronze-light">
              <span className="font-serif text-sm normal-case italic tracking-normal">ii.</span> Duration
            </dt>
            <dd className="mt-5">
              <span className="font-display text-[clamp(2.4rem,4.4vw,4rem)] leading-none text-ivory">
                <span data-reveal="count" data-count={EVENT.durationHours}>
                  {EVENT.durationHours}
                </span>
                <span className="ml-2 font-serif text-[0.5em] italic text-ivory/80">hours</span>
              </span>
              <span className="mt-3 block text-sm text-ivory-dim">Offline hackathon</span>
            </dd>
          </div>
          <div className="relative py-10 md:pl-10">
            <span data-reveal="rule" className="absolute left-0 top-[-1px] block h-px w-full origin-left bg-bronze-light/70" />
            <dt className="flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.34em] text-bronze-light">
              <span className="font-serif text-sm normal-case italic tracking-normal">iii.</span> Set sail
            </dt>
            <dd className="mt-5">
              <span className="font-display text-[clamp(2.4rem,4.4vw,4rem)] leading-none text-ivory">17–18</span>
              <span className="mt-3 block text-sm text-ivory-dim">October 2026</span>
            </dd>
          </div>
        </dl>

        {/* the horizon: what awaits the winners */}
        <div className="mt-24 grid items-end gap-10 md:mt-36 md:grid-cols-12">
          <p className="eyebrow text-bronze-light md:col-span-3 md:pb-3" data-reveal="drift">
            Beyond the horizon
          </p>
          <div className="md:col-span-9" data-reveal="mask">
            <p className="font-serif text-[clamp(1.7rem,3.4vw,3.1rem)] font-light leading-[1.18] text-ivory">
              <span className="reveal-line">
                <span>Winners get an opportunity for a</span>
              </span>
              <span className="reveal-line">
                <span>
                  <em className="not-italic text-bronze-light">TATA STRIVE internship</em>,
                </span>
              </span>
              <span className="reveal-line">
                <span className="text-ivory/60 italic">subject to applicable terms and conditions.</span>
              </span>
            </p>
          </div>
        </div>

        {/* articles of the voyage */}
        <div className="relative mt-28 md:mt-40">
          <div className="flex items-baseline justify-between gap-6">
            <h3 className="font-display text-[clamp(1.3rem,2.2vw,1.9rem)] tracking-[0.14em] text-ivory" data-reveal="drift">
              Articles of the Voyage
            </h3>
          </div>
          <div className="relative mt-10">
          <img
            src={asset('assets/helmet/helmet-isolated.webp')}
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={241}
            height={493}
            className="pointer-events-none absolute bottom-[calc(100%-1.25rem)] right-[3%] z-10 hidden w-[clamp(6rem,9vw,8.5rem)] drop-shadow-[0_24px_30px_rgb(0_0_0/0.55)] lg:block"
          />
          <ol className="grid gap-px overflow-hidden rounded-[2px] bg-ink/30 md:grid-cols-3">
            {ARTICLES.map((a) => (
              <li key={a.n} className="chart-paper relative px-7 pb-10 pt-8 text-ink" data-reveal="unfurl">
                <span className="font-serif text-5xl font-light italic text-bronze-deep/80">{a.n}</span>
                <span className="mt-6 block text-[0.66rem] font-bold uppercase tracking-[0.34em] text-ink-soft">{a.title}</span>
                <p className="mt-3 font-serif text-[1.35rem] leading-snug text-ink">{a.text}</p>
                <svg className="absolute bottom-4 right-5 h-6 w-6 text-bronze-deep/40" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2l1.6 8.4L22 12l-8.4 1.6L12 22l-1.6-8.4L2 12l8.4-1.6z" fill="currentColor" />
                </svg>
              </li>
            ))}
          </ol>
          </div>
        </div>

        <div className="mt-24 flex flex-col gap-3 border-t border-ivory/10 pt-10 text-sm text-ivory-dim md:mt-32 md:flex-row md:items-center md:justify-between">
          <p data-reveal="drift">
            <span className="text-[0.66rem] font-semibold uppercase tracking-[0.34em] text-bronze-light">Organized by</span>
            <span className="mt-2 block font-serif text-lg text-ivory md:mt-1">
              {EVENT.organizer.name}, {EVENT.organizer.chapter}
            </span>
            <span className="block">{EVENT.organizer.institute}</span>
          </p>
          <p data-reveal="drift" className="md:text-right">
            <span className="text-[0.66rem] font-semibold uppercase tracking-[0.34em] text-bronze-light">Powered by</span>
            <span className="mt-2 block font-display tracking-[0.16em] text-ivory md:mt-1">TATA STRIVE</span>
          </p>
        </div>
      </div>
    </section>
  );
}
