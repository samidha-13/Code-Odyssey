import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CHOREO } from '../cinematic/choreography';
import { Director, type TextRefs } from '../cinematic/director';
import { Renderer } from '../cinematic/renderer';
import { asset } from '../data/asset';
import { HeroSection } from '../sections/HeroSection';
import { ScrollText } from './ScrollText';

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

    let target = 0;
    let current = 0;
    let st: ScrollTrigger | null = null;
    let raf = 0;
    let last = performance.now();
    const t0 = last;

    const size = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      director.resize(w, h, Math.min(window.devicePixelRatio || 1, mobile ? 2 : 1.5));
    };
    size();

    const length = () => {
      const vh = director.portrait ? CHOREO.lengthVh.mobile : CHOREO.lengthVh.desktop;
      return Math.round(window.innerHeight * vh);
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
        onUpdate: (self) => {
          target = self.progress;
        },
        onRefresh: (self) => {
          target = self.progress;
        },
      });
      target = current = st.progress;
    }, el);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      // render only while the hero is on screen (pinned, or scrolling away)
      if (st && window.scrollY > st.end + window.innerHeight) return;
      // critically-damped follow: a touch of inertia on the camera
      const diff = target - current;
      current = Math.abs(diff) < 1e-5 ? target : current + diff * (1 - Math.exp(-dt * 7));
      director.frame(current, (now - t0) / 1000);
    };
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(size);
    ro.observe(el);

    const canvas = glCanvas.current!;
    const onLost = (e: Event) => {
      e.preventDefault();
      onUnsupported();
    };
    canvas.addEventListener('webglcontextlost', onLost);

    let alive = true;
    director.load(
      () => alive && setReady(true),
      (f) => alive && setProgress(f),
    );

    return () => {
      alive = false;
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

      <p
        ref={ref('presents')}
        className="pointer-events-none absolute inset-x-0 bottom-[max(7.5rem,17vh)] text-center font-serif text-[0.95rem] italic tracking-[0.08em] text-ivory/85 sm:text-lg"
      >
        The Computer Society of India · KJSIT Student Chapter
        <span className="mt-1 block not-italic font-sans text-[0.62rem] font-semibold tracking-[0.5em] text-bronze-light uppercase">
          presents
        </span>
      </p>
      <div ref={ref('hint')} className="scroll-hint" aria-hidden="true">
        Scroll to begin the voyage
        <i />
      </div>

      <ScrollText
        refFn={ref('line1')}
        className="story-line line1"
        variant="letters"
        lines={['Every great journey', 'begins in the unknown.']}
      />
      <ScrollText refFn={ref('line2')} className="story-line line2" variant="words" lines={['Rise above', 'the unknown.']} />

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
