/* ==========================================================================
   SnapVid — screens part A: helpers, chrome, home, analyze, preview, quality
   ========================================================================== */
const H = {
  esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  vid: (id) => VIDEOS[id] || VIDEOS.iceland,
};
const Screens = {};
const st_menu = -1;

function toast(msg) {
  const ic = msg.tone === "danger" ? SV.alert : msg.tone === "warn" ? SV.alert : SV.check;
  const col = msg.tone === "danger" ? "var(--sv-danger)" : msg.tone === "warn" ? "var(--sv-warn)" : "var(--sv-ok)";
  return `<div class="toast" role="status"><span aria-hidden="true" style="color:${col};display:inline-flex">${ic}</span>${H.esc(msg.text || msg)}</div>`;
}

function statusbar(device) {
  const bars = `<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="7.5" width="3" height="4.5" rx="1"/><rect x="4.6" y="5" width="3" height="7" rx="1"/><rect x="9.2" y="2.5" width="3" height="9.5" rx="1"/><rect x="13.8" y="0" width="3" height="12" rx="1" opacity=".38"/></svg>`;
  const wifi = `<svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden="true"><path d="M8.5 11.4 6.2 8.7a3.6 3.6 0 0 1 4.6 0Z"/><path d="M8.5 6.1c-1.7 0-3.2.6-4.4 1.6L2.7 6c1.6-1.3 3.6-2 5.8-2s4.2.7 5.8 2l-1.4 1.7A6.9 6.9 0 0 0 8.5 6.1Z"/><path d="M8.5 2.4c-2.6 0-5 .9-6.8 2.4L.5 3.4A12.6 12.6 0 0 1 8.5 0c3 0 5.8 1.1 8 3l-1.2 1.4A11 11 0 0 0 8.5 2.4Z"/></svg>`;
  const batt = `<svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden="true"><rect x=".6" y=".6" width="22" height="11.8" rx="3.6" stroke="currentColor" stroke-opacity=".45"/><rect x="2.2" y="2.2" width="15.5" height="8.6" rx="2.2" fill="currentColor"/><path d="M24.3 4.4v4.2c1-.3 1.6-1 1.6-2.1s-.6-1.8-1.6-2.1Z" fill="currentColor" fill-opacity=".5"/></svg>`;
  if (device === "android")
    return `<div class="statusbar"><span class="mono-num">9:41</span><span class="statusbar__row">${wifi}${batt}</span></div>`;
  return `<div class="statusbar"><span class="mono-num">9:41</span><span class="statusbar__row">${bars}${wifi}${batt}</span></div>`;
}

function appbar({ title, brand, back, right, solid }) {
  return `<header class="appbar ${solid ? "appbar--solid" : ""}">
    ${back ? `<button class="btn btn--icon btn--ghost" data-act="back" aria-label="Go back">${SV.back}</button>` : ""}
    ${brand ? `<div class="appbar__brand"><span class="appbar__mark" aria-hidden="true">${SV.mark(19, "#fff")}</span><span class="appbar__name">SnapVid</span></div>` : ""}
    ${title ? `<h1 class="t-h3 grow" style="font-weight:680">${title}</h1>` : `<span class="grow"></span>`}
    ${right || ""}
  </header>`;
}

function tabbar(active) {
  const items = [
    { id: "home", label: "Home", icon: SV.home },
    { id: "library", label: "Downloads", icon: SV.download, dot: true },
  ];
  return `<nav class="tabbar" aria-label="Primary">
    ${items.map((i) => `<button data-act="tab-${i.id}" ${active === i.id ? 'aria-current="page"' : ""}>
      <span aria-hidden="true">${i.icon}</span><span>${i.label}</span>
      ${i.dot && active !== "library" ? '<i class="dot" aria-hidden="true"></i>' : ""}
    </button>`).join("")}
  </nav>`;
}

function thumb(vid, opts = {}) {
  const v = H.vid(vid);
  return `<div class="thumb" ${opts.ratio ? `style="aspect-ratio:${opts.ratio}"` : ""}>
    <img src="${IMG[v.thumb]}" alt="Thumbnail: ${H.esc(v.title)}" ${opts.eager ? "" : 'loading="lazy"'} />
    ${opts.hd ? `<span class="thumb__hd">${opts.hd}</span>` : ""}
    ${opts.scrim ? '<span class="thumb__scrim"></span>' : ""}
    ${opts.play ? `<button class="thumb__play" data-act="play-preview" aria-label="Play preview of ${H.esc(v.title)}">${SV.play}</button>` : ""}
    ${opts.dur !== false ? `<span class="thumb__dur">${v.dur}</span>` : ""}
    ${opts.leftTop ? `<span style="position:absolute;left:10px;top:10px">${opts.leftTop}</span>` : ""}
    ${opts.leftBottom ? `<span style="position:absolute;left:10px;bottom:10px">${opts.leftBottom}</span>` : ""}
  </div>`;
}

function policyNote(tone, text, act) {
  const ico = tone === "ok" ? SV.shield : tone === "warn" ? SV.alert : SV.info;
  const col = tone === "ok" ? "var(--sv-ok)" : tone === "warn" ? "var(--sv-warn)" : "var(--text-3)";
  return `<div class="policy">
    <span style="color:${col};display:inline-flex" aria-hidden="true">${ico}</span>
    <span class="grow">${text}${act ? ` <button data-act="${act.act}" style="color:var(--accent-text);font-weight:620;font-size:12.5px">${act.label}</button>` : ""}</span>
  </div>`;
}

function ring(pct, opts = {}) {
  const size = opts.size || 208, sw = opts.stroke || 12;
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return `<div class="ring" style="width:${size}px;height:${size}px" role="img" aria-label="${Math.round(pct)} percent complete">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle class="ring__track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${sw}"/>
      <circle class="ring__fill" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${sw}"
        stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
    </svg>
    <div class="ring__label"><span class="ring__pct t-num">${Math.round(pct)}<small>%</small></span></div>
  </div>`;
}

function checkAnimated(size = 96) {
  return `<div class="checkwrap" style="width:${size}px;height:${size}px">
    <span class="halo"></span>
    <svg width="${size}" height="${size}" viewBox="0 0 96 96" aria-hidden="true">
      <circle class="c-disc" cx="48" cy="48" r="42" fill="var(--sv-ok-soft)" stroke="var(--sv-ok)" stroke-width="1.6" stroke-opacity=".5"/>
      <path class="c-tick" d="M30 49.5 43 62.5 67 36" fill="none" stroke="var(--sv-ok)" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg></div>`;
}

const STATE_ART = {
  tray: `<svg width="132" height="104" viewBox="0 0 132 104" fill="none" aria-hidden="true"><rect x="18" y="12" width="96" height="60" rx="14" stroke="var(--stroke-strong)" stroke-width="2"/><path d="M40 78h52" stroke="var(--stroke-strong)" stroke-width="2" stroke-linecap="round"/><path d="M66 36v22m0 0-10-10m10 10 10-10" stroke="var(--sv-accent)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  search: `<svg width="132" height="104" viewBox="0 0 132 104" fill="none" aria-hidden="true"><circle cx="58" cy="46" r="26" stroke="var(--stroke-strong)" stroke-width="2"/><path d="m78 66 16 16" stroke="var(--stroke-strong)" stroke-width="2" stroke-linecap="round"/><path d="M48 46h20" stroke="var(--sv-accent)" stroke-width="3.4" stroke-linecap="round"/></svg>`,
  wifi: `<svg width="132" height="104" viewBox="0 0 132 104" fill="none" aria-hidden="true"><path d="M28 44a52 52 0 0 1 76 0" stroke="var(--stroke-strong)" stroke-width="2" stroke-linecap="round"/><path d="M42 58a34 34 0 0 1 48 0" stroke="var(--stroke-strong)" stroke-width="2" stroke-linecap="round"/><circle cx="66" cy="76" r="5" fill="var(--sv-accent)"/><path d="M34 54l64-14" stroke="var(--sv-accent)" stroke-width="3.4" stroke-linecap="round" opacity=".85"/></svg>`,
  cloud: `<svg width="132" height="104" viewBox="0 0 132 104" fill="none" aria-hidden="true"><path d="M40 74h50a20 20 0 0 0 1.6-39.9A28 28 0 0 0 38 42a18 18 0 0 0 2 32Z" stroke="var(--stroke-strong)" stroke-width="2"/><path d="M66 56v20m0 0-9-9m9 9 9-9" stroke="var(--sv-accent)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 30l76 46" stroke="var(--sv-accent)" stroke-width="3.4" stroke-linecap="round"/></svg>`,
};

function stateBlock(s, opts = {}) {
  return `<div class="state">
    <div class="state__art">${STATE_ART[s.art] || ""}</div>
    <h3>${s.title}</h3>
    <p class="t-body">${s.body}</p>
    ${s.note ? `<p class="t-xs mt-4" style="max-width:290px">${s.note}</p>` : ""}
    <div class="state__actions">
      ${s.primary ? `<button class="btn btn--primary" data-act="${opts.primaryAct || "noop"}">${s.primary}</button>` : ""}
      ${s.secondary ? `<button class="btn btn--outline" data-act="${opts.secondaryAct || "noop"}">${s.secondary}</button>` : ""}
    </div>
  </div>`;
}

function errorCard(e, opts = {}) {
  const map = { warn: ["var(--sv-warn)", "var(--sv-warn-soft)"], danger: ["var(--sv-danger)", "var(--sv-danger-soft)"], info: ["var(--sv-info)", "var(--sv-info-soft)"] };
  const [col, soft] = map[e.tone];
  return `<div class="card card--pad">
    <div class="between">
      <span class="row__ico" style="background:${soft};border-color:transparent;color:${col}">${SV[e.icon]}</span>
      <span class="badge mono-num">${e.code}</span>
    </div>
    <h3 class="t-h3 mt-4" style="font-size:17px">${e.title}</h3>
    <p class="t-sm mt-2">${e.body}</p>
    ${e.hint ? `<p class="t-xs mt-3">${e.hint}</p>` : ""}
    <div class="center gap-3 wrap mt-4">
      <button class="btn btn--primary btn--sm" data-act="${opts.retry || "retry-analyze"}">${e.actions[0]}</button>
      <button class="btn btn--ghost btn--sm" data-act="${opts.dismiss || "toast-dismissed"}">${e.actions[1] || "Dismiss"}</button>
    </div>
  </div>`;
}

/* --------------------------------- SPLASH ------------------------------- */
Screens.splash = () => `<div class="app" style="justify-content:center;align-items:center;padding:0 34px;text-align:center">
  <div style="animation:pop 700ms var(--e-out) both">
    <span style="display:grid;place-items:center;width:104px;height:104px;margin:0 auto 26px;border-radius:30px;background:linear-gradient(180deg,var(--sv-accent),var(--sv-accent-600));box-shadow:0 26px 60px -22px rgba(255,107,44,.85),inset 0 1px 0 rgba(255,255,255,.32);color:#fff">${SV.mark(50, "#fff")}</span>
    <h1 style="font-size:34px;letter-spacing:-.04em;font-weight:740;margin:0">SnapVid</h1>
    <p class="t-body mt-3" style="font-size:16px">Save your favorite videos, simply.</p>
  </div>
  <div style="position:absolute;bottom:calc(46px + var(--safe-b));left:34px;right:34px">
    <div class="bar bar--indet" style="height:3px;width:132px;margin:0 auto 22px"><div class="bar__fill"></div></div>
    ${policyNote("muted", "Downloads only from sources that permit them.")}
  </div>
</div>`;

/* ------------------------------ ONBOARDING ------------------------------ */
const ONB = [
  {
    art: `<svg width="220" height="180" viewBox="0 0 220 180" fill="none" aria-hidden="true"><rect x="22" y="30" width="176" height="46" rx="16" stroke="var(--stroke-strong)" stroke-width="2"/><path d="M48 53h92" stroke="var(--text-3)" stroke-width="3.4" stroke-linecap="round"/><path d="M150 44.5h6M153 40.5v8" stroke="var(--sv-accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M162 49.5a6 6 0 0 1-5.4 5.9" stroke="var(--stroke-strong)" stroke-width="2.4" stroke-linecap="round"/><rect x="52" y="102" width="116" height="44" rx="22" fill="var(--sv-accent)" fill-opacity=".14" stroke="var(--sv-accent)" stroke-width="2"/><path d="M110 114v20m0 0-9-9m9 9 9-9" stroke="var(--sv-accent)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    title: "Paste a link, get a file",
    body: "Drop in a link from a source that allows downloads. SnapVid reads it, verifies permission and shows you what's available.",
  },
  {
    art: `<svg width="220" height="180" viewBox="0 0 220 180" fill="none" aria-hidden="true"><rect x="28" y="22" width="164" height="42" rx="14" stroke="var(--stroke-strong)" stroke-width="2"/><rect x="28" y="72" width="164" height="42" rx="14" fill="var(--sv-accent)" fill-opacity=".13" stroke="var(--sv-accent)" stroke-width="2"/><circle cx="166" cy="93" r="11" fill="var(--sv-accent)"/><path d="m161 93 3.6 3.6L172 88.6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="28" y="122" width="164" height="42" rx="14" stroke="var(--stroke-strong)" stroke-width="2"/><path d="M48 43h54M48 93h40M48 143h48" stroke="var(--text-3)" stroke-width="3.2" stroke-linecap="round"/></svg>`,
    title: "Pick exactly your quality",
    body: "4K, 1080p, 720p, 480p, 360p or audio only — with the file size shown before you commit.",
  },
  {
    art: `<svg width="220" height="180" viewBox="0 0 220 180" fill="none" aria-hidden="true"><rect x="34" y="16" width="152" height="148" rx="22" stroke="var(--stroke-strong)" stroke-width="2"/><rect x="52" y="40" width="116" height="32" rx="10" fill="var(--sv-accent)" fill-opacity=".13" stroke="var(--sv-accent)" stroke-width="1.6"/><path d="M66 56h58" stroke="var(--sv-accent)" stroke-width="3.2" stroke-linecap="round"/><rect x="52" y="82" width="116" height="32" rx="10" stroke="var(--stroke-strong)" stroke-width="1.6"/><path d="M66 98h72" stroke="var(--text-3)" stroke-width="3.2" stroke-linecap="round"/><path d="M110 124v16m0 0-6.5-6.5m6.5 6.5 6.5-6.5" stroke="var(--text-3)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    title: "Saved, private, yours",
    body: "Files live on your device only. No accounts, no re-uploads, no tracking of what you save.",
  },
];

Screens.onboarding = (st) => {
  const s = ONB[st.onbStep];
  return `<div class="app" style="padding:calc(var(--safe-t) + 6px) 0 0">
    <div class="between" style="padding:0 18px">
      <div class="appbar__brand"><span class="appbar__mark" aria-hidden="true">${SV.mark(19, "#fff")}</span><span class="appbar__name">SnapVid</span></div>
      <button class="btn btn--ghost btn--sm" data-act="onb-skip">Skip</button>
    </div>
    <div class="scroll scroll--plain" style="padding-top:18px">
      <div class="onb-art" style="animation:pop 520ms var(--e-out) both">${s.art}</div>
      <div class="mt-6" aria-live="polite">
        <p class="t-label">Step ${st.onbStep + 1} of 3</p>
        <h1 class="t-h2 mt-3">${s.title}</h1>
        <p class="t-body mt-3">${s.body}</p>
      </div>
      <div class="dots mt-6">
        ${ONB.map((_, i) => `<i data-act="onb-dot" data-i="${i}" data-on="${i === st.onbStep ? 1 : 0}"></i>`).join("")}
      </div>
    </div>
    <div style="padding:16px 18px calc(20px + var(--safe-b))">
      ${st.onbStep < 2
        ? `<button class="btn btn--primary btn--lg btn--block" data-act="onb-next">Continue ${SV.chev}</button>`
        : `<button class="btn btn--primary btn--lg btn--block" data-act="onb-done">${SV.download} Get started</button>`}
      <div class="mt-4">${policyNote("muted", POLICY.short)}</div>
    </div>
  </div>`;
};

/* ---------------------------------- HOME -------------------------------- */
function mrowCompact(d) {
  const v = H.vid(d.vid);
  return `<button class="row row--tap" data-act="open-file" style="gap:12px">
    <span style="width:74px;flex:none;border-radius:12px;overflow:hidden;border:1px solid var(--stroke);aspect-ratio:16/9;display:block">
      <img src="${IMG[v.thumb]}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy" /></span>
    <span class="row__txt">
      <span class="row__title" style="font-size:14.5px">${H.esc(v.title.split(" — ")[0])}</span>
      <span class="t-xs row__sub">${d.q} · ${d.size} · ${d.time}</span></span>
    <span class="row__chev" aria-hidden="true">${SV.eye}</span>
  </button>`;
}

Screens.home = (st) => {
  const busy = st.busy;
  const invalid = st.fieldError;
  return `<div class="app">
  ${appbar({ brand: true })}
  <div class="scroll scr-home">
    <section class="hero">
      <h2>Download videos.<br /> <span class="hero__grad">Your way.</span></h2>
      <p class="mt-3">Paste a supported video link and choose your preferred quality.</p>
    </section>

    <section class="card card--pad mt-6">
      <div class="field ${invalid ? "field--error" : ""}">
        <span class="field__ico" aria-hidden="true">${SV.chain}</span>
        <label class="sv-sr" for="urlInput">Video URL</label>
        <input id="urlInput" type="text" inputmode="url" enterkeyhint="go" autocomplete="off" spellcheck="false"
          placeholder="Paste video URL" value="${H.esc(st.url)}" data-act="url-input" aria-describedby="urlHelp" aria-invalid="${invalid ? "true" : "false"}" />
        ${st.url ? `<button class="btn btn--icon btn--ghost" data-act="clear-url" aria-label="Clear link">${SV.x}</button>` : ""}
        <button class="btn btn--sm" data-act="paste" style="background:var(--surface);min-height:44px">${SV.clipboard} Paste</button>
      </div>
      <p class="t-xs mt-3" id="urlHelp" style="${invalid ? "color:var(--sv-danger);display:flex;gap:6px;align-items:center" : ""}">
        ${invalid ? `${SV.alert} That doesn't look like a video link. Links start with https://` : "Works with links from sources that allow downloading."}
      </p>

      <button class="btn btn--primary btn--lg btn--block mt-4" data-act="analyze" ${busy ? "disabled" : ""}>
        ${busy
          ? `<span class="ringlet" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><circle class="tr" cx="12" cy="12" r="9" fill="none"/><circle class="fl" cx="12" cy="12" r="9" fill="none"/></svg></span> Analyzing…`
          : `${SV.download} Analyze Video`}
      </button>

      ${invalid ? `<div class="banner banner--danger mt-4" role="alert">
          <span class="banner__ico" aria-hidden="true">${SV.alert}</span>
          <div><p class="banner__t">We couldn't process this link.</p><p class="banner__d">Check the URL or try another supported source.</p></div>
        </div>` : ""}
    </section>

    <section class="mt-5">
      <div class="sources" aria-hidden="true">
        ${[SV.cloud, SV.shield, SV.globe, SV.film, SV.layers].map((ic) => `<span class="source-chip">${ic}</span>`).join("")}
      </div>
      <p class="t-sm mt-3">Supports compatible video sources</p>
      <p class="t-xs mt-2">SnapVid only processes videos you're authorized to download or that the source explicitly permits. DRM‑protected, paywalled and login‑only media can't be processed.</p>
    </section>

    <div class="sec-head"><span class="sec-head__t">Recent</span><button class="sec-head__a" data-act="tab-library">See all</button></div>
    <section class="inset-card" style="padding:6px 12px">
      ${DOWNLOADS.slice(0, 2).map(mrowCompact).join("")}
    </section>

    <section class="mt-6">${policyNote("muted", POLICY.short, { act: "open-policy", label: "How it works" })}</section>
  </div>
  ${tabbar("home")}
  ${st.toast ? toast(st.toast) : ""}
</div>`;
};

/* -------------------------------- ANALYZE ------------------------------- */
Screens.analyze = (st) => `<div class="app">
  ${appbar({ title: "Analyzing link", back: true })}
  <div class="scroll" aria-busy="true">
    <div class="sk" style="aspect-ratio:16/9;border-radius:var(--r-xl);display:grid;place-items:center">
      <span aria-hidden="true" style="width:34px;height:34px;display:block;border-radius:50%;border:2.6px solid var(--stroke-strong);border-top-color:var(--sv-accent);animation:spin 900ms linear infinite"></span>
    </div>
    <div class="mt-5 stack gap-3">
      <div class="sk" style="height:20px;width:86%"></div>
      <div class="sk" style="height:20px;width:54%"></div>
    </div>
    <p class="t-sm mt-5" style="min-height:22px;color:var(--text)" aria-live="polite">${st.analyzeStage || "Reading link…"}</p>
    <div class="inset-card mt-4" style="padding:6px 14px">
      ${[["Reading link", 1], ["Checking source permission", st.analyzeStep > 0 ? 1 : 0], ["Fetching available formats", st.analyzeStep > 1 ? 1 : 0]]
        .map(([label, done]) => `<div class="row" style="min-height:52px">
          <span class="row__ico" style="width:30px;height:30px;border-radius:9px;${done ? "background:var(--sv-ok-soft);border-color:transparent;color:var(--sv-ok)" : "color:var(--text-3)"}">${done ? SV.check : SV.clock}</span>
          <span class="row__txt"><span class="row__title" style="font-size:14.5px;color:${done ? "var(--text)" : "var(--text-3)"}">${label}</span></span>
        </div>`).join("")}
    </div>
    <div class="mt-6">${policyNote("muted", "Only sources that allow downloading can be processed.")}</div>
  </div>
  <div style="padding:12px 18px calc(20px + var(--safe-b))">
    <button class="btn btn--outline btn--block" data-act="cancel-analyze">Cancel</button>
  </div>
</div>`;

/* -------------------------------- PREVIEW ------------------------------- */
Screens.preview = (st) => {
  const v = H.vid(st.videoId);
  const q = v.formats.find((f) => f.id === st.quality) || v.formats[1];
  return `<div class="app">
  ${appbar({ title: "Video details", back: true, right: `<button class="btn btn--icon btn--ghost" data-act="toast-copied" aria-label="More options">${SV.dots}</button>` })}
  <div class="scroll">
    ${thumb(v.id, { play: true, eager: true, scrim: true, leftTop: `<span class="badge badge--solid">${q.label}</span>` })}
    <h1 class="t-h3 mt-5" style="font-size:21px;line-height:1.25">${H.esc(v.title)}</h1>
    <div class="center gap-3 mt-4">
      <span aria-hidden="true" style="width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:15px;background:var(--accent-soft);color:var(--accent-text);border:1px solid var(--sv-accent-ring)">${H.esc(v.source[0])}</span>
      <span>
        <span class="row__title">${H.esc(v.source)}</span>
        <span class="t-xs row__sub">${H.esc(v.handle)} · ${H.esc(v.stats)}</span>
      </span>
    </div>

    <div class="center gap-2 wrap mt-4">
      <span class="badge">${SV.clock} ${v.dur}</span>
      <span class="badge">${SV.film} ${v.formats.length} formats</span>
      <span class="badge">${SV.download} up to ${v.formats[0].size}</span>
      <span class="badge badge--ok">${SV.check} Downloads allowed</span>
    </div>

    <div class="banner banner--info mt-4">
      <span class="banner__ico" aria-hidden="true">${SV.shield}</span>
      <div>
        <p class="banner__t" style="color:var(--text)">This source permits downloads</p>
        <p class="banner__d">${H.esc(v.license)}. SnapVid verifies permission before processing.</p>
      </div>
    </div>

    <div class="sec-head"><span class="sec-head__t">File information</span></div>
    <div class="inset-card" style="padding:4px 14px">
      ${[["Video container", "MP4 (H.264 / H.265)"], ["Audio track", "M4A · AAC 192 kbps"], ["Highest available", v.formats[0].label + " · " + v.formats[0].size], ["Duration", v.dur], ["Subtitles", "English · .srt available"]]
        .map(([k, val]) => `<div class="row" style="min-height:50px"><span class="row__txt"><span class="t-sm" style="color:var(--text)">${k}</span></span><span class="t-sm mono-num" style="color:var(--text-2);text-align:right">${val}</span></div>`).join("")}
    </div>

    <div class="mt-6">${policyNote("muted", "Keep downloads for personal use unless the licence says otherwise.")}</div>
  </div>
  <div style="padding:12px 18px calc(20px + var(--safe-b));background:linear-gradient(180deg,transparent,var(--bg) 42%)">
    <button class="btn btn--primary btn--lg btn--block" data-act="open-quality">${SV.download} Choose quality</button>
    <button class="btn btn--ghost btn--block mt-2" data-act="open-quality">More options</button>
  </div>
  ${st.toast ? toast(st.toast) : ""}
</div>`;
};

/* ---------------------------- QUALITY SHEET ----------------------------- */
function qualitySheet(st) {
  const v = H.vid(st.videoId);
  const sel = v.formats.find((f) => f.id === st.quality) || v.formats[1];
  return `<div class="sheet-wrap" role="dialog" aria-modal="true" aria-labelledby="qTitle">
    <div class="sheet-scrim" data-act="close-sheet"></div>
    <div class="sheet">
      <span class="sheet__grab" aria-hidden="true"></span>
      <div class="between" style="padding:0 2px 4px">
        <div>
          <h2 class="t-h3" id="qTitle">Select quality</h2>
          <p class="t-xs mt-2">${H.esc(v.source)} · ${v.dur}</p>
        </div>
        <button class="btn btn--icon btn--ghost" data-act="close-sheet" aria-label="Close quality selection">${SV.x}</button>
      </div>

      <div class="sheet__scroll mt-3" role="radiogroup" aria-labelledby="qTitle">
        <div class="qlist">
          ${v.formats.map((f) => `<button class="qopt" role="radio" aria-checked="${f.id === st.quality}" data-act="select-q" data-q="${f.id}">
            <span class="grow">
              <span class="qopt__top">
                <span class="qopt__res">${f.label}${f.badge ? `<span class="badge" style="height:20px;margin-left:6px;vertical-align:1px">${f.badge}</span>` : ""}</span>
                <span class="qopt__size">${f.size}</span>
              </span>
              <span class="qopt__meta">
                <span class="t-xs" style="flex:none">${f.fmt}</span><span class="t-xs" style="color:var(--text-3);flex:none">·</span>
                <span class="t-xs">${f.meta}</span>
                ${f.tag ? `<span class="badge badge--accent" style="height:20px;flex:none">${f.tag}</span>` : ""}
              </span>
            </span>
            <span class="qopt__check" aria-hidden="true">${SV.check}</span>
          </button>`).join("")}
        </div>

        ${st.moreOptions ? `<div class="mt-4" style="animation:pop 320ms var(--e-out) both">
          <p class="t-label mb-4">More options</p>
          <div class="inset-card" style="padding:4px 14px">
            <div class="row"><span class="row__txt"><span class="row__title" style="font-size:14.5px">Include subtitles</span><span class="t-xs row__sub">English (.srt)</span></span>
              <span class="sw" role="switch" tabindex="0" aria-checked="true" aria-label="Include subtitles" data-act="toggle"></span></div>
            <div class="row"><span class="row__txt"><span class="row__title" style="font-size:14.5px">Embed cover art</span><span class="t-xs row__sub">For audio files</span></span>
              <span class="sw" role="switch" tabindex="0" aria-checked="false" aria-label="Embed cover art" data-act="toggle"></span></div>
            <button class="row row--tap" data-act="toast-location" style="min-height:52px"><span class="row__txt"><span class="row__title" style="font-size:14.5px">Save to</span><span class="t-xs row__sub">Files ▸ SnapVid</span></span><span class="row__chev" aria-hidden="true">${SV.chev}</span></button>
            <button class="row row--tap" data-act="toast-copied" style="min-height:52px"><span class="row__txt"><span class="row__title" style="font-size:14.5px">File name</span><span class="t-xs row__sub">${H.esc(v.title.split(" — ")[0].slice(0, 32))}…</span></span><span class="row__chev" aria-hidden="true">${SV.edit}</span></button>
          </div>
        </div>` : ""}
      </div>

      <div style="padding-top:14px;border-top:1px solid var(--stroke);margin-top:12px">
        <button class="btn btn--primary btn--lg btn--block" data-act="start-download">${SV.download} Download ${sel.label}</button>
        <button class="btn btn--ghost btn--block mt-2" data-act="toggle-more" aria-expanded="${st.moreOptions}">${st.moreOptions ? "Fewer options" : "More options"}</button>
      </div>
    </div>
  </div>`;
}
