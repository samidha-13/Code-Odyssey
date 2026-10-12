import { useRef } from 'react';
import { SubmissionCountdown } from '../components/SubmissionCountdown';
import { asset } from '../data/asset';
import { EVENT } from '../data/event';

/** the bare scroll of parchment the ink is written on (public/) */
const PAPER = 'page_background-removebg-preview.png';

/**
 * The problem statements, on a sheet of old parchment in the same ink as the
 * shortlist on the bottle's paper. Sealed until they are released; the
 * hourglass counts down to the submission deadline.
 */
export function ProblemStatementsPage() {
  const sheet = useRef<HTMLDivElement>(null);

  // the sheet leans toward the pointer, a few degrees at most
  const onMove = (e: React.PointerEvent) => {
    const el = sheet.current;
    if (!el || e.pointerType !== 'mouse') return;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width - 0.5;
    const y = (e.clientY - b.top) / b.height - 0.5;
    el.style.setProperty('--ry', `${(x * 5).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-y * 4).toFixed(2)}deg`);
  };
  const onLeave = () => {
    sheet.current?.style.setProperty('--ry', '0deg');
    sheet.current?.style.setProperty('--rx', '0deg');
  };

  const ps = EVENT.problemStatements;
  return (
    <div className="ps-page" style={{ ['--grain' as string]: `url(${asset('assets/textures/grain.png')})` }}>
      <header className="ps-top">
        <a className="ps-back" href="./">
          <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden="true">
            <path d="M18 5H2M6 1L2 5l4 4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Back to the voyage
        </a>
        <span className="ps-mark">CSI · KJSIT</span>
      </header>

      <main className="ps-stage" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div ref={sheet} className="ps-sheet" style={{ backgroundImage: `url(${asset(PAPER)})` }}>
          <article className="ps-ink">
            <p data-ink="" className="ps-eyebrow">
              {EVENT.name} · {EVENT.organizer.shortName}
            </p>
            <h1 data-ink="" className="ps-title">
              {ps.title}
            </h1>
            <p data-ink="" className="ps-rule" aria-hidden="true">
              ✦
            </p>
            <p data-ink="" className="ps-soft">
              {ps.status}
            </p>
            <p data-ink="" className="ps-body">
              The challenges are still sealed. Keep watch on {EVENT.social.instagram.handle}.
            </p>

            <div data-ink="" className="ps-count">
              <SubmissionCountdown variant="full" />
            </div>
          </article>
          <span className="ps-seal" aria-hidden="true">
            CO5
          </span>
        </div>
      </main>

      <footer className="ps-footer">
        {EVENT.organizer.name}, {EVENT.organizer.chapter}, {EVENT.organizer.institute} · Powered by TATA STRIVE
      </footer>
    </div>
  );
}
