import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(query);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia(query).matches;

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
