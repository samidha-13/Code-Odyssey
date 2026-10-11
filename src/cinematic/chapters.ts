import type { Chapter } from './choreography';

/**
 * Bridges the navbar and the pinned cinematic. While the cinematic is
 * mounted, Home / Timeline / About / Sponsors / Register are points on its
 * one scroll timeline rather than separate page sections.
 */
type Binding = {
  /** document scroll position for a chapter */
  scrollFor: (c: Chapter) => number;
  /** chapter currently on screen */
  current: () => Chapter;
};

let binding: Binding | null = null;
const listeners = new Set<() => void>();

export const chapters = {
  bind(b: Binding) {
    binding = b;
    listeners.forEach((l) => l());
    return () => {
      if (binding === b) binding = null;
      listeners.forEach((l) => l());
    };
  },
  scrollFor(c: string): number | null {
    return binding ? binding.scrollFor(c as Chapter) : null;
  },
  current(): Chapter | null {
    return binding ? binding.current() : null;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
