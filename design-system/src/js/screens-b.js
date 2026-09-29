/* ==========================================================================
   SnapVid — screens part B: progress, complete, library, settings, states,
   desktop website
   ========================================================================== */

/* ------------------------------- PROGRESS -------------------------------- */
Screens.progress = (st) => {
  const v = H.vid(st.videoId);
  const f = v.formats.find((x) => x.id === st.quality) || v.formats[1];
  const total = parseFloat(f.size);
  const done = (total * st.progress) / 100;
  const pct = Math.round(st.progress);
  return `<div class="app">
  ${appbar({ title: "Downloading", right: `<button class="btn btn--icon btn--ghost" data-act="cancel-download" aria-label="Cancel download">${SV.x}</button>` })}
  <div class="scroll" style="padding-bottom:calc(140px + var(--safe-b))">
    <div class="split">
      <div>
        ${thumb(v.id, { leftTop: `<span class="badge badge--solid">${f.label}</span>`, leftBottom: `<span class="badge" data-live="state" style="background:rgba(6,7,10,.72);color:#fff;border-color:rgba(255,255,255,.16)">${st.paused ? "Paused" : "Downloading"}</span>` })}
        <h1 class="t-h3 mt-4" style="font-size:17px;line-height:1.32">${H.esc(v.title)}</h1>
        <p class="t-xs mt-2">${H.esc(v.source)} · ${f.fmt}</p>
      </div>

      <div class="stack" style="align-items:center;gap:16px;padding-top:6px">
        ${ring(pct)}
        <div style="text-align:center">
          <p class="t-sm mono-num" style="color:var(--text);font-weight:600" data-live="size">${done.toFixed(1)} MB <span style="color:var(--text-3)">of ${f.size}</span></p>
          <p class="t-xs mt-2" aria-live="polite" data-live="eta">${st.paused ? "Paused · tap Resume to continue" : `About ${st.etaTxt} remaining · ${st.speed} MB/s`}</p>
        </div>
      </div>
    </div>

    <div class="inset-card mt-5" style="padding:14px">
      <div class="bar"><div class="bar__fill" data-live="bar" style="width:${pct}%"></div></div>
      <div class="between mt-4">
        <span class="t-xs" style="color:${pct > 0 ? "var(--text)" : "var(--text-3)"}">Fetching</span>
        <span class="t-xs" style="color:${pct > 12 ? "var(--text)" : "var(--text-3)"}">Transferring</span>
        <span class="t-xs" style="color:${pct > 92 ? "var(--text)" : "var(--text-3)"}">Saving</span>
      </div>
    </div>

    <div class="mt-5">${policyNote("muted", `Permission verified for ${H.esc(v.source)}. The file stays on this device.`)}</div>
  </div>
  <div style="padding:12px 18px calc(20px + var(--safe-b));background:linear-gradient(180deg,transparent,var(--bg) 42%)">
    <div class="center gap-3">
      <button class="btn btn--primary btn--lg grow" data-act="${st.paused ? "resume" : "pause"}">${st.paused ? SV.play : SV.pause} ${st.paused ? "Resume" : "Pause"}</button>
      <button class="btn btn--lg" data-act="cancel-download">${SV.x} Cancel</button>
    </div>
  </div>
</div>`;
};

/* ------------------------------- COMPLETE -------------------------------- */
Screens.complete = (st) => {
  const v = H.vid(st.videoId);
  const f = v.formats.find((x) => x.id === st.quality) || v.formats[1];
  return `<div class="app">
  ${appbar({ title: "Saved", right: `<button class="btn btn--icon btn--ghost" data-act="tab-home" aria-label="Close">${SV.x}</button>` })}
  <div class="scroll" style="display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:14px;padding-bottom:calc(40px + var(--safe-b))" role="status">
    ${checkAnimated(96)}
    <h1 class="t-h2 mt-5">Download complete</h1>
    <p class="t-body mt-3" style="max-width:32ch">${H.esc(v.title)}</p>

    <div class="inset-card mt-5" style="width:100%;padding:4px 14px;text-align:left">
      <div class="row"><span class="row__txt"><span class="t-xs">Quality</span><span class="row__title" style="font-size:14.5px">${f.label} · ${f.fmt}</span></span><span class="badge badge--ok">${SV.check} Verified</span></div>
      <div class="row"><span class="row__txt"><span class="t-xs">File size</span><span class="row__title" style="font-size:14.5px">${f.size}</span></span></div>
      <div class="row"><span class="row__txt"><span class="t-xs">Saved to</span><span class="row__title" style="font-size:14.5px">Files ▸ SnapVid</span></span><span class="row__chev" aria-hidden="true">${SV.folder}</span></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;margin-top:22px">
      <button class="btn btn--primary btn--lg" data-act="toast-opened">${SV.external} Open</button>
      <button class="btn btn--lg" data-act="toast-shared">${SV.share} Share</button>
    </div>
    <button class="btn btn--ghost btn--block mt-2" data-act="tab-home">${SV.plus} Download another</button>

    <div class="mt-5" style="width:100%">${policyNote("muted", "Shared files keep their original licence terms.")}</div>
  </div>
  ${st.toast ? toast(st.toast) : ""}
</div>`;
};

/* -------------------------------- LIBRARY -------------------------------- */
function mrowItem(d, i, openMenu) {
  const v = H.vid(d.vid);
  return `<div class="mrow" style="padding:14px 0;border-bottom:1px solid var(--stroke)">
    <span class="mrow__thumb">
      <img src="${IMG[v.thumb]}" alt="" loading="lazy" />
      <span class="badge badge--solid" style="position:absolute;left:6px;top:6px;height:20px;font-size:10.5px;padding:0 7px">${d.q}</span>
    </span>
    <span class="mrow__body">
      <span class="mrow__title">${H.esc(v.title)}</span>
      <span class="mrow__meta">
        <span class="t-xs">${d.fmt}</span><span class="t-xs" style="color:var(--text-3)">·</span>
        <span class="t-xs">${d.size}</span><span class="t-xs" style="color:var(--text-3)">·</span>
        <span class="t-xs">${d.time}</span>
      </span>
    </span>
    <button class="btn btn--icon btn--ghost" data-act="row-menu" data-i="${i}"
      aria-label="More actions for ${H.esc(v.title)}" aria-haspopup="menu" aria-expanded="${openMenu}">${SV.dots}</button>
  </div>`;
}

function rowMenu(d) {
  return `<div style="position:absolute;inset:0;z-index:45">
    <div class="sheet-scrim" data-act="close-menu"></div>
    <div class="card" role="menu" aria-label="File actions"
      style="position:absolute;right:16px;top:32%;width:228px;padding:8px;background:var(--glass-2);animation:pop 200ms var(--e-out) both">
      <p class="t-xs" style="padding:6px 10px 8px;border-bottom:1px solid var(--stroke);margin-bottom:6px">${H.esc(H.vid(d.vid).title.slice(0, 30))}…</p>
      ${[["Open", SV.external, "toast-opened"], ["Share", SV.share, "toast-shared"], ["Rename", SV.edit, "toast-renamed"], ["Delete", SV.trash, "confirm-delete"]]
        .map(([l, ic, act]) => `<button class="row row--tap" role="menuitem" data-act="${act}" style="min-height:46px;padding:0 10px;border-bottom:0;${l === "Delete" ? "color:var(--sv-danger)" : ""}">
          <span aria-hidden="true" style="display:inline-flex;color:${l === "Delete" ? "var(--sv-danger)" : "var(--text-3)"}">${ic}</span>
          <span class="grow" style="font-size:15px">${l}</span></button>`).join("")}
    </div>
  </div>`;
}

Screens.library = (st) => {
  const list = st.libEmpty ? [] : DOWNLOADS;
  const q = (st.libQuery || "").toLowerCase();
  const filtered = list.filter((d) => {
    const v = H.vid(d.vid);
    const matchQ = !q || v.title.toLowerCase().includes(q) || d.q.toLowerCase().includes(q) || d.fmt.toLowerCase().includes(q);
    const matchF = st.libFilter === "all" || (st.libFilter === "audio" ? d.fmt === "M4A" : d.fmt === "MP4");
    return matchQ && matchF;
  });
  const groups = ["Today", "Yesterday", "Older"];
  return `<div class="app">
  ${appbar({ title: "Downloads", right: `<button class="btn btn--icon btn--ghost" data-act="focus-search" aria-label="Search downloads">${SV.search}</button>` })}
  <div class="scroll">
    <div class="field" style="min-height:52px">
      <span class="field__ico" aria-hidden="true">${SV.search}</span>
      <label class="sv-sr" for="libSearch">Search downloads</label>
      <input id="libSearch" type="text" placeholder="Search downloads" value="${H.esc(st.libQuery || "")}" data-act="lib-search" enterkeyhint="search" />
      ${st.libQuery ? `<button class="btn btn--icon btn--ghost" data-act="clear-search" aria-label="Clear search">${SV.x}</button>` : ""}
    </div>
    <div class="center gap-2 wrap mt-4">
      ${[["all", "All"], ["video", "Video"], ["audio", "Audio"]].map(([k, l]) => `<button class="badge" data-act="lib-filter" data-f="${k}"
        aria-pressed="${st.libFilter === k}" style="height:32px;${st.libFilter === k ? "background:var(--accent-soft);border-color:var(--sv-accent-ring);color:var(--accent-text)" : ""}">${l}</button>`).join("")}
      <button class="badge" data-act="toast-sorted" style="height:32px;margin-left:auto">${SV.order} Newest</button>
    </div>

    ${list.length === 0
      ? `<div class="mt-6">${stateBlock(EMPTIES.library, { primaryAct: "tab-home", secondaryAct: "toast-how" })}</div>`
      : filtered.length === 0
        ? `<div class="mt-6">${stateBlock(EMPTIES.search, { primaryAct: "clear-search" })}</div>`
        : groups.map((g) => {
            const items = filtered.filter((d) => d.group === g);
            if (!items.length) return "";
            return `<div class="sec-head"><span class="sec-head__t">${g}</span><span class="t-xs">${items.length} file${items.length > 1 ? "s" : ""}</span></div>
              <section>${items.map((d) => mrowItem(d, DOWNLOADS.indexOf(d), st.libMenu === DOWNLOADS.indexOf(d))).join("")}</section>`;
          }).join("")}

    ${st.libEmpty ? "" : `<div class="mt-6">${policyNote("muted", "Files are stored locally. Clearing history never deletes the files themselves.")}</div>`}
  </div>
  ${st.libMenu >= 0 ? rowMenu(DOWNLOADS[st.libMenu]) : ""}
  ${tabbar("library")}
  ${st.toast ? toast(st.toast) : ""}
</div>`;
};

/* ------------------------------- SETTINGS -------------------------------- */
function srow({ title, sub, right, act, ico, tone }) {
  return `<button class="row row--tap" data-act="${act || "noop"}" style="min-height:56px">
    ${ico ? `<span class="row__ico ${tone === "accent" ? "row__ico--accent" : ""}" aria-hidden="true">${SV[ico]}</span>` : ""}
    <span class="row__txt"><span class="row__title" style="${tone === "danger" ? "color:var(--sv-danger)" : ""}">${title}</span>${sub ? `<span class="t-xs row__sub">${sub}</span>` : ""}</span>
    ${right || `<span class="row__chev" aria-hidden="true">${SV.chev}</span>`}
  </button>`;
}

function switchRow({ title, sub, checked, act }) {
  return `<div class="row" style="min-height:56px">
    <span class="row__txt"><span class="row__title">${title}</span>${sub ? `<span class="t-xs row__sub">${sub}</span>` : ""}</span>
    <span class="sw" role="switch" tabindex="0" aria-checked="${checked}" aria-label="${title}" data-act="${act}"></span>
  </div>`;
}

Screens.settings = (st) => `<div class="app">
  ${appbar({ title: "Settings", right: `<button class="btn btn--icon btn--ghost" data-act="toast-help" aria-label="Help">${SV.info}</button>` })}
  <div class="scroll">
    <div class="card card--pad center gap-4">
      <span aria-hidden="true" style="width:48px;height:48px;border-radius:50%;display:grid;place-items:center;font-weight:700;color:#fff;background:linear-gradient(150deg,#3b4250,#1e2229);box-shadow:inset 0 0 0 1px var(--stroke-strong)">AR</span>
      <div class="grow"><p class="row__title">Ayesha Rahman</p><p class="t-xs mt-2">Local profile · no account needed</p></div>
      <span class="badge badge--accent">Pro</span>
    </div>

    <div class="sec-head"><span class="sec-head__t">Appearance</span></div>
    <div class="card card--pad" style="padding:14px">
      <div class="seg" role="tablist" aria-label="Appearance">
        <span class="seg__thumb" style="width:calc((100% - 6px)/3);transform:translateX(calc(${["dark", "light", "system"].indexOf(st.themePref)} * 100%))"></span>
        ${[["dark", "Dark", SV.moon], ["light", "Light", SV.sun], ["system", "System", SV.monitor]]
          .map(([k, l, ic]) => `<button role="tab" data-act="set-theme" data-v="${k}" aria-selected="${st.themePref === k}">
            <span aria-hidden="true" style="display:inline-flex;vertical-align:-4px;margin-right:6px">${ic}</span>${l}</button>`).join("")}
      </div>
      <p class="t-xs mt-4">Dark mode is the default. System follows your device setting automatically.</p>
    </div>

    <div class="sec-head"><span class="sec-head__t">Download</span></div>
    <div class="card" style="padding:2px 14px">
      ${srow({ title: "Default quality", sub: "Used when a source offers several options", act: "cycle-quality", right: `<span class="center gap-2 t-sm" style="color:var(--text-2)">${st.set.defaultQuality}p ${SV.chev}</span>` })}
      ${srow({ title: "Default format", sub: "Where the source supports it", act: "cycle-format", right: `<span class="center gap-2 t-sm" style="color:var(--text-2)">${st.set.defaultFormat} ${SV.chev}</span>` })}
      ${switchRow({ title: "Wi‑Fi only", sub: "Queue downloads until you're on Wi‑Fi", checked: st.set.wifiOnly, act: "toggle-wifi" })}
      ${srow({ title: "Auto-download", sub: st.set.autoDownload === "ask" ? "Ask me each time" : st.set.autoDownload === "always" ? "Start right after analysis" : "Only when I tap download", act: "cycle-auto", right: `<span class="center gap-2 t-sm" style="color:var(--text-2)">${st.set.autoDownload === "ask" ? "Ask" : st.set.autoDownload === "always" ? "Always" : "Never"} ${SV.chev}</span>` })}
      ${srow({ title: "Download location", sub: "Files ▸ SnapVid · 4.2 GB used", act: "toast-location", right: `<span class="center gap-2 t-sm" style="color:var(--accent-text)">Change ${SV.chev}</span>` })}
    </div>
    <p class="t-xs mt-3" style="padding:0 4px">On iPhone and Android, files are saved to SnapVid's own folder. Move them to your camera roll or cloud drive from the Downloads tab.</p>

    <div class="sec-head"><span class="sec-head__t">General</span></div>
    <div class="card" style="padding:2px 14px">
      ${srow({ title: "Language", act: "cycle-language", right: `<span class="center gap-2 t-sm" style="color:var(--text-2)">${st.set.language} ${SV.chev}</span>` })}
      ${switchRow({ title: "Notifications", sub: "Completion and failure alerts", checked: st.set.notifications, act: "toggle-notif" })}
      ${srow({ title: "Clear download history", sub: "Removes records · keeps your files", tone: "danger", act: "confirm-clear" })}
      ${srow({ title: "About SnapVid", sub: "Version 2.4.0 · Build 318", act: "toast-about" })}
    </div>

    <div class="sec-head"><span class="sec-head__t">Privacy</span></div>
    <div class="card" style="padding:2px 14px">
      ${srow({ title: "Privacy information", sub: "What we store and what we don't", ico: "shield", act: "open-privacy" })}
      ${srow({ title: "Data usage", sub: "Processing is server-side; files go straight to you", ico: "chart", act: "open-privacy" })}
      ${srow({ title: "Supported-source policy", sub: "How SnapVid decides what to process", ico: "info", act: "open-policy" })}
    </div>

    <div class="banner banner--info mt-5">
      <span class="banner__ico" aria-hidden="true">${SV.lock}</span>
      <div>
        <p class="banner__t" style="color:var(--text)">Downloads you're allowed to make</p>
        <p class="banner__d">${POLICY.long}</p>
      </div>
    </div>

    <p class="t-xs mt-5" style="text-align:center">SnapVid 2.4.0 · Made for creators and their audiences</p>
  </div>
  ${tabbar("settings")}
  ${st.toast ? toast(st.toast) : ""}
</div>`;

/* ------------------------------ ERROR STATES ----------------------------- */
Screens.errors = (st) => {
  const keys = Object.keys(ERRORS);
  const cur = st.errorKey || "invalid";
  const primary = ERRORS[cur];
  const rest = keys.filter((k) => k !== cur).map((k) => ERRORS[k]);
  const col = { warn: ["var(--sv-warn)", "var(--sv-warn-soft)"], danger: ["var(--sv-danger)", "var(--sv-danger-soft)"], info: ["var(--sv-info)", "var(--sv-info-soft)"] }[primary.tone];
  return `<div class="app">
  ${appbar({ title: "Error states", back: true, right: `<span class="badge">${keys.length} patterns</span>` })}
  <div class="scroll">
    <div class="banner banner--info">
      <span class="banner__ico" aria-hidden="true">${SV.info}</span>
      <div>
        <p class="banner__t" style="color:var(--text)">Every failure answers three questions</p>
        <p class="banner__d">What happened · why it happened · what to do next. Recovery is always the first action, and no link dead-ends.</p>
      </div>
    </div>

    <div class="center gap-2 wrap mt-5">
      ${keys.map((k) => `<button class="badge" data-act="set-error" data-e="${k}" style="height:32px;${k === cur ? "background:var(--accent-soft);border-color:var(--sv-accent-ring);color:var(--accent-text)" : ""}">${ERRORS[k].code}</button>`).join("")}
    </div>

    <div class="card card--pad mt-4" style="text-align:center;padding:32px 20px" role="alert">
      <span class="row__ico" style="margin:0 auto;width:54px;height:54px;border-radius:17px;background:${col[1]};border-color:transparent;color:${col[0]}">${SV[primary.icon]}</span>
      <h2 class="t-h3 mt-4">${primary.title}</h2>
      <p class="t-sm mt-3" style="max-width:34ch;margin-inline:auto">${primary.body}</p>
      <div class="center gap-3 wrap" style="justify-content:center;margin-top:22px">
        <button class="btn btn--primary" data-act="retry-analyze">${primary.actions[0]}</button>
        <button class="btn btn--outline" data-act="toast-dismissed">${primary.actions[1] || "Dismiss"}</button>
      </div>
      ${primary.hint ? `<p class="t-xs mt-4">${primary.hint}</p>` : ""}
    </div>

    <div class="sec-head"><span class="sec-head__t">Inline &amp; banner patterns</span></div>
    <div class="stack gap-3">
      <div class="field field--error" style="min-height:56px">
        <span class="field__ico" aria-hidden="true">${SV.chain}</span>
        <input value="htp:/broken link" aria-invalid="true" aria-label="Video URL with an error" readonly />
        <button class="btn btn--sm" data-act="clear-url" style="min-height:40px">Clear</button>
      </div>
      <p class="t-xs" style="color:var(--sv-danger);display:flex;gap:6px;align-items:center">${SV.alert} Check the URL or try another supported source.</p>
      <div class="banner banner--warn" role="alert">
        <span class="banner__ico" aria-hidden="true">${SV.alert}</span>
        <div><p class="banner__t">Waiting for Wi‑Fi</p><p class="banner__d">This 412 MB download is paused and resumes automatically on a Wi‑Fi network.</p></div>
      </div>
      <div class="banner banner--danger" role="alert">
        <span class="banner__ico" aria-hidden="true">${SV.alert}</span>
        <div class="grow"><p class="banner__t">Download interrupted</p><p class="banner__d">Connection lost at 62%. Retry continues from where it stopped.</p></div>
        <button class="btn btn--sm" data-act="resume">Retry</button>
      </div>
      <div class="toast" style="position:static;transform:none;animation:none;justify-content:center;white-space:normal;text-align:center">
        <span style="color:var(--sv-danger);display:inline-flex" aria-hidden="true">${SV.alert}</span> File generation failed · tap to retry
      </div>
    </div>

    <div class="sec-head"><span class="sec-head__t">All other states</span></div>
    <div class="stack gap-3">${rest.map((e) => errorCard(e)).join("")}</div>
    <div class="mt-6">${policyNote("warn", "Errors never suggest bypassing DRM, logins or platform limits.", { act: "open-policy", label: "Policy" })}</div>
  </div>
  ${st.toast ? toast(st.toast) : ""}
</div>`;
};

/* ------------------------------ EMPTY STATES ----------------------------- */
Screens.empty = (st) => {
  const keys = Object.keys(EMPTIES);
  const cur = st.emptyKey || "library";
  const e = EMPTIES[cur];
  const others = keys.filter((k) => k !== cur).map((k) => EMPTIES[k]);
  return `<div class="app">
  ${appbar({ title: "Empty states", back: true, right: `<span class="badge">${keys.length} states</span>` })}
  <div class="scroll">
    <div class="banner banner--info">
      <span class="banner__ico" aria-hidden="true">${SV.info}</span>
      <div><p class="banner__t" style="color:var(--text)">Empty is still useful</p>
      <p class="banner__d">Each empty state names the situation, explains what will appear, and offers exactly one primary action.</p></div>
    </div>

    <div class="center gap-2 wrap mt-5">
      ${keys.map((k) => `<button class="badge" data-act="set-empty" data-e="${k}" style="height:32px;${k === cur ? "background:var(--accent-soft);border-color:var(--sv-accent-ring);color:var(--accent-text)" : ""}">${EMPTIES[k].title}</button>`).join("")}
    </div>

    <div class="card mt-4" style="padding:8px 16px 20px">${stateBlock(e, { primaryAct: "primary-empty", secondaryAct: "toast-how" })}</div>

    <div class="sec-head"><span class="sec-head__t">Other states</span></div>
    <div class="stack gap-3">
      ${others.map((o) => `<div class="card" style="padding:6px 16px 18px">${stateBlock(o, { primaryAct: "primary-empty", secondaryAct: "toast-how" })}</div>`).join("")}
    </div>

    <div class="sec-head"><span class="sec-head__t">Library, in context</span></div>
    <div class="inset-card" style="padding:6px 14px">
      ${stateBlock(EMPTIES.library, { primaryAct: "tab-home" })}
    </div>
    <div class="mt-6">${policyNote("muted", "Nothing is uploaded to SnapVid — an empty library means an empty server too.")}</div>
  </div>
  ${tabbar("library")}
</div>`;
};

/* --------------------------- DESKTOP (WEBSITE) --------------------------- */
function siteNav(st, active) {
  return `<nav class="site__nav">
    <div class="center gap-3">
      <span class="appbar__mark" style="width:36px;height:36px;border-radius:11px" aria-hidden="true">${SV.mark(20, "#fff")}</span>
      <span class="site__word">SnapVid</span>
    </div>
    <div class="site__links">
      ${[["home", "Home"], ["library", "Downloads"], ["settings", "Settings"]]
        .map(([k, l]) => `<button data-act="site-${k}" ${active === k ? 'aria-current="page"' : ""}>${l}</button>`).join("")}
    </div>
    <div class="center gap-3" style="margin-left:auto">
      ${st.siteLibOpen ? `<div class="field" style="min-height:40px;max-width:260px;border-radius:var(--r-pill);padding-left:14px">
        <span class="field__ico" aria-hidden="true">${SV.search}</span>
        <input placeholder="Search downloads" aria-label="Search downloads" style="height:36px;font-size:14px" />
      </div>` : ""}
      <div class="seg" style="width:210px" role="tablist" aria-label="Appearance">
        <span class="seg__thumb" style="width:calc((100% - 6px)/3);transform:translateX(calc(${["dark", "light", "system"].indexOf(st.themePref)} * 100%))"></span>
        ${[["dark", "Dark"], ["light", "Light"], ["system", "Auto"]]
          .map(([k, l]) => `<button role="tab" data-act="set-theme" data-v="${k}" aria-selected="${st.themePref === k}" style="height:34px;font-size:13.5px">${l}</button>`).join("")}
      </div>
      <button class="btn btn--icon btn--sm" data-act="toast-help" aria-label="Help and profile" style="min-width:40px;height:40px">
        <span aria-hidden="true" style="width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:680;color:#fff;background:linear-gradient(150deg,#3b4250,#1e2229)">AR</span>
      </button>
    </div>
  </nav>`;
}

Screens.desktop = (st) => {
  const v = H.vid(st.videoId);
  const sel = v.formats.find((f) => f.id === st.quality) || v.formats[1];
  const page = st.sitePage || "home";
  let content = "";

  if (page === "home") {
    content = `<div class="site__inner">
      <div style="text-align:center;max-width:760px;margin:12px auto 34px" class="site-hero">
        <span class="badge badge--accent" style="height:30px">${SV.bolt} Snaps in seconds</span>
        <h1 class="mt-4">Download videos. <span class="hero__grad">Your way.</span></h1>
        <p class="t-body" style="margin-inline:auto">Paste a supported video link and choose your preferred quality — 4K down to audio, with file sizes up front.</p>
      </div>

      <div style="max-width:900px;margin:0 auto 26px" class="card card--pad">
        <div class="field">
          <span class="field__ico" aria-hidden="true">${SV.chain}</span>
          <label class="sv-sr" for="siteUrl">Video URL</label>
          <input id="siteUrl" placeholder="Paste video URL" value="${H.esc(st.url)}" data-act="url-input" />
          ${st.url ? `<button class="btn btn--icon btn--ghost" data-act="clear-url" aria-label="Clear link">${SV.x}</button>` : ""}
          <button class="btn btn--sm" data-act="paste" style="min-height:44px">${SV.clipboard} Paste</button>
          <button class="btn btn--primary btn--sm" data-act="analyze" style="min-height:44px;padding:0 22px">${st.busy ? "Analyzing…" : "Analyze Video"}</button>
        </div>
        <div class="between mt-3">
          <p class="t-xs">Works with sources that allow downloading · no DRM, no logins bypassed</p>
          <div class="center gap-2">${[SV.cloud, SV.shield, SV.globe, SV.film].map((ic) => `<span class="source-chip" style="width:28px;height:28px;border-radius:9px" aria-hidden="true">${ic}</span>`).join("")}</div>
        </div>
      </div>

      <div class="site-grid">
        <div class="stack gap-5">
          <div class="card site-card">
            <div class="between mb-4">
              <div><p class="t-label">Analyzed</p><h3 class="t-h3 mt-2">${H.esc(v.title)}</h3></div>
              <span class="badge badge--ok">${SV.check} Allowed</span>
            </div>
            ${thumb(v.id, { play: true, eager: true, scrim: true })}
            <div class="center gap-2 wrap mt-4">
              <span class="badge">${SV.clock} ${v.dur}</span>
              <span class="badge">${H.esc(v.source)}</span>
              <span class="badge">${SV.film} ${v.formats.length} formats</span>
              <span class="badge badge--accent">${sel.label} · ${sel.size}</span>
            </div>
            <p class="t-xs mt-4">${H.esc(v.license)}. SnapVid verified permission before offering these formats.</p>
          </div>

          <div class="card site-card">
            <p class="t-label">Recent downloads</p>
            <div class="site-lib mt-4">
              ${DOWNLOADS.slice(0, 3).map((d) => {
                const dv = H.vid(d.vid);
                return `<div class="inset-card" style="padding:10px;border-radius:var(--r-lg)">
                  <div style="border-radius:12px;overflow:hidden;position:relative;aspect-ratio:16/9">
                    <img src="${IMG[dv.thumb]}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:12px" loading="lazy" />
                    <span class="badge badge--solid" style="position:absolute;left:8px;top:8px;height:22px;font-size:11px">${d.q}</span>
                  </div>
                  <p class="row__title mt-3" style="font-size:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${H.esc(dv.title)}</p>
                  <p class="t-xs mt-2">${d.size} · ${d.time}</p>
                </div>`;
              }).join("")}
            </div>
          </div>
        </div>

        <div class="stack gap-5">
          <div class="card site-card">
            <div class="between">
              <div><p class="t-label">Quality</p><h3 class="t-h3 mt-2">Choose a format</h3></div>
              <span class="badge">${v.formats.length} options</span>
            </div>
            <div class="qlist mt-4" role="radiogroup" aria-label="Quality">
              ${v.formats.slice(0, 5).map((f) => `<button class="qopt" role="radio" aria-checked="${f.id === st.quality}" data-act="select-q" data-q="${f.id}">
                <span class="grow"><span class="qopt__top">
                  <span class="qopt__res">${f.label}${f.badge ? `<span class="badge" style="height:20px;margin-left:6px;vertical-align:1px">${f.badge}</span>` : ""}</span>
                  <span class="qopt__size">${f.size}</span></span>
                  <span class="qopt__meta"><span class="t-xs" style="flex:none">${f.fmt}</span>${f.tag ? `<span class="badge badge--accent" style="height:20px;flex:none">${f.tag}</span>` : ""}</span></span>
                <span class="qopt__check" aria-hidden="true">${SV.check}</span>
              </button>`).join("")}
            </div>
            <button class="btn btn--primary btn--lg btn--block mt-4" data-act="start-download">${SV.download} Download ${sel.label} · ${sel.size}</button>
          </div>

          <div class="card site-card">
            <p class="t-label">Active download</p>
            <div class="center gap-4 mt-4">
              ${ring(Math.round(st.progress), { size: 132, stroke: 10 })}
              <div class="grow">
                <p class="row__title" style="font-size:14.5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${H.esc(v.title)}</p>
                <p class="t-xs mt-2 mono-num">${((parseFloat(sel.size) * st.progress) / 100).toFixed(1)} MB of ${sel.size} · ${st.paused ? "Paused" : st.speed + " MB/s"}</p>
                <div class="center gap-2 mt-4">
                  <button class="btn btn--primary btn--sm grow" data-act="${st.paused ? "resume" : "pause"}">${st.paused ? "Resume" : "Pause"}</button>
                  <button class="btn btn--sm" data-act="cancel-download">Cancel</button>
                </div>
              </div>
            </div>
            <div class="bar mt-4"><div class="bar__fill" style="width:${Math.round(st.progress)}%"></div></div>
            <p class="t-xs mt-3">${st.paused ? "Paused by you" : `About ${st.etaTxt} remaining`} · Saved to Downloads ▸ SnapVid</p>
          </div>

          <div class="card site-card">
            <div class="between">
              <p class="t-label">Completed</p>
              <button class="t-xs" data-act="site-library" style="color:var(--accent-text);font-weight:620">Open library</button>
            </div>
            <div class="stack mt-3">
              ${DOWNLOADS.slice(0, 3).map((d) => {
                const dv = H.vid(d.vid);
                return `<div class="row" style="min-height:52px">
                  <span style="width:56px;flex:none;border-radius:10px;overflow:hidden;aspect-ratio:16/9;border:1px solid var(--stroke)">
                    <img src="${IMG[dv.thumb]}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy" /></span>
                  <span class="row__txt"><span class="row__title" style="font-size:14px">${H.esc(dv.title.split(" — ")[0])}</span>
                  <span class="t-xs row__sub">${d.q} · ${d.size} · ${d.time}</span></span>
                  <span class="badge badge--ok" style="height:22px">${SV.check}</span>
                </div>`;
              }).join("")}
            </div>
          </div>
        </div>
      </div>

      <div class="card site-card mt-6" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
        ${[["Sources that permit downloads", "We check each link against the publisher's download rules before anything is processed."],
           ["Nothing stored server-side", "Processing is temporary. Your files go straight to your device and stay there."],
           ["No DRM, no workarounds", "Paywalled, login-only or DRM-protected media is refused with a clear explanation."]]
          .map(([t, d]) => `<div class="center gap-3" style="align-items:flex-start">
            <span class="row__ico row__ico--accent" aria-hidden="true">${SV.shield}</span>
            <span><span class="row__title">${t}</span><span class="t-xs row__sub">${d}</span></span></div>`).join("")}
      </div>
    </div>`;
  }

  if (page === "library") {
    content = `<div class="site__inner">
      <div class="between mb-5">
        <div><p class="t-label">Library</p><h1 class="t-h2 mt-2">Your downloads</h1>
          <p class="t-body mt-3">${DOWNLOADS.length} files · 999 MB · stored on this device</p></div>
        <div class="center gap-3">
          <div class="field" style="min-height:44px;border-radius:var(--r-pill);padding-left:14px;width:280px">
            <span class="field__ico" aria-hidden="true">${SV.search}</span>
            <input placeholder="Search downloads" aria-label="Search downloads" style="height:38px;font-size:14.5px" />
          </div>
          <button class="btn btn--sm" style="height:44px">${SV.filter} Filter</button>
          <button class="btn btn--primary btn--sm" data-act="site-home" style="height:44px">${SV.plus} New download</button>
        </div>
      </div>
      ${["Today", "Yesterday", "Older"].map((g) => {
        const items = DOWNLOADS.filter((d) => d.group === g);
        if (!items.length) return "";
        return `<p class="t-label mt-6">${g}</p>
        <div class="site-lib mt-3">
          ${items.map((d) => {
            const dv = H.vid(d.vid);
            return `<div class="card site-card" style="padding:14px">
              <div style="border-radius:var(--r-md);overflow:hidden;position:relative;aspect-ratio:16/9">
                <img src="${IMG[dv.thumb]}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy" />
                <span class="badge badge--solid" style="position:absolute;left:8px;top:8px;height:22px">${d.q}</span>
                <span class="badge" style="position:absolute;right:8px;bottom:8px;height:22px;background:rgba(6,7,10,.72);color:#fff;border-color:rgba(255,255,255,.16)">${dv.dur}</span>
              </div>
              <p class="row__title mt-4" style="font-size:15px">${H.esc(dv.title)}</p>
              <p class="t-xs mt-2">${d.fmt} · ${d.size} · ${d.time}</p>
              <div class="center gap-2 mt-4">
                <button class="btn btn--sm" data-act="toast-opened" style="flex:1">${SV.external} Open</button>
                <button class="btn btn--sm" data-act="toast-shared" style="flex:1">${SV.share} Share</button>
                <button class="btn btn--icon btn--sm" data-act="confirm-delete" aria-label="Delete ${H.esc(dv.title)}" style="color:var(--sv-danger);min-width:40px;height:40px">${SV.trash}</button>
              </div>
            </div>`;
          }).join("")}
        </div>`;
      }).join("")}
      <div class="mt-6">${policyNote("muted", "Files stay on your device. Clearing history removes records only.")}</div>
    </div>`;
  }

  if (page === "settings") {
    content = `<div class="site__inner">
      <p class="t-label">Preferences</p>
      <h1 class="t-h2 mt-2">Settings</h1>
      <p class="t-body mt-3 mb-5">Appearance, download defaults, notifications and privacy — in four sections.</p>
      <div class="site-settings">
        <div class="stack gap-5">
          <div class="card site-card">
            <p class="t-label">Appearance</p>
            <div class="seg mt-4" role="tablist" aria-label="Appearance">
              <span class="seg__thumb" style="width:calc((100% - 6px)/3);transform:translateX(calc(${["dark", "light", "system"].indexOf(st.themePref)} * 100%))"></span>
              ${[["dark", "Dark"], ["light", "Light"], ["system", "System"]].map(([k, l]) => `<button role="tab" data-act="set-theme" data-v="${k}" aria-selected="${st.themePref === k}">${l}</button>`).join("")}
            </div>
            <p class="t-xs mt-4">Dark is the primary theme; light is a full alternative — every screen is designed for both.</p>
          </div>
          <div class="card site-card">
            <p class="t-label">Download</p>
            <div class="stack mt-2">
              ${srow({ title: "Default quality", sub: "Used when several options exist", act: "cycle-quality", right: `<span class="center gap-2 t-sm" style="color:var(--text-2)">${st.set.defaultQuality}p ${SV.chev}</span>` })}
              ${srow({ title: "Default format", act: "cycle-format", right: `<span class="center gap-2 t-sm" style="color:var(--text-2)">${st.set.defaultFormat} ${SV.chev}</span>` })}
              ${switchRow({ title: "Wi‑Fi only", sub: "Queue until a Wi‑Fi network is available", checked: st.set.wifiOnly, act: "toggle-wifi" })}
              ${srow({ title: "Auto-download", act: "cycle-auto", right: `<span class="center gap-2 t-sm" style="color:var(--text-2)">${st.set.autoDownload === "ask" ? "Ask" : st.set.autoDownload === "always" ? "Always" : "Never"} ${SV.chev}</span>` })}
              ${srow({ title: "Download location", sub: "Downloads ▸ SnapVid · 999 MB used", act: "toast-location", right: `<span class="t-sm" style="color:var(--accent-text)">Change</span>` })}
            </div>
          </div>
        </div>
        <div class="stack gap-5">
          <div class="card site-card">
            <p class="t-label">General</p>
            <div class="stack mt-2">
              ${srow({ title: "Language", act: "cycle-language", right: `<span class="t-sm" style="color:var(--text-2)">${st.set.language}</span>` })}
              ${switchRow({ title: "Notifications", sub: "Completion and failure alerts", checked: st.set.notifications, act: "toggle-notif" })}
              ${srow({ title: "Clear download history", sub: "Removes records · keeps your files", tone: "danger", act: "confirm-clear" })}
              ${srow({ title: "About SnapVid", sub: "Version 2.4.0 · Build 318", act: "toast-about" })}
            </div>
          </div>
          <div class="card site-card">
            <p class="t-label">Privacy</p>
            <div class="stack mt-2">
              ${srow({ title: "Privacy information", sub: "What we store and what we don't", ico: "shield", act: "open-privacy" })}
              ${srow({ title: "Data usage", sub: "Temporary server-side processing only", ico: "chart", act: "open-privacy" })}
              ${srow({ title: "Supported-source policy", sub: "What SnapVid will and won't process", ico: "info", act: "open-policy" })}
            </div>
          </div>
          <div class="banner banner--info">
            <span class="banner__ico" aria-hidden="true">${SV.lock}</span>
            <div><p class="banner__t" style="color:var(--text)">Downloads you're allowed to make</p><p class="banner__d">${POLICY.long}</p></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  return `<div class="site">
    <div class="browserbar">
      <span class="dots" aria-hidden="true"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></span>
      <span class="url">${SV.lock} snapvid.app${page === "home" ? "" : "/" + page}</span>
      <span class="center gap-3" aria-hidden="true" style="color:var(--text-3)">${SV.refresh}${SV.share}</span>
    </div>
    ${siteNav(st, page)}
    <div class="site__wrap">${content}</div>
  </div>`;
};
