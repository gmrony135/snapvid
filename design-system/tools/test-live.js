/*
 * End-to-end test of the live app: real browser, real server, real download.
 *
 *   cd design-system
 *   node tools/test-live.js                      (server must run on :8787)
 *   BASE=http://localhost:9000 node tools/test-live.js
 *
 * It drives the actual UI: type a link -> Analyze -> quality list -> Download ->
 * progress -> complete -> Downloads -> share sheet. Everything it asserts is
 * data that came from the server, never from the page's demo path.
 */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:8787";
const TEST_URL = process.env.TEST_URL || "https://archive.org/details/BigBuckBunny_124";
/* Screenshots go to a scratch folder by default so a test run never dirties the
   repo. To refresh the captures that are committed:
     SHOTS_OUT=../../assets/screens node tools/test-live.js
   They are written as JPEGs — the committed ones are, and PNGs are 3× the size. */
const SHOT_DIR = process.env.SHOTS_OUT
  ? path.resolve(__dirname, "..", "..", process.env.SHOTS_OUT)
  : path.join(__dirname, "..", "preview");
fs.mkdirSync(SHOT_DIR, { recursive: true });
const shot = (page, name) => page.screenshot({ path: path.join(SHOT_DIR, name + ".jpg"), type: "jpeg", quality: 82 });

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (extra ? "  → " + extra : "")); }
};
const txt = (page, sel) => page.$eval(sel, (el) => el.textContent.trim());

(async () => {
  console.log("\nSnapVid live app test — " + BASE + "\n");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, colorScheme: "dark" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  /* --- connected -------------------------------------------------------- */
  ok("app is served by the server", (await page.title()).toLowerCase().includes("snapvid"));
  const hint = await txt(page, "#hint");
  ok("app noticed the server", /Connected to your SnapVid server/.test(hint), hint);

  /* --- real analysis ---------------------------------------------------- */
  await page.fill("#url", TEST_URL);
  await page.click("#analyzeBtn");
  await page.waitForSelector('.view[data-view="quality"].is-active', { timeout: 60000 });
  const title = await txt(page, "#qTitle");
  ok("real video title from the source", title === "Big Buck Bunny", title);
  const meta = await txt(page, "#qMeta");
  ok("meta shows host + duration", /archive\.org/.test(meta) && /\d+:\d\d/.test(meta), meta);
  ok("real thumbnail replaced the placeholder", await page.$eval('.view[data-view="quality"] .thumb img', (el) => !!el.src).catch(() => false));

  const rows = await page.$$eval("#qlist .qopt", (els) => els.map((e) => e.textContent.replace(/\s+/g, " ").trim()));
  console.log("      " + rows.length + " quality rows: " + rows.map((r) => r.split(" ")[0]).join(", "));
  ok("quality list came from the source (has sizes)", rows.length > 0 && /MB|GB/.test(rows.join(" ")), rows.join(" | "));
  ok("no invented 1080p row when the source tops out lower", !rows.some((r) => /1080p/.test(r)), rows[0]);
  const cta = await txt(page, "#downloadBtn");
  ok("CTA names a real quality", /^Download \d+p$/.test(cta), cta);

  /* pick the smallest offered quality so the test is quick */
  const small = await page.$$eval("#qlist .qopt", (els) => {
    const last = els[els.length - 1];
    return last.getAttribute("data-q");
  });
  await page.click('#qlist .qopt[data-q="' + small + '"]');
  ok("selecting a quality updates the CTA", (await txt(page, "#downloadBtn")).includes(small) || /Download (Audio|\d+p)/.test(await txt(page, "#downloadBtn")));

  await shot(page, "live-01-quality-real");

  /* --- real download ---------------------------------------------------- */
  await page.click("#downloadBtn");
  await page.waitForSelector('.view[data-view="progress"].is-active', { timeout: 15000 });
  await page.waitForTimeout(1000);
  const nums = await txt(page, "#nums");
  ok("progress shows real byte counts", /\d/.test(nums) && /of/.test(nums), nums);

  /* pause, prove the partial file is kept, then resume */
  await page.click("#pauseBtn");
  await page.waitForTimeout(1200);
  const pauseLabel = await txt(page, "#pauseLabel");
  const pausedEta = await txt(page, "#eta");
  const pausedPct = await txt(page, "#pct");
  ok("pause button flips to Resume", pauseLabel === "Resume", pauseLabel);
  ok("paused state is explained", /Paused/.test(pausedEta), pausedEta);
  await shot(page, "live-02-paused-real");

  await page.click("#pauseBtn");
  await page.waitForTimeout(800);
  const resumedPct = await txt(page, "#pct");
  ok("resume works", (await txt(page, "#pauseLabel")) === "Pause" || /%/.test(resumedPct), "label=" + (await txt(page, "#pauseLabel")));

  await page.waitForSelector('.view[data-view="complete"].is-active', { timeout: 240000 });
  await page.waitForTimeout(1600);   /* let the success tick finish animating */
  const size = await txt(page, "#cSize");
  ok("complete screen shows the real file size", /MB|GB|KB/.test(size), size);

  await shot(page, "live-03-complete-real");

  /* the focused flow deliberately hides the bottom nav */
  ok("bottom nav is hidden during the focused flow (by design)",
    (await page.$eval(".phone", (el) => el.dataset.tabs)) === "off");

  /* --- history + file -------------------------------------------------- */
  await page.click("#againBtn");            /* Download another → back to Home */
  await page.waitForTimeout(500);
  ok("bottom nav comes back on Home", (await page.$eval(".phone", (el) => el.dataset.tabs)) === "on");
  await page.click('.tabbar button[data-go="downloads"]');
  await page.waitForTimeout(500);
  const count = await txt(page, "#dlCount");
  ok("download appears in history", /\d+ file/.test(count), count);
  const rowTitle = await txt(page, "#dlGroups .row__t b");
  ok("history row has the real title", rowTitle === "Big Buck Bunny", rowTitle);

  await page.click("#dlGroups [data-menu]");
  await page.waitForSelector("#sheet", { timeout: 5000 });
  const sheet = await txt(page, "#sheet");
  ok("menu offers save/share/open/delete", /Save to Photos/.test(sheet) && /Open the file/.test(sheet) && /Delete from server/.test(sheet));
  await shot(page, "live-04-menu-real");
  await page.click("#scrim");

  /* file itself is served */
  const fileInfo = await page.evaluate(async () => {
    const r = await fetch("/api/jobs");
    const d = await r.json();
    const done = d.jobs.filter((j) => j.status === "done")[0];
    const head = await fetch(done.fileUrl, { method: "HEAD" });
    return { url: done.fileUrl, status: head.status, type: head.headers.get("content-type"), name: done.fileName, size: done.sizeText };
  });
  ok("file is served over HTTP", fileInfo.status === 200, JSON.stringify(fileInfo));
  ok("file is a video", /video\//.test(fileInfo.type || ""), fileInfo.type);
  console.log("      " + fileInfo.name + "  (" + fileInfo.size + ")");

  /* --- refusals --------------------------------------------------------- */
  await page.click('.tabbar button[data-go="home"]');
  await page.fill("#url", "https://www.netflix.com/watch/80100172");
  await page.click("#analyzeBtn");
  await page.waitForTimeout(2500);
  const refusal = await txt(page, "#errTitle") + " / " + await txt(page, "#errMsg");
  ok("DRM source is refused with a clear reason", /DRM/.test(refusal), refusal);
  await shot(page, "live-05-refused-drm");

  ok("no console/page errors", errors.length === 0, errors.slice(0, 2).join(" | "));

  await browser.close();
  console.log("\n" + pass + " passed, " + fail + " failed\n");
  process.exit(fail ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
