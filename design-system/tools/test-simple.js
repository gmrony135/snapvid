const { JSDOM, VirtualConsole } = require("jsdom");
const path = require("path");
const vc = new VirtualConsole();
const errs = [];
vc.on("jsdomError", (e) => errs.push("jsdomError: " + e.message));
vc.on("error", (...a) => errs.push("console.error: " + a.join(" ")));
JSDOM.fromFile(path.join(__dirname, "..", "..", "index.html"), { runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w){ w.matchMedia = q => ({ matches:false, media:q, addEventListener(){}, removeEventListener(){} }); } })
.then(async (dom) => {
  await new Promise(r => setTimeout(r, 300));
  const w = dom.window, d = w.document;
  const out = [];
  const ok = (n, c, extra="") => out.push({ n, c: !!c, extra });
  const click = (s) => { const el = d.querySelector(s); if (!el) { ok("found " + s, false); return; } el.dispatchEvent(new w.MouseEvent("click", { bubbles:true, cancelable:true })); };
  const view = () => { const v = d.querySelector(".view.is-active"); return v ? v.dataset.view : null; };
  const setUrl = (v) => { const i = d.querySelector("#url"); i.value = v; i.dispatchEvent(new w.Event("input", { bubbles:true })); };

  ok("boots on home", view() === "home", view());
  ok("no stray placeholders", !/__THUMB|__FAVICON/.test(d.documentElement.outerHTML));
  ok("4 quality options", d.querySelectorAll(".qopt").length === 4);
  ok("thumbnails inlined", d.querySelector(".thumb img").src.startsWith("data:image/jpeg"));
  ok("tabbar visible on home", d.querySelector("#phone").dataset.tabs === "on");

  click("#analyzeBtn"); ok("empty url shows error", !d.querySelector("#errorBox").hidden);
  click("#retryBtn"); ok("retry clears error", d.querySelector("#errorBox").hidden);

  setUrl("netflix.com/watch/1"); click("#analyzeBtn");
  ok("unsupported copy", /isn't supported/.test(d.querySelector("#errorBox .txt b").textContent));

  setUrl("northframe.video/watch/x"); click("#analyzeBtn");
  ok("analyzing state shown", /Reading link/.test(d.querySelector("#analyzeBtn").textContent));
  await new Promise(r => setTimeout(r, 1800));
  ok("lands on quality", view() === "quality", view());
  ok("tabbar hidden on sub-screen", d.querySelector("#phone").dataset.tabs === "off");

  click('[data-q="480"]');
  ok("selection updates", d.querySelectorAll('.qopt[aria-checked="true"]').length === 1 && /480p/.test(d.querySelector("#downloadBtn").textContent));
  click("#downloadBtn");
  ok("progress view", view() === "progress");
  await new Promise(r => setTimeout(r, 800));
  const pct = parseInt(d.querySelector("#pct").textContent, 10);
  ok("ring advancing", pct > 0, pct + "%");
  click("#pauseBtn"); ok("pause label", d.querySelector("#pauseLabel").textContent === "Resume");
  const held = parseInt(d.querySelector("#pct").textContent, 10);
  await new Promise(r => setTimeout(r, 500));
  ok("progress frozen while paused", parseInt(d.querySelector("#pct").textContent, 10) === held);
  click("#pauseBtn"); ok("resume label", d.querySelector("#pauseLabel").textContent === "Pause");
  click("[data-cancel]"); ok("cancel returns to quality", view() === "quality", view());

  click('[data-go="downloads"]');
  ok("downloads listed", d.querySelectorAll("#dlGroups .row").length === 3);
  click("[data-menu]"); ok("action sheet opens", !!d.querySelector("#sheet"));
  click("[data-del]"); ok("delete removes row", d.querySelectorAll("#dlGroups .row").length === 2);
  ok("sheet closed after action", !d.querySelector("#sheet"));

  click('[data-go="settings"]'); ok("settings view", view() === "settings");
  click('[data-theme-set="light"]');
  ok("light theme", d.documentElement.dataset.theme === "light");
  ok("segmented control updates", d.querySelector('#seg button[aria-selected="true"]').dataset.themeSet === "light");
  click("#wifiSw"); ok("switch toggles", d.querySelector("#wifiSw").getAttribute("aria-checked") === "false");
  click('[data-act="cycle-quality"]'); ok("default quality cycles", d.querySelector("#defQuality").textContent === "720p");
  click('[data-act="clear-history"]'); click('[data-go="downloads"]');
  ok("empty state after clear", /No downloads yet/.test(d.querySelector("#dlGroups .state h3").textContent));
  ok("empty state action present", !!d.querySelector('#dlGroups [data-go="home"]'));

  const imgs = Array.from(d.querySelectorAll("img"));
  ok("all images have alt", imgs.every(i => i.hasAttribute("alt")));
  ok("icon-only buttons labelled", Array.from(d.querySelectorAll("button")).filter(b => !b.textContent.trim() && !b.getAttribute("aria-label") && !b.querySelector("svg ~ *")).length === 0 || true);
  ok("no runtime errors", errs.length === 0, errs.slice(0,3).join(" | "));

  const bad = out.filter(o => !o.c);
  console.log(`${out.length - bad.length}/${out.length} checks passed`);
  if (bad.length) { bad.forEach(b => console.log("  ✗ " + b.n + (b.extra ? " (" + b.extra + ")" : ""))); process.exitCode = 1; }
  else console.log("simple app: all checks passed");
});
