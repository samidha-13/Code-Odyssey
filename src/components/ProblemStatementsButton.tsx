import { asset } from '../data/asset';
import { EVENT } from '../data/event';

/** Opens the problem statements page (a page of its own, not a section). */
export function ProblemStatementsButton({ className = '' }: { className?: string }) {
  return (
    <a className={`btn-voyage ${className}`} href={asset(EVENT.problemStatements.href)}>
      {EVENT.problemStatements.title}
      <svg className="arrow" width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden="true">
        <path d="M0 5h16M12 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </a>
  );
}
