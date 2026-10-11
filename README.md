# Code Odyssey 5.0 — CSI KJSIT × TATA STRIVE

A cinematic, scroll-driven website for **Code Odyssey 5.0**, the 30-hour offline hackathon run by the Computer Society of India (CSI) Student Chapter at K. J. Somaiya Institute of Technology (KJSIT) on 17–18 October 2026, powered by TATA STRIVE.

The whole site is one continuous, scroll-driven journey:
1. **Home:** CODE ODYSSEY 5.0 hangs over the desert at sunset. When scrolling starts, its letters stream past the camera as it pushes into the buried helmet.
2. **Into the deep:** the helmet's interior swallows the frame and opens into deep water, and the camera keeps moving forward.
3. **Timeline:** the camera rises beside a floating barrel while the voyage log (the hackathon journey, 17–18 October 2026) moves up with it.
4. **About → Sponsors → Register:** the camera breaks the surface into the open sea, and the CSI ship (CSI flag, TATA STRIVE sail) sails in on that same water. While it sails, the hackathon description, key facts, rules, sponsor and registration panels appear beside it.

The navbar chapters (Home, Timeline, About, Sponsors, Register) are points on that one timeline (`src/cinematic/chapters.ts`). With reduced motion or no WebGL, a static opening is followed by the regular About, Timeline, Sponsors and Register sections.

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
- **Text belongs to the scenes.** The title's letters sit in the scene nearer than the helmet, so they stream past the lens as the camera moves in. The voyage-log and ship's-log entries rise in the same rhythm, each coming into focus at the barrel's depth or beside the ship.
- **One sea.** The ship is drawn at exactly the scale and position it had in its own image, over that image's ship-free water. The sea's colour, light and texture never change once the ship arrives.
- **Navigation.** Navbar links scroll smoothly. Long jumps, such as going back to Home, dip to dark instead of scrubbing through the whole voyage. Deep links like `/#timeline` work.

See **[ASSETS.md](ASSETS.md)** for the asset manifest, alignment measurements, and the gaps in the supplied material.

## Not yet built

Selected-team boarding tickets come in a later stage, once ticket assets and team data are supplied. They mount after the Register section in `src/App.tsx`.
