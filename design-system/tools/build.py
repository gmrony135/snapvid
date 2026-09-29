#!/usr/bin/env python3
"""SnapVid build:
   1. snapvid.html        — single-file interactive prototype (CSS + JS + images inlined)
   2. screens.html        — visual spec gallery of every captured screen
   3. preview/*.jpg       — compact gallery assets
"""
import base64, io, os, re, json, glob
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# ------------------------------------------------------------------ 1. single file
html = open("index.html").read()
css = open("src/styles.css").read()
js_files = ["src/js/images.js", "src/js/data.js", "src/js/screens-a.js", "src/js/screens-b.js", "src/js/app.js"]
js = "\n".join(open(f).read() for f in js_files)
inline_script = open("index.html").read()
tail = """  // The "Play demo" button in the top bar mirrors the rail action.
  document.getElementById("demoBtn").addEventListener("click", () => {
    S.demo ? (S.demo = false, clearDemo(), render()) : playDemo();
  });
"""

out = html
out = out.replace('<link rel="stylesheet" href="src/styles.css" />', "<style>\n" + css + "\n</style>")
# swap icon links to inline data URIs so the single file is truly standalone
def datauri(p):
    with open(p, "rb") as fh:
        return "data:image/png;base64," + base64.b64encode(fh.read()).decode()
out = re.sub(r'<link rel="icon"[^>]*/>', f'<link rel="icon" href="{datauri("assets/brand/favicon-32.png")}" sizes="32x32" />', out)
out = re.sub(r'<link rel="apple-touch-icon"[^>]*/>', f'<link rel="apple-touch-icon" href="{datauri("assets/brand/apple-touch-180.png")}" />', out)
scripts = re.findall(r'<script src="[^"]+"></script>', out)
out = out.replace("\n".join(scripts), "<script>\n" + js + "\n" + tail + "</script>")
assert "src/js/" not in out, "script tags left behind"
assert "src/styles.css" not in out
open("snapvid.html", "w").write(out)
print(f"snapvid.html            {os.path.getsize('snapvid.html')/1024:.0f} KB (single file, zero external deps)")

# ------------------------------------------------------------------ 2. gallery assets
os.makedirs("preview/gallery", exist_ok=True)
shots = []
LABELS = {
    "splash": ("1 · Splash", "Cold start · 1.2 s max"),
    "onboarding": ("2 · Onboarding", "Three pages, skippable"),
    "home": ("3 · Home", "URL input + Analyze"),
    "analyze": ("4 · URL analysis", "Stage feedback + skeleton"),
    "preview": ("5 · Video preview", "Title, source, file info, permission"),
    "quality": ("6 · Quality selection", "Bottom sheet, recommended preselected"),
    "progress": ("7 · Download progress", "Ring, size, ETA, pause/resume/cancel"),
    "complete": ("8 · Download complete", "Success check + Open / Share"),
    "library": ("9 · Downloads history", "Today / Yesterday / Older"),
    "settings": ("10 · Settings", "Appearance, Download, General, Privacy"),
    "errors": ("11 · Error states", "7 patterns + inline/banner variants"),
    "empty": ("12 · Empty states", "4 situations, each actionable"),
    "desktop": ("13 · Desktop website", "Centred 1120px container, 2-column workbench"),
}
DEVICE_LABEL = {"iphone": "iPhone", "android": "Android", "tablet": "Tablet", "desktop": "Desktop"}
for f in sorted(glob.glob("preview/*.png")):
    name = os.path.basename(f)[:-4]
    parts = name.split("-")
    if len(parts) < 3 or parts[0] not in LABELS or parts[1] not in DEVICE_LABEL:
        continue
    base, dev = parts[0], parts[1]
    title, sub = LABELS[base]
    variant = f"{parts[2]} · {DEVICE_LABEL[dev]}" + (" · landscape" if "landscape" in parts else "")
    im = Image.open(f).convert("RGB")
    w = 520 if base != "desktop" else 1180
    h = int(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS)
    p = f"preview/gallery/{name}.jpg"
    im.save(p, "JPEG", quality=80, optimize=True, progressive=True)
    shots.append({"name": name, "file": p, "title": title, "sub": sub, "variant": variant})

def b64(p):
    with open(p, "rb") as fh:
        return "data:image/jpeg;base64," + base64.b64encode(fh.read()).decode()

cards = "\n".join(
    f'''<figure class="shot">
      <div class="shot__frame"><img src="{b64(s['file'])}" alt="{s['title']} — {s['variant']}" loading="lazy" /></div>
      <figcaption><strong>{s['title']}</strong><span>{s['sub']}</span><span class="tag">{s['variant']}</span></figcaption>
    </figure>''' for s in shots)

gallery = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<title>SnapVid — Screen Spec Gallery</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root {{
    --bg:#06070a; --card:rgba(255,255,255,.045); --stroke:rgba(255,255,255,.09);
    --text:#fff; --text-2:#9ba1a8; --text-3:#6b7178; --accent:#ff6b2c;
  }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:
      radial-gradient(1100px 560px at 12% -8%, rgba(255,107,44,.10), transparent 60%),
      radial-gradient(900px 480px at 90% 2%, rgba(96,165,250,.06), transparent 62%), var(--bg);
    color:var(--text); font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    -webkit-font-smoothing:antialiased; padding:0 0 90px; }}
  header {{ padding:52px 34px 26px; max-width:1320px; margin:0 auto; }}
  .brand {{ display:flex; align-items:center; gap:13px; margin-bottom:22px; }}
  .mark {{ width:44px; height:44px; border-radius:14px; display:grid; place-items:center;
    background:linear-gradient(180deg,#ff8d4f,#e94a14); box-shadow:0 14px 30px -14px rgba(255,107,44,.9), inset 0 1px 0 rgba(255,255,255,.3); }}
  h1 {{ font-size:40px; letter-spacing:-.035em; margin:0 0 10px; font-weight:730; }}
  header p {{ color:var(--text-2); max-width:70ch; margin:0 0 8px; }}
  .meta {{ display:flex; gap:10px; flex-wrap:wrap; margin-top:18px; }}
  .meta span {{ font-size:12.5px; font-weight:600; color:var(--text-2); background:var(--card);
    border:1px solid var(--stroke); border-radius:999px; padding:6px 12px; }}
  main {{ max-width:1320px; margin:0 auto; padding:0 34px; display:grid;
    grid-template-columns:repeat(auto-fill, minmax(360px, 1fr)); gap:30px; }}
  .shot {{ margin:0; }}
  .shot__frame {{ border-radius:26px; padding:16px; background:
      linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.015));
    border:1px solid var(--stroke); display:grid; place-items:center;
    box-shadow:0 30px 70px -40px rgba(0,0,0,.9); }}
  .shot__frame img {{ width:100%; height:auto; border-radius:16px; display:block; }}
  figcaption {{ display:flex; flex-direction:column; gap:4px; padding:14px 4px 0; }}
  figcaption strong {{ font-size:15.5px; letter-spacing:-.02em; }}
  figcaption span {{ color:var(--text-3); font-size:13px; }}
  .tag {{ color:var(--accent) !important; font-weight:620; font-size:12px !important; letter-spacing:.02em; }}
  footer {{ max-width:1320px; margin:56px auto 0; padding:0 34px; color:var(--text-3); font-size:13.5px; }}
  footer strong {{ color:var(--text-2); }}
</style></head>
<body>
  <header>
    <div class="brand">
      <span class="mark" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 128 128"><path d="M32 59 L96 59 L64 106 Z" fill="#fff"/><rect x="53.5" y="15" width="21" height="52" rx="10.5" fill="#fff"/></svg></span>
      <div><div style="font-size:19px;font-weight:720;letter-spacing:-.03em">SnapVid</div>
      <div style="font-size:12.5px;color:#868d96">Screen spec gallery · v2.4</div></div>
    </div>
    <h1>Every screen, every theme.</h1>
    <p>All 13 screens captured in a real browser at 2× — iPhone, Android, tablet and desktop, in dark and light. These are the exact renders of the interactive prototype, not mockups.</p>
    <p style="color:var(--text-3)">Open <strong style="color:var(--text-2)">snapvid.html</strong> for the live prototype: real interactions, animated progress, bottom sheets and the guided demo.</p>
    <div class="meta">
      <span>13 screens</span><span>39 components</span><span>Dark + light</span><span>iPhone · Android · tablet · desktop</span>
      <span>WCAG AA contrast</span><span>48px touch targets</span><span>Reduced-motion aware</span>
    </div>
  </header>
  <main>
{cards}
  </main>
  <footer>
    <p><strong>Product rule shown throughout:</strong> SnapVid only processes videos the user is authorised to download or that the source explicitly permits. No DRM bypass, no paywall or login circumvention, no platform-limit workarounds — unsupported links resolve to a clear, actionable message instead.</p>
  </footer>
</body></html>
"""
open("screens.html", "w").write(gallery)
print(f"screens.html            {os.path.getsize('screens.html')/1024:.0f} KB ({len(shots)} screenshots)")

# ------------------------------------------------------------------ 3. style guide
MARK_SVG = '<svg width="28" height="28" viewBox="0 0 128 128" aria-hidden="true"><path d="M32 59 L96 59 L64 106 Z" fill="#fff"/><rect x="53.5" y="15" width="21" height="52" rx="10.5" fill="#fff"/></svg>'
RING_SVG = (
    '<svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true" style="transform:rotate(-90deg)">'
    '<circle cx="48" cy="48" r="43.5" fill="none" stroke="var(--stroke)" stroke-width="9"/>'
    '<circle cx="48" cy="48" r="43.5" fill="none" stroke="var(--sv-accent)" stroke-width="9" stroke-linecap="round" '
    'stroke-dasharray="273.3" stroke-dashoffset="87.5" style="filter:drop-shadow(0 0 10px rgba(255,107,44,.45))"/></svg>'
    '<div class="ring__label" style="position:absolute;inset:0;display:grid;place-items:center">'
    '<span class="t-num" style="font-size:22px;font-weight:700">68<small style="font-size:13px;opacity:.55">%</small></span></div>'
)

def svg_datauri(name):
    with open(f"assets/brand/{name}", "rb") as fh:
        return "data:image/svg+xml;base64," + base64.b64encode(fh.read()).decode()

styleguide = f"""<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8" /><title>SnapVid — Brand &amp; UI Kit</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
{css}
/* style-guide chrome only */
body {{ background: var(--bg); color: var(--text); margin:0; }}
.sg {{ max-width:1180px; margin:0 auto; padding:46px 30px 100px; }}
.sg h1 {{ font-size:40px; letter-spacing:-.035em; margin:14px 0 8px; font-weight:730; }}
.sg h2 {{ font-size:13px; letter-spacing:.09em; text-transform:uppercase; color:var(--text-3); margin:52px 0 16px; font-weight:680; }}
.sg p.lead {{ color:var(--text-2); max-width:74ch; }}
.sg .grid {{ display:grid; gap:16px; }}
.sg .g2 {{ grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); }}
.sg .g3 {{ grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); }}
.sg .panel {{ background:var(--card); border:1px solid var(--stroke); border-radius:var(--r-xl); padding:22px; box-shadow:var(--shadow-2); }}
.sg .panel h3 {{ margin:0 0 4px; font-size:16px; letter-spacing:-.02em; }}
.sg .panel .sub {{ color:var(--text-3); font-size:12.5px; margin:0 0 16px; }}
.sg .swatch {{ border-radius:var(--r-md); height:78px; border:1px solid var(--stroke); }}
.sg .swatch-row {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:14px; }}
.sg code {{ font-family:ui-monospace,Menlo,monospace; font-size:12px; background:rgba(127,127,127,.14); padding:1.5px 6px; border-radius:6px; }}
.sg .type-row {{ display:flex; align-items:baseline; gap:16px; padding:12px 0; border-bottom:1px solid var(--stroke); }}
.sg .type-row span:last-child {{ margin-left:auto; color:var(--text-3); font-size:12px; white-space:nowrap; }}
.sg .logo-grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:16px; }}
.sg .logo-tile {{ border-radius:var(--r-lg); padding:26px; display:grid; place-items:center; border:1px solid var(--stroke); }}
.sg .token-list {{ display:grid; gap:8px; }}
.sg .token-list div {{ display:flex; justify-content:space-between; font-size:13px; color:var(--text-2); border-bottom:1px dashed var(--stroke); padding-bottom:7px; }}
</style></head>
<body><div class="sg">
  <div class="center gap-4">
    <span class="appbar__mark" style="width:52px;height:52px;border-radius:16px" aria-hidden="true">{MARK_SVG}</span>
    <div><div style="font-size:20px;font-weight:720;letter-spacing:-.03em">SnapVid</div>
    <div style="font-size:12.5px;color:var(--text-3)">Brand &amp; UI kit · design system v2.4</div></div>
    <span class="grow"></span>
    <div class="seg" style="width:250px" id="tg">
      <span class="seg__thumb" style="width:calc((100% - 6px)/3);transform:translateX(0)"></span>
      <button aria-selected="true" data-t="dark">Dark</button><button data-t="light">Light</button><button data-t="system">System</button>
    </div>
  </div>

  <h1>Save your favorite videos, simply.</h1>
  <p class="lead">The system behind the SnapVid apps and website: one accent, two themes, generous radii, subtle glass. Dark is primary; light is a complete alternative — never an afterthought.</p>

  <h2>Logo — construction</h2>
  <div class="grid g2">
    <div class="panel">
      <h3>Mark</h3><p class="sub">A bold download arrow whose head is a rounded play triangle. One silhouette, no stroke weight to lose at 16 px.</p>
      <div class="logo-grid">
        <div class="logo-tile" style="background:#0a0b0d"><img src="{svg_datauri('mark-white.svg')}" width="72" height="72" alt="SnapVid mark on dark" /></div>
        <div class="logo-tile" style="background:#fff"><img src="{svg_datauri('mark-ink.svg')}" width="72" height="72" alt="SnapVid mark on light" /></div>
        <div class="logo-tile" style="background:linear-gradient(180deg,#ff8d4f,#e94a14);border-color:transparent"><img src="{svg_datauri('mark-white.svg')}" width="72" height="72" alt="SnapVid mark on accent" /></div>
      </div>
      <div class="token-list mt-4">
        <div><span>Clear space</span><span>½ arrow width on all sides</span></div>
        <div><span>Minimum size</span><span>16 px (app), 20 px (web)</span></div>
        <div><span>Never</span><span>rotate · add shadow · outline · recolor off-brand</span></div>
      </div>
    </div>
    <div class="panel">
      <h3>App icon</h3><p class="sub">Squircle tile built on a 128-unit grid, radius 31.25 (≈24.5%). iOS ignores the radius and applies its own mask; Android adaptive icons get a 17% safe-zone inset.</p>
      <div class="logo-grid">
        <div class="logo-tile" style="background:#17181c"><img src="{b64('assets/brand/icon-192-dark.png')}" width="88" height="88" alt="App icon dark" /></div>
        <div class="logo-tile" style="background:#eef0f3"><img src="{b64('assets/brand/icon-192-light.png')}" width="88" height="88" alt="App icon light" /></div>
        <div class="logo-tile" style="background:#0f1013"><img src="{b64('assets/brand/icon-1024-accent.png')}" width="88" height="88" alt="App icon accent" /></div>
      </div>
      <div class="panel__ico" style="display:flex;gap:12px;align-items:flex-end;margin-top:20px;background:#0b0c0f;border:1px solid var(--stroke);border-radius:var(--r-lg);padding:16px">
        <img src="{b64('assets/brand/icon-64-dark.png')}" width="48" alt="64px" style="border-radius:12px" />
        <img src="{b64('assets/brand/icon-48-dark.png')}" width="36" alt="48px" style="border-radius:10px" />
        <img src="{b64('assets/brand/icon-32-dark.png')}" width="26" alt="32px" style="border-radius:8px" />
        <img src="{b64('assets/brand/icon-24-dark.png')}" width="20" alt="24px" style="border-radius:6px" />
        <img src="{b64('assets/brand/icon-16-dark.png')}" width="14" alt="16px" style="border-radius:4px" />
        <span class="t-xs" style="margin-left:auto">64 · 48 · 32 · 24 · 16 px</span>
      </div>
    </div>
  </div>

  <h2>Colour</h2>
  <div class="panel">
    <div class="swatch-row">
      {''.join(f'<div><div class="swatch" style="background:{c}"></div><div class="token-list" style="margin-top:10px"><div style="border:0;padding:0"><span>{n}</span><code>{c.upper()}</code></div></div></div>' for n, c in [("Background", "#08090b"), ("Surface", "#101216"), ("Text", "#ffffff"), ("Text 2", "#9ba1a8"), ("Accent", "#ff6b2c"), ("Accent 700", "#c9430f"), ("Success", "#34d399"), ("Danger", "#ff5a5f"), ("Warning", "#fbbf24"), ("Info", "#60a5fa")])}
    </div>
    <p class="sub mt-5">The accent is reserved for one thing per view: the primary action. It also carries progress, selection, active navigation and live status — which is why those moments always look like SnapVid.</p>
  </div>

  <h2>Type scale</h2>
  <div class="panel">
    <div class="type-row"><span class="t-h1">Display 34</span><span>34 / 730 / -0.03em</span></div>
    <div class="type-row"><span class="t-h2">Screen title 26</span><span>26 / 700 / -0.025em</span></div>
    <div class="type-row"><span class="t-h3">Section 19</span><span>19 / 650 / -0.02em</span></div>
    <div class="type-row"><span style="font-size:15.5px;font-weight:550">Body 15.5</span><span>15.5 / 400 / 1.5</span></div>
    <div class="type-row"><span class="t-sm">Secondary 13.5</span><span>13.5 / 400</span></div>
    <div class="type-row"><span class="t-xs">Caption 12</span><span>12 / 450</span></div>
    <div class="type-row"><span class="t-label">LABEL 11.5</span><span>11.5 / 650 / +0.08em</span></div>
    <div class="type-row"><span class="t-num" style="font-size:30px;font-weight:700">1,284 MB</span><span>tabular numerals for all data</span></div>
  </div>

  <h2>Actions</h2>
  <div class="panel">
    <div class="center gap-4 wrap">
      <button class="btn btn--primary btn--lg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10"/><path d="m7.5 10 4.5 4.5L16.5 10"/><path d="M5 19.5h14"/></svg> Analyze Video</button>
      <button class="btn btn--lg"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="7.5" y="6" width="3.4" height="12" rx="1.4"/><rect x="13.1" y="6" width="3.4" height="12" rx="1.4"/></svg> Pause</button>
      <button class="btn btn--outline">More options</button>
      <button class="btn btn--ghost">Cancel</button>
      <button class="btn btn--danger btn--sm"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7.5h14"/><path d="M9.5 7.5V6a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 6v1.5"/><path d="M6.5 7.5 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4A1.5 1.5 0 0 0 16.7 19l.8-11.5"/></svg> Delete</button>
      <button class="btn btn--icon" aria-label="Example icon button"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5.5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18.5" r="1.5"/></svg></button>
    </div>
    <p class="sub mt-4">Minimum touch target 48 px. Pulse on press: <code>scale(.968)</code>, 130 ms. Primary buttons carry an inner top highlight and a 12% accent glow.</p>
  </div>

  <h2>Status &amp; data</h2>
  <div class="panel">
    <div class="center gap-3 wrap">
      <span class="badge badge--accent"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg> Recommended</span>
      <span class="badge badge--ok"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg> Downloads allowed</span>
      <span class="badge badge--warn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5 21 19.5H3Z"/><path d="M12 10v4.2M12 17.2v.4"/></svg> Wi‑Fi only</span>
      <span class="badge badge--danger"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5 21 19.5H3Z"/><path d="M12 10v4.2M12 17.2v.4"/></svg> Unavailable</span>
      <span class="badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M8 4.5v15M16 4.5v15M3.5 9.5h17M3.5 14.5h17"/></svg> 6 formats</span>
      <span class="badge badge--solid">720p</span>
    </div>
    <div class="center gap-4 mt-5 wrap">
      <span class="sw" role="switch" aria-checked="true" aria-label="Enabled switch demo"></span>
      <span class="sw" role="switch" aria-checked="false" aria-label="Disabled switch demo"></span>
      <div style="min-width:180px"><div class="bar"><div class="bar__fill" style="width:68%"></div></div><p class="t-xs mt-2">68% · 57.1 MB of 84 MB</p></div>
      <div class="ring" style="width:96px;height:96px;position:relative">{RING_SVG}</div>
    </div>
    <p class="sub mt-5">Status is never colour alone — every state pairs colour with an icon or a text label.</p>
  </div>

  <h2>Geometry</h2>
  <div class="panel grid g3">
    <div><h3>Radii</h3><div class="token-list mt-3"><div><span>xs / input chips</span><code>10</code></div><div><span>sm / thumbs</span><code>14</code></div><div><span>md</span><code>18</code></div><div><span>lg / rows</span><code>22</code></div><div><span>xl / cards</span><code>28</code></div><div><span>2xl / sheets</span><code>34</code></div><div><span>pill / buttons</span><code>999</code></div></div></div>
    <div><h3>Spacing</h3><div class="token-list mt-3"><div><span>4 · 8 · 12 · 16</span><span>inside components</span></div><div><span>20 · 24</span><span>card padding</span></div><div><span>32 · 40</span><span>between sections</span></div><div><span>56</span><span>hero blocks</span></div></div></div>
    <div><h3>Elevation</h3><div class="token-list mt-3"><div><span>shadow-1</span><span>rows, switches</span></div><div><span>shadow-2</span><span>cards</span></div><div><span>shadow-3</span><span>sheets, tab bar</span></div><div><span>accent glow</span><span>primary CTA</span></div></div></div>
  </div>

  <h2>Motion</h2>
  <div class="panel">
    <div class="token-list">
      <div><span>Button press</span><code>scale(.968) · 130 ms</code></div>
      <div><span>Thumbnail fade-in</span><code>blur(6px)→0 · 620 ms</code></div>
      <div><span>Bottom sheet</span><code>translateY 102%→0 · 520 ms</code></div>
      <div><span>Quality selection</span><code>check springs 1.06 × 240 ms</code></div>
      <div><span>Progress ring</span><code>stroke 480 ms ease-out</code></div>
      <div><span>Success check</span><code>draw 520 ms + halo 900 ms</code></div>
    </div>
    <p class="sub mt-4">Everything is disabled under <code>prefers-reduced-motion</code> — and the studio's <em>Calm motion</em> switch shows the same result.</p>
  </div>

  <h2>Voice</h2>
  <div class="panel">
    <div class="token-list">
      <div><span>Do</span><span>“We couldn't process this link. Check the URL or try another supported source.”</span></div>
      <div><span>Don't</span><span>“Error 400: invalid input string.”</span></div>
      <div><span>Do</span><span>“Downloading isn't permitted for this video.”</span></div>
      <div><span>Don't</span><span>“DRM detected — use a different tool.”</span></div>
      <div><span>Do</span><span>“Your saved videos will appear here.”</span></div>
      <div><span>Don't</span><span>“No data.”</span></div>
    </div>
    <p class="sub mt-4">Short sentences. No jargon. Never blame the user. Always name the next action.</p>
  </div>
</div>
<script>
  const tg = document.getElementById('tg');
  tg.addEventListener('click', (e) => {{
    const b = e.target.closest('button[data-t]'); if (!b) return;
    const order = ['dark','light','system'];
    const i = order.indexOf(b.dataset.t);
    document.documentElement.dataset.theme = b.dataset.t === 'system' ? 'dark' : b.dataset.t;
    tg.querySelector('.seg__thumb').style.transform = `translateX(${{i * 100}}%)`;
    tg.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
  }});
</script>
</body></html>
"""
open("brand.html", "w").write(styleguide)
print(f"brand.html              {os.path.getsize('brand.html')/1024:.0f} KB (live style guide)")
