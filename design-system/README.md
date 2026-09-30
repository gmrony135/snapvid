# SnapVid — UI/UX Design System & Interactive Prototype

**Save your favorite videos, simply.**

A complete, working design system for a premium cross-platform video downloader — mobile-first
(iPhone & Android), scaling to tablet and desktop web. Everything here is real, runnable front-end:
no static mockups, no placeholder lorem.

---

## Start here

| File | What it is | Open it when you want to… |
|---|---|---|
| **`snapvid.html`** | The whole product as one self-contained file (551 KB, zero external requests) | Click through every screen, try the flow, play the guided demo. **Recommended first look.** |
| **`index.html`** | The design studio (serves `src/` + `assets/`) | Work on the design: device frames, theme switch, calm-motion mode, scenario picker, live design notes |
| **`screens.html`** | Spec gallery — all 12 screens captured at 2× in a real browser | Review the design screen by screen without clicking |
| **`brand.html`** | Live style guide — logo, colour, type, components, motion, voice | Hand the visual language to a developer or designer |

Live preview: run `python3 -m http.server 8000` in this folder (already running on port **8000**).

---

## What's inside

### 12 screens
1. **Splash** — brand mark, tagline, trust line
2. **Onboarding** — 3 pages, skippable, one idea each
3. **Home** — hero, URL field with paste/clear, `Analyze Video`, supported-source strip
4. **URL analysis** — staged progress (reading → permission check → formats) with skeleton
5. **Video preview** — thumbnail + play, title, creator, duration, file info, permission banner
6. **Quality selection** — bottom sheet: 2160p/1080p/720p/480p/360p/audio, sizes, badges, `More options`
7. **Download progress** — 208 px ring, % , downloaded/total, ETA, speed, Pause / Resume / Cancel
8. **Download complete** — animated check, `Open` / `Share` / `Download another`
9. **Downloads history** — search, Video/Audio filters, Today / Yesterday / Older, row menu (Open, Share, Rename, Delete), empty state
10. **Error states** — 7 patterns (invalid URL, unsupported source, unavailable, no permission, network, server busy, file generation) + inline/banner variants
11. **Empty states** — library, no matches, waiting for Wi-Fi, offline
12. **Desktop website** — centred 1120 px container, top nav, main input, preview card, quality panel, progress panel, 3-up library

### Also covered
- **App icon & logo** — dark / light / accent tiles, 16 → 1024 px, Android adaptive + Play Store, iOS touch icon, favicon, SVG twins
- **Dark (primary) + light (alternative)** themes, switchable per screen
- **iPhone 393 × 852, Android 412 × 892, tablet 834 × 900, desktop 1280 browser** frames with correct safe areas
- **Portrait and landscape** — one tap (or `R`) rotates the frame; home becomes a two-column layout, progress splits thumbnail and ring, the tab bar becomes a full-width iOS-style bar, and the notch/home indicator move to the long edge
- **Animations** — press feedback, analysis loading, thumbnail blur-in, quality selection, progress ring, success check, sheet slide, toasts — all disabled under `prefers-reduced-motion` or *Calm motion*
- **Accessibility** — AA+ contrast, 48 px targets, labelled icon buttons, `role=switch`/`radiogroup`/`dialog`, live regions, visible focus rings, status never communicated by colour alone
- **Product rule, everywhere** — SnapVid processes only videos the user is authorised to download or that the source explicitly permits. No DRM, paywall, login or platform-limit workarounds; unsupported links resolve to a clear, actionable message.

---

## Try it (interactive prototype)

- **Paste** → fills a sample link · **Analyze Video** → staged analysis → preview
- **Choose quality** → bottom sheet, tap any row, CTA label follows your selection
- **Download 720p** → live ring animates, Pause / Resume / Cancel all work, then the success screen
- **Downloads** → filter, search, row menu; theme switching lives in the top bar
- **Guided demo**: press `P` (or ▶ Play demo) to watch the whole flow run automatically
- **Keyboard**: `←/→` screens · `1‑9` jump · `T` theme · `D` device · `R` rotate · `P` demo · `Esc` close sheets
- **Scenario picker** (studio top bar): jump straight to any of the seven error designs or the empty states

---

## Project layout

```
snapvid/
├── snapvid.html          single-file prototype (built)
├── screens.html          spec gallery (built)
├── brand.html            live style guide (built)
├── index.html            design studio shell
├── src/
│   ├── styles.css        design tokens + components + device frames (one system)
│   └── js/
│       ├── data.js       icons, video data, errors, empty states, notes, policy
│       ├── screens-a.js  splash, onboarding, home, analyze, preview, quality sheet
│       ├── screens-b.js  progress, complete, library, states, desktop site
│       ├── app.js        state machine, event delegation, demo, device/theme shell
│       └── images.js     inlined thumbnails (generated)
├── assets/
│   ├── raw/              original generated thumbnails
│   ├── img/              optimised 16:9 thumbnails
│   └── brand/            icons (PNG 16→1024, adaptive, touch), mark.svg, wordmark.svg
├── preview/              22 real-browser screenshots + gallery crops
└── tools/
    ├── make_assets.py    icon/mark generator (PIL) + SVG twins
    ├── smoke.js          106 assertions over every screen & interaction (jsdom)
    ├── shots.js          Playwright screenshot pass (2×, all devices/themes)
    └── build.py          builds snapvid.html / screens.html / brand.html
```

## Rebuild

```bash
python3 tools/make_assets.py   # regenerate brand assets
node tools/smoke.js            # 106/106 checks
node tools/shots.js            # refresh preview/ screenshots
python3 tools/build.py         # rebuild the three deliverables
```

## Design tokens (quick reference)

- **Accent** `#FF6B2C` (light theme `#F4551A`) — primary action, progress, selection, active nav, live status. One accent moment per view.
- **Dark (primary)** bg `#08090B` · surface `#101216` · text `#FFFFFF` · secondary `#9BA1A8`
- **Light (alternative)** bg `#F4F5F7` · surface `#FFFFFF` · text `#0A0B0D` · secondary `#5C636B`
- **Status** success `#34D399` · warning `#FBBF24` · danger `#FF5A5F` · info `#60A5FA`
- **Radii** 10 / 14 / 18 / 22 (rows) / 28 (cards) / 34 (sheets) / pill
- **Touch target** 48 px · **Body** 15.5 px · **Titles** 26–34 px, tight tracking, tabular numerals for all data

---

*SnapVid is a design concept. Sample videos, creators and file sizes are fictional; thumbnails are
original generated imagery. The download-permission model shown here is the intended product behaviour.*
