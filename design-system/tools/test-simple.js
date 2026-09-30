/* Functional checks for the simple SnapVid app (root index.html) — no demo data expected. */
const { JSDOM, VirtualConsole } = require("jsdom");
const path = require("path");
const FILE = path.join(__dirname, "..", "..", "index.html");

const vc = new VirtualConsole();
const errs = [];
vc.on("jsdomError", (e) => errs.push("jsdomError: " + e.message));
vc.on("error", (...a) => errs.push("console.error: " + a.join(" ")));

JSDOM.fromFile(FILE, {
  runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) { w.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }); },
}).then(async (dom) => {
  await new Promise((r) => setTimeout(r, 300));
  const w = dom.window, d = w.document;
  const out = [];
  const ok = (n, c, extra = "") => out.push({ n, c: !!c, extra });
  const $ = (s) => d.querySelector(s);
  const click = (s) => { const el = $(s); if (!el) { ok("found " + s, false); return false; } el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true })); return true; };
  const view = () => { const v = $(".view.is-active"); return v ? v.dataset.view : null; };
  const setUrl = (v) => { const i = $("#url"); i.value = v; i.dispatchEvent(new w.Event("input", { bubbles: true })); };
  const rows = (sel) => d.querySelectorAll(sel).length;

  /* ---------- 1. boots clean, with no demo data anywhere ---------- */
  ok("boots on home", view() === "home", view());
  const html = d.documentElement.outerHTML;
  ["Iceland", "Northframe", "Creamy Garlic", "Rooftop Sessions", "4.2M views", "data:image/jpeg", "THUMBS"].forEach((t) => {
    ok('no demo data: "' + t + '"', html.indexOf(t) === -1);
  });
  ok("no images at all", d.querySelectorAll("img").length === 0, rows("img") + " imgs");
  ok("recent section hidden while empty", $("#recentWrap").hidden === true);
  ok("4 quality options", rows(".qopt") === 4);
  ok("quality title is neutral", $("#qTitle").textContent === "Untitled video", $("#qTitle").textContent);

  /* ---------- 2. downloads start empty ---------- */
  click('[data-go="downloads"]');
  ok("downloads view", view() === "downloads");
  ok("empty state shown", /No downloads yet/.test($("#dlGroups .state h3").textContent));
  ok("empty state copy", /Your saved videos will appear here/.test($("#dlGroups .state p").textContent));
  ok("no download rows", rows("#dlGroups .row") === 0);
  ok("file count line cleared", $("#dlCount").textContent === "");
  click('[data-go="home"]');

  /* ---------- 3. paste uses the real clipboard, nothing is injected ---------- */
  click("#pasteBtn");
  await new Promise((r) => setTimeout(r, 60));
  ok("paste does not inject a sample link", $("#url").value === "", JSON.stringify($("#url").value));
  ok("paste explains why", !!$(".toast"), $(".toast") ? $(".toast").textContent : "no toast");

  /* ---------- 4. error states ---------- */
  click("#analyzeBtn");
  ok("empty url → error", $("#errorBox").hidden === false);
  click("#retryBtn");
  ok("retry clears error", $("#errorBox").hidden === true);
  setUrl("netflix.com/watch/1"); click("#analyzeBtn");
  ok("blocked url → unsupported copy", /isn't supported/.test($("#errorBox .txt b").textContent));

  /* ---------- 5. analyze a real link ---------- */
  setUrl("northframe.video/watch/some-clip"); $("#clearBtn").hidden = false;
  click("#analyzeBtn");
  ok("analyzing state", /Reading link/.test($("#analyzeBtn").textContent));
  await new Promise((r) => setTimeout(r, 1800));
  ok("lands on quality", view() === "quality", view());
  ok("title comes from the pasted link", $("#qTitle").textContent === "Video from northframe.video", $("#qTitle").textContent);
  ok("meta names the host", /northframe\.video/.test($("#qMeta").textContent));
  ok("preview is a placeholder, not a photo", rows(".thumb--empty") === 1 && rows(".thumb img:not([hidden])") === 0);
  ok("tabs hidden on sub-screen", $("#phone").dataset.tabs === "off");

  /* ---------- 6. quality selection ---------- */
  click('[data-q="480"]');
  ok("one option selected", rows('.qopt[aria-checked="true"]') === 1);
  ok("cta follows selection", /Download 480p/.test($("#downloadBtn").textContent), $("#downloadBtn").textContent);

  /* ---------- 7. progress: pause / resume / cancel ---------- */
  click("#downloadBtn");
  ok("progress view", view() === "progress");
  ok("progress header uses the link name", $("#pTitle").textContent === "Video from northframe.video");
  await new Promise((r) => setTimeout(r, 900));
  ok("ring is advancing", parseInt($("#pct").textContent, 10) > 0, $("#pct").textContent);
  click("#pauseBtn");
  ok("pause label", $("#pauseLabel").textContent === "Resume");
  const held = parseInt($("#pct").textContent, 10);
  await new Promise((r) => setTimeout(r, 600));
  ok("frozen while paused", parseInt($("#pct").textContent, 10) === held);
  click("#pauseBtn");
  ok("resume label", $("#pauseLabel").textContent === "Pause");
  click("[data-cancel]");
  ok("cancel returns to quality", view() === "quality", view());

  /* ---------- 8. run one to completion, then manage it ---------- */
  click("#downloadBtn");
  const done = await (async () => {
    for (let i = 0; i < 300; i++) {
      if (view() === "complete") return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  })();
  ok("download completes", done, view());
  if (done) {
    ok("complete shows the link name", $("#cTitle").textContent === "Video from northframe.video");
    ok("complete shows the chosen quality", /480p/.test($("#cQuality").textContent), $("#cQuality").textContent);
    ok("complete shows the file size", $("#cSize").textContent === "38 MB", $("#cSize").textContent);
  }
  click('[data-go="downloads"]');
  ok("one download listed", rows("#dlGroups .row") === 1, rows("#dlGroups .row") + " rows");
  ok("count line populated", /1 file/.test($("#dlCount").textContent), $("#dlCount").textContent);
  click("[data-menu]");
  ok("action sheet opens", !!$("#sheet"));
  click("[data-del]");
  ok("delete removes the row", rows("#dlGroups .row") === 0);
  ok("back to empty state", /No downloads yet/.test($("#dlGroups .state h3").textContent));
  click('[data-go="home"]');
  ok("recent hides again when empty", $("#recentWrap").hidden === true);

  /* ---------- 9. no settings screen any more ---------- */
  ok("there is no settings view", d.querySelector('.view[data-view="settings"]') === null);
  ok("there is no settings tab", d.querySelector('.tabbar [data-go="settings"]') === null);
  ok("tab bar has exactly two destinations", d.querySelectorAll(".tabbar button").length === 2,
    String(d.querySelectorAll(".tabbar button").length));
  ok("no gear button in the header", d.querySelector("#toSettings") === null);
  ok("no leftover settings controls", d.querySelectorAll("#seg,#wifiSw,#defQuality,[data-theme-set],[data-act]").length === 0);
  ok("theme follows the device instead", ["dark", "light"].indexOf(d.documentElement.dataset.theme) > -1,
    d.documentElement.dataset.theme);

  /* ---------- 10. a11y + hygiene ---------- */
  ok("icon buttons are labelled", Array.from(d.querySelectorAll("button")).filter((b) => !b.textContent.trim() && !b.getAttribute("aria-label")).length === 0);
  ok("no runtime errors", errs.length === 0, errs.slice(0, 2).join(" | "));

  const bad = out.filter((o) => !o.c);
  console.log(`${out.length - bad.length}/${out.length} checks passed`);
  if (bad.length) { bad.forEach((b) => console.log("  ✗ " + b.n + (b.extra ? " (" + b.extra + ")" : ""))); process.exitCode = 1; }
  else console.log("simple app: all checks passed");
});
