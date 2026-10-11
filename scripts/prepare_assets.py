"""
Builds the web-ready assets in public/assets/ from the untouched originals in
design/source-assets/ (extracted losslessly from the supplied co5.pdf with
`pdfimages -all`).

Run:  python3 -I scripts/prepare_assets.py
Requires: Pillow, numpy.

Nothing here invents imagery: every output is a crop, mask, resize or
re-encode of a supplied image, except textures/grain.png (generated noise).
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design" / "source-assets"
OUT = ROOT / "public" / "assets"

PHOTO_Q = 88


def out(rel: str) -> Path:
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def webp(im: Image.Image, rel: str, q: int = PHOTO_Q) -> None:
    im.save(out(rel), "WEBP", quality=q, method=6)
    print(f"  {rel:48s} {im.size[0]}x{im.size[1]}")


def luminance(a: np.ndarray) -> np.ndarray:
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- sand ----
def sand() -> None:
    print("sand / helmet sequence")
    webp(Image.open(SRC / "p1-01-sand-helmet-wide.png").convert("RGB"), "sand/sand-helmet-01-wide.webp")
    webp(Image.open(SRC / "p2-01-sand-helmet-approach.png").convert("RGB"), "sand/sand-helmet-02-approach.webp")
    webp(Image.open(SRC / "p2-02-sand-helmet-closeup.png").convert("RGB"), "sand/sand-helmet-03-closeup.webp")

    # Helmet-free landscape: trim the white page border / black rule baked
    # into the JPEG before using it.
    im = Image.open(SRC / "p3-02-sand-landscape-no-helmet.jpg").convert("RGB")
    a = luminance(np.asarray(im).astype(float))
    cols = np.where((a.mean(0) < 235) & (a.mean(0) > 25))[0]
    rows = np.where((a.mean(1) < 235) & (a.mean(1) > 25))[0]
    box = (int(cols[0]) + 2, int(rows[0]), int(cols[-1]) - 1, int(rows[-1]) - 2)
    webp(im.crop(box), "sand/sand-background.webp")


# ------------------------------------------------------------- portal ----
def portal() -> None:
    """Close-up helmet with its dark eye/mouth openings cut to alpha, so the
    ocean layer behind can be seen *through* the helmet during the dive."""
    print("helmet portal")
    im = Image.open(SRC / "p2-02-sand-helmet-closeup.png").convert("RGB")
    c = np.asarray(im).astype(float)
    lum = luminance(c)
    blurred = np.asarray(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(float)

    dark = Image.fromarray(((blurred < 34) * 255).astype(np.uint8)).copy()
    # seeds: left eye, right eye, central mouth gap
    for seed in [(530, 400), (790, 400), (660, 600)]:
        ImageDraw.floodfill(dark, seed, 128)
    region = (np.asarray(dark) == 128).astype(np.uint8) * 255
    region = Image.fromarray(region).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(4))
    r = np.asarray(region).astype(float) / 255

    # keep the lit bronze rims opaque: only truly dark pixels become holes
    darkness = smoothstep(58, 18, lum)
    hole = np.clip(r * np.maximum(darkness, (r > 0.92) * 1.0), 0, 1)
    alpha = (1 - hole) * 255
    rgba = np.dstack([c.astype(np.uint8), alpha.astype(np.uint8)])
    Image.fromarray(rgba, "RGBA").save(out("helmet/helmet-portal.webp"), "WEBP", quality=90, method=6)
    print(f"  helmet/helmet-portal.webp hole coverage {hole.mean():.3f}")


# ----------------------------------------------------- isolated helmet ----
def isolated_helmet() -> None:
    print("isolated helmet")
    im = Image.open(SRC / "p3-01-helmet-trio-white-bg.png").convert("RGB")
    crop = im.crop((150, 150, 415, 660))  # the largest of the three helmets
    a = np.asarray(crop).astype(float)
    whiteness = a.min(axis=2)
    alpha = smoothstep(250, 214, whiteness)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(float) / 255
    # de-fringe: un-premultiply against white so edges don't glow
    rgb = a.copy()
    safe = np.maximum(alpha, 0.05)[..., None]
    rgb = np.clip((rgb - 255 * (1 - safe)) / safe, 0, 255)
    rgba = np.dstack([rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])
    hel = Image.fromarray(rgba, "RGBA")
    hel = hel.crop(hel.getbbox())
    hel.save(out("helmet/helmet-isolated.png"), optimize=True)
    print(f"  helmet/helmet-isolated.png {hel.size}")

    # favicons from the same cut-out
    for size, name in [(32, "favicon-32.png"), (180, "apple-touch-icon.png"), (512, "icon-512.png")]:
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        h = hel.copy()
        h.thumbnail((int(size * 0.92), int(size * 0.92)), Image.LANCZOS)
        canvas.alpha_composite(h, ((size - h.size[0]) // 2, (size - h.size[1]) // 2))
        if name == "apple-touch-icon.png":
            bg = Image.new("RGBA", (size, size), (9, 17, 28, 255))
            bg.alpha_composite(canvas)
            canvas = bg
        canvas.save(ROOT / "public" / name, optimize=True)


# --------------------------------------------------------------- ocean ----
def ocean() -> None:
    print("ocean")
    webp(Image.open(SRC / "p4-01-ocean-depths.png").convert("RGB"), "ocean/ocean-depths.webp")
    webp(Image.open(SRC / "p5-01-ocean-light-rays.png").convert("RGB"), "ocean/ocean-light-rays.webp")
    webp(Image.open(SRC / "p6-01-ocean-surface-from-below.png").convert("RGB"), "ocean/ocean-surface-from-below.webp", 92)
    webp(Image.open(SRC / "p7-01-ocean-surface.png").convert("RGB"), "ocean/ocean-surface.webp")


# --------------------------------------------------------------- logos ----
def logos() -> None:
    print("logos")
    # keep lossless; the logo tile includes its own brand gradient
    im = Image.open(SRC / "p8-02-tata-strive-logo.png").convert("RGB")
    im.save(out("logos/tata-strive-logo.png"), optimize=True)
    print(f"  logos/tata-strive-logo.png {im.size}")


# ------------------------------------------------------------ textures ----
def textures() -> None:
    print("textures")
    rng = np.random.default_rng(7)
    n = rng.normal(128, 30, (160, 160)).clip(0, 255).astype(np.uint8)
    g = Image.fromarray(n, "L")
    g.save(out("textures/grain.png"), optimize=True)
    print("  textures/grain.png 160x160 (generated)")


# ------------------------------------------------------------ social ----
def social() -> None:
    im = Image.open(SRC / "p1-01-sand-helmet-wide.png").convert("RGB")
    w, h = im.size
    th = int(w / 1.905)
    og = im.crop((0, (h - th) // 2 + 20, w, (h - th) // 2 + 20 + th)).resize((1200, 630), Image.LANCZOS)
    og.save(ROOT / "public" / "og-image.jpg", quality=86)
    print("  og-image.jpg 1200x630")


# ------------------------------------------------- new ship (TATA sail) ----
SHIP_POLY = [  # hull + sail + yard + mast + flag, in source px (1581x995)
    (800, 2), (918, 2), (918, 96), (828, 96), (826, 190), (1062, 192), (1062, 214), (1050, 216),
    (1046, 440), (1030, 515), (962, 522), (958, 640), (948, 760), (900, 850), (840, 925), (818, 948),
    (796, 925), (742, 850), (700, 760), (682, 640), (678, 522), (620, 515), (600, 440), (596, 216),
    (584, 214), (584, 192), (802, 190), (798, 96),
]
RIGGING = [(812, 80), (1000, 196), (640, 196)]
WAKE_POLY = [
    (580, 360), (1070, 360), (1108, 560), (1092, 700), (1030, 800), (960, 900), (905, 995),
    (730, 995), (660, 860), (590, 720), (535, 600), (548, 450),
]


def ship_new() -> None:
    """Splits the supplied aerial ship scene into (a) a clean, ship-free ocean
    whose waves can move, and (b) the ship + its wake as an alpha cut-out."""
    print("ship (TATA STRIVE sail)")
    im = Image.open(SRC / "n1-csi-ship-tata-strive-sail.jpg").convert("RGB")
    W, H = im.size
    arr = np.asarray(im).astype(float)

    def poly_mask(poly, blur):
        m = Image.new("L", (W, H), 0)
        ImageDraw.Draw(m).polygon(poly, fill=255)
        return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m

    ship = np.asarray(poly_mask(SHIP_POLY, 1.2)).astype(float) / 255
    rig = np.asarray(poly_mask(RIGGING, 2)).astype(float) / 255 * 0.9
    wake = np.asarray(poly_mask(WAKE_POLY, 26)).astype(float) / 255
    cut_a = np.clip(np.maximum.reduce([ship, rig, wake]), 0, 1)
    rgba = np.dstack([arr.astype(np.uint8), (cut_a * 255).astype(np.uint8)])
    cut = Image.fromarray(rgba, "RGBA")
    box = cut.getbbox()
    cut.crop(box).save(out("ship/csi-ship.webp"), "WEBP", quality=90, method=6)
    print(f"  ship/csi-ship.webp crop box {box}")

    # inpaint the ship + wake out of the ocean with patches of real water
    # sampled from the same rows (keeps the lighting gradient)
    hole = np.asarray(
        Image.fromarray((np.maximum(np.maximum(ship, rig), wake > 0.02) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(31))
    ).astype(float) / 255
    rng = np.random.default_rng(5)
    P = 72
    yy, xx = np.mgrid[0:P, 0:P]
    winw = (np.sin(np.pi * (xx + 0.5) / P) * np.sin(np.pi * (yy + 0.5) / P)) ** 2
    acc = np.zeros((H, W, 3))
    wsum = np.zeros((H, W))
    ys, xs = np.where(hole > 0.01)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    clean_x = [(20, x0 - P - 20), (x1 + 20, W - P - 20)]
    n = int((y1 - y0 + P) * (x1 - x0 + P) / (P * P) * 10)
    for _ in range(n):
        dx = rng.integers(x0 - P // 2, x1 - P // 2)
        dy = rng.integers(y0 - P // 2, y1 - P // 2 + 1)
        lo, hi = clean_x[rng.integers(2)]
        sx = rng.integers(lo, hi)
        sy = int(np.clip(dy + rng.integers(-40, 40), 0, H - P))
        patch = arr[sy:sy + P, sx:sx + P]
        if rng.random() < 0.5:
            patch = patch[:, ::-1]
        ya, yb = max(dy, 0), min(dy + P, H)
        xa, xb = max(dx, 0), min(dx + P, W)
        wv = winw[ya - dy:yb - dy, xa - dx:xb - dx]
        acc[ya:yb, xa:xb] += patch[ya - dy:yb - dy, xa - dx:xb - dx] * wv[..., None]
        wsum[ya:yb, xa:xb] += wv
    fill = acc / np.maximum(wsum, 1e-3)[..., None]
    soft = np.asarray(Image.fromarray((hole * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))).astype(float) / 255
    soft = np.maximum(soft, hole)
    soft = np.where(wsum > 0.05, soft, 0)[..., None]
    ocean = arr * (1 - soft) + fill * soft
    webp(Image.fromarray(np.clip(ocean, 0, 255).astype(np.uint8)), "ocean/ocean-open-sea.webp", 86)

    # Seamlessly tileable copy (both axes) so the sea can flow past the ship
    # indefinitely at the ship's own scale. First flatten the photo's broad
    # lighting gradient (so tiles don't show as blocks), then blend with a
    # half-rolled copy — which wraps continuously by construction — using a
    # variance-preserving blend so the waves keep their contrast.
    H2, W2 = ocean.shape[:2]
    oc8 = Image.fromarray(np.clip(ocean, 0, 255).astype(np.uint8))
    low = np.asarray(oc8.filter(ImageFilter.GaussianBlur(140))).astype(float)
    mean = ocean.reshape(-1, 3).mean(0)
    flat = ocean - low + mean
    def wrap(img, axis):
        n = img.shape[axis]
        w = np.sin(np.pi * (np.arange(n) + 0.5) / n) ** 2
        w = w[:, None, None] if axis == 0 else w[None, :, None]
        rolled = np.roll(img, n // 2, axis=axis)  # its own seam sits where w == 1
        return ((img - mean) * w + (rolled - mean) * (1 - w)) / np.sqrt(w**2 + (1 - w) ** 2) + mean

    tile = wrap(wrap(flat, 1), 0)
    webp(Image.fromarray(np.clip(tile, 0, 255).astype(np.uint8)), "ocean/ocean-open-sea-tile.webp", 86)
    webp(im, "ship/csi-ship-scene.webp", 86)


def barrel() -> None:
    print("barrel")
    im = Image.open(SRC / "n2-barrel-white-bg.png").convert("RGB")
    a = np.asarray(im).astype(float)
    bg = ((a.min(2) > 226) & ((a.max(2) - a.min(2)) < 22)).astype(np.uint8) * 255
    m = Image.fromarray(bg).copy()
    w, h = m.size
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        if m.getpixel(seed) == 255:
            ImageDraw.floodfill(m, seed, 128)
    outside = (np.asarray(m) == 128).astype(np.uint8) * 255
    outside = Image.fromarray(outside).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(1.4))
    alpha = 255 - np.asarray(outside).astype(float)
    rgba = np.dstack([a.astype(np.uint8), alpha.astype(np.uint8)])
    b = Image.fromarray(rgba, "RGBA")
    b = b.crop(b.getbbox())
    b.save(out("props/barrel.webp"), "WEBP", quality=90, method=6)
    print(f"  props/barrel.webp {b.size}")


if __name__ == "__main__":
    sand()
    portal()
    isolated_helmet()
    ocean()
    ship_new()
    barrel()
    logos()
    textures()
    social()
