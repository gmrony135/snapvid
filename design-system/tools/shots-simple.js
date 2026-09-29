/* Screenshots of the simple SnapVid app (root index.html) with Playwright. */
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

  await shot("01-home-dark");

  await tap("#pasteBtn");
  await tap("#analyzeBtn");
  await page.waitForTimeout(1900);
  await shot("02-quality-dark");

  await tap('[data-q="1080"]');
  await page.waitForTimeout(300);
  await shot("03-quality-selected");

  await tap("#downloadBtn");
  await page.waitForTimeout(1600);
  await shot("04-progress-dark");

  await tap("#pauseBtn");
  await page.waitForTimeout(350);
  await shot("05-progress-paused");
  await tap("#pauseBtn");

  await page.waitForFunction(() => document.querySelector('.view[data-view="complete"]').classList.contains("is-active"), { timeout: 30000 });
  await page.waitForTimeout(800);
  await shot("06-complete-dark");

  await nav("downloads");
  await page.waitForTimeout(450);
  await shot("07-downloads-dark");
  await tap("#dlGroups [data-menu]");
  await page.waitForTimeout(450);
  await shot("08-downloads-menu");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);

  await nav("settings");
  await page.waitForTimeout(350);
  await shot("09-settings-dark");
  await tap('[data-theme-set="light"]');
  await page.waitForTimeout(450);
  await shot("10-settings-light");
  await nav("home");
  await page.waitForTimeout(400);
  await shot("11-home-light");
  await nav("downloads");
  await page.waitForTimeout(350);
  await shot("12-downloads-light");

  await nav("home");
  await tap("#analyzeBtn");
  await page.waitForTimeout(350);
  await shot("13-error-light");

  await nav("settings");
  await tap('[data-theme-set="dark"]');
  await page.waitForTimeout(200);
  await tap('[data-act="clear-history"]');
  await nav("downloads");
  await page.waitForTimeout(450);
  await shot("14-empty-dark");

  console.log(errs.length ? "errors: " + errs.slice(0, 5).join(" | ") : "no console errors");
  await browser.close();
})();
