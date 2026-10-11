import { EVENT, registrationLabel } from '../data/event';
import { navigateTo } from '../hooks/navigate';

/**
 * Registration call-to-action. Links to the configured URL when registration
 * is open; otherwise it takes visitors to the Register section, which
 * explains the current status. It never points at an invented URL.
 */
export function RegisterButton({ className = '' }: { className?: string }) {
  const { url, status } = EVENT.registration;
  const label = registrationLabel();
  const arrow = (
    <svg className="arrow" width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden="true">
      <path d="M0 5h16M12 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
  if (status === 'open' && url) {
    return (
      <a className={`btn-voyage ${className}`} href={url} target="_blank" rel="noopener noreferrer">
        {label}
        {arrow}
      </a>
    );
  }
  return (
    <a
      className={`btn-voyage ${className}`}
      data-state="soon"
      href="#register"
      onClick={(e) => {
        e.preventDefault();
        navigateTo('register');
      }}
    >
      {label}
      {arrow}
    </a>
  );
}
