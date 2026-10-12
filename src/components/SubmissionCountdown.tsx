import { EVENT } from '../data/event';
import { two, useCountdown } from '../hooks/useCountdown';
import { Hourglass } from './Hourglass';

type Props = {
  /** compact: one row for the opening screen; full: the parchment page */
  variant: 'compact' | 'full';
  className?: string;
};

/** Time left to submit, as an hourglass and as words. */
export function SubmissionCountdown({ variant, className = '' }: Props) {
  const { deadlineISO, openedISO, display } = EVENT.problemStatements.submission;
  const c = useCountdown(deadlineISO, openedISO);
  const units = [
    [c.days, 'Days'],
    [c.hours, 'Hours'],
    [c.minutes, 'Minutes'],
    [c.seconds, 'Seconds'],
  ] as const;
  const spoken = c.done
    ? 'Submissions are closed'
    : `${c.days} days, ${c.hours} hours and ${c.minutes} minutes left to submit, until ${display}`;

  return (
    <div className={`countdown countdown--${variant} ${className}`} data-done={c.done}>
      <Hourglass remaining={c.remaining} running={!c.done} className="countdown-glass" />
      <div className="countdown-text">
        <p className="countdown-eyebrow">{c.done ? 'The sands have run out' : 'Time left to submit'}</p>
        {c.done ? (
          <p className="countdown-closed">Submissions are closed</p>
        ) : (
          <p className="countdown-units" aria-hidden="true">
            {units.map(([n, label]) => (
              <span key={label}>
                <b>{two(n)}</b>
                <small>{variant === 'compact' ? label[0].toLowerCase() : label}</small>
              </span>
            ))}
          </p>
        )}
        <p className="countdown-deadline">
          {variant === 'compact' ? 'Closes' : 'Submissions close'} {display}
        </p>
        <p className="sr-only" aria-live="off">
          {spoken}
        </p>
      </div>
    </div>
  );
}
