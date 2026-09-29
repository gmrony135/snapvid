"use strict";
/*
 * SnapVid server — the real backend behind the app.
 *
 *   node server.js            (or: npm start)
 *   PORT=9000 node server.js
 *
 * It serves the app itself (../index.html), the assets, and a small JSON API:
 *
 *   GET    /api/health              engine + policy info
 *   POST   /api/analyze             {url}                       -> real title/formats
 *   POST   /api/download            {url, quality, ...}         -> job
 *   GET    /api/jobs                all jobs (history)
 *   GET    /api/jobs/:id            one job (progress polling)
 *   POST   /api/jobs/:id/pause      pause   (partial file is kept)
 *   POST   /api/jobs/:id/resume     resume  (continues the same file)
 *   POST   /api/jobs/:id/cancel     cancel  (deletes the partial file)
 *   GET    /api/file/:id            stream the finished file (Range supported)
 *   DELETE /api/file/:id            delete the file + its record
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const policy = require("./lib/policy");
const engine = require("./lib/engine");
const jobs = require("./lib/jobs");

const ROOT = path.join(__dirname, "..");
const APP_HTML = path.join(ROOT, "index.html");
const ASSETS = path.join(ROOT, "assets");

/* ------------------------------------------------------------------ config -- */
function loadConfig() {
  const defaults = {
    port: Number(process.env.PORT || 8787),
    host: process.env.HOST || "0.0.0.0",
    downloadDir: "downloads",
    allowedHosts: [],
    maxDurationSeconds: 14400,
    maxConcurrentDownloads: 2,
    apiToken: null,
    engine: { cmd: "python3", args: ["-m", "yt_dlp"] }
  };
  let file = {};
  try {
    file = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
  } catch (err) {
    console.warn("· config.json not readable, using defaults");
  }
  const cfg = Object.assign(defaults, file, { engine: Object.assign(defaults.engine, file.engine || {}) });
  if (process.env.PORT) cfg.port = Number(process.env.PORT);
  cfg.downloadDir = path.isAbsolute(cfg.downloadDir) ? cfg.downloadDir : path.join(__dirname, cfg.downloadDir);
  fs.mkdirSync(cfg.downloadDir, { recursive: true });
  return cfg;
}

const cfg = loadConfig();
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml",
  ".mp4": "video/mp4", ".m4v": "video/mp4", ".m4a": "audio/mp4", ".webm": "video/webm",
  ".mkv": "video/x-matroska", ".avi": "video/x-msvideo", ".mov": "video/quicktime",
  ".ogv": "video/ogg", ".ogm": "video/ogg", ".ogg": "audio/ogg", ".opus": "audio/ogg",
  ".mp3": "audio/mpeg", ".aac": "audio/aac", ".wav": "audio/wav", ".flac": "audio/flac",
  ".3gp": "video/3gpp", ".mpeg": "video/mpeg", ".mpg": "video/mpeg", ".ts": "video/mp2t",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8"
};

/* ----------------------------------------------------------------- helpers -- */
function send(res, status, body, headers) {
  const h = Object.assign({ "Cache-Control": "no-store" }, headers || {});
  if (Buffer.isBuffer(body)) {
    res.writeHead(status, h);
    return res.end(body);
  }
  const text = typeof body === "string" ? body : JSON.stringify(body);
  h["Content-Type"] = h["Content-Type"] || "application/json; charset=utf-8";
  h["Content-Length"] = Buffer.byteLength(text);
  res.writeHead(status, h);
  res.end(text);
}

function readJson(req, limit) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (d) => {
      data += d;
      if (data.length > (limit || 65536)) { reject(new Error("too large")); req.destroy(); }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(new Error("bad json")); }
    });
    req.on("error", reject);
  });
}

/* Containers that can be remuxed into MP4 without re-encoding. Theora/Vorbis
   (.ogv) can't, so for those we keep the original file instead of failing. */
const REMUXABLE = new Set(["mp4", "m4v", "mov", "webm", "mkv", "avi", "flv", "f4v", "3gp", "3g2", "ts", "m2ts", "mts", "mpg", "mpeg", "wmv", "asf", "vob"]);

function sanitizeFileName(name) {
  return String(name || "video.mp4").replace(/[\u0000-\u001f\u007f/\\:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 180) || "video.mp4";
}

/* -------------------------------------------------------------- static app -- */
function serveStatic(req, res, urlPath) {
  if (urlPath === "/" || urlPath === "/index.html") return serveFile(res, APP_HTML, req);
  if (urlPath === "/favicon.ico") return send(res, 204, "");
  const rel = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const candidates = [
    path.join(ROOT, rel),
    path.join(ASSETS, rel.replace(/^\/assets\//, "").replace(/^\//, ""))
  ];
  for (const file of candidates) {
    const inside = file === ROOT || file.startsWith(ROOT + path.sep);
    if (inside && fs.existsSync(file) && fs.statSync(file).isFile()) return serveFile(res, file, req);
  }
  return send(res, 404, { ok: false, message: "Not found" });
}

function serveFile(res, file, req) {
  const stat = fs.statSync(file);
  const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  const range = req && req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
    if (isNaN(start) || start < 0) start = 0;
    if (isNaN(end) || end >= stat.size) end = stat.size - 1;
    if (start > end) { res.writeHead(416, { "Content-Range": "bytes */" + stat.size }); return res.end(); }
    res.writeHead(206, {
      "Content-Type": type, "Content-Length": end - start + 1,
      "Content-Range": "bytes " + start + "-" + end + "/" + stat.size,
      "Accept-Ranges": "bytes", "Cache-Control": "no-store"
    });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, {
    "Content-Type": type, "Content-Length": stat.size,
    "Accept-Ranges": "bytes", "Cache-Control": "no-store"
  });
  fs.createReadStream(file).pipe(res);
}

/* --------------------------------------------------------------- API routes -- */
function authorized(req) {
  if (!cfg.apiToken) return true;
  const header = req.headers["x-snapvid-token"];
  const url = new URL(req.url, "http://localhost");
  return header === cfg.apiToken || url.searchParams.get("token") === cfg.apiToken;
}

async function handleApi(req, res, urlPath, query) {
  const method = req.method.toUpperCase();

  if (!authorized(req)) return send(res, 401, { ok: false, code: "unauthorized", message: "This server needs its access token." });

  if (urlPath === "/api/health" && method === "GET") {
    return send(res, 200, {
      ok: true, app: "SnapVid", version: "1.0",
      engine: engineInfo,
      policy: {
        allowedHosts: cfg.allowedHosts,
        openSource: cfg.allowedHosts.length === 0,
        maxDurationSeconds: cfg.maxDurationSeconds,
        maxConcurrentDownloads: cfg.maxConcurrentDownloads,
        notes: "SnapVid never bypasses DRM, paywalls, logins or access controls."
      },
      active: jobs.activeCount(),
      jobs: jobs.list().length
    });
  }

  if (urlPath === "/api/analyze" && method === "POST") {
    let body;
    try { body = await readJson(req); } catch (e) { return send(res, 400, { ok: false, code: "invalid-url", message: "We couldn't read that request." }); }
    const gate = policy.checkUrl(body.url, cfg);
    if (!gate.ok) return send(res, 200, gate);
    if (!engineInfo.ytdlp.ok) return send(res, 200, { ok: false, code: "engine-missing", message: "The download engine isn't installed on this server.", hint: "Run: pip install yt-dlp" });

    const result = await engine.analyze(gate.url, cfg, 120000);
    if (!result.ok) {
      if (result.timedOut) return send(res, 200, { ok: false, code: "network", message: "The source took too long to answer.", hint: "Try again in a moment." });
      if (result.missingEngine) return send(res, 200, { ok: false, code: "engine-missing", message: "The download engine isn't installed on this server." });
      return send(res, 200, policy.explainEngineError(result.stderr));
    }
    const infoCheck = policy.checkInfo(result.info, cfg);
    if (!infoCheck.ok) return send(res, 200, infoCheck);
    return send(res, 200, { ok: true, video: shapeVideo(result.info, gate) });
  }

  if (urlPath === "/api/download" && method === "POST") {
    let body;
    try { body = await readJson(req); } catch (e) { return send(res, 400, { ok: false, code: "bad-request", message: "We couldn't read that request." }); }
    const gate = policy.checkUrl(body.url, cfg);
    if (!gate.ok) return send(res, 200, gate);
    if (jobs.activeCount() >= cfg.maxConcurrentDownloads) {
      return send(res, 200, { ok: false, code: "server-busy", message: "SnapVid is already downloading " + cfg.maxConcurrentDownloads + " files.", hint: "Wait for one to finish, or raise maxConcurrentDownloads in config.json." });
    }
    /* Re-check right before download so a link that changed to DRM/private since
       analysis (or a direct API call that skipped analysis) is still refused. */
    const result = await engine.analyze(gate.url, cfg, 120000);
    if (!result.ok) {
      if (result.timedOut) return send(res, 200, { ok: false, code: "network", message: "The source took too long to answer." });
      return send(res, 200, policy.explainEngineError(result.stderr));
    }
    const infoCheck = policy.checkInfo(result.info, cfg);
    if (!infoCheck.ok) return send(res, 200, infoCheck);

    const video = shapeVideo(result.info, gate);
    const wanted = String(body.quality || "720");
    const pick = video.qualities.filter((q) => q.id === wanted)[0] || video.qualities[0];
    const job = jobs.createJob({
      url: gate.url, host: gate.host, title: video.title, duration: video.duration,
      license: video.license, quality: pick ? pick.id : wanted, qualityLabel: pick ? pick.label : wanted,
      remux: !!(pick && pick.remux), outExt: (pick && pick.ext) || "mp4", thumbnail: video.thumbnail
    }, cfg);
    jobs.run(job, cfg);
    return send(res, 200, { ok: true, job: jobs.get(job.id) });
  }

  if (urlPath === "/api/jobs" && method === "GET") {
    return send(res, 200, { ok: true, jobs: jobs.list() });
  }

  const jobMatch = /^\/api\/jobs\/([A-Za-z0-9._-]+)(?:\/(pause|resume|cancel))?$/.exec(urlPath);
  if (jobMatch) {
    const id = jobMatch[1];
    const action = jobMatch[2];
    if (!action && method === "GET") {
      const job = jobs.get(id);
      return job ? send(res, 200, { ok: true, job }) : send(res, 404, { ok: false, code: "not-found" });
    }
    if (action && method === "POST") {
      const out = action === "pause" ? jobs.pause(id, cfg) : action === "resume" ? jobs.resume(id, cfg) : jobs.cancel(id);
      return send(res, out.ok ? 200 : 409, out);
    }
  }

  const fileMatch = /^\/api\/file\/([A-Za-z0-9._-]+)$/.exec(urlPath);
  if (fileMatch) {
    const job = jobs.get(fileMatch[1]);
    if (!job || job.status !== "done" || !job.fileUrl) return send(res, 404, { ok: false, code: "not-found", message: "That file isn't on this server." });
    const filePath = path.join(cfg.downloadDir, job.id);
    const picked = jobs.list().filter((j) => j.id === job.id)[0];
    const real = findJobFile(filePath);
    if (!real) return send(res, 404, { ok: false, code: "not-found" });
    if (method === "DELETE") {
      jobs.remove(job.id, cfg);
      return send(res, 200, { ok: true });
    }
    if (method === "GET" || method === "HEAD") {
      res.setHeader("Content-Disposition", "attachment; filename=\"" + sanitizeFileName(picked.fileName) + "\"");
      return serveFile(res, real, req);
    }
  }

  return send(res, 404, { ok: false, message: "Unknown API route" });
}

function findJobFile(dir) {
  let best = null;
  let entries = [];
  try { entries = fs.readdirSync(dir); } catch (e) { return null; }
  entries.forEach((name) => {
    if (/\.(part|ytdl|temp)$/i.test(name)) return;
    const p = path.join(dir, name);
    let st;
    try { st = fs.statSync(p); } catch (e) { return; }
    if (!st.isFile()) return;
    if (!best || st.size > best.size) best = { path: p, size: st.size };
  });
  return best ? best.path : null;
}

/* --------------------------------------------------------- shape for the UI -- */
function shapeVideo(info, gate) {
  /* Careful: not every source reports codec fields (archive.org doesn't), so
     "unknown" must mean "assume it has video", not "throw it away". */
  const usable = (f) => f && !f.has_drm && !((f.vcodec === "none") && (f.acodec === "none"));
  const hasVideo = (f) => f.vcodec === undefined || f.vcodec === null || f.vcodec !== "none";
  const audioOnlyFormat = (f) => f.vcodec === "none" && !!f.acodec && f.acodec !== "none";

  const formats = (info.formats || []).filter(usable);

  /* One entry per resolution the source actually has — never invent a 1080p row
     when the source tops out at 720p. For each height keep the most useful file
     (one that already contains audio beats video-only, then the bigger file). */
  const byHeight = new Map();
  formats.forEach((f) => {
    if (!f.height || !hasVideo(f)) return;
    const key = f.height;
    const cur = byHeight.get(key);
    const rank = (x) => [(x.acodec && x.acodec !== "none") ? 1 : 0, x.filesize || x.filesize_approx || 0];
    if (!cur || rank(f)[0] > rank(cur)[0] || (rank(f)[0] === rank(cur)[0] && rank(f)[1] > rank(cur)[1])) {
      byHeight.set(key, f);
    }
  });

  const cap = Number(cfg.maxQualityHeight || 1080);
  const heights = Array.from(byHeight.keys()).sort((a, b) => b - a);
  const inCap = heights.filter((h) => h <= cap);
  const chosen = (inCap.length ? inCap : heights.slice(0, 1)).slice(0, 6);

  const audioTracks = formats.filter(audioOnlyFormat);

  const qualities = chosen.map((h) => {
    const best = byHeight.get(h);
    const videoOnly = best.acodec === "none";
    /* will this download be merged with a separate audio track? then it lands as MP4 */
    const merges = !videoOnly && formats.some((f) => f.height === h && f.acodec === "none") && audioTracks.length > 0;
    const container = (best.ext || "mp4").toLowerCase();
    const outExt = (merges || REMUXABLE.has(container)) ? "mp4" : container;
    let bytes = best.filesize || best.filesize_approx || null;
    const approx = !best.filesize;
    if (!bytes && videoOnly && info.duration) {
      const rate = best.tbr || best.vbr;
      if (rate) bytes = Math.round((rate * 1000 / 8) * info.duration);
    }
    return {
      id: String(h),
      label: h + "p",
      height: best.height,
      ext: outExt,
      container: container,
      merges: merges,
      remux: !merges && REMUXABLE.has(container),
      bytes,
      sizeText: bytes ? jobs.fmtBytes(bytes) : null,
      approx,
      badge: h >= 1080 ? "HD" : ""
    };
  });

  const audioFormats = formats.filter(audioOnlyFormat);
  if (audioFormats.length) {
    const best = audioFormats.reduce((a, b) => ((b.abr || b.tbr || 0) > (a.abr || a.tbr || 0) ? b : a));
    const bytes = best.filesize || best.filesize_approx || (best.abr && info.duration ? Math.round((best.abr * 1000 / 8) * info.duration) : null);
    qualities.push({
      id: "audio", label: "Audio", ext: "m4a", bytes,
      sizeText: bytes ? jobs.fmtBytes(bytes) : null,
      approx: !best.filesize, badge: ""
    });
  }

  const cleaned = qualities.slice().sort((a, b) => (b.height || 0) - (a.height || 0));
  const recommended = (cleaned.filter((q) => q.label === "720p")[0] || cleaned.filter((q) => q.height <= 720)[0] || cleaned[0] || {}).id || null;
  return {
    title: info.title || "Video from " + gate.host,
    host: gate.host,
    uploader: info.uploader || info.channel || info.creator || null,
    duration: Number(info.duration) || null,
    durationText: info.duration ? clock(info.duration) : null,
    thumbnail: info.thumbnail || null,
    webpageUrl: info.webpage_url || gate.url,
    license: info.license || null,
    qualities: cleaned,
    recommended: recommended
  };
}

function clock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const two = (n) => String(n).padStart(2, "0");
  return h ? h + ":" + two(m) + ":" + two(sec) : m + ":" + two(sec);
}

/* -------------------------------------------------------------------- boot -- */
let engineInfo = { ytdlp: { ok: false }, ffmpeg: { ok: false } };

async function boot() {
  const [ytdlp, ffmpeg] = await Promise.all([engine.probe(cfg), engine.probeFfmpeg()]);
  engineInfo = { ytdlp, ffmpeg };
  const restored = jobs.restore(cfg);
  console.log("SnapVid server");
  console.log("  engine   : " + (ytdlp.ok ? "yt-dlp " + ytdlp.version : "MISSING — pip install yt-dlp"));
  console.log("  ffmpeg   : " + (ffmpeg.ok ? ffmpeg.version.replace(/^ffmpeg version /, "ffmpeg ") : "missing (no merging / audio extraction)"));
  console.log("  sources  : " + (cfg.allowedHosts.length ? cfg.allowedHosts.join(", ") : "any source the engine supports"));
  console.log("  files in : " + cfg.downloadDir + (restored ? "  (" + restored + " from an earlier run)" : ""));
  console.log("  open     : http://localhost:" + cfg.port);

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const urlPath = url.pathname;
    if (urlPath.startsWith("/api/")) {
      handleApi(req, res, urlPath, url.searchParams).catch((err) => {
        console.error("api error:", err);
        if (!res.headersSent) send(res, 500, { ok: false, message: "Something went wrong on the server." });
      });
      return;
    }
    serveStatic(req, res, urlPath);
  });

  server.listen(cfg.port, cfg.host, () => {
    console.log("  ready.\n");
  });
  return server;
}

if (require.main === module) boot();

module.exports = { boot, cfg };
