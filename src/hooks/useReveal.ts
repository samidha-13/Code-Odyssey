import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { prefersReducedMotion } from './useReducedMotion';

/**
 * Scroll-scrubbed reveals for elements marked with `data-reveal` inside a
 * container. Each kind has its own motion so sections don't all "fade up":
 *
 *   mask    – children of `.reveal-line` rise out of a clipping mask
 *   rule    – a hairline draws from its origin
 *   count   – a number counts up to `data-count` (formatted en-IN)
 *   drift   – gentle rise with opacity (used sparingly)
 *   unfurl  – a banner unrolls from its top edge
 *   parallax– moves at `data-speed` relative to scroll
 *
 * Scrubbed (not one-shot) so everything reverses naturally on scroll-up.
 */
export function useReveal(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const st = (el: Element, start = 'top 88%', end = 'top 58%') => ({
        trigger: el,
        start,
        end,
        scrub: 0.7,
      });

      root.querySelectorAll<HTMLElement>('[data-reveal="mask"]').forEach((el) => {
        gsap.fromTo(
          el.querySelectorAll('.reveal-line > span'),
          { yPercent: 108 },
          { yPercent: 0, ease: 'power3.out', stagger: 0.12, scrollTrigger: st(el) },
        );
      });

      root.querySelectorAll<HTMLElement>('[data-reveal="rule"]').forEach((el) => {
        gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, ease: 'power2.inOut', scrollTrigger: st(el, 'top 92%', 'top 62%') });
      });

      root.querySelectorAll<HTMLElement>('[data-reveal="count"]').forEach((el) => {
        const to = Number(el.dataset.count || 0);
        const obj = { v: 0 };
        const fmt = new Intl.NumberFormat('en-IN');
        el.textContent = '0';
        gsap.to(obj, {
          v: to,
          ease: 'power2.out',
          scrollTrigger: st(el, 'top 90%', 'top 55%'),
          onUpdate: () => {
            el.textContent = fmt.format(Math.round(obj.v));
          },
        });
      });

      root.querySelectorAll<HTMLElement>('[data-reveal="drift"]').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 36, opacity: 0 },
          { y: 0, opacity: 1, ease: 'power2.out', scrollTrigger: st(el, 'top 92%', 'top 66%') },
        );
      });

      root.querySelectorAll<HTMLElement>('[data-reveal="unfurl"]').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(0 0 100% 0)', y: -10 },
          { clipPath: 'inset(0 0 0% 0)', y: 0, ease: 'power2.out', scrollTrigger: st(el, 'top 90%', 'top 55%') },
        );
      });

      root.querySelectorAll<HTMLElement>('[data-reveal="parallax"]').forEach((el) => {
        const speed = Number(el.dataset.speed || 0.2);
        gsap.fromTo(
          el,
          { yPercent: -speed * 50 },
          {
            yPercent: speed * 50,
            ease: 'none',
            scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, [ref]);
}
