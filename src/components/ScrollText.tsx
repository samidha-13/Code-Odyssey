import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import { Letters, MaskedWords } from './Letters';

type Props = {
  lines: string[];
  className?: string;
  /**
   * letters / words: markup only — the cinematic director drives them.
   * read: words brighten one by one as the paragraph scrolls through view.
   */
  variant: 'letters' | 'words' | 'read';
  refFn?: (node: HTMLElement | null) => void;
  as?: 'p' | 'h2' | 'h3' | 'div';
};

export function ScrollText({ lines, className = '', variant, refFn, as: Tag = 'p' }: Props) {
  const local = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (variant !== 'read' || !local.current || prefersReducedMotion()) return;
    const el = local.current;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('[data-w]'),
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 52%', scrub: 0.6 },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [variant]);

  const setRef = (node: HTMLElement | null) => {
    local.current = node;
    refFn?.(node);
  };

  const label = lines.join(' ');
  return (
    <Tag ref={setRef as never} className={className} aria-label={variant === 'read' ? undefined : label}>
      {lines.map((line, i) => (
        <span key={i} className="block" aria-hidden={variant === 'read' ? undefined : true}>
          {variant === 'letters' && <Letters text={line} />}
          {variant === 'words' && <MaskedWords text={line} />}
          {variant === 'read' &&
            line.split(' ').map((w, j, arr) => (
              <span key={j} data-w="">
                {w}
                {j < arr.length - 1 ? ' ' : null}
              </span>
            ))}
        </span>
      ))}
    </Tag>
  );
}
