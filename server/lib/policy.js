"use strict";
/*
 * SnapVid policy layer.
 *
 * This is the part that keeps the product honest. Every request goes through
 * checkUrl() and then checkInfo(); the download itself is only allowed to start
 * if both pass. Nothing here ever touches cookies, tokens, logins or DRM keys —
 * when a source needs any of that, SnapVid refuses instead of working around it.
 */

/* Sources that are DRM-protected / paywalled by design. We refuse them up front
   so the user gets an honest answer instead of a broken download. */
const BLOCKED_HOSTS = [
  /(^|\.)netflix\./i,
  /(^|\.)primevideo\./i,
  /(^|\.)hotstar\./i,
  /(^|\.)disneyplus\./i,
  /(^|\.)hulu\./i,
  /(^|\.)tv\.apple\./i,
  /(^|\.)music\.apple\./i,
  /(^|\.)spotify\./i,
  /(^|\.)tidal\./i,
  /(^|\.)deezer\./i,
  /(^|\.)audible\./i,
  /(^|\.)udemy\./i,
  /(^|\.)skillshare\./i
];

function fail(code, message, hint) {
  return { ok: false, code, message, hint: hint || "Check the URL or try another supported source." };
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch (err) {
    return "";
  }
}

function hostMatches(host, pattern) {
  const p = String(pattern).toLowerCase().replace(/^www\./, "");
  return host === p || host.endsWith("." + p);
}

/* ---------------------------------------------------------------- URL gate -- */
function checkUrl(rawUrl, cfg) {
  const url = String(rawUrl || "").trim();
  if (!url) return fail("invalid-url", "That link looks empty.", "Paste a video link to continue.");
  if (url.length > 2048) return fail("invalid-url", "That link is too long to be a video URL.");

  let parsed;
  try {
    parsed = new URL(/^[a-z]+:\/\//i.test(url) ? url : "https://" + url);
  } catch (err) {
    return fail("invalid-url", "We couldn't read that link.", "Check the URL — it should start with https://.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return fail("invalid-url", "Only http and https links are supported.");
  }
  if (!parsed.hostname.includes(".")) {
    return fail("invalid-url", "We couldn't read that link.", "Check the URL or try another supported source.");
  }

  const host = hostnameOf(parsed.href);
  for (const re of BLOCKED_HOSTS) {
    if (re.test(host + ".")) {
      return fail(
        "drm",
        "This source is DRM-protected.",
        "SnapVid doesn't bypass DRM or paywalls. Use the source's own download option, if it has one."
      );
    }
  }

  const allowed = ((cfg && cfg.allowedHosts) || []).filter(Boolean);
  if (allowed.length && !allowed.some((p) => hostMatches(host, p))) {
    return fail(
      "not-allowed-host",
      "This server isn't set up for that source.",
      "Allowed sources: " + allowed.join(", ")
    );
  }

  return { ok: true, url: parsed.href, host };
}

/* ----------------------------------------------------- what the engine saw -- */
/* info = the JSON yt-dlp returns for a link. */
function checkInfo(info, cfg) {
  if (!info || typeof info !== "object") {
    return fail("extract-failed", "We couldn't process this link.");
  }

  if (info._type === "playlist" || Array.isArray(info.entries)) {
    const n = Array.isArray(info.entries) ? info.entries.length : 0;
    return fail(
      "playlist",
      "That's a playlist" + (n ? " of " + n + " videos" : "") + ", not a single video.",
      "SnapVid handles one video at a time — open the video you want and paste that link."
    );
  }

  if (info.is_live) {
    return fail(
      "live",
      "This is a live stream.",
      "Live streams have no final file to save. Try again once the broadcast has ended."
    );
  }

  const availability = String(info.availability || "");
  if (availability === "needs_auth" || availability === "needs_subscription") {
    return fail(
      "login-required",
      "This video needs a login or a subscription.",
      "SnapVid never signs in for you and doesn't bypass access controls."
    );
  }
  if (availability === "premium" || availability === "rented" || availability === "purchased") {
    return fail(
      "rental",
      "This title is paid or rented content.",
      "SnapVid only works with videos you're allowed to download."
    );
  }
  if (availability === "private") {
    return fail("login-required", "This video is private.", "SnapVid can't access private media.");
  }

  const formats = (info.formats || []).filter((f) => f && (f.vcodec !== "none" || f.acodec !== "none"));
  if (formats.length && formats.every((f) => f.has_drm)) {
    return fail("drm", "Every format of this video is DRM-protected.", "SnapVid doesn't bypass DRM.");
  }
  if (!formats.length) {
    return fail("unavailable", "No downloadable formats were found for this video.");
  }

  const max = Number((cfg && cfg.maxDurationSeconds) || 0);
  if (max > 0 && Number(info.duration) > max) {
    const h = Math.round(max / 3600);
    return fail("too-long", "This video is longer than this server allows.", "Limit: " + h + " hours.");
  }

  return { ok: true };
}

/* ------------------------------------------- turn engine errors into copy -- */
/* yt-dlp messages we can explain to a human. Order matters. */
const ERROR_MAP = [
  [/sign in to confirm|login required|cookies|account|members-only|join this channel/i, "login-required",
    "This video needs a signed-in account.",
    "SnapVid doesn't use your logins or cookies, so it can't fetch this one."],
  [/confirm your age|age-restricted|inappropriate/i, "login-required",
    "This video is age-restricted.",
    "Restricted media isn't something SnapVid works around."],
  [/private video|this video is private/i, "login-required",
    "This video is private."],
  [/drm|protected by widevine|encrypted/i, "drm",
    "This video is DRM-protected.",
    "SnapVid doesn't bypass DRM."],
  [/premieres in|not available yet|upcoming/i, "unavailable",
    "This video hasn't been published yet."],
  [/video unavailable|removed|deleted|no longer available|404/i, "unavailable",
    "This video is unavailable."],
  [/unsupported url|no suitable extractor|not a valid url/i, "unsupported",
    "We don't support this source."],
  [/timed out|timeout|temporary failure|connection reset|network|getaddrinfo|ssl/i, "network",
    "We couldn't reach that source."],
  [/http error 5\d\d|server error/i, "server-busy",
    "The source is having trouble right now.",
    "Try again in a moment."]
];

function explainEngineError(stderr, fallbackMessage) {
  const text = String(stderr || "");
  for (const [re, code, message, hint] of ERROR_MAP) {
    if (re.test(text)) return fail(code, message, hint);
  }
  return fail("extract-failed", fallbackMessage || "We couldn't process this link.");
}

module.exports = { checkUrl, checkInfo, explainEngineError, hostnameOf, BLOCKED_HOSTS };
