"use strict";
/* Thin wrapper around the download engine (yt-dlp) — analyse + spawn helpers. */

const { spawn } = require("child_process");

function engineBin(cfg) {
  return { cmd: cfg.engine.cmd || "python3", args: cfg.engine.args || ["-m", "yt_dlp"] };
}

/* Shared flags. --no-playlist keeps a pasted playlist link from turning into a
   batch; the progress template gives us machine-readable numbers instead of
   scraping the pretty progress bar. */
function baseArgs(cfg) {
  const a = ["--no-playlist", "--no-warnings", "--no-cache-dir", "--ignore-config"];
  if (cfg.cookiesFile) a.push("--cookies", cfg.cookiesFile); /* opt-in, user-supplied only */
  return a;
}

const PROGRESS_PREFIX = "@@SNAP@@";
const PROGRESS_TEMPLATE =
  PROGRESS_PREFIX +
  "%(progress.status)s|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|" +
  "%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s|%(progress.filename)s";

/* ------------------------------------------------------------------ analyse -- */
function analyze(url, cfg, timeoutMs) {
  return new Promise((resolve) => {
    const bin = engineBin(cfg);
    const args = bin.args.concat(baseArgs(cfg), ["-J", "--no-progress", url]);
    let out = "";
    let err = "";
    let done = false;

    const child = spawn(bin.cmd, args, { windowsHide: true });
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      try { killTree(child); } catch (e) { /* ignore */ }
      resolve({ ok: false, stderr: "timed out", timedOut: true });
    }, timeoutMs || 120000);

    child.stdout.on("data", (d) => { out += d.toString(); if (out.length > 40e6) killTree(child); });
    child.stderr.on("data", (d) => { err += d.toString().slice(0, 8000); });
    child.on("error", (e) => {
      if (done) return;
      done = true; clearTimeout(timer);
      resolve({ ok: false, stderr: e.message, missingEngine: e.code === "ENOENT" });
    });
    child.on("close", (code) => {
      if (done) return;
      done = true; clearTimeout(timer);
      if (code !== 0) return resolve({ ok: false, stderr: err, code });
      try {
        const json = JSON.parse(out);
        resolve({ ok: true, info: json });
      } catch (e) {
        resolve({ ok: false, stderr: err || "engine returned no data" });
      }
    });
  });
}

/* --------------------------------------------------------------- download -- */
function formatSelector(quality) {
  if (quality === "audio") {
    return "bestaudio[ext=m4a]/bestaudio/best";
  }
  const h = parseInt(quality, 10) || 720;
  /* Prefer a plain MP4 so the file plays everywhere, then fall back to whatever
     the source has. Never above the requested height. */
  return (
    "bestvideo[height<=" + h + "][ext=mp4]+bestaudio[ext=m4a]/" +
    "bestvideo[height<=" + h + "]+bestaudio/" +
    "best[height<=" + h + "]/best"
  );
}

function startDownload(job, cfg) {
  const bin = engineBin(cfg);
  const args = bin.args.concat(baseArgs(cfg), [
    "--newline",
    "--progress",
    "--progress-template", "download:" + PROGRESS_TEMPLATE,
    "--continue",
    "--no-part", /* keep the partial file under its final name so resume is obvious */
    "-f", formatSelector(job.quality),
    "--merge-output-format", "mp4",
    "-o", require("path").join(job.dir, "%(title).120B [%(id)s].%(ext)s")
  ]);
  /* Only ask for a container conversion when the source format can actually go
     into MP4 — otherwise the whole download would be reported as failed. */
  if (job.remux) args.push("--remux-video", "mp4");
  if (job.quality === "audio") args.push("-x", "--audio-format", "m4a", "--audio-quality", "0");
  args.push(job.url);

  const child = spawn(bin.cmd, args, { windowsHide: true, detached: process.platform !== "win32" });
  return { child, cmd: bin.cmd, args };
}

function killTree(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  try {
    if (process.platform !== "win32" && child.pid) process.kill(-child.pid, "SIGTERM");
    else child.kill("SIGTERM");
  } catch (e) {
    try { child.kill("SIGTERM"); } catch (e2) { /* already gone */ }
  }
}

/* Parse one --progress-template line into numbers we can show. */
function parseProgressLine(line) {
  const i = line.indexOf(PROGRESS_PREFIX);
  if (i === -1) return null;
  const parts = line.slice(i + PROGRESS_PREFIX.length).split("|");
  if (parts.length < 7) return null;
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  return {
    status: parts[0],
    downloaded: num(parts[1]),
    total: num(parts[2]) || num(parts[3]),
    speed: num(parts[4]),
    eta: num(parts[5]),
    filename: parts.slice(6).join("|").trim()
  };
}

/* ------------------------------------------------------------- engine info -- */
function probe(cfg) {
  return new Promise((resolve) => {
    const bin = engineBin(cfg);
    const child = spawn(bin.cmd, bin.args.concat(["--version"]), { windowsHide: true });
    let out = "", err = "";
    child.stdout.on("data", (d) => { out += d.toString(); });
    child.stderr.on("data", (d) => { err += d.toString(); });
    child.on("error", (e) => resolve({ ok: false, error: e.message }));
    child.on("close", (code) => {
      resolve(code === 0
        ? { ok: true, version: out.trim() }
        : { ok: false, error: (err || "exit " + code).trim().slice(0, 300) });
    });
  });
}

function probeFfmpeg() {
  return new Promise((resolve) => {
    const child = spawn("ffmpeg", ["-version"], { windowsHide: true });
    let out = "";
    child.stdout.on("data", (d) => { out += d.toString(); });
    child.on("error", () => resolve({ ok: false }));
    child.on("close", (code) => resolve({ ok: code === 0, version: (out.split("\n")[0] || "").trim() }));
  });
}

module.exports = {
  analyze, startDownload, killTree, parseProgressLine, probe, probeFfmpeg,
  formatSelector, PROGRESS_PREFIX
};
