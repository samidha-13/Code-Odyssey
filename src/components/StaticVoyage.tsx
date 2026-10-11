import { RegisterButton } from './RegisterButton';
import { asset } from '../data/asset';
import { EVENT } from '../data/event';
import { POWERED_BY } from '../data/sponsors';
import { TIMELINE } from '../data/timeline';

/**
 * Motion-free telling of the same story, used when the visitor prefers
 * reduced motion or WebGL is unavailable. Same plates, same order, no pinning.
 */
export function StaticVoyage() {
  return (
    <section id="home" aria-label="Code Odyssey 5.0 — the voyage" className="relative">
      <h1 className="sr-only">
        {EVENT.name} — {EVENT.format}, {EVENT.dates.display}. Powered by TATA STRIVE.
      </h1>

      <figure className="relative h-[100svh] min-h-[34rem] overflow-hidden">
        <img
          src={asset('assets/sand/sand-helmet-01-wide.webp')}
          alt="An ancient Greek helmet half-buried in desert sand at sunset, a citadel and the Trojan horse beyond."
          className="absolute inset-0 h-full w-full object-cover object-[48%_60%]"
          fetchPriority="high"
        />
        <div className="intro-scrim" aria-hidden="true" />
        <div className="intro" aria-hidden="true">
          <p className="intro-eyebrow">
            <span>Computer Society of India</span>
            <i />
            <span>KJSIT presents</span>
          </p>
          <div className="intro-mark">
            <span className="i-code">CODE</span>
            <span className="i-odyssey">
              ODYSSEY<span className="i-edition">{EVENT.edition}</span>
            </span>
          </div>
          <p className="intro-meta">
            <span>{EVENT.dates.display}</span>
            <i />
            <span>{EVENT.format}</span>
          </p>
        </div>
      </figure>

      <div className="relative overflow-hidden bg-abyss">
        <img src={asset('assets/ocean/ocean-light-rays.webp')} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-bottom opacity-80" />
        <div className="relative mx-auto grid max-w-5xl gap-12 px-6 py-28 md:grid-cols-[1fr_14rem]">
          <div>
            <p className="log-eyebrow">The Voyage Log</p>
            <p className="log-date !text-left">{EVENT.dates.display}</p>
            <ol className="mt-12 space-y-12">
              {TIMELINE.map((m, i) => (
                <li key={m.id} className="log-item !m-0 !w-auto !text-left" style={{ ['--focus' as string]: 1 }}>
                  <span className="log-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="log-when">{m.when}</span>
                  <h3 className="log-title">{m.title}</h3>
                  <p className="log-detail">{m.detail}</p>
                  <span className="log-tags !justify-start">
                    {m.confirmed && <span className="log-tag log-tag--on">Confirmed date</span>}
                    {m.note && <span className="log-tag">{m.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <img src={asset('assets/props/barrel.webp')} alt="" loading="lazy" className="hidden w-56 self-center opacity-80 md:block" />
        </div>
      </div>

      <div className="relative min-h-[100svh] overflow-hidden">
        <img
          src={asset('assets/ship/csi-ship-scene.webp')}
          alt="The CSI ship under a TATA STRIVE sail, flying the CSI-KJSIT flag on the open sea."
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="finale-scrim" aria-hidden="true" />
        <div className="finale !relative min-h-[100svh]">
          <div className="finale-col finale-col--left">
            <p className="finale-eyebrow">Allies of the Voyage</p>
            {POWERED_BY && (
              <div className="finale-sponsor">
                <img src={POWERED_BY.logo} width={POWERED_BY.width} height={POWERED_BY.height} alt={POWERED_BY.name} />
                <span>
                  <small>{POWERED_BY.tier}</small>
                  <strong>{POWERED_BY.name}</strong>
                </span>
              </div>
            )}
            <p className="finale-copy">{EVENT.winnerOpportunity}</p>
          </div>
          <div className="finale-col finale-col--right">
            <div className="finale-identity">
              <span className="fi-name">
                Code Odyssey <em>{EVENT.edition}</em>
              </span>
              <span className="fi-meta">{EVENT.dates.display}</span>
              <span className="fi-meta fi-meta--dim">{EVENT.format}</span>
            </div>
            <div className="finale-cta">
              <RegisterButton />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
