/* Headless smoke test: loads index.html in jsdom, renders every screen,
   exercises the main interactions and reports any runtime error. */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const root = path.join(__dirname, "..");
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errors.push("jsdomError: " + e.message));
vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));
vc.on("warn", () => {});
vc.on("log", () => {});

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

JSDOM.fromFile(path.join(root, "index.html"), {
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    window.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  },
}).then(async (dom) => {
  await new Promise((r) => setTimeout(r, 600));
  const w = dom.window, d = w.document;
  const api = w.SnapVid;
  const S = api.S;
  const sc = (id) => (id === "quality" ? api.qualitySheet(S) : api.Screens[id](S));

  const results = [];
  const check = (name, cond, extra = "") => results.push({ name, ok: !!cond, extra });

  // 1. every screen renders non-trivial markup
  const ids = ["splash", "onboarding", "home", "analyze", "preview", "quality", "progress", "complete", "library", "errors", "empty", "desktop"];
  const strip = (m) => m.replace(/src="data:[^"]*"/g, 'src="data:…"').replace(/[A-Za-z0-9+/]{120,}={0,2}/g, "…");
  for (const id of ids) {
    const markup = sc(id);
    const bare = strip(markup);
    check(`screen:${id} renders`, typeof markup === "string" && markup.length > 400, `${markup.length} chars`);
    check(`screen:${id} no undefined`, !/undefined|NaN|\[object Object\]/.test(bare), (bare.match(/undefined|NaN|\[object Object\]/) || [""])[0]);
    check(`screen:${id} no template leak`, !bare.includes("${"));
  }

  // 2. traverse the studio
  for (const id of ids) {
    api.go(id);
    const stage = d.querySelector("#stage");
    check(`stage:${id} mounted`, stage.innerHTML.includes("device__frame"));
    check(`notes:${id} mounted`, d.querySelector("#notes").innerHTML.includes("Specs applied"));
  }

  const act = (sel) => {
    const el = d.querySelector(sel);
    if (!el) return false;
    el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  };

  // 3. per-device rendering
  for (const dev of ["iphone", "android", "tablet", "desktop"]) {
    d.querySelector(`#deviceGroup [data-device="${dev}"]`).dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    check(`device:${dev} frame`, d.querySelector(`.device[data-device="${dev}"]`) !== null);
  }

  // 4. themes
  for (const t of ["dark", "light", "system"]) {
    d.querySelector(`#themeGroup [data-theme-set="${t}"]`).dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    check(`theme:${t} applied`, d.documentElement.dataset.theme === (t === "system" ? "dark" : t), d.documentElement.dataset.theme);
  }
  d.querySelector(`#themeGroup [data-theme-set="dark"]`).dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

  // 5. home → analyze → preview → quality → progress → complete
  api.go("home");
  act('[data-act="paste"]');
  check("paste fills url", S.url.length > 5, S.url);
  act('[data-act="analyze"]');
  check("analyze leaves home", S.screen === "analyze", S.screen);
  await new Promise((r) => setTimeout(r, 2200));
  check("analysis lands on preview", S.screen === "preview", S.screen);

  act('[data-act="open-quality"]');
  check("quality sheet opens", S.screen === "quality" && !!d.querySelector('.sheet-wrap[role="dialog"]'));
  const q4 = d.querySelector('[data-act="select-q"][data-q="480"]');
  check("quality options rendered", !!q4);
  q4.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  check("quality selection updates", S.quality === "480", S.quality);
  check("cta label follows selection", d.querySelector("#screen .sheet .btn--primary").textContent.includes("480p"));

  act('[data-act="toggle-more"]');
  check("more options expand", !!d.querySelector('[aria-expanded="true"]'));
  act('[data-act="start-download"]');
  check("progress starts", S.screen === "progress" && !!d.querySelector(".ring__fill"));
  await new Promise((r) => setTimeout(r, 900));
  check("progress advances", S.progress > 0, String(S.progress.toFixed(1)));
  act('[data-act="pause"]');
  check("pause sets state", S.paused === true);
  act('[data-act="resume"]');
  check("resume clears state", S.paused === false);
  act('[data-act="cancel-download"]');
  check("cancel returns to preview", S.screen === "preview", S.screen);

  // 6. library interactions
  api.go("library");
  act('[data-act="lib-filter"][data-f="audio"]');
  check("audio filter", S.libFilter === "audio" && d.querySelectorAll("#screen .mrow").length === 1, String(d.querySelectorAll("#screen .mrow").length));
  act('[data-act="lib-filter"][data-f="all"]');
  const search = d.querySelector("#libSearch");
  search.value = "pasta";
  search.dispatchEvent(new w.Event("input", { bubbles: true }));
  check("search filters", d.querySelectorAll("#screen .mrow").length === 1, String(d.querySelectorAll("#screen .mrow").length));
  act('[data-act="clear-search"]');
  const menuBtn = d.querySelector('#screen [data-act="row-menu"]');
  menuBtn.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  check("row menu opens", !!d.querySelector('[role="menu"]'));
  act('[data-act="close-menu"]');
  check("row menu closes", !d.querySelector('[role="menu"]'));

  // 7. there is no settings screen or tab any more
  check("no settings screen", !api.SCREENS.some((x) => x.id === "settings"));
  check("no tab-settings action", !d.querySelector('[data-act="tab-settings"]'));
  check("bottom nav has two destinations", d.querySelectorAll("#screen .tabbar [data-act^=\"tab-\"]").length === 2,
    String(d.querySelectorAll("#screen .tabbar [data-act^=\"tab-\"]").length));
  check("no leftover settings controls", !d.querySelector('[data-act^="cycle-"],[data-act^="toggle-wifi"],[data-act^="toggle-notif"]'));

  // 8. policy sheet
  api.go("home");
  act('[data-act="open-policy"]');
  check("policy sheet opens", !!d.querySelector("#pTitle"));
  act('[data-act="close-policy"]');
  check("policy sheet closes", !d.querySelector("#pTitle"));

  // 9. states
  api.go("errors");
  check("7 error states", d.querySelectorAll("#screen .card h3").length >= 6, String(d.querySelectorAll("#screen .card h3").length));
  act('[data-act="set-error"][data-e="permission"]');
  check("error switch works", S.errorKey === "permission" && /isn.t permitted/.test(d.querySelector("#screen [role=alert]").textContent));
  api.go("empty");
  act('[data-act="set-empty"][data-e="wifi"]');
  check("empty switch works", S.emptyKey === "wifi" && d.querySelector("#screen").textContent.includes("Waiting for Wi‑Fi"));

  // 10. scenario routing
  const sel = d.querySelector("#scenario");
  sel.value = "invalid"; sel.dispatchEvent(new w.Event("change", { bubbles: true }));
  check("scenario invalid → errors", S.screen === "errors" && S.errorKey === "invalid");
  sel.value = "empty"; sel.dispatchEvent(new w.Event("change", { bubbles: true }));
  check("scenario empty → library empty", S.screen === "library" && S.libEmpty === true);
  sel.value = "success"; sel.dispatchEvent(new w.Event("change", { bubbles: true }));

  // 11. guided demo boots
  api.playDemo();
  await new Promise((r) => setTimeout(r, 600));
  check("demo starts at splash", ["splash", "onboarding"].includes(S.screen), S.screen);
  await new Promise((r) => setTimeout(r, 6400));
  check("demo progresses", ["onboarding", "home"].includes(S.screen), S.screen);
  await new Promise((r) => setTimeout(r, 6000));
  check("demo reaches analysis/preview", ["analyze", "preview", "quality"].includes(S.screen), S.screen);

  // 12. desktop website pages
  api.go("desktop");
  for (const p of ["home", "library"]) {
    api.S.sitePage = p; api.render();
    const t = d.querySelector("#screen").textContent;
    check(`desktop page:${p}`, t.length > 200 && !/undefined/.test(t));
  }

  // 13. a11y spot checks
  const imgs = Array.from(d.querySelectorAll("#screen img"));
  check("images have alt", imgs.every((i) => i.hasAttribute("alt")), `${imgs.length} imgs`);
  const iconBtns = Array.from(d.querySelectorAll('#screen button:not([aria-label]):not([data-act="noop"])')).filter((b) => b.textContent.trim().length === 0);
  check("icon buttons labelled", iconBtns.length === 0, iconBtns.map((b) => b.outerHTML.slice(0, 60)).join(" | "));

  // report
  const fails = results.filter((r) => !r.ok);
  console.log(`\n${results.length - fails.length}/${results.length} checks passed`);
  if (errors.length) { console.log(`\n${errors.length} runtime messages:`); errors.slice(0, 12).forEach((e) => console.log("  - " + e)); }
  if (fails.length) { console.log("\nFAILURES:"); fails.forEach((f) => console.log(`  ✗ ${f.name} ${f.extra ? "(" + f.extra + ")" : ""}`)); process.exitCode = 1; }
  else console.log("\nAll checks passed.");
  dom.window.close();
}).catch((e) => { console.error("harness error", e); process.exit(1); });
