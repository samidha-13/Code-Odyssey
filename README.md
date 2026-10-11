# Code Odyssey 5.0 — CSI KJSIT × TATA STRIVE

A cinematic, scroll-driven website for **Code Odyssey 5.0**, the 30-hour offline hackathon run by the Computer Society of India (CSI) Student Chapter at K. J. Somaiya Institute of Technology (KJSIT) on 17–18 October 2026, powered by TATA STRIVE.

Scrolling carries the visitor through one continuous world. The story starts at a helmet in the desert sand, passes through the helmet into the dark ocean, rises towards sunlight and breaks the surface. It ends at the CSI ship, where the event identity is revealed piece by piece. The About, Timeline, Sponsors and Register chapters continue the same voyage.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm run assets     # rebuild public/assets from design/source-assets (Python 3 + Pillow + numpy)
```

The build output is fully relative (`base: './'`), so `dist/` can be hosted from a domain root or a sub-path such as GitHub Pages.

## Configuration: change content without touching animation

| What | Where |
|---|---|
| Event facts: dates, format, prize, rules, deadline, Instagram | `src/data/event.ts` |
| **Registration link** | Set `VITE_REGISTRATION_URL` (see `.env.example`). If it's empty, every Register button shows "Registrations opening soon" and leads to the Register section; no URL is invented. |
| Timeline milestones | `src/data/timeline.ts` (`confirmed: true` only for calendar-confirmed dates) |
| Sponsors | `src/data/sponsors.ts`: add `{ name, logo, tier?, url?, width, height }` |
| CSI KJSIT logo and link | `EVENT.organizer.logo` / `EVENT.organizer.url` |
| Social-share absolute URL | `VITE_SITE_URL` at build time |
| Scroll timing of every scene and text line | `src/cinematic/choreography.ts` |

## How it works

```
src/
  cinematic/
    renderer.ts       WebGL2 compositor: textured quads + depth blur, ripple,
                      waterline mask, vignette/band masks, light shafts
    director.ts       camera path, layer choreography, text reveals, navbar contrast
    choreography.ts   scroll intervals for each scene and text line
    particles.ts      dust, deep-sea motes, bubbles, surface spray (2D canvas)
  components/
    CinematicExperience.tsx   pinned hero (GSAP ScrollTrigger) + render loop
    StaticVoyage.tsx          motion-free version (reduced motion / no WebGL)
    Navbar.tsx  ScrollText.tsx  SectionTransition.tsx  RegisterButton.tsx  Letters.tsx  Footer.tsx
  sections/   HeroSection  AboutSection  TimelineSection  SponsorsSection  RegisterSection
  hooks/      useReveal (scrubbed reveals), navigate, useActiveSection, useReducedMotion
  data/       event.ts  timeline.ts  sponsors.ts
public/assets/  helmet/ sand/ ocean/ ship/ logos/ textures/
design/source-assets/   untouched originals extracted from the PDF
```

- **Scroll → progress → frame.** ScrollTrigger pins the hero for 13 viewport heights (11 on phones) and reports progress. A damped follower adds slight camera inertia. The director renders each frame as a pure function of that progress, so scrolling up reverses the whole journey exactly. Nothing goes through React state during scroll.
- **Why WebGL, and why not Three.js.** All the scenery is 2D renders, so there's no 3D scene to build. WebGL is used for the effects DOM layers can't do cheaply: mip-level depth of field, refraction ripples, the animated waterline, and procedural light shafts. If WebGL2 is unavailable, or the visitor prefers reduced motion, `StaticVoyage` tells the same story with static plates.
- **Text belongs to the scenes.** Each line has its own interval and its own motion:
  - "Every great journey…" condenses letter by letter out of the dark.
  - "Rise above…" climbs out of a mask and cools in colour as the light grows.
  - CODE converges from the haze, then ODYSSEY is swept in by a bronze sheen and 5.0 rises.
  - The dates, format, TATA STRIVE and the call to action follow in sequence.
- **Navigation.** Navbar links scroll smoothly. Long jumps, such as going back to Home, dip to dark instead of scrubbing through the whole voyage. Deep links like `/#timeline` work.

See **[ASSETS.md](ASSETS.md)** for the asset manifest, alignment measurements, and the gaps in the supplied material.

## Not yet built

Selected-team boarding tickets come in a later stage, once ticket assets and team data are supplied. They mount after the Register section in `src/App.tsx`.
