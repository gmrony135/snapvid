#!/usr/bin/env python3
"""SnapVid brand asset generator (PIL). Geometry mirrors assets/brand/*.svg (128 unit viewBox)."""
from PIL import Image, ImageDraw
import math, os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "brand")
os.makedirs(OUT, exist_ok=True)

SS = 4  # supersample

ACCENT_TOP = (255, 141, 79)
ACCENT_BOT = (233, 74, 20)
INK = (9, 10, 12)
WHITE = (255, 255, 255)

def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))

def gradient_squircle(size, radius, top=ACCENT_TOP, bot=ACCENT_BOT, pad=0):
    """Vertical gradient clipped to a rounded rect (squircle-ish)."""
    S = size
    g = Image.new("RGB", (1, S))
    for y in range(S):
        g.putpixel((0, y), lerp(top, bot, y / max(1, S - 1)))
    g = g.resize((S, S))
    mask = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([pad, pad, S - 1 - pad, S - 1 - pad], radius=radius, fill=255)
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    out.paste(g, (0, 0), mask)
    # subtle inner top highlight
    hl = Image.new("L", (S, S), 0)
    hd = ImageDraw.Draw(hl)
    hd.rounded_rectangle([pad, pad, S - 1 - pad, S - 1 - pad], radius=radius, outline=70, width=max(2, S // 240))
    top_hl = Image.new("RGBA", (S, S), (255, 255, 255, 0))
    grad = Image.new("L", (1, S))
    for y in range(S):
        grad.putpixel((0, y), max(0, int(120 * (1 - y / (S * 0.55)))))
    grad = grad.resize((S, S))
    hl = Image.composite(hl, Image.new("L", (S, S), 0), grad)
    white = Image.new("RGBA", (S, S), (255, 255, 255, 255))
    out = Image.composite(white, out, hl)
    return out

def rounded_poly(draw, pts, color, r):
    """Proper rounded convex polygon: inset polygon (edges moved in by r) + vertex discs."""
    n = len(pts)
    inset, centers = [], []
    for i in range(n):
        p = pts[i]
        pv = pts[(i - 1) % n]
        nx = pts[(i + 1) % n]
        d1 = unit(pv, p)
        d2 = unit(nx, p)
        centers.append(p)
        inset.append((p[0] + d1[0] * r, p[1] + d1[1] * r))
        inset.append((p[0] + d2[0] * r, p[1] + d2[1] * r))
    draw.polygon(inset, fill=color)
    for c in centers:
        draw.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], fill=color)


def unit(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy) or 1.0
    return (dx / L, dy / L)


def draw_mark_glyph(img, S, color=WHITE, scale=1.0, simple=False):
    """SnapVid mark: bold tapered down-arrow with a rounded play-triangle head.
    One solid silhouette; reads instantly at 16px."""
    d = ImageDraw.Draw(img, "RGBA")
    u = S / 128.0 * scale
    cx = cy = S / 2.0

    def T(x, y):
        return (cx + (x - 64) * u, cy + (y - 64) * u)

    def P(pts):
        return [T(*p) for p in pts]

    hw = 11.0 if simple else 10.5     # shaft half width
    # arrow head (rounded triangle)  -- drawn first so the shaft blends into it
    rounded_poly(d, P([(64 - 32, 59), (64 + 32, 59), (64, 106)]), color, 8.5 * u)
    # arrow shaft
    d.rounded_rectangle([T(64 - hw, 15)[0], T(64 - hw, 15)[1], T(64 + hw, 67)[0], T(64 + hw, 67)[1]],
                        radius=hw * u, fill=color)
    return img


def make_icon(size, bg=None, radius_ratio=0.245, glyph_scale=0.94, transparent_bg=False, pad_ratio=0.0, glyph_ink=False):
    glyph_scale = glyph_scale * 1.0
    S = size * SS
    if transparent_bg:
        img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    else:
        if bg == "dark":
            base = Image.new("RGBA", (S, S), (0, 0, 0, 0))
            d = ImageDraw.Draw(base)
            d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radius_ratio), fill=INK)
            img = base
        elif bg == "light":
            base = Image.new("RGBA", (S, S), (0, 0, 0, 0))
            d = ImageDraw.Draw(base)
            d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radius_ratio), fill=(255, 255, 255))
            img = base
        elif bg == "accent":
            img = gradient_squircle(S, int(S * radius_ratio))
        else:
            img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    glyph = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    use_simple = size <= 32 and not transparent_bg
    for c in (255, 141, 79):
        pass
    if bg == "light":
        gcol = INK
    elif bg == "accent":
        gcol = WHITE
    elif glyph_ink:
        gcol = INK
    else:
        gcol = WHITE
    draw_mark_glyph(glyph, S, color=gcol, scale=glyph_scale * (1 - pad_ratio * 2), simple=use_simple)
    img = Image.alpha_composite(img, glyph)
    if bg in ("dark", "light") and size >= 32:
        hd = ImageDraw.Draw(img, "RGBA")
        hcol = (255, 255, 255, 26) if bg == "dark" else (10, 10, 12, 20)
        hd.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radius_ratio),
                             outline=hcol, width=max(2, S // 300))
    return img.resize((size, size), Image.LANCZOS)

def save(img, name):
    p = os.path.join(OUT, name)
    img.save(p)
    return p

# ---------- icons ----------
for s in (1024,):
    save(make_icon(s, bg="dark"), f"icon-{s}-dark.png")
    save(make_icon(s, bg="light"), f"icon-{s}-light.png")
    save(make_icon(s, bg="accent"), f"icon-{s}-accent.png")
    save(make_icon(s, transparent_bg=True), f"mark-{s}-white.png")
    save(make_icon(s, transparent_bg=True, glyph_ink=True), f"mark-{s}-ink.png")

save(make_icon(180, bg="dark"), "apple-touch-180.png")
save(make_icon(32, bg="dark"), "favicon-32.png")
save(make_icon(16, bg="dark"), "favicon-16.png")
# Android adaptive icon: 108dp canvas, 72dp safe zone -> glyph padded
save(make_icon(432, transparent_bg=True, pad_ratio=0.17), "android-adaptive-foreground-432.png")
save(make_icon(432, bg="dark"), "android-adaptive-background-432.png")
save(make_icon(512, bg="accent", radius_ratio=0.30), "android-playstore-512.png")

# ---------- small-size legibility sheet ----------
def strip(sizes, bg_mode, path, labels=True):
    pad = 26
    W = sum(s + pad for s in sizes) + pad
    H = max(sizes) + pad * 2 + (26 if labels else 0)
    bgc = (8, 9, 11, 255) if bg_mode == "dark" else (255, 255, 255, 255)
    canvas = Image.new("RGBA", (W, H), bgc)
    x = pad
    for s in sizes:
        ic = make_icon(s, bg=("dark" if bg_mode == "dark" else "light"))
        canvas.alpha_composite(ic, (x, pad))
        x += s + pad
    canvas.save(path)
    return path

for _s in (16, 24, 32, 48, 64, 128, 192, 512):
    for _mode in ("dark", "light"):
        save(make_icon(_s, bg=_mode), f"icon-{_s}-{_mode}.png")

strip([16, 24, 32, 48, 64, 128, 256], "dark", os.path.join(OUT, "iconsize-dark.png"))
strip([16, 24, 32, 48, 64, 128, 256], "light", os.path.join(OUT, "iconsize-light.png"))

# 2x export for retina inspection
make_icon(32, bg="dark").resize((256, 256), Image.NEAREST).save(os.path.join(OUT, "icon-32-dark-zoom8x.png"))
print("brand assets written to", OUT)
for f in sorted(os.listdir(OUT)):
    print("  ", f, f"{os.path.getsize(os.path.join(OUT,f))/1024:.1f} KB")


# --------------------------------------------------------------------------- #
# SVG twins — generated from the same geometry so CSS/PNG/SVG never drift.
# --------------------------------------------------------------------------- #
def svg_rounded_poly(pts, r):
    """SVG path for a convex polygon with rounded corners (arc at each vertex)."""
    n = len(pts)
    d = []
    for i in range(n):
        prev, cur, nxt = pts[(i - 1) % n], pts[i], pts[(i + 1) % n]
        d1, d2 = unit(prev, cur), unit(nxt, cur)
        a = (cur[0] + d1[0] * r, cur[1] + d1[1] * r)
        b = (cur[0] + d2[0] * r, cur[1] + d2[1] * r)
        d.append(("M" if i == 0 else "L") + f"{a[0]:.2f} {a[1]:.2f}")
        d.append(f"A{r:.2f} {r:.2f} 0 0 1 {b[0]:.2f} {b[1]:.2f}")
    d.append("Z")
    return " ".join(d)


def svg_mark_path(glyph="currentColor"):
    seg = []
    seg.append(svg_rounded_poly([(32, 59), (96, 59), (64, 106)], 8.5))
    seg.append("M53.5 15 h21 a10.5 10.5 0 0 1 10.5 10.5 V67 a10.5 10.5 0 0 1 -21 0 V25.5 a10.5 10.5 0 0 1 10.5 -10.5 Z")
    return " ".join(seg)


def svg_mark(fill="currentColor", size=128):
    f = "#0A0B0D" if fill == "currentColor" else fill
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
            f'viewBox="0 0 128 128" role="img" aria-label="SnapVid">'
            f'<path d="{svg_mark_path()}" fill="{f}"/></svg>')


def svg_tile(bg, glyph_fill, size=512, rx=125, grad=False):
    if grad:
        bgdef = ('<defs><linearGradient id="sv" x1="0" y1="0" x2="0" y2="1">'
                 '<stop offset="0" stop-color="#FF8D4F"/><stop offset="1" stop-color="#E94A14"/>'
                 '</linearGradient></defs>')
        bgel = '<rect width="128" height="128" rx="31.25" fill="url(#sv)"/>'
    else:
        bgdef = ""
        bgel = f'<rect width="128" height="128" rx="31.25" fill="{bg}"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 128 128" '
            f'role="img" aria-label="SnapVid app icon">{bgdef}{bgel}'
            f'<path d="{svg_mark_path()}" fill="{glyph_fill}" transform="translate(64 63) scale(0.94) translate(-64 -63)"/></svg>')


S = os.path.join(OUT)
open(os.path.join(S, "mark.svg"), "w").write(svg_mark())
open(os.path.join(S, "mark-ink.svg"), "w").write(svg_mark("#0A0B0D"))
open(os.path.join(S, "mark-white.svg"), "w").write(svg_mark("#FFFFFF"))
open(os.path.join(S, "icon-dark.svg"), "w").write(svg_tile("#0A0B0D", "#FFFFFF"))
open(os.path.join(S, "icon-light.svg"), "w").write(svg_tile("#FFFFFF", "#0A0B0D"))
open(os.path.join(S, "icon-accent.svg"), "w").write(svg_tile(None, "#FFFFFF", grad=True))
open(os.path.join(S, "wordmark.svg"), "w").write(
    '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="128" viewBox="0 0 360 128" role="img" aria-label="SnapVid">'
    f'<g transform="translate(0 0)"><path d="{svg_mark_path()}" fill="#FF6B2C" transform="translate(64 63.5) scale(0.94) translate(-64 -63.5)"/></g>'
    '<text x="126" y="82" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif" '
    'font-size="56" font-weight="650" letter-spacing="-1.6" fill="currentColor">SnapVid</text></svg>')
print("svgs written")
