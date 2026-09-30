/* ============================ live server mode ============================
   The whole app above works on its own as a UI prototype. This block connects
   it to the SnapVid backend (../server) when one is running on the same origin:
   real link analysis, real quality list with real sizes, a real download, real
   pause/resume, and files you can actually open or share.
   If no server answers, nothing here activates and the app stays a demo.      */
(function () {
  var S = { live: false, video: null, job: null, jobId: null, poll: null, token: null, engine: null };

  try { S.token = localStorage.getItem("snapvid.token"); } catch (e) { S.token = null; }
  try {
    var q = new URLSearchParams(location.search).get("token");
    if (q) { S.token = q; localStorage.setItem("snapvid.token", q); }
  } catch (e) { /* ignore */ }

  function api(path, opts) {
    opts = opts || {};
    var headers = { "content-type": "application/json" };
    if (S.token) headers["x-snapvid-token"] = S.token;
    return fetch(path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) { return r.json().catch(function () { return {}; }); });
  }

  var demoAnalyze = analyze, demoStart = startDownload, demoRenderQuality = renderQuality,
      demoPaint = paint, demoOpenMenu = openMenu;

  var QLABEL = function (v) { return v ? v.label : "720p"; };
  function pick() {
    var list = (S.video && S.video.qualities) || [];
    return list.filter(function (q) { return q.id === state.quality; })[0] || list[0] || null;
  }
  function pretty(q) {
    if (!q) return "";
    var ext = (q.ext || "mp4").toUpperCase();
    return q.sizeText ? ext + " · " + q.sizeText + (q.approx ? " est." : "") : ext + " · size unknown";
  }

  /* ---------------------------------------------------------------- health -- */
  function probeServer() {
    if (typeof fetch !== "function") { markPreview(); return; }
    /* opened straight from disk — there is no origin to ask */
    if (location.protocol === "file:") { markPreview(); return; }
    api("/api/health").then(function (d) {
      if (!d || !d.ok) return;
      S.live = true;
      S.engine = d.engine;
      var hint = document.getElementById("hint");
      if (hint && document.getElementById("errorBox").hidden) {
        hint.textContent = "Connected to your SnapVid server" + (S.engine && S.engine.ffmpeg && S.engine.ffmpeg.ok ? "" : " · ffmpeg missing") + ".";
      }
      restoreHistory();
    }).catch(function () { markPreview(); });
    /* no answer at all (offline, or opened as a plain file) */
    setTimeout(function () {
      if (!S.live) markPreview();
    }, 2500);
  }

  /* Be honest when there is no backend: the screens still work, but nothing is
     really downloaded. The hint line says so instead of pretending. */
  function markPreview() {
    if (S.live) return;
    var hint = document.getElementById("hint");
    if (hint && document.getElementById("errorBox").hidden) {
      hint.textContent = "Preview mode — start the SnapVid server to download real videos.";
    }
  }

  function restoreHistory() {
    return api("/api/jobs").then(function (d) {
      if (!d || !d.ok || !d.jobs) return;
      var done = d.jobs.filter(function (j) { return j.status === "done"; });
      DOWNLOADS = done.map(function (j) {
        var t = j.finishedAt || j.createdAt;
        return {
          id: j.id, title: j.title || j.fileName || "Saved file", source: j.host || "",
          q: j.qualityLabel || "File", size: j.sizeText || "—",
          fileUrl: j.fileUrl, fileName: j.fileName, thumb: j.thumbnail || null,
          group: groupOf(t), when: whenOf(t)
        };
      });
      renderDownloads(); renderRecent();
    });
  }
  function groupOf(iso) {
    var d = new Date(iso), now = new Date();
    var days = Math.floor((startOfDay(now) - startOfDay(d)) / 86400000);
    return days <= 0 ? "Today" : days === 1 ? "Yesterday" : "Older";
  }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
  function whenOf(iso) {
    var mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + " min ago";
    var h = Math.round(mins / 60);
    if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
    return groupOf(iso);
  }

  /* --------------------------------------------------------------- analyse -- */
  function liveAnalyze() {
    var url = state.url.trim();
    clearError();
    if (!url) { showError("invalid"); document.getElementById("url").focus(); return; }
    var btn = document.getElementById("analyzeBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span><span id="analyzeLabel">Reading link…</span>';
    var stages = ["Reading link…", "Checking source permission…", "Fetching formats…"];
    var i = 0;
    var timer = setInterval(function () {
      i += 1;
      var l = document.getElementById("analyzeLabel");
      if (l && i < stages.length) l.textContent = stages[i];
    }, 700);

    api("/api/analyze", { method: "POST", body: { url: url } }).then(function (d) {
      clearInterval(timer);
      btn.disabled = false;
      btn.innerHTML = ICON_DOWNLOAD + '<span id="analyzeLabel">Analyze Video</span>';
      if (!d || !d.ok) { showError("server", d || {}); return; }
      S.video = d.video;
      current.title = d.video.title;
      current.host = d.video.host;
      state.quality = d.video.recommended || (d.video.qualities[0] && d.video.qualities[0].id) || "720";
      fillQuality(d.video);
      setView("quality");
    }).catch(function () {
      clearInterval(timer);
      btn.disabled = false;
      btn.innerHTML = ICON_DOWNLOAD + '<span id="analyzeLabel">Analyze Video</span>';
      showError("server", { message: "The SnapVid server isn't answering.", hint: "Start it with: npm start (in the server folder)." });
    });
  }

  var ICON_DOWNLOAD = '<svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10"/><path d="m7.5 10 4.5 4.5L16.5 10"/><path d="M5 19.5h14"/></svg>';

  function fillQuality(v) {
    document.getElementById("qTitle").textContent = v.title;
    var bits = [v.host];
    if (v.durationText) bits.push(v.durationText);
    if (v.uploader) bits.push(v.uploader);
    if (v.license) bits.push("source states: " + shortLicense(v.license));
    document.getElementById("qMeta").textContent = bits.join(" · ");
    var thumb = document.querySelector('.view[data-view="quality"] .thumb');
    var placeholder = thumb.innerHTML;
    if (v.thumbnail) {
      thumb.className = "thumb";
      thumb.innerHTML = "";
      var img = document.createElement("img");
      img.alt = "";
      img.referrerPolicy = "no-referrer";
      img.addEventListener("error", function () {
        thumb.className = "thumb thumb--empty";
        thumb.innerHTML = placeholder;
      });
      img.src = v.thumbnail;
      thumb.appendChild(img);
      if (v.durationText) {
        var dur = document.createElement("span");
        dur.className = "dur";
        dur.textContent = v.durationText;
        thumb.appendChild(dur);
      }
      var play = document.createElement("button");
      play.className = "play";
      play.setAttribute("aria-label", "Open the source page");
      play.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 7.5v9l7.5-4.5z"/></svg>';
      play.addEventListener("click", function () { window.open(v.webpageUrl, "_blank", "noopener"); });
      thumb.appendChild(play);
    }
    renderQuality();
  }
  function shortLicense(url) {
    var m = /creativecommons\.org\/licenses\/([a-z-]+)/i.exec(url);
    if (m) return "CC " + m[1].toUpperCase().replace("-", " ");
    if (/publicdomain/i.test(url)) return "Public domain";
    return "check with the source";
  }

  /* ------------------------------------------------------- quality screen -- */
  function liveRenderQuality() {
    var list = (S.video && S.video.qualities) || [];
    if (!list.length) return demoRenderQuality();
    document.getElementById("qlist").innerHTML = list.map(function (q) {
      var sel = q.id === state.quality;
      return '<button class="qopt" role="radio" aria-checked="' + sel + '" data-q="' + q.id + '">' +
        '<span class="qinfo"><span class="qopt__top"><b>' + q.label +
          (q.badge ? ' <span class="badge" style="height:20px;vertical-align:1px">' + q.badge + '</span>' : "") +
          '</b><span class="qopt__size">' + (q.sizeText || "size unknown") + (q.approx ? " est." : "") + '</span></span>' +
          '<small>' + pretty(q) + (q.approx ? " · exact size unknown" : "") + '</small></span>' +
        '<span class="check" aria-hidden="true"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>' +
        '</button>';
    }).join("");
    document.getElementById("downloadBtn").textContent = "Download " + QLABEL(pick());
  }

  /* -------------------------------------------------------------- download -- */
  function liveStart() {
    var q = pick();
    if (!q) { showError("unsupported"); return; }
    document.getElementById("pTitle").textContent = current.title;
    document.getElementById("pQuality").textContent = q.label + " · " + pretty(q);
    document.getElementById("pauseLabel").textContent = "Pause";
    state.progress = 0; state.paused = false;
    S.job = null; S.jobId = null; S.afterStart = null;
    setView("progress");
    paint();

    api("/api/download", { method: "POST", body: { url: state.url.trim(), quality: q.id } }).then(function (d) {
      if (!d || !d.ok) { setView("quality"); showError("server", d || {}); return; }
      S.job = d.job; S.jobId = d.job.id;
      if (S.afterStart === "pause") { S.afterStart = null; api("/api/jobs/" + S.jobId + "/pause", { method: "POST" }); }
      if (S.afterStart === "cancel") { S.afterStart = null; api("/api/jobs/" + S.jobId + "/cancel", { method: "POST" }); return; }
      poll();
    }).catch(function () {
      setView("quality");
      showError("server", { message: "The SnapVid server isn't answering." });
    });
  }

  function poll() {
    clearInterval(S.poll);
    S.poll = setInterval(function () {
      if (!S.jobId) return;
      api("/api/jobs/" + S.jobId).then(function (d) {
        if (!d || !d.ok || !d.job) return;
        S.job = d.job;
        state.progress = d.job.percent || 0;
        state.paused = d.job.status === "paused";
        paint();
        if (d.job.status === "done") { stopPoll(); liveFinish(); }
        else if (d.job.status === "error") {
          stopPoll();
          setView("quality");
          showError("server", d.job.error || { message: "The download failed." });
        } else if (d.job.status === "cancelled") { stopPoll(); setView("quality"); }
      });
    }, 600);
  }
  function stopPoll() { clearInterval(S.poll); S.poll = null; }

  function livePaint() {
    /* Live mode never borrows the prototype's made-up numbers. Before the job
       exists we show an honest starting state instead. */
    var job = S.job || { status: "starting", percent: 0, downloadedText: "0 B", totalText: null, message: "Starting…" };
    var p = Math.max(0, Math.min(100, job.percent || 0));
    var c = 615.8;
    document.getElementById("ring").setAttribute("stroke-dashoffset", String(c * (1 - p / 100)));
    document.getElementById("pct").innerHTML = Math.round(p) + "<small>%</small>";
    document.getElementById("nums").innerHTML = (job.downloadedText || "0 B") +
      " <span>of " + (job.totalText || "unknown") + "</span>";
    document.getElementById("bar").style.width = p + "%";
    var eta = document.getElementById("eta");
    if (job.status === "paused") eta.textContent = "Paused · tap Resume to continue from " + (job.downloadedText || "here");
    else if (job.status === "done") eta.textContent = "Saved";
    else if (job.message && /Finishing|merg|extract/i.test(job.message)) eta.textContent = job.message;
    else if (job.speedText && job.eta !== null && job.eta !== undefined) eta.textContent = "About " + job.eta + " s left · " + job.speedText;
    else if (job.speedText) eta.textContent = job.speedText;
    else eta.textContent = "Starting…";
    var label = document.getElementById("pauseLabel");
    if (label) label.textContent = job.status === "paused" ? "Resume" : "Pause";
  }

  function liveFinish() {
    var job = S.job || {};
    var q = pick();
    var entry = {
      id: job.id, title: job.title || current.title, source: job.host || current.host,
      q: job.qualityLabel || QLABEL(q), size: job.sizeText || (q && q.sizeText) || "—",
      fileUrl: job.fileUrl, fileName: job.fileName,
      thumb: job.thumbnail || (S.video && S.video.thumbnail) || null,
      group: "Today", when: "just now"
    };
    DOWNLOADS = [entry].concat(DOWNLOADS.filter(function (d) { return d.id !== entry.id; }));
    document.getElementById("cTitle").textContent = entry.title;
    document.getElementById("cQuality").textContent = entry.q + " · " + pretty(q).split(" · ")[0];
    document.getElementById("cSize").textContent = entry.size;
    /* honest destination: the file is on the server until the browser saves it */
    var saved = document.getElementById("cSaved");
    if (saved) saved.textContent = "Your device — tap Save/Share for Photos";
    renderDownloads(); renderRecent();
    setView("complete");
  }

  /* ------------------------------------------------------- file in/out ---- */
  function fileOf(entry) {
    if (!entry) return null;
    return entry.fileUrl || ("/api/file/" + entry.id);
  }
  function saveToDevice(entry, then) {
    var url = fileOf(entry);
    fetch(url).then(function (r) { return r.blob(); }).then(function (blob) {
      var name = (entry && entry.fileName) || "snapvid-video.mp4";
      var file = null;
      try { file = new File([blob], name, { type: blob.type || "video/mp4" }); } catch (e) { file = null; }
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: entry.title }).then(function () { return "shared"; });
      }
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 20000);
      return "downloaded";
    }).then(function (how) {
      if (how === "shared") toast("Choose “Save to Photos” to keep it");
      else toast("Saved to your device's Downloads");
      if (then) then();
    }).catch(function () { toast("Couldn't reach the file — try again"); });
  }

  /* ---------------------------------------------------------- row menu ---- */
  function liveOpenMenu(id) {
    closeMenu();
    var entry = DOWNLOADS.filter(function (d) { return String(d.id) === String(id); })[0];
    if (!entry) return demoOpenMenu(id);
    var scrim = document.createElement("div");
    scrim.className = "scrim"; scrim.id = "scrim";
    var sheet = document.createElement("div");
    sheet.className = "sheet"; sheet.id = "sheet"; sheet.setAttribute("role", "menu");
    sheet.innerHTML =
      '<div class="grab"></div>' +
      '<div class="row" style="min-height:auto;padding:4px 0 12px;border:0"><span class="row__t"><b>' + esc(entry.title) + '</b>' +
        '<span class="row__meta">' + esc(entry.q || "") + " · " + esc(entry.size || "") + '</span></span></div>' +
      '<button class="row" role="menuitem" id="mSave">' + ICON_SHARE + 'Save to Photos / gallery</button>' +
      '<button class="row" role="menuitem" id="mOpen">' + ICON_OPEN + 'Open the file</button>' +
      '<button class="row" role="menuitem" id="mCopy">' + ICON_LINK + 'Copy link</button>' +
      '<button class="row" role="menuitem" id="mDel" style="color:var(--danger)">' + ICON_TRASH + 'Delete from server</button>';
    phone.appendChild(scrim); phone.appendChild(sheet);
    scrim.addEventListener("click", closeMenu);
    sheet.querySelector("#mSave").addEventListener("click", function () { closeMenu(); saveToDevice(entry); });
    sheet.querySelector("#mOpen").addEventListener("click", function () { closeMenu(); window.open(fileOf(entry), "_blank"); });
    sheet.querySelector("#mCopy").addEventListener("click", function () {
      closeMenu();
      var abs = location.origin + fileOf(entry);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(abs).then(function () { toast("Link copied"); }, function () { toast(abs.slice(0, 40) + "…"); });
      } else toast(abs.slice(0, 40) + "…");
    });
    sheet.querySelector("#mDel").addEventListener("click", function () {
      closeMenu();
      fetch(fileOf(entry), { method: "DELETE" }).then(function () {
        DOWNLOADS = DOWNLOADS.filter(function (d) { return d.id !== entry.id; });
        renderDownloads(); renderRecent(); toast("Deleted from the server");
      });
    });
  }
  var ICON_OPEN = '<svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 5.5h4.5V10"/><path d="M18.5 5.5 11 13"/><path d="M17 14.5v3.4a1.6 1.6 0 0 1-1.6 1.6H6.1A1.6 1.6 0 0 1 4.5 17.9V8.6A1.6 1.6 0 0 1 6.1 7h3.4"/></svg>';
  var ICON_SHARE = '<svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="m8.5 7.5 3.5-3.5 3.5 3.5"/><path d="M6 13v5.5A1.5 1.5 0 0 0 7.5 20h9A1.5 1.5 0 0 0 18 18.5V13"/></svg>';
  var ICON_LINK = '<svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="1.7" stroke-linecap="round"><path d="M9.5 14.5 14.5 9.5"/><path d="M7.5 11 6 12.5a3.6 3.6 0 0 0 5 5l1.5-1.5"/><path d="M16.5 13l1.5-1.5a3.6 3.6 0 0 0-5-5L11.5 8"/></svg>';
  var ICON_TRASH = '<svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7.5h14"/><path d="M9.5 7.5V6A1.5 1.5 0 0 1 11 4.5h2A1.5 1.5 0 0 1 14.5 6v1.5"/><path d="M6.5 7.5 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4A1.5 1.5 0 0 0 16.7 19l.8-11.5"/></svg>';

  /* ------------------------------------------------ wire into the app ------ */
  analyze = function () { return S.live ? liveAnalyze() : demoAnalyze(); };
  startDownload = function () { return S.live ? liveStart() : demoStart(); };
  renderQuality = function () { return (S.live && S.video) ? liveRenderQuality() : demoRenderQuality(); };
  paint = function () { return S.live ? livePaint() : demoPaint(); };
  openMenu = function (id) { return (S.live && DOWNLOADS.length) ? liveOpenMenu(id) : demoOpenMenu(id); };

  /* capture phase, so we act before the demo handlers in the app above */
  document.addEventListener("click", function (ev) {
    if (!S.live) return;
    var t = ev.target.closest && ev.target.closest("#analyzeBtn,#downloadBtn,#pauseBtn,[data-cancel],#openBtn,#shareBtn");
    if (!t) return;

    if (t.id === "analyzeBtn") { ev.preventDefault(); ev.stopPropagation(); liveAnalyze(); return; }
    if (t.id === "downloadBtn") { ev.preventDefault(); ev.stopPropagation(); liveStart(); return; }
    if (t.id === "pauseBtn") {
      ev.preventDefault(); ev.stopPropagation();
      if (!S.jobId) { S.afterStart = "pause"; toast("Pausing as soon as the download starts…"); return; }
      var paused = S.job && S.job.status === "paused";
      api("/api/jobs/" + S.jobId + (paused ? "/resume" : "/pause"), { method: "POST" }).then(function (d) {
        if (!d || !d.ok) { toast(d && d.message ? d.message : "Couldn't change the download state"); return; }
        S.job = d.job; state.paused = d.job.status === "paused"; paint();
        if (!paused) toast("Paused — the part you downloaded is kept");
      });
      return;
    }
    if (t.hasAttribute && t.hasAttribute("data-cancel")) {
      ev.preventDefault(); ev.stopPropagation();
      if (S.jobId) api("/api/jobs/" + S.jobId + "/cancel", { method: "POST" });
      else if (S.job === null && !S.jobId) S.afterStart = "cancel";
      stopPoll(); S.job = null; S.jobId = null;
      setView("quality"); toast("Download cancelled");
      return;
    }
    if (t.id === "openBtn") { ev.preventDefault(); ev.stopPropagation(); window.open(fileOf(DOWNLOADS[0] || { id: (S.job && S.job.id) }), "_blank"); toast("Opening the saved file"); return; }
    if (t.id === "shareBtn") {
      ev.preventDefault(); ev.stopPropagation();
      var entry = DOWNLOADS[0] || (S.job ? { id: S.job.id, title: S.job.title, fileName: S.job.fileName } : null);
      if (entry) saveToDevice(entry);
      return;
    }
  }, true);

  /* keep the live code honest if the server goes away mid-session */
  window.addEventListener("online", function () { if (!S.live) probeServer(); });
  probeServer();
})();

<!-- auto-push probe -->
