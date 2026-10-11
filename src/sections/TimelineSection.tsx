import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { TIMELINE } from '../data/timeline';
import { useReveal } from '../hooks/useReveal';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import { SectionTransition } from '../components/SectionTransition';

function CompassRose({ className = '' }: { className?: string }) {
  const pts = Array.from({ length: 16 });
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 3" />
      <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" strokeWidth="0.4" />
      {pts.map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const long = i % 4 === 0;
        const r = long ? 92 : i % 2 === 0 ? 70 : 50;
        const w = long ? 9 : 5;
        const x = 100 + Math.sin(a) * r;
        const y = 100 - Math.cos(a) * r;
        const lx = 100 + Math.sin(a + Math.PI / 2) * w;
        const ly = 100 - Math.cos(a + Math.PI / 2) * w;
        const rx = 100 + Math.sin(a - Math.PI / 2) * w;
        const ry = 100 - Math.cos(a - Math.PI / 2) * w;
        return (
          <g key={i}>
            <path d={`M100 100 L${lx} ${ly} L${x} ${y} Z`} fill="currentColor" fillOpacity={long ? 0.55 : 0.25} />
            <path d={`M100 100 L${rx} ${ry} L${x} ${y} Z`} fill="currentColor" fillOpacity={long ? 0.25 : 0.1} />
          </g>
        );
      })}
      <text x="100" y="20" textAnchor="middle" fontSize="11" fill="currentColor" fontFamily="Cinzel, serif">
        N
      </text>
    </svg>
  );
}

/**
 * Chapter II — the captain's chart. A route draws itself through each
 * waypoint as the visitor scrolls; confirmed dates are marked as such and
 * everything else shows exactly what has been announced.
 */
export function TimelineSection() {
  const ref = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [path, setPath] = useState({ d: '', w: 0, h: 0 });
  useReveal(ref);

  // build the route through the actual marker positions
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const build = () => {
      const box = list.getBoundingClientRect();
      const pts = Array.from(list.querySelectorAll<HTMLElement>('[data-waypoint]')).map((m) => {
        const r = m.getBoundingClientRect();
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
      });
      if (pts.length < 2) return;
      const start = { x: pts[0].x, y: Math.max(0, pts[0].y - 120) };
      const end = { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y + 120 };
      const all = [start, ...pts, end];
      let d = `M${all[0].x.toFixed(1)} ${all[0].y.toFixed(1)}`;
      for (let i = 1; i < all.length; i++) {
        const a = all[i - 1];
        const b = all[i];
        const my = (b.y - a.y) * 0.5;
        d += ` C${a.x.toFixed(1)} ${(a.y + my).toFixed(1)} ${b.x.toFixed(1)} ${(b.y - my).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      }
      setPath({ d, w: box.width, h: box.height });
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(list);
    document.fonts?.ready.then(build);
    return () => ro.disconnect();
  }, []);

  // draw the route + light each waypoint as the route reaches it
  useLayoutEffect(() => {
    if (!path.d || prefersReducedMotion()) return;
    const list = listRef.current!;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-route]',
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: 0.6 },
        },
      );
      list.querySelectorAll<HTMLElement>('[data-milestone]').forEach((li) => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: li, start: 'top 78%', end: 'top 48%', scrub: 0.6 },
        });
        tl.fromTo(li.querySelector('[data-waypoint]'), { scale: 0.4, opacity: 0.35 }, { scale: 1, opacity: 1, ease: 'back.out(2)' }, 0)
          .fromTo(li.querySelector('[data-glow]'), { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1 }, 0.1)
          .fromTo(li.querySelector('[data-card]'), { opacity: 0, x: li.dataset.side === 'r' ? 40 : -40 }, { opacity: 1, x: 0, ease: 'power2.out' }, 0.05)
          .fromTo(li.querySelector('[data-tick]'), { scaleX: 0 }, { scaleX: 1, ease: 'power2.out' }, 0.2);
      });
    }, ref);
    return () => ctx.revert();
  }, [path.d]);

  return (
    <section id="timeline" ref={ref} className="chart-paper relative overflow-hidden text-ink" aria-labelledby="timeline-title">
      <SectionTransition variant="sea-to-chart" />
      <div className="chart-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <CompassRose className="pointer-events-none absolute -right-24 top-24 w-[min(34rem,70vw)] text-bronze-deep/25 md:right-[-4rem]" />

      <div className="relative mx-auto max-w-[78rem] px-5 pb-32 pt-28 sm:px-8 md:pb-44 md:pt-40">
        <header className="max-w-3xl">
          <p className="eyebrow text-bronze-deep" data-reveal="drift">
            Chapter II · The Route
          </p>
          <h2 id="timeline-title" className="mt-8" data-reveal="mask">
            <span className="reveal-line font-display text-[clamp(2.4rem,5.6vw,5rem)] leading-[1] tracking-[0.02em]">
              <span>The Voyage</span>
            </span>
            <span className="reveal-line font-serif text-[clamp(2.4rem,5.4vw,4.8rem)] font-light italic leading-[1.05] text-bronze-deep">
              <span>Chart</span>
            </span>
          </h2>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-ink-soft" data-reveal="drift">
            <span className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rotate-45 bg-navy" aria-hidden="true" /> Confirmed date
            </span>
            <span className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rotate-45 border border-dashed border-ink-soft" aria-hidden="true" /> As announced · details to be announced
            </span>
          </div>
        </header>

        <ol ref={listRef} className="relative mt-20 md:mt-28">
          {path.d && (
            <svg
              className="pointer-events-none absolute left-0 top-0 overflow-visible"
              width={path.w}
              height={path.h}
              viewBox={`0 0 ${path.w} ${path.h}`}
              aria-hidden="true"
            >
              <path d={path.d} fill="none" stroke="rgb(28 26 23 / 0.22)" strokeWidth="1" strokeDasharray="2 7" />
              <path
                data-route=""
                d={path.d}
                pathLength={1}
                fill="none"
                stroke="#7a5528"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray="1"
                strokeDashoffset={prefersReducedMotion() ? 0 : 1}
              />
            </svg>
          )}

          {TIMELINE.map((m, i) => {
            const side = i % 2 === 0 ? 'l' : 'r';
            return (
              <li
                key={m.id}
                data-milestone=""
                data-side={side}
                className="relative grid min-h-[13rem] items-center pb-14 pl-14 md:grid-cols-2 md:pb-6 md:pl-0"
              >
                {/* waypoint */}
                <span
                  className={`absolute left-[1.15rem] top-3 md:top-1/2 md:-translate-y-1/2 ${side === 'l' ? 'md:left-[46%]' : 'md:left-[54%]'}`}
                >
                  <span className="relative -ml-3 -mt-3 grid h-6 w-6 place-items-center md:-mt-3">
                    <span data-glow="" className="absolute inset-[-10px] rounded-full bg-bronze/25 blur-md" aria-hidden="true" />
                    <span
                      data-waypoint=""
                      className={`relative block h-3.5 w-3.5 rotate-45 ${m.confirmed ? 'bg-navy ring-4 ring-navy/15' : 'border border-dashed border-ink bg-parchment'}`}
                      aria-hidden="true"
                    />
                  </span>
                </span>

                <div
                  data-card=""
                  className={`relative ${side === 'l' ? 'md:col-start-1 md:pr-[14%] md:text-right' : 'md:col-start-2 md:pl-[14%]'}`}
                >
                  <span
                    data-tick=""
                    className={`mb-5 hidden h-px w-14 bg-bronze-deep/60 md:block ${side === 'l' ? 'ml-auto origin-right' : 'origin-left'}`}
                    aria-hidden="true"
                  />
                  <span className="font-serif text-sm italic text-bronze-deep">Waypoint {String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-2 font-display text-[clamp(1.25rem,2vw,1.7rem)] leading-tight tracking-[0.06em]">{m.title}</h3>
                  <p className="mt-3 font-serif text-[clamp(1.4rem,2.2vw,1.9rem)] font-medium leading-tight text-navy">
                    {m.when}
                  </p>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{m.detail}</p>
                  <p className={`mt-4 flex flex-wrap gap-2 ${side === 'l' ? 'md:justify-end' : ''}`}>
                    {m.confirmed && (
                      <span className="rounded-full bg-navy px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-ivory">
                        Confirmed date
                      </span>
                    )}
                    {m.note && (
                      <span className="rounded-full border border-dashed border-ink/40 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink-soft">
                        {m.note}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <SectionTransition variant="chart-to-deck" />
    </section>
  );
}
