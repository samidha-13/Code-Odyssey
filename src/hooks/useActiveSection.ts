import { useEffect, useState } from 'react';
import { chapters } from '../cinematic/chapters';

/**
 * The navbar's active item. Inside the cinematic it follows the scroll
 * timeline's chapters; otherwise it tracks which section crosses mid-screen.
 */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0]);
  const [bound, setBound] = useState(() => chapters.current() !== null);

  useEffect(() => {
    const sync = () => setBound(chapters.current() !== null);
    sync();
    return chapters.subscribe(sync);
  }, []);

  useEffect(() => {
    if (bound) {
      let raf = 0;
      const onScroll = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const c = chapters.current();
          if (c) setActive(c);
        });
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', onScroll);
      };
    }
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-48% 0px -48% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids, bound]);

  return active;
}
