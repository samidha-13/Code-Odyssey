# Asset manifest — Code Odyssey 5.0

Every image on the site comes from the supplied reference PDF (`co5.pdf`, 8 pages, 12 embedded images). The images were extracted losslessly with `pdfimages -all` into [`design/source-assets/`](design/source-assets/) and are kept there untouched. [`scripts/prepare_assets.py`](scripts/prepare_assets.py) builds every web-ready file in `public/assets/` from those originals; run it with `npm run assets`.

Nothing is invented. Every output is a copy, crop, mask, resize or re-encode of a supplied image. The one exception is `textures/grain.png`, which is generated noise. There are no 3D models; the cinematic is a 2.5D composite of the supplied renders.

## What the PDF contains

| PDF page | Original (design/source-assets) | Size | Notes |
|---|---|---|---|
| 1 | `p1-01-sand-helmet-wide.png` | 1307×750 | Wide establishing shot. **Page 1 holds this image twice; both copies are byte-identical**, so only one is kept. |
| 2 | `p2-01-sand-helmet-approach.png` | 1301×752 | Approach / medium shot |
| 2 | `p2-02-sand-helmet-closeup.png` | 1331×742 | Close-up |
| 3 | `p3-01-helmet-trio-white-bg.png` | 1316×718 | Three helmets on white (one image) |
| 3 | `p3-02-sand-landscape-no-helmet.jpg` | 1376×783 | Helmet-free landscape (has a white page border and a black rule) |
| 4 | `p4-01-ocean-depths.png` | 1600×925 | Near-black deep ocean with rock terrain |
| 5 | `p5-01-ocean-light-rays.png` | 914×1600 | Portrait: black depths rising to sunlit rays |
| 6 | `p6-01-ocean-surface-from-below.png` | 423×752 | Portrait: sun seen through the surface. **Low resolution.** |
| 7 | `p7-01-ocean-surface.png` | 1600×900 | Open sea at the horizon |
| 8 | `p8-01-csi-fleet.jpg` | 1600×901 | Aerial fleet of galleys with CSI-KJSIT sails |
| 8 | `p8-02-tata-strive-logo.png` | 225×225 | TATA STRIVE logo tile (with its own gradient) |

### Gaps in what was supplied

- **The helmet sequence has three distinct shots, not four.** The brief describes four progressive sand-and-helmet images, but page 1's two images are identical. The fourth stage (extreme close-up / portal) is built from the close-up plate (see `helmet-portal`).
- **No standalone single-ship image.** The only ship render is the multi-ship fleet (page 8). Until the single CSI ship image is supplied, `ship/csi-ship.webp` is a **temporary stand-in**: a tight crop of the lead ship only, with feathered edges. The crop doesn't distort the ship, flag or sail. To swap in the real asset, replace `public/assets/ship/csi-ship.webp` and its sea plate (or update `SCENE_ASSETS.ship` in `src/cinematic/director.ts`).
- **No CSI KJSIT logo file.** The navbar uses a typographic "CSI · KJSIT" mark. Set `EVENT.organizer.logo` in `src/data/event.ts` to a file in `public/` and the navbar will use it. The sail emblem was not cropped out of the render to stand in as the official logo.

## Web assets (public/assets)

| File | From | Processing | Role |
|---|---|---|---|
| `sand/sand-helmet-01-wide.webp` | p1 | WebP q88 | **Scene 01** opening frame. Split by the shader into far / ground / near depth bands for parallax. Preloaded as the only critical image. |
| `sand/sand-helmet-02-approach.webp` | p2 #1 | WebP q88 | **Scene 01** second stage. Cross-faded in with a soft vignette mask, helmet-aligned to the wide shot. |
| `sand/sand-helmet-03-closeup.webp` | p2 #2 | WebP q88 | **Scene 01–02** close-up and the start of the dive |
| `helmet/helmet-portal.webp` | p2 #2 | Eye and mouth openings flood-filled to alpha with feathered edges; lit bronze rims stay opaque | **Scene 02** the camera passes *through* the helmet. The ocean behind is seen through the openings, then the cheek guards sweep past the lens. |
| `helmet/helmet-isolated.png` | p3 #1 (largest helmet) | White background keyed out and de-fringed; original kept | Emblem in About; source of the favicons |
| `sand/sand-background.webp` | p3 #2 | White border and black rule trimmed | **Landfall** (Register) backdrop: the voyage returns to the shore beneath the citadel |
| `ocean/ocean-depths.webp` | p4 | WebP q88 | **Scene 03** dark ocean, seen first through the helmet |
| `ocean/ocean-light-rays.webp` | p5 | WebP q88 | **Scene 04** ascent. The camera pans from the black bottom of this tall plate up to its sunlit top. |
| `ocean/ocean-surface-from-below.webp` | p6 | WebP q92 | **Scene 05** just under the surface. Used briefly behind ripple and blur because of its low resolution. |
| `ocean/ocean-surface.webp` | p7 | WebP q88 | **Scene 05–06** above water, revealed by the moving waterline |
| `ship/csi-ship.webp` | p8 #1 (lead ship crop x 597–1013) | Crop with 78 px feathered sides (alpha) | **Scene 06** the CSI ship. Temporary stand-in, see above. |
| `ship/csi-sea-plate.webp` | p8 #1 | 1800² plate: the crop's own sea colour, re-textured with feathered patches sampled only from ship-free open water | Sea around the ship. Drawn at the ship's scale so the waves match; also the About backdrop. |
| `ship/csi-fleet.webp` | p8 #1 | WebP q86 | Dimmed backdrop of **Sponsors** ("allies of the voyage"). It never stands in for the hero ship. |
| `logos/tata-strive-logo.png` | p8 #2 | Lossless; never cropped or recoloured | Hero "Powered by", Sponsors banner |
| `textures/grain.png` | generated | 160² noise | Film grain overlay |
| `../favicon-32.png`, `../apple-touch-icon.png`, `../icon-512.png` | isolated helmet | Resized | Favicons |
| `../og-image.jpg` | p1 | 1200×630 crop | Social sharing image |

## Alignment data

The helmet nose-guard tip is the shared anchor across the three sand plates (measured in source pixels):

| Plate | Nose tip | Helmet width | Scale vs wide |
|---|---|---|---|
| wide | (630, 543) | ≈ 65 px | 1 |
| approach | (637, 585) | ≈ 220 px | 3.38 |
| close-up | (664, 545) | ≈ 562 px | 8.62 |

Other measurements:
- Portal target (centre of the mouth gap in the close-up): (661, 600).
- Waterline in `ocean-surface-from-below`: 15 % of its height.
- Horizon in `ocean-surface`: 31.7 % of its height.

These values live at the top of `src/cinematic/director.ts`.

## Does the isolated helmet help the zoom?

No. It is about 240 px wide, while the helmet in the close-up plate is 562 px wide. The portal effect is cut from the close-up instead, which keeps the most detail at the moment of entry.
