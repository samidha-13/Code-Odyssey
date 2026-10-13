import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CHOREO } from '../cinematic/choreography';
import { Director, type TextRefs } from '../cinematic/director';
import { Renderer } from '../cinematic/renderer';
import { chapters } from '../cinematic/chapters';
import { asset } from '../data/asset';
import { HeroSection } from '../sections/HeroSection';
import { IntroTitle } from '../sections/IntroTitle';
import { VoyageLog } from '../sections/VoyageLog';
import { AboutDeep } from '../sections/AboutDeep';
import { PaperNote } from '../sections/PaperNote';

type Props = { onUnsupported: () => void };

/**
 * The pinned, scroll-scrubbed voyage: desert → helmet → abyss → ascent →
 * surface → ship → title. One WebGL canvas renders the world; foreground
 * text is plain DOM, choreographed by the same progress value.
 */
export function CinematicExperience({ onUnsupported }: Props) {
  const root = useRef<HTMLElement>(null);
  const glCanvas = useRef<HTMLCanvasElement>(null);
  const fxCanvas = useRef<HTMLCanvasElement>(null);
  const texts = useRef<TextRefs>({});
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useLayoutEffect(() => {
    const el = root.current!;
    const renderer = Renderer.create(glCanvas.current!);
    if (!renderer) {
      onUnsupported();
      return;
    }
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const director = new Director(renderer, fxCanvas.current!, texts.current, mobile);

    let alive = true;
    let target = 0;
    let current = 0;
    let st: ScrollTrigger | null = null;
    let raf = 0;
    let last = performance.now();
    const t0 = last;

    const size = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const before = director.lengthScale();
      director.resize(w, h, Math.min(window.devicePixelRatio || 1, mobile ? 2 : 1.5));
      // the log's height (fonts, rotation) sets how much scroll it gets: re-measure the pin
      if (st && Math.abs(director.lengthScale() - before) > 0.01) ScrollTrigger.refresh();
    };
    size();

    // scroll progress and the timeline differ only where the log is given extra scroll
    const length = () => {
      const vh = director.portrait ? CHOREO.lengthVh.mobile : CHOREO.lengthVh.desktop;
      return Math.round(window.innerHeight * vh * director.lengthScale());
    };

    const ctx = gsap.context(() => {
      st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: () => `+=${length()}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // the ship's log (voyage in numbers → join the crew) moves one block per scroll:
        // when scrolling settles there, it carries on to the next block in that direction
        snap: {
          snapTo: (value: number) => {
            const stops = director.deckStops();
            const p = director.timeAt(value);
            if (!st || stops.length < 2 || p < stops[0] - 0.012 || p > stops[stops.length - 1]) return value;
            // already resting on a block (e.g. after a navbar jump to Sponsors): stay there
            const here = stops.find((s) => Math.abs(s - p) < 0.002);
            if (here !== undefined) return director.scrollAt(here);
            const next =
              st.direction > 0
                ? stops.find((s) => s > p + 1e-4)
                : [...stops].reverse().find((s) => s < p - 1e-4);
            return next === undefined ? value : director.scrollAt(next);
          },
          directional: false,
          delay: 0.04,
          duration: { min: 0.25, max: 0.6 },
          ease: 'power2.inOut',
          inertia: false,
        },
        onUpdate: (self) => {
          target = self.progress;
        },
        onRefresh: (self) => {
          target = self.progress;
        },
      });
      target = current = st.progress;
    }, el);

    // the navbar's chapters are points on this one timeline
    const unbind = chapters.bind({
      scrollFor: (c) => {
        if (!st) return 0;
        if (c === 'home') return 0;
        return st.start + director.scrollAt(director.chapters()[c]) * (st.end - st.start);
      },
      current: () => director.chapterAt(director.timeAt(st ? st.progress : 0)),
    });

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      // render only while the hero is on screen (pinned, or scrolling away)
      if (st && window.scrollY > st.end + window.innerHeight) return;
      // critically-damped follow: a touch of inertia on the camera
      const diff = target - current;
      current = Math.abs(diff) < 1e-5 ? target : current + diff * (1 - Math.exp(-dt * 7));
      director.frame(director.timeAt(current), (now - t0) / 1000);
    };
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(size);
    ro.observe(el);
    document.fonts?.ready.then(() => alive && size());

    const canvas = glCanvas.current!;
    const onLost = (e: Event) => {
      e.preventDefault();
      onUnsupported();
    };
    canvas.addEventListener('webglcontextlost', onLost);

    director.load(
      () => alive && setReady(true),
      (f) => alive && setProgress(f),
    );

    return () => {
      alive = false;
      unbind();
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      ctx.revert();
      renderer.dispose();
      document.documentElement.style.removeProperty('--nav-glass');
    };
  }, [onUnsupported]);

  const ref = (k: keyof TextRefs) => (node: HTMLElement | null) => {
    texts.current[k] = node;
  };

  return (
    <section
      id="home"
      ref={root}
      className="relative h-[100lvh] w-full overflow-hidden bg-abyss"
      style={{ ['--grain' as string]: `url(${asset('assets/textures/grain.png')})` }}
      aria-label="Code Odyssey 5.0 — the voyage"
    >
      <canvas ref={glCanvas} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
      <canvas ref={fxCanvas} className="pointer-events-none absolute inset-0 block h-full w-full" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <IntroTitle refFn={ref} />
      <div ref={ref('hint')} className="scroll-hint" aria-hidden="true">
        Scroll to begin the voyage
        <i />
      </div>
      <AboutDeep refFn={ref} />
      <VoyageLog refFn={ref} />
      <PaperNote refFn={ref} />
      <HeroSection refFn={ref} />

      <div className="loader" data-done={ready} aria-hidden={ready}>
        <div className="flex flex-col items-center gap-5">
          <span className="font-display text-xs tracking-[0.6em] text-bronze-light">CSI · KJSIT</span>
          <span className="block h-px w-40 overflow-hidden bg-ivory/10">
            <span
              className="block h-full bg-bronze-light transition-[width] duration-500"
              style={{ width: `${Math.max(8, progress * 100)}%` }}
            />
          </span>
          <span className="sr-only">Loading the voyage</span>
        </div>
      </div>
    </section>
  );
}
