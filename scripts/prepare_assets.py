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


# ---------------------------------------------------------------- ship ----
def ship() -> None:
    """The PDF only contains the multi-ship CSI fleet render. Until the
    single-ship image is supplied, the lead (flag) ship is cropped out of it
    and used as a stand-in. Replace ship/csi-ship.webp to swap it."""
    print("ship")
    fleet = Image.open(SRC / "p8-01-csi-fleet.jpg").convert("RGB")
    webp(fleet, "ship/csi-fleet.webp", 86)

    x0, x1 = 597, 1013
    crop = fleet.crop((x0, 0, x1, fleet.size[1]))
    w, h = crop.size
    # feathered side edges so the crop melts into the sea plate
    xs = np.arange(w)
    edge = np.minimum(xs, w - 1 - xs).astype(float)
    a = smoothstep(0, 78, edge)[None, :].repeat(h, 0)
    rgba = np.dstack([np.asarray(crop), (a * 255).astype(np.uint8)])
    Image.fromarray(rgba, "RGBA").save(out("ship/csi-ship.webp"), "WEBP", quality=90, method=6)
    print(f"  ship/csi-ship.webp {w}x{h}")

    # Sea plate: widen the crop's own water by stretching its outer columns,
    # then blur heavily -> a colour-matched aerial sea field for the
    # remainder of a landscape viewport (no other ships visible).
    arr = np.asarray(crop).astype(float)
    left = arr[:, :34].mean(1, keepdims=True)
    right = arr[:, -34:].mean(1, keepdims=True)
    edge_col = (left + right) / 2  # (h, 1, 3) average sea colour per row
    # square plate, drawn at the ship's own scale so wave sizes match
    W = h = 1800
    col = np.asarray(Image.fromarray(np.clip(edge_col, 0, 255).astype(np.uint8)).resize((1, h), Image.BILINEAR)).astype(float)
    plate = Image.fromarray(np.clip(np.repeat(col, W, axis=1), 0, 255).astype(np.uint8))
    plate = plate.filter(ImageFilter.GaussianBlur(40))
    # Re-texture with real water: random feathered patches sampled only from
    # ship-free open water in the fleet render (a light texture "quilt").
    rng = np.random.default_rng(11)
    farr = np.asarray(fleet).astype(float)
    clean = [(0, 0, 245, 320), (1150, 0, 1420, 165)]
    acc = np.zeros((h, W)), np.zeros((h, W))
    P = 96
    yy, xx = np.mgrid[0:P, 0:P]
    win = (np.sin(np.pi * (xx + 0.5) / P) * np.sin(np.pi * (yy + 0.5) / P)) ** 2
    for _ in range(int(W * h / (P * P) * 9)):
        cx0, cy0, cx1, cy1 = clean[rng.integers(len(clean))]
        sx = rng.integers(cx0, cx1 - P)
        sy = rng.integers(cy0, cy1 - P)
        patch = luminance(farr[sy:sy + P, sx:sx + P])
        if rng.random() < 0.5:
            patch = patch[:, ::-1]
        patch = patch - patch.mean()
        dx = rng.integers(-P // 2, W - P // 2)
        dy = rng.integers(-P // 2, h - P // 2)
        x0, y0 = max(dx, 0), max(dy, 0)
        x1, y1 = min(dx + P, W), min(dy + P, h)
        acc[0][y0:y1, x0:x1] += (patch * win)[y0 - dy:y1 - dy, x0 - dx:x1 - dx]
        acc[1][y0:y1, x0:x1] += win[y0 - dy:y1 - dy, x0 - dx:x1 - dx]
    detail = (acc[0] / np.maximum(acc[1], 1e-3))[..., None] * 1.05
    pa = np.asarray(plate).astype(float)
    res = np.clip(pa + detail, 0, 255).astype(np.uint8)
    webp(Image.fromarray(res), "ship/csi-sea-plate.webp", 82)


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


if __name__ == "__main__":
    sand()
    portal()
    isolated_helmet()
    ocean()
    ship()
    logos()
    textures()
    social()
