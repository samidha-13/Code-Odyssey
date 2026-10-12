import { useEffect, useState } from 'react';

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** ms left; 0 once the deadline has passed */
  left: number;
  /** share of the window still to run, 1 → 0 (the sand left in the top bulb) */
  remaining: number;
  done: boolean;
};

const read = (end: number, start: number): Countdown => {
  const left = Math.max(0, end - Date.now());
  const s = Math.floor(left / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor(s / 3600) % 24,
    minutes: Math.floor(s / 60) % 60,
    seconds: s % 60,
    left,
    remaining: Math.min(1, left / Math.max(1, end - start)),
    done: left === 0,
  };
};

/** Ticks once a second until `endISO`; `startISO` sets the full-glass moment. */
export function useCountdown(endISO: string, startISO: string): Countdown {
  const end = Date.parse(endISO);
  const start = Date.parse(startISO);
  const [state, setState] = useState(() => read(end, start));
  useEffect(() => {
    const tick = () => setState(read(end, start));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [end, start]);
  return state;
}

export const two = (n: number) => String(n).padStart(2, '0');
