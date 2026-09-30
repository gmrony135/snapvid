/* Real-browser screenshot pass: renders every screen in dark/light on each device
   and saves cropped images to /preview. Also reports console errors. */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "preview");
fs.mkdirSync(OUT, { recursive: true });

const SHOTS = [
  { f: "splash-iphone-dark", id: "splash", device: "iphone", theme: "dark" },
  { f: "onboarding-iphone-dark", id: "onboarding", device: "iphone", theme: "dark" },
  { f: "home-iphone-dark", id: "home", device: "iphone", theme: "dark" },
  { f: "home-iphone-light", id: "home", device: "iphone", theme: "light" },
  { f: "analyze-iphone-dark", id: "analyze", device: "iphone", theme: "dark" },
  { f: "preview-iphone-dark", id: "preview", device: "iphone", theme: "dark" },
  { f: "quality-iphone-dark", id: "quality", device: "iphone", theme: "dark" },
  { f: "progress-iphone-dark", id: "progress", device: "iphone", theme: "dark" },
  { f: "complete-iphone-dark", id: "complete", device: "iphone", theme: "dark" },
  { f: "library-iphone-dark", id: "library", device: "iphone", theme: "dark" },
  { f: "library-iphone-light", id: "library", device: "iphone", theme: "light" },
  { f: "errors-iphone-dark", id: "errors", device: "iphone", theme: "dark" },
  { f: "empty-iphone-dark", id: "empty", device: "iphone", theme: "dark" },
  { f: "home-android-dark", id: "home", device: "android", theme: "dark" },
  { f: "library-tablet-dark", id: "library", device: "tablet", theme: "dark" },
  { f: "empty-tablet-light", id: "empty", device: "tablet", theme: "light" },
  { f: "home-iphone-dark-landscape", id: "home", device: "iphone", theme: "dark", orient: "landscape" },
  { f: "progress-iphone-dark-landscape", id: "progress", device: "iphone", theme: "dark", orient: "landscape" },
  { f: "desktop-home-dark", id: "desktop", device: "desktop", theme: "dark", page: "home" },
  { f: "desktop-library-dark", id: "desktop", device: "desktop", theme: "dark", page: "library" },
];

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1800, height: 1150 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

  await page.goto("http://localhost:8000/index.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.SnapVid);

  for (const s of SHOTS) {
    await page.evaluate(({ id, device, theme, page: sitePage, orient }) => {
      const { S, go, render } = window.SnapVid;
      S.themePref = theme; S.device = device; S.orient = orient || "portrait";
      S.libEmpty = false; S.libMenu = -1; S.moreOptions = false; S.toast = null;
      S.progress = 68; S.speed = "5.2"; S.etaTxt = "42 s"; S.paused = false; S.busy = false;
      S.videoId = "iceland"; S.quality = "720";
      if (sitePage) { S.sitePage = sitePage; S.screen = "desktop"; }
      else if (id === "quality") S.screen = "quality";
      else go(id);
      render();
    }, s);
    await page.waitForTimeout(560);
    const el = await page.$(".device .device__frame");
    await el.screenshot({ path: path.join(OUT, `${s.f}.png`) });
  }

  // studio overview shot (whole page, one screen per device)
  await page.evaluate(() => {
    const { S, go } = window.SnapVid;
    S.themePref = "dark"; S.device = "iphone"; go("home");
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "studio-overview.png") });

  console.log("shots:", fs.readdirSync(OUT).length);
  if (errors.length) { console.log("console errors:"); errors.slice(0, 10).forEach((e) => console.log("  - " + e)); }
  else console.log("no console errors");
  await browser.close();
})();
