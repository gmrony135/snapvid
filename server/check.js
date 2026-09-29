"use strict";
/*
 * SnapVid doctor — checks that the server can actually do its job.
 *
 *   node check.js              engine + policy self-tests
 *   node check.js <video url>  ...plus one real end-to-end download
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const engine = require("./lib/engine");
const policy = require("./lib/policy");
const { cfg } = require("./server");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (extra ? "  → " + extra : "")); }
}

async function main() {
  console.log("\nSnapVid doctor\n");

  console.log("engine");
  const ytdlp = await engine.probe(cfg);
  ok("yt-dlp installed", ytdlp.ok, ytdlp.error || "pip install yt-dlp");
  if (ytdlp.ok) console.log("      version " + ytdlp.version);
  const ffmpeg = await engine.probeFfmpeg();
  ok("ffmpeg installed (needed to merge / extract audio)", ffmpeg.ok, "apt install ffmpeg");
  if (ffmpeg.ok) console.log("      " + ffmpeg.version);

  console.log("\npolicy — what SnapVid refuses");
  const allowed = policy.checkUrl("https://archive.org/details/BigBuckBunny_124", cfg);
  ok("plain allowed link accepted", allowed.ok === true, JSON.stringify(allowed));

  const cases = [
    ["netflix.com/watch/123 → DRM refusal", "https://www.netflix.com/watch/123", "drm"],
    ["primevideo.com → DRM refusal", "https://www.primevideo.com/detail/x", "drm"],
    ["spotify.com → DRM refusal", "https://open.spotify.com/track/abc", "drm"],
    ["not-a-url → invalid", "hello world", "invalid-url"],
    ["ftp:// → invalid", "ftp://example.com/v.mp4", "invalid-url"]
  ];
  cases.forEach(([name, url, code]) => {
    const r = policy.checkUrl(url, cfg);
    ok(name, r.ok === false && r.code === code, "got " + r.code);
  });

  const infoCases = [
    ["playlist → refused", { _type: "playlist", entries: [1, 2, 3] }, "playlist"],
    ["live stream → refused", { _type: "video", is_live: true, formats: [{ vcodec: "h264", acodec: "aac" }] }, "live"],
    ["private video → refused", { availability: "private", formats: [{ vcodec: "h264", acodec: "aac" }] }, "login-required"],
    ["needs subscription → refused", { availability: "needs_subscription", formats: [{ vcodec: "h264", acodec: "aac" }] }, "login-required"],
    ["rented title → refused", { availability: "rented", formats: [{ vcodec: "h264", acodec: "aac" }] }, "rental"],
    ["all formats DRM → refused", { formats: [{ has_drm: true, vcodec: "h264", acodec: "aac" }] }, "drm"],
    ["long video → refused", { duration: 99999, formats: [{ vcodec: "h264", acodec: "aac" }] }, "too-long"]
  ];
  infoCases.forEach(([name, info, code]) => {
    const r = policy.checkInfo(info, cfg);
    ok(name, r.ok === false && r.code === code, "got " + r.code);
  });
  const good = policy.checkInfo({ duration: 300, formats: [{ vcodec: "h264", acodec: "aac", height: 720 }] }, cfg);
  ok("normal video accepted", good.ok === true, JSON.stringify(good));

  console.log("\nengine error copy");
  const e1 = policy.explainEngineError("ERROR: Sign in to confirm your age. Use --cookies-from-browser");
  ok("login wall → friendly refusal", e1.code === "login-required", e1.code);
  const e2 = policy.explainEngineError("ERROR: This video is DRM protected");
  ok("DRM error → friendly refusal", e2.code === "drm", e2.code);

  console.log("\nformat selector");
  ok("720p prefers mp4+aac", /bestvideo\[height<=720\]\[ext=mp4\]/.test(engine.formatSelector("720")));
  ok("audio uses bestaudio", /bestaudio/.test(engine.formatSelector("audio")));

  if (process.argv[2]) {
    const url = process.argv[2];
    console.log("\nend-to-end download of " + url);
    const gate = policy.checkUrl(url, cfg);
    ok("url passes policy", gate.ok === true, gate.message);

    const a = await engine.analyze(gate.url, cfg, 120000);
    ok("analysis works", a.ok === true, a.stderr && a.stderr.split("\n")[0]);
    if (a.ok) {
      const check = policy.checkInfo(a.info, cfg);
      ok("source is allowed to download", check.ok === true, check.message);
      console.log("      title: " + (a.info.title || "?"));
      console.log("      license: " + (a.info.license || "not stated by the source"));

      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapvid-check-"));
      const job = { id: "check", dir: tmp, url: gate.url, quality: "360", qualityLabel: "360p" };
      const { child } = engine.startDownload(job, cfg);
      const started = Date.now();
      const code = await new Promise((resolve) => child.on("close", resolve));
      const secs = ((Date.now() - started) / 1000).toFixed(1);
      ok("download finished", code === 0, "exit " + code);
      const files = fs.readdirSync(tmp).filter((f) => !/\.(part|ytdl)$/.test(f));
      ok("file written", files.length > 0, tmp);
      files.forEach((f) => console.log("      " + f + "  " + (fs.statSync(path.join(tmp, f)).size / 1048576).toFixed(1) + " MB in " + secs + "s"));
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  } else {
    console.log("\ntip: node check.js <url>  runs a real download to prove it works end-to-end");
  }

  console.log("\n" + pass + " passed, " + fail + " failed\n");
  process.exit(fail ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
