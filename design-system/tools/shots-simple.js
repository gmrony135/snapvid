/* Screenshots of the simple SnapVid app (root index.html). No demo data is injected —
   the flow uses a link typed at runtime, exactly like a user would. */
const { chromium } = require("playwright");
const path = require("path");
const OUT = path.join(__dirname, "..", "..", "assets", "screens");
const FILE = "file://" + path.join(__dirname, "..", "..", "index.html");

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1100, height: 950 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(FILE, { waitUntil: "load" });
  await page.waitForTimeout(400);

  const shot = async (n) => (await page.$(".phone")).screenshot({ path: path.join(OUT, n + ".png") });
  const tap = (sel) => page.evaluate((s) => { const el = document.querySelector(s); if (!el) throw new Error("missing " + s); el.click(); }, sel);
  const nav = (v) => page.evaluate((v) => document.querySelector('.tabbar button[data-go="' + v + '"]').click(), v);
  const typeUrl = (v) => page.evaluate((v) => {
    const i = document.querySelector("#url");
    i.value = v; i.dispatchEvent(new Event("input", { bubbles: true }));
  }, v);

  /* 1 — home, empty */
  await shot("01-home-empty-dark");
  await page.evaluate(() => document.querySelector('[data-theme-set]') && null);
  await nav("settings"); await tap('[data-theme-set="light"]'); await nav("home");
  await page.waitForTimeout(350);
  await shot("02-home-empty-light");
  await nav("settings"); await tap('[data-theme-set="dark"]'); await nav("home");
  await page.waitForTimeout(250);

  /* 2 — error state (invalid link) */
  await tap("#analyzeBtn");
  await page.waitForTimeout(350);
  await shot("03-error-dark");
  await tap("#retryBtn");

  /* 3 — analyze + quality */
  await typeUrl("northframe.video/watch/some-clip");
  await tap("#analyzeBtn");
  await page.waitForTimeout(1900);
  await shot("04-quality-dark");
  await tap('[data-q="480"]');
  await page.waitForTimeout(280);
  await shot("05-quality-selected-dark");

  /* 4 — progress */
  await tap("#downloadBtn");
  await page.waitForTimeout(1600);
  await shot("06-progress-dark");
  await tap("#pauseBtn");
  await page.waitForTimeout(350);
  await shot("07-progress-paused-dark");
  await tap("#pauseBtn");

  /* 5 — complete */
  await page.waitForFunction(() => document.querySelector('.view[data-view="complete"]').classList.contains("is-active"), { timeout: 30000 });
  await page.waitForTimeout(800);
  await shot("08-complete-dark");

  /* 6 — downloads (one real entry) + its menu */
  await nav("downloads");
  await page.waitForTimeout(450);
  await shot("09-downloads-dark");
  await tap("#dlGroups [data-menu]");
  await page.waitForTimeout(450);
  await shot("10-downloads-menu-dark");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);

  /* 7 — clear history → empty state */
  await nav("settings");
  await tap('[data-act="clear-history"]');
  await nav("downloads");
  await page.waitForTimeout(450);
  await shot("11-downloads-empty-dark");

  /* 8 — settings, dark + light */
  await nav("settings");
  await page.waitForTimeout(300);
  await shot("12-settings-dark");
  await tap('[data-theme-set="light"]');
  await page.waitForTimeout(400);
  await shot("13-settings-light");
  await nav("home");
  await page.waitForTimeout(300);
  await shot("14-home-light-after-flow");

  console.log(errs.length ? "errors: " + errs.slice(0, 5).join(" | ") : "no console errors");
  await browser.close();
})();
