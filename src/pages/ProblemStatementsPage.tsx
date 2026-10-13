import { SubmissionCountdown } from '../components/SubmissionCountdown';
import { asset } from '../data/asset';
import { EVENT } from '../data/event';

/**
 * A torn page with no ends (design/source-assets/paper/Problemstatements_background-removebg-preview.png),
 * stacked with its mirror image into ps-paper-tile.webp so it repeats without a
 * seam and grows as long as the text on it.
 */
const PAPER = 'assets/textures/ps-paper-tile.webp';

/**
 * The problem statements, in ink on a long sheet of old paper, in the same
 * hand as the shortlist on the bottle's paper. Sealed until they are
 * released; the hourglass counts down to the submission deadline.
 */
export function ProblemStatementsPage() {
  const ps = EVENT.problemStatements;
  const released = ps.statements.length > 0;
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

      <main className="ps-stage">
        <article className="ps-sheet" style={{ backgroundImage: `url(${asset(PAPER)})` }}>
          <div className="ps-ink">
            <p data-ink="" className="ps-eyebrow">
              {EVENT.name} · {EVENT.organizer.shortName}
            </p>
            <h1 data-ink="" className="ps-title">
              {ps.title}
            </h1>
            <p data-ink="" className="ps-rule" aria-hidden="true">
              ✦
            </p>

            {released && (
              <p data-ink="" className="ps-soft">
                {ps.theme}
              </p>
            )}
            {released ? (
              <ol data-ink="" className="ps-list">
                {ps.statements.map((s, i) => (
                  <li key={s.id} className="ps-item">
                    <span className="ps-num">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      {s.track && <p className="ps-track">{s.track}</p>}
                      <h2 className="ps-item-title">{s.title}</h2>
                      <p className="ps-item-body">{s.summary}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <>
                <p data-ink="" className="ps-soft">
                  {ps.status}
                </p>
                <p data-ink="" className="ps-body">
                  The challenges of this voyage are still sealed. They will be written on this page before the crews
                  set sail on {EVENT.dates.display}. Keep watch on {EVENT.social.instagram.handle} for the announcement.
                </p>
              </>
            )}

            <div data-ink="" className="ps-divider" aria-hidden="true">
              <span />✦<span />
            </div>

            <div data-ink="" className="ps-count">
              <SubmissionCountdown variant="full" />
            </div>

            {released && (
              <div data-ink="" className="ps-submit">
                <a className="btn-voyage" href={ps.submission.formUrl} target="_blank" rel="noopener noreferrer">
                  Submit Round 1
                  <svg className="arrow" width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden="true">
                    <path d="M0 5h16M12 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </a>
                <p className="ps-policy">{ps.submission.policy}</p>
              </div>
            )}

            <div data-ink="" className="ps-foot">
              <p className="ps-sign">The crew of {EVENT.organizer.shortName}</p>
              <span className="ps-seal" aria-hidden="true">
                CO5
              </span>
            </div>
          </div>
        </article>
      </main>

      <footer className="ps-footer">
        {EVENT.organizer.name}, {EVENT.organizer.chapter}, {EVENT.organizer.institute} · Powered by TATA STRIVE
      </footer>
    </div>
  );
}
