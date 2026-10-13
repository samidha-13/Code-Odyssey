import { useEffect, useState } from 'react';
import { asset } from '../data/asset';
import { EVENT } from '../data/event';
import { navigateTo } from '../hooks/navigate';
import { useActiveSection } from '../hooks/useActiveSection';

export const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'register', label: 'Register' },
] as const;
const IDS = NAV_ITEMS.map((n) => n.id);

/** Small astrolabe glyph — decorative, used beside the typographic CSI mark. */
function Astrolabe({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="17.5" stroke="currentColor" strokeOpacity="0.55" />
      <circle cx="20" cy="20" r="12" stroke="currentColor" strokeOpacity="0.35" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const r1 = i % 6 === 0 ? 14 : 15.8;
        return (
          <line
            key={i}
            x1={20 + Math.cos(a) * r1}
            y1={20 + Math.sin(a) * r1}
            x2={20 + Math.cos(a) * 17.5}
            y2={20 + Math.sin(a) * 17.5}
            stroke="currentColor"
            strokeOpacity={i % 6 === 0 ? 0.9 : 0.4}
          />
        );
      })}
      <path d="M20 6 L22.4 20 L20 34 L17.6 20 Z" fill="currentColor" fillOpacity="0.85" />
      <circle cx="20" cy="20" r="1.6" fill="#050d18" />
    </svg>
  );
}

export function Navbar() {
  const active = useActiveSection(IDS);
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  // once past the cinematic, the bar becomes an opaque deep-sea glass
  useEffect(() => {
    const about = () => document.getElementById('about');
    const onScroll = () => {
      const a = about();
      setSolid(!!a && a.getBoundingClientRect().top <= 72);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    navigateTo(id);
  };

  const org = EVENT.organizer;
  const markInner = (
    <>
      {org.logo ? (
        <img src={asset(org.logo)} alt="" width={40} height={40} className="h-10 w-10" />
      ) : (
        <Astrolabe className="h-8 w-8 text-bronze-light transition-transform duration-700 group-hover:rotate-45" />
      )}
      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.95rem] font-semibold tracking-[0.2em] text-ivory">CSI</span>
        <span className="mt-1 text-[0.56rem] font-semibold tracking-[0.42em] text-ivory/70">KJSIT</span>
      </span>
    </>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="nav-shell" data-solid={solid}>
        <nav
          className="mx-auto flex h-16 max-w-[90rem] items-center justify-between px-5 sm:px-8"
          aria-label="Primary"
        >
          {org.url ? (
            <a href={org.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3" aria-label="CSI KJSIT">
              {markInner}
            </a>
          ) : (
            <a href="#home" onClick={go('home')} className="group flex items-center gap-3" aria-label="CSI KJSIT — back to the beginning">
              {markInner}
            </a>
          )}

          <ul className="hidden items-center gap-9 md:flex">
            {NAV_ITEMS.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  onClick={go(n.id)}
                  className="nav-link"
                  aria-current={active === n.id ? 'true' : undefined}
                >
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <a href={asset(EVENT.problemStatements.href)} className="nav-link nav-link--page">
                {EVENT.problemStatements.title}
              </a>
            </li>
          </ul>

          <button
            type="button"
            className="relative -mr-2 flex h-11 w-11 items-center justify-center md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3 w-6">
              <span
                className={`absolute left-0 block h-px w-6 bg-ivory transition-transform duration-300 ${open ? 'top-1.5 rotate-45' : 'top-0'}`}
              />
              <span
                className={`absolute left-0 block h-px bg-ivory transition-all duration-300 ${open ? 'top-1.5 w-6 -rotate-45' : 'top-3 w-4'}`}
              />
            </span>
          </button>
        </nav>
      </div>

      <div
        id="mobile-menu"
        className={`fixed inset-0 top-0 -z-10 bg-abyss/95 backdrop-blur-md transition-opacity duration-500 md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!open}
      >
        <ul className="flex h-full flex-col justify-center gap-2 px-8">
          {NAV_ITEMS.map((n, i) => (
            <li
              key={n.id}
              className="transition-all duration-500"
              style={{ transitionDelay: open ? `${80 + i * 60}ms` : '0ms', transform: open ? 'none' : 'translateY(12px)', opacity: open ? 1 : 0 }}
            >
              <a
                href={`#${n.id}`}
                onClick={go(n.id)}
                tabIndex={open ? 0 : -1}
                className="flex items-baseline gap-5 border-b border-ivory/10 py-4"
                aria-current={active === n.id ? 'true' : undefined}
              >
                <span className="font-serif text-sm italic text-bronze-light">0{i + 1}</span>
                <span className={`font-display text-3xl tracking-[0.12em] ${active === n.id ? 'text-ivory' : 'text-ivory/70'}`}>
                  {n.label}
                </span>
              </a>
            </li>
          ))}
          <li
            className="transition-all duration-500"
            style={{ transitionDelay: open ? `${80 + NAV_ITEMS.length * 60}ms` : '0ms', transform: open ? 'none' : 'translateY(12px)', opacity: open ? 1 : 0 }}
          >
            <a
              href={asset(EVENT.problemStatements.href)}
              tabIndex={open ? 0 : -1}
              className="flex items-baseline gap-5 border-b border-ivory/10 py-4"
            >
              <span className="font-serif text-sm italic text-bronze-light">0{NAV_ITEMS.length + 1}</span>
              <span className="font-display text-3xl tracking-[0.12em] text-ivory/70">{EVENT.problemStatements.title}</span>
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
