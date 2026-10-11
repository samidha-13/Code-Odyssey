import { prefersReducedMotion } from './useReducedMotion';

/**
 * Section navigation that respects the pinned cinematic. Short hops scroll
 * smoothly; long jumps (e.g. Sponsors → Home, which would otherwise scrub
 * through the entire voyage in a blur) dip to dark, jump, and fade back.
 */
export function navigateTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = id === 'home' ? 0 : Math.round(el.getBoundingClientRect().top + window.scrollY);
  const distance = Math.abs(top - window.scrollY);
  history.replaceState(null, '', id === 'home' ? location.pathname + location.search : `#${id}`);

  if (prefersReducedMotion()) {
    window.scrollTo({ top, behavior: 'auto' });
    return;
  }
  if (distance < window.innerHeight * 2.5) {
    window.scrollTo({ top, behavior: 'smooth' });
    return;
  }
  const curtain = document.getElementById('curtain');
  if (!curtain) {
    window.scrollTo({ top, behavior: 'auto' });
    return;
  }
  curtain.dataset.on = 'true';
  window.setTimeout(() => {
    window.scrollTo({ top, behavior: 'auto' });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        curtain.dataset.on = 'false';
      }),
    );
  }, 380);
}
