"use strict";
/* Download job manager: one job = one file being downloaded. Real state, real
   numbers, real pause/resume (the engine keeps the partial file and continues). */

const fs = require("fs");
const path = require("path");
const engine = require("./engine");
const { explainEngineError } = require("./policy");

const jobs = new Map(); /* id -> job */
let seq = 0;

function newId() {
  seq += 1;
  return Date.now().toString(36) + "-" + seq.toString(36) + "-" + Math.random().toString(36).slice(2, 6);
}

function fmtBytes(n) {
  if (!Number.isFinite(n) || n < 0) return null;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0, v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
  return (v >= 100 || i === 0 ? Math.round(v) : v.toFixed(v >= 10 ? 1 : 2)) + " " + units[i];
}

function publicJob(job) {
  const total = job.total || null;
  return {
    id: job.id,
    status: job.status,
    quality: job.quality,
    qualityLabel: job.qualityLabel,
    url: job.url,
    title: job.title,
    host: job.host,
    duration: job.duration,
    percent: Math.max(0, Math.min(100, job.percent || 0)),
    determinate: !!total,
    downloaded: job.downloaded || 0,
    downloadedText: fmtBytes(job.downloaded),
    total: total,
    totalText: total ? fmtBytes(total) : null,
    speed: job.speed || null,
    speedText: job.speed ? fmtBytes(job.speed) + "/s" : null,
    eta: job.eta === null || job.eta === undefined ? null : job.eta,
    sizeText: job.fileSize ? fmtBytes(job.fileSize) : (total ? fmtBytes(total) : null),
    fileUrl: job.status === "done" ? "/api/file/" + job.id : null,
    fileName: job.fileName || null,
    license: job.license || null,
    thumbnail: job.thumbnail || null,
    error: job.error || null,
    message: job.message || null,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt || null
  };
}

function activeCount() {
  let n = 0;
  jobs.forEach((j) => { if (j.status === "downloading" || j.status === "starting") n += 1; });
  return n;
}

function createJob({ url, host, title, duration, license, quality, qualityLabel, remux, outExt, thumbnail }, cfg) {
  const id = newId();
  const dir = path.join(cfg.downloadDir, id);
  fs.mkdirSync(dir, { recursive: true });
  const job = {
    id, dir, url, host, title, duration, license, quality, qualityLabel,
    remux: !!remux, outExt: outExt || "mp4", thumbnail: thumbnail || null,
    status: "starting", percent: 0, downloaded: 0, total: null, speed: null, eta: null,
    filePath: null, fileName: null, fileSize: null, error: null, message: null,
    createdAt: new Date().toISOString(), streams: new Map(), children: []
  };
  jobs.set(id, job);
  return job;
}

function run(job, cfg) {
  const { child } = engine.startDownload(job, cfg);
  /* keep the engine's own words on disk — the only way to diagnose a failure */
  const logPath = path.join(job.dir, "engine.log");
  const log = (line) => { try { fs.appendFileSync(logPath, line + "\n"); } catch (e) { /* ignore */ } };
  log("--- run started " + new Date().toISOString() + " ---");
  job.child = child;
  job.status = "downloading";
  job.message = "Downloading…";
  job.children.push(child);

  let buf = "";
  const onLine = (line) => {
    const p = engine.parseProgressLine(line);
    if (p) {
      if (p.filename) job.streams.set(p.filename, p);
      let dl = 0, total = 0, anyUnknown = false, speed = 0, eta = null;
      job.streams.forEach((s) => {
        dl += s.downloaded || 0;
        if (s.total) total += s.total; else anyUnknown = true;
        if (s.speed) speed += s.speed;
        if (s.eta !== null && s.eta !== undefined) eta = eta === null ? s.eta : Math.max(eta, s.eta);
      });
      job.downloaded = dl;
      job.total = !anyUnknown && total > 0 ? total : (total || null);
      job.speed = speed || null;
      job.eta = eta;
      if (job.total) job.percent = Math.min(99.5, (job.downloaded / job.total) * 100);
      return;
    }
    if (/^\[Merger\] Merging formats/.test(line)) { job.message = "Finishing — merging video and audio…"; job.percent = Math.max(job.percent, 99.6); return; }
    if (/^\[ExtractAudio\]/.test(line)) { job.message = "Finishing — extracting audio…"; job.percent = Math.max(job.percent, 99.6); return; }
    if (/^\[FixupM3u8\]|^\[Fixup\w+\]/.test(line)) { job.message = "Finishing…"; return; }
    if (/^\[download\] Destination: /.test(line)) { job.message = "Downloading…"; return; }
  };

  child.stdout.on("data", (d) => {
    try { fs.appendFileSync(logPath, d.toString().replace(/\r/g, "\n")); } catch (e) { /* ignore */ }
    buf += d.toString();
    const lines = buf.split(/\r?\n/);
    buf = lines.pop();
    lines.forEach(onLine);
  });
  let stderr = "";
  child.stderr.on("data", (d) => {
    stderr += d.toString().slice(0, 8000);
    try { fs.appendFileSync(logPath, "[stderr] " + d.toString()); } catch (e) { /* ignore */ }
  });

  child.on("error", (e) => {
    job.status = "error";
    job.error = { code: "engine-missing", message: "The download engine couldn't start.", hint: e.message };
    job.message = null;
  });

  child.on("close", (code) => {
    log("--- exit " + code + " ---");
    if (buf) onLine(buf);
    const intentional = job.cancelRequested || job.pauseRequested;
    if (job.cancelRequested) {
      job.status = "cancelled";
      job.message = "Cancelled";
      try { fs.rmSync(job.dir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
      return;
    }
    if (job.pauseRequested) {
      job.status = "paused";
      job.message = "Paused — resume to continue from " + (fmtBytes(job.downloaded) || "where you stopped");
      return;
    }
    const finished = pickOutput(job.dir);
    const looksComplete = finished && (code === 0 || (job.total && finished.size >= job.total * 0.999));
    if (looksComplete) {
      const file = finished;
      const conversionFailed = code !== 0;
      if (conversionFailed) {
        job.message = "Saved as " + (file.path.split(".").pop() || "").toUpperCase() + " — this source can't be converted to MP4";
      }
      job.filePath = file.path;
      job.fileName = path.basename(file.path);
      job.fileSize = file.size;
      job.total = file.size;
      job.downloaded = file.size;
      job.percent = 100;
      job.status = "done";
      job.message = "Download complete";
      job.finishedAt = new Date().toISOString();
      return;
    }
    if (!intentional) {
      job.status = "error";
      job.error = explainEngineError(stderr);
      job.message = null;
    }
  });
}

function pickOutput(dir) {
  let best = null;
  let entries = [];
  try { entries = fs.readdirSync(dir); } catch (e) { return null; }
  entries.forEach((name) => {
    if (/\.(part|ytdl|temp)$/i.test(name)) return;
    const p = path.join(dir, name);
    let st;
    try { st = fs.statSync(p); } catch (e) { return; }
    if (!st.isFile() || st.size === 0) return;
    if (!best || st.size > best.size) best = { path: p, size: st.size };
  });
  return best;
}

function pause(id, cfg) {
  const job = jobs.get(id);
  if (!job) return { ok: false, code: "not-found" };
  if (job.status !== "downloading" && job.status !== "starting") {
    return { ok: false, code: "bad-state", message: "This download isn't running." };
  }
  job.pauseRequested = true;
  engine.killTree(job.child);
  return { ok: true, job: publicJob(job) };
}

function resume(id, cfg) {
  const job = jobs.get(id);
  if (!job) return { ok: false, code: "not-found" };
  if (job.status !== "paused") return { ok: false, code: "bad-state", message: "This download isn't paused." };
  job.pauseRequested = false;
  job.message = "Resuming…";
  run(job, cfg);
  return { ok: true, job: publicJob(job) };
}

function cancel(id) {
  const job = jobs.get(id);
  if (!job) return { ok: false, code: "not-found" };
  job.cancelRequested = true;
  engine.killTree(job.child);
  if (job.status !== "downloading" && job.status !== "starting") {
    job.status = "cancelled";
    job.message = "Cancelled";
    try { fs.rmSync(job.dir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  }
  return { ok: true };
}

function remove(id, cfg) {
  const job = jobs.get(id);
  if (!job) return { ok: false, code: "not-found" };
  if (job.filePath) { try { fs.unlinkSync(job.filePath); } catch (e) { /* ignore */ } }
  try { fs.rmSync(job.dir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  jobs.delete(id);
  return { ok: true };
}

function get(id) {
  const job = jobs.get(id);
  return job ? publicJob(job) : null;
}

function list() {
  return Array.from(jobs.values())
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(publicJob);
}

/* On boot, pick up files from a previous run so history survives a restart. */
function restore(cfg) {
  let dirs = [];
  try { dirs = fs.readdirSync(cfg.downloadDir); } catch (e) { return 0; }
  let n = 0;
  dirs.forEach((name) => {
    const dir = path.join(cfg.downloadDir, name);
    if (jobs.has(name)) return;
    let st;
    try { st = fs.statSync(dir); } catch (e) { return; }
    if (!st.isDirectory()) return;
    const file = pickOutput(dir);
    if (!file) return;
    n += 1;
    jobs.set(name, {
      id: name, dir, url: "", host: "", title: name.replace(/ \[[^\]]+\]\.[a-z0-9]+$/i, ""),
      quality: "", qualityLabel: "Saved earlier", status: "done", percent: 100,
      downloaded: file.size, total: file.size, speed: null, eta: null,
      filePath: file.path, fileName: path.basename(file.path), fileSize: file.size,
      error: null, message: "Download complete", createdAt: st.mtime.toISOString(),
      finishedAt: st.mtime.toISOString(), restored: true, streams: new Map(), children: []
    });
  });
  return n;
}

module.exports = { createJob, run, pause, resume, cancel, remove, get, list, restore, activeCount, publicJob, fmtBytes };
