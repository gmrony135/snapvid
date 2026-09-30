/* ==========================================================================
   SnapVid — studio runtime
   State machine + event delegation + device/theme shell + guided demo
   ========================================================================== */
const IMG = window.SNAP_IMG || {};

const SCREENS = [
  { id: "splash", n: 1, label: "Splash", icon: "bolt" },
  { id: "onboarding", n: 2, label: "Onboarding", icon: "layers" },
  { id: "home", n: 3, label: "Home", icon: "home" },
  { id: "analyze", n: 4, label: "URL analysis", icon: "refresh" },
  { id: "preview", n: 5, label: "Video preview", icon: "film" },
  { id: "quality", n: 6, label: "Quality selection", icon: "sliders" },
  { id: "progress", n: 7, label: "Download progress", icon: "download" },
  { id: "complete", n: 8, label: "Download complete", icon: "check" },
  { id: "library", n: 9, label: "Downloads history", icon: "folder" },
  { id: "errors", n: 10, label: "Error states", icon: "alert" },
  { id: "empty", n: 11, label: "Empty states", icon: "cloud" },
  { id: "desktop", n: 12, label: "Desktop website", icon: "laptop" },
];
const MOBILE_ONLY = SCREENS.filter((s) => s.id !== "desktop").map((s) => s.id);

const S = {
  screen: "home",
  device: "iphone",
  orient: "portrait",
  themePref: "dark",
  theme: "dark",
  motion: "full",
  onbStep: 0,
  url: "",
  videoId: "iceland",
  quality: "720",
  moreOptions: false,
  busy: false,
  analyzeStep: 0,
  analyzeStage: "Reading link…",
  fieldError: false,
  progress: 0,
  paused: false,
  speed: "4.8",
  etaTxt: "1 min 12 s",
  libQuery: "",
  libFilter: "all",
  libEmpty: false,
  libMenu: -1,
  errorKey: "invalid",
  emptyKey: "library",
  sitePage: "home",
  siteLibOpen: false,
  toast: null,
  policyOpen: false,
  scenario: "success",
  history: [],
  demo: false,
  demoStep: 0,
  sortDir: "Newest",
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ------------------------------ THEME ----------------------------------- */
function applyTheme() {
  let t = S.themePref;
  if (t === "system") t = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  S.theme = t;
  document.documentElement.dataset.theme = t;
  document.documentElement.dataset.motion = S.motion === "calm" ? "calm" : "full";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t === "dark" ? "#08090b" : "#f4f5f7");
}

/* ------------------------------ RENDER --------------------------------- */
const DEVICE_LIST = [
  { id: "iphone", label: "iPhone", icon: "appleLogo", w: 393 },
  { id: "android", label: "Android", icon: "androidLogo", w: 412 },
  { id: "tablet", label: "Tablet", icon: "tablet", w: 834 },
  { id: "desktop", label: "Desktop", icon: "laptop", w: 1280 },
];

function currentScreenHtml() {
  if (S.screen === "quality") return Screens.preview(S) + qualitySheet(S);
  const fn = Screens[S.screen];
  return fn ? fn(S) : "";
}

function screenMeta() { return SCREENS.find((s) => s.id === S.screen) || SCREENS[2]; }

function renderRail() {
  const rail = $("#rail");
  rail.innerHTML = `
    <p class="rail__label">Flow</p>
    ${SCREENS.filter((s) => s.n <= 8).map((s) => `<button class="rail__item" data-goto="${s.id}" aria-current="${S.screen === s.id}"><span class="rail__n">${s.n}</span>${s.label}</button>`).join("")}
    <p class="rail__label">System</p>
    ${SCREENS.filter((s) => s.n >= 9).map((s) => `<button class="rail__item" data-goto="${s.id}" aria-current="${S.screen === s.id}"><span class="rail__n">${s.n}</span>${s.label}</button>`).join("")}
    <p class="rail__label">Jump to device</p>
    ${DEVICE_LIST.map((d) => `<button class="rail__item" data-device="${d.id}" aria-current="${S.device === d.id}"><span class="rail__n" style="background:transparent">${SV[d.icon]}</span>${d.label}</button>`).join("")}
    <p class="rail__label">Prototype</p>
    <button class="rail__item" data-act="play-demo" aria-current="false"><span class="rail__n" style="background:var(--sv-accent);color:#14110e">▶</span>${S.demo ? "Demo running…" : "Play guided demo"}</button>
    <button class="rail__item" data-act="reset-all" aria-current="false"><span class="rail__n" style="background:transparent">${SV.refresh}</span>Reset state</button>
  `;
}

function renderStage() {
  const stage = $("#stage");
  const meta = screenMeta();
  const device = S.device;
  const frameClass = device === "desktop" ? "device device--wide" : "device";
  const chrome = device === "iphone" ? '<span class="island"></span><span class="home-ind"></span>'
    : device === "android" ? '<span class="punch"></span><span class="home-ind"></span>' : "";
  stage.innerHTML = `
    <div class="stage__caption">
      <h1>${meta.n}. ${meta.label}</h1>
      <p>${(NOTES[S.screen] || NOTES.home).lead}</p>
      <div class="stage__hint">
        <span class="kbd">← → navigate screens</span>
        <span class="kbd">T theme</span>
        <span class="kbd">D device</span><span class="kbd">R rotate</span>
        <span class="kbd">P play demo</span>
      </div>
    </div>
    <div class="${frameClass}" data-device="${device}" data-orient="${device === "desktop" ? "landscape" : S.orient}">
      <div class="device__frame">
        ${chrome}
        ${device === "desktop" ? "" : statusbar(device)}
        <div class="device__screen" id="screen">${currentScreenHtml()}</div>
      </div>
    </div>
  `;
  renderNotes();
  renderRail();
}

function renderNotes() {
  const n = NOTES[S.screen] || NOTES.home;
  $("#notes").innerHTML = `
    <h4>${screenMeta().n}. ${n.title}</h4>
    <p>${n.lead}</p>
    <h4>Specs applied</h4>
    <ul>${n.specs.map((s) => `<li>${s}</li>`).join("")}</ul>
    <h4>Accessibility</h4>
    <ul>${n.a11y.map((s) => `<li>${s}</li>`).join("")}</ul>
    <h4>Brand</h4>
    <div class="swatch-row">
      <span class="swatch"><i style="background:#08090b"></i><span>bg #08090B</span></span>
      <span class="swatch"><i style="background:#ff6b2c"></i><span>accent #FF6B2C</span></span>
      <span class="swatch"><i style="background:#ffffff"></i><span>text #FFF</span></span>
      <span class="swatch"><i style="background:#9ba1a8"></i><span>text-2 #9BA1A8</span></span>
    </div>
    <h4>Try it</h4>
    <ul>
      <li>Paste a sample link from the studio bar, then press <code>Analyze Video</code>.</li>
      <li>Type <code>blocked</code> in the URL field to see the unsupported-source state.</li>
      <li>Scenarios in the top bar map to the seven error designs.</li>
    </ul>
  `;
}

function render() {
  applyTheme();
  document.body.dataset.wide = S.device === "desktop" ? "1" : "0";
  renderStage();
  $$("#deviceGroup button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.device === S.device)));
  $$("#themeGroup button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === S.themePref)));
  $("#motionBtn").setAttribute("aria-pressed", String(S.motion === "calm"));
  const ob = $("#orientBtn");
  ob.setAttribute("aria-pressed", String(S.orient === "landscape"));
  ob.hidden = S.device === "desktop";
  ob.innerHTML = S.orient === "landscape" ? "Landscape" : "Portrait";
  $("#scenario").value = S.scenario;
  const meta = screenMeta();
  document.title = `SnapVid — ${meta.label}`;
}

/* --------------------------- LIVE PROGRESS ------------------------------ */
let tickTimer = null;

function startProgress() {
  S.progress = 0; S.paused = false; S.screen = "progress";
  render();
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (S.paused) return;
    const inc = 0.9 + Math.random() * 1.6;
    S.progress = Math.min(100, S.progress + inc);
    const remaining = Math.max(1, Math.round((100 - S.progress) / 2.2));
    S.etaTxt = remaining > 60 ? `${Math.floor(remaining / 60)} min ${remaining % 60} s` : `${remaining} s`;
    S.speed = (4 + Math.random() * 2.4).toFixed(1);
    paintProgress();
    if (S.progress >= 100) {
      clearInterval(tickTimer); tickTimer = null;
      setTimeout(() => { S.screen = "complete"; render(); }, 420);
    }
  }, 120);
}

function paintProgress() {
  const root = $("#screen");
  if (!root || S.screen !== "progress") return;
  const fill = root.querySelector(".ring__fill");
  const pctEl = root.querySelector(".ring__pct");
  if (fill) {
    const c = parseFloat(fill.getAttribute("stroke-dasharray"));
    fill.setAttribute("stroke-dashoffset", String(c * (1 - S.progress / 100)));
  }
  if (pctEl) pctEl.innerHTML = `${Math.round(S.progress)}<small>%</small>`;
  const f = H.vid(S.videoId).formats.find((x) => x.id === S.quality) || H.vid(S.videoId).formats[1];
  const total = parseFloat(f.size);
  $$('[data-live="size"]', root).forEach((el) => { el.innerHTML = `${((total * S.progress) / 100).toFixed(1)} MB <span style="color:var(--text-3)">of ${f.size}</span>`; });
  $$('[data-live="eta"]', root).forEach((el) => { el.textContent = S.paused ? "Paused · tap Resume to continue" : `About ${S.etaTxt} remaining · ${S.speed} MB/s`; });
  $$('[data-live="bar"]', root).forEach((el) => { el.style.width = `${S.progress}%`; });
  $$('[data-live="state"]', root).forEach((el) => { el.textContent = S.paused ? "Paused" : "Downloading"; });
}

/* ------------------------------ ANALYSIS -------------------------------- */
function analyze() {
  const url = S.url.trim();
  if (!url) { S.fieldError = true; render(); return; }
  const low = url.toLowerCase();
  if (low.includes("blocked") || low.includes("drm") || low.includes("netflix")) {
    S.errorKey = "unsupported"; S.screen = "errors"; S.fieldError = false; render(); return;
  }
  if (low.includes("private") || low.includes("deleted")) {
    S.errorKey = "unavailable"; S.screen = "errors"; S.fieldError = false; render(); return;
  }
  if (!/^https?:\/\//.test(low) && !/^[a-z0-9-]+\.[a-z]{2,}\//.test(low)) { S.fieldError = true; render(); return; }

  S.fieldError = false; S.busy = true; S.analyzeStep = 0; S.analyzeStage = "Reading link…";
  S.screen = "analyze"; S.history.push("home"); render();
  const stages = ["Reading link…", "Checking source permission…", "Fetching available formats…"];
  [0, 620, 1240].forEach((d, i) => setTimeout(() => {
    S.analyzeStep = i; S.analyzeStage = stages[i];
    if (i > 0) render();
  }, d));
  setTimeout(() => { S.busy = false; S.screen = "preview"; S.history.push("analyze"); render(); }, 1750);
}

/* ------------------------------- TOASTS --------------------------------- */
let toastTimer = null;
function showToast(text, tone) {
  S.toast = { text, tone };
  const app = $("#screen .app");
  if (!app) { S.toast = null; return; }
  const old = app.querySelector(".toast"); if (old) old.remove();
  app.insertAdjacentHTML("beforeend", toast({ text, tone }));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    const t = $("#screen .toast"); if (t) t.remove();
    S.toast = null;
  }, 2200);
}

/* ---------------------------- POLICY SHEET ------------------------------ */
function policySheet() {
  return `<div class="sheet-wrap" role="dialog" aria-modal="true" aria-labelledby="pTitle" style="z-index:60">
    <div class="sheet-scrim" data-act="close-policy"></div>
    <div class="sheet">
      <span class="sheet__grab" aria-hidden="true"></span>
      <div class="between">
        <h2 class="t-h3" id="pTitle">Downloads you're allowed to make</h2>
        <button class="btn btn--icon btn--ghost" data-act="close-policy" aria-label="Close">${SV.x}</button>
      </div>
      <div class="sheet__scroll mt-4">
        <p class="t-sm">${POLICY.long}</p>
        <div class="sec-head"><span class="sec-head__t">What SnapVid supports</span></div>
        <div class="inset-card" style="padding:4px 14px">
          ${SOURCES.map((s) => `<div class="row" style="min-height:54px">
            <span class="row__ico" style="width:32px;height:32px;border-radius:10px;background:var(--sv-ok-soft);border-color:transparent;color:var(--sv-ok)" aria-hidden="true">${SV.check}</span>
            <span class="row__txt"><span class="row__title" style="font-size:14.5px">${s.name}</span><span class="t-xs row__sub">${s.note}</span></span>
          </div>`).join("")}
        </div>
        <div class="sec-head"><span class="sec-head__t">What SnapVid won't do</span></div>
        <div class="stack gap-2">
          ${[["Bypass DRM or encryption", "Protected media is refused, with an explanation."],
             ["Skip paywalls or logins", "Account-restricted media can't be processed."],
             ["Ignore platform limits", "If the publisher disables downloads, SnapVid respects it."],
             ["Store your files", "Processing is temporary; files go to your device only."]]
            .map(([t, d]) => `<div class="banner banner--danger" style="padding:11px 13px">
              <span class="banner__ico" aria-hidden="true">${SV.x}</span>
              <div><p class="banner__t" style="color:var(--text)">${t}</p><p class="banner__d">${d}</p></div></div>`).join("")}
        </div>
        <div class="mt-5">${policyNote("ok", "You keep responsibility for what you download — SnapVid keeps the rules.")}</div>
      </div>
      <button class="btn btn--primary btn--block mt-4" data-act="close-policy">Got it</button>
    </div>
  </div>`;
}

/* ---------------------------- GUIDED DEMO ------------------------------- */
let demoTimers = [];
function clearDemo() { demoTimers.forEach(clearTimeout); demoTimers = []; }

function playDemo() {
  clearDemo();
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  Object.assign(S, {
    demo: true, device: S.device === "desktop" ? "desktop" : "iphone", url: "", fieldError: false,
    onbStep: 0, moreOptions: false, libEmpty: false, libQuery: "", libFilter: "all", libMenu: -1,
    videoId: "iceland", quality: "720", progress: 0, paused: false, sitePage: "home",
  });
  const steps = [
    [0, () => { S.screen = "splash"; render(); }],
    [1300, () => { S.screen = "onboarding"; S.onbStep = 0; render(); }],
    [3100, () => { S.onbStep = 1; render(); }],
    [4900, () => { S.onbStep = 2; render(); }],
    [6700, () => { S.screen = "home"; render(); }],
  ];
  const sample = DEMO_URLS.iceland;
  for (let i = 0; i < sample.length; i++) {
    steps.push([7000 + i * 42, () => {
      S.url = sample.slice(0, i + 1);
      const input = $("#urlInput"); if (input) { input.value = S.url; }
      const app = $("#screen .app"); if (app && !app.querySelector('[data-act="clear-url"]')) {
        renderStage();
      }
    }]);
  }
  steps.push([7000 + sample.length * 42 + 320, () => { renderStage(); }]);
  steps.push([7000 + sample.length * 42 + 700, () => { S.busy = true; S.analyzeStep = 0; analyze(); }]);
  steps.push([11200, () => { S.screen = "quality"; S.moreOptions = false; render(); }]);
  steps.push([13400, () => { S.moreOptions = true; render(); }]);
  steps.push([15200, () => { S.moreOptions = false; S.screen = "progress"; startProgress(); }]);
  steps.push([17000, () => { S.paused = true; paintProgress(); render(); S.screen = "progress"; S.paused = true; paintProgress(); }]);
  steps.push([18600, () => { S.paused = false; paintProgress(); showToast("Download resumed", "ok"); }]);
  steps.forEach(([t, fn]) => demoTimers.push(setTimeout(fn, t)));
}

/* ------------------------------ INTERACTION ----------------------------- */
document.addEventListener("click", (ev) => {
  const goto = ev.target.closest("[data-goto]");
  if (goto) { go(goto.dataset.goto); return; }
  const dev = ev.target.closest("[data-device]");
  if (dev && dev.tagName === "BUTTON") {   // device switchers only — never the frame wrapper
    S.device = dev.dataset.device;
    if (S.device === "desktop") S.screen = "desktop";
    else if (S.screen === "desktop") S.screen = "home";
    render(); return;
  }
  const t = ev.target.closest("[data-act]");
  if (!t) return;
  const act = t.dataset.act;

  const T = (text, tone) => showToast(text, tone);
  switch (act) {
    case "tab-home": go("home"); break;
    case "tab-library": go("library"); break;
    case "site-home": S.sitePage = "home"; render(); break;
    case "site-library": S.sitePage = "library"; render(); break;
    case "back": {
      const prev = S.history.pop();
      if (prev) go(prev, false); else go(S.screen === "home" ? "home" : "home", false);
      break;
    }
    case "paste": S.url = DEMO_URLS[S.videoId] || DEMO_URLS.iceland; S.fieldError = false; render(); T("Link pasted from clipboard"); break;
    case "clear-url": S.url = ""; S.fieldError = false; render(); break;
    case "analyze": analyze(); break;
    case "cancel-analyze": S.busy = false; go("home"); break;
    case "open-quality": S.screen = "quality"; go("quality"); break;
    case "close-sheet": go("preview"); break;
    case "select-q": S.quality = t.dataset.q; render(); break;
    case "toggle-more": S.moreOptions = !S.moreOptions; render(); break;
    case "start-download": startProgress(); break;
    case "pause": S.paused = true; render(); paintProgress(); T("Paused", "warn"); break;
    case "resume": S.paused = false; render(); paintProgress(); T("Resumed", "ok"); break;
    case "cancel-download": if (tickTimer) { clearInterval(tickTimer); tickTimer = null; } S.progress = 0; go("preview"); T("Download cancelled", "warn"); break;
    case "open-file": T("Opening in player…"); break;
    case "row-menu": S.libMenu = Number(t.dataset.i); render(); break;
    case "close-menu": S.libMenu = -1; render(); break;
    case "confirm-delete": S.libMenu = -1; render(); T("Deleted · Undo available", "warn"); break;
    case "lib-filter": S.libFilter = t.dataset.f; render(); break;
    case "clear-search": S.libQuery = ""; render(); break;
    case "focus-search": { const i = $("#libSearch"); if (i) i.focus(); break; }
    case "set-theme": S.themePref = t.dataset.v; render(); T(`Theme: ${t.dataset.v === "system" ? "System" : t.dataset.v}`, "ok"); break;
    case "toggle": { const on = t.getAttribute("aria-checked") === "true"; t.setAttribute("aria-checked", String(!on)); break; }
    case "set-error": S.errorKey = t.dataset.e; render(); break;
    case "set-empty": S.emptyKey = t.dataset.e; render(); break;
    case "primary-empty": T("Nothing to do yet — this is a design preview"); break;
    case "retry-analyze": S.errorKey = S.errorKey; go("home"); T("Try again", "ok"); break;
    case "toggle-lib-empty": S.libEmpty = !S.libEmpty; render(); break;
    case "play-demo": S.demo ? (S.demo = false, clearDemo(), render()) : playDemo(); break;
    case "reset-all": clearDemo(); if (tickTimer) clearInterval(tickTimer); location.reload(); break;
    case "onb-next": S.onbStep = Math.min(2, S.onbStep + 1); render(); break;
    case "onb-dot": S.onbStep = Number(t.dataset.i); render(); break;
    case "onb-skip": case "onb-done": go("home"); break;
    case "open-policy": case "open-privacy": S.policyOpen = true; $("#screen").insertAdjacentHTML("beforeend", policySheet()); break;
    case "close-policy": { const s = $("#screen .sheet-wrap"); if (s) s.remove(); S.policyOpen = false; break; }
    case "noop": break;
    default:
      if (act.startsWith("toast-")) {
        const map = {
          "toast-copied": "Link copied", "toast-opened": "Opening file…", "toast-shared": "Share sheet opened",
          "toast-renamed": "Rename opened", "toast-location": "Choose a folder",
          "toast-sorted": `Sorted by: ${S.sortDir}`, "toast-help": "Help centre opened", "toast-how": "Guided tour started",
          "toast-generic": "Got it", "toast-dismissed": "Dismissed", "toast-clear": "History cleared",
        };
        T(map[act] || "Done", act.includes("renamed") ? "warn" : "ok");
      }
  }
});

/* URL field: live input handling without full re-render (keeps the caret) */
document.addEventListener("input", (ev) => {
  const el = ev.target;
  if (el.dataset.act === "url-input") {
    S.url = el.value; S.fieldError = false;
    const app = $("#screen .app");
    const field = el.closest(".field");
    if (field) {
      const has = !!field.querySelector('[data-act="clear-url"]');
      if (el.value && !has) {
        const btn = document.createElement("button");
        btn.className = "btn btn--icon btn--ghost"; btn.dataset.act = "clear-url"; btn.setAttribute("aria-label", "Clear link");
        btn.innerHTML = SV.x; field.insertBefore(btn, field.querySelector('[data-act="paste"]'));
      } else if (!el.value && has) {
        field.querySelector('[data-act="clear-url"]').remove();
      }
      field.classList.toggle("field--error", false);
    }
  }
  if (el.dataset.act === "lib-search") {
    S.libQuery = el.value;
    const cur = el.selectionStart;
    render();
    const again = $("#libSearch"); if (again) { again.focus(); again.setSelectionRange(cur, cur); }
  }
});

document.addEventListener("keydown", (ev) => {
  const inField = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
  if (ev.key === "Enter" && document.activeElement.dataset && document.activeElement.dataset.act === "url-input") { analyze(); return; }
  if (inField) return;
  const i = MOBILE_ONLY.indexOf(S.screen === "quality" ? "quality" : S.screen);
  if (ev.key === "ArrowRight") { go(nextScreen(1)); }
  else if (ev.key === "ArrowLeft") { go(nextScreen(-1)); }
  else if (ev.key.toLowerCase() === "t") { S.themePref = S.themePref === "dark" ? "light" : "dark"; render(); }
  else if (ev.key.toLowerCase() === "d") {
    const order = DEVICE_LIST.map((d) => d.id);
    S.device = order[(order.indexOf(S.device) + 1) % order.length];
    if (S.device === "desktop") S.orient = "landscape";
    if (S.device === "desktop") S.screen = "desktop";
    else if (S.screen === "desktop") S.screen = "home";
    render();
  }
  else if (ev.key.toLowerCase() === "p") { S.demo = false; playDemo(); }
  else if (ev.key.toLowerCase() === "r" && S.device !== "desktop") { S.orient = S.orient === "portrait" ? "landscape" : "portrait"; render(); }
  else if (/^[1-9]$/.test(ev.key)) { const s = SCREENS[Number(ev.key) - 1]; if (s) go(s.id); }
  else if (ev.key === "Escape") { const p = $("#screen .sheet-wrap"); if (p) p.remove(); S.policyOpen = false; }
});

function nextScreen(dir) {
  const list = S.device === "desktop" ? ["desktop"] : MOBILE_ONLY;
  const i = list.indexOf(S.screen);
  return list[(i + dir + list.length) % list.length];
}

function go(id, push = true) {
  if (id === S.screen) { render(); return; }
  if (push && S.screen && S.screen !== "quality") S.history.push(S.screen);
  S.screen = id;
  if (id === "desktop" && S.device !== "desktop") S.device = "desktop";
  if (id !== "desktop" && S.device === "desktop") S.device = "iphone";
  if (id !== "quality") S.moreOptions = S.moreOptions;
  render();
  const sc = $("#screen .scroll"); if (sc) sc.scrollTop = 0;
}

/* ------------------------------ TOP BAR UI ------------------------------ */
function paintTopbar() {
  $("#brandMark").innerHTML = SV.mark(22, "#fff");
  $("#deviceGroup").innerHTML = DEVICE_LIST.map((d) => `<button data-device="${d.id}" aria-pressed="${S.device === d.id}">${SV[d.icon]} ${d.label}</button>`).join("");
  $("#themeGroup").innerHTML = [["dark", "Dark"], ["light", "Light"], ["system", "System"]]
    .map(([k, l]) => `<button data-theme-set="${k}" aria-pressed="${S.themePref === k}">${l}</button>`).join("");
  $("#scenario").innerHTML = [["success", "Flow: success"], ["invalid", "Error: invalid URL"], ["unsupported", "Error: unsupported source"], ["unavailable", "Error: unavailable"], ["permission", "Error: no permission"], ["network", "Error: network"], ["busy", "Error: server busy"], ["filegen", "Error: file generation"], ["empty", "Empty library"], ["offline", "Empty: offline"]]
    .map(([k, l]) => `<option value="${k}">${l}</option>`).join("");
  $("#deviceGroup").addEventListener("click", (e) => {
    const b = e.target.closest("[data-device]"); if (!b) return;
    S.device = b.dataset.device;
    if (S.device === "desktop") S.screen = "desktop";
    else if (S.screen === "desktop") S.screen = "home";
    render();
  });
  $("#themeGroup").addEventListener("click", (e) => {
    const b = e.target.closest("[data-theme-set]"); if (!b) return;
    S.themePref = b.dataset.themeSet; render();
  });
  $("#motionBtn").addEventListener("click", () => { S.motion = S.motion === "calm" ? "full" : "calm"; render(); });
  $("#orientBtn").addEventListener("click", () => { S.orient = S.orient === "portrait" ? "landscape" : "portrait"; render(); });
  $("#scenario").addEventListener("change", (e) => applyScenario(e.target.value));
}

function applyScenario(v) {
  S.scenario = v;
  clearDemo(); if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  if (v === "success") { S.libEmpty = false; S.url = ""; go("home"); return; }
  if (v === "empty") { S.libEmpty = true; go("library"); return; }
  if (v === "offline") { S.emptyKey = "offline"; go("empty"); return; }
  const map = { invalid: "invalid", unsupported: "unsupported", unavailable: "unavailable", permission: "permission", network: "network", busy: "busy", filegen: "filegen" };
  S.errorKey = map[v] || "invalid";
  go("errors");
}

/* -------------------------------- BOOT ---------------------------------- */
paintTopbar();
render();
if (window.matchMedia) window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => { if (S.themePref === "system") render(); });

/* --------------------- PUBLIC HOOKS (debug & extension) ------------------ */
window.SnapVid = { S, SCREENS, Screens, SV, VIDEOS, ERRORS, EMPTIES, DOWNLOADS, NOTES, POLICY, SOURCES, go, render, playDemo, clearDemo, startProgress, qualitySheet, policySheet };
