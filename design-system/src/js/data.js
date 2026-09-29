/* ==========================================================================
   SnapVid — content layer: icons, realistic media data, states, design notes
   ========================================================================== */
const SV = (() => {
  const s = (d, extra = "") => `<svg class="sv-ico" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  return {
    /* ---- Mark: arrow whose head is a play triangle (matches brand assets) ---- */
    mark(size = 22, fill = "currentColor") {
      return `<svg class="sv-ico" width="${size}" height="${size}" viewBox="0 0 128 128" aria-hidden="true"><path d="M32 59 L96 59 L64 106 Z" fill="${fill}" stroke="${fill}" stroke-width="0" /><rect x="53.5" y="15" width="21" height="52" rx="10.5" fill="${fill}"/></svg>`;
    },
    link: s(`<path d="M10.5 13.5 13.5 10.5"/><path d="M8 16l-1.5 1.5a3.5 3.5 0 0 1-5-5L6 8"/><path d="M16 8l1.5-1.5a3.5 3.5 0 0 1 5 5L18 16" transform="translate(0 0)"/>`),
    /* cleaner link glyph */
    chain: s(`<path d="M9.5 14.5 14.5 9.5"/><path d="M7.5 11 6 12.5a3.6 3.6 0 0 0 5 5l1.5-1.5"/><path d="M16.5 13l1.5-1.5a3.6 3.6 0 0 0-5-5L11.5 8"/>`),
    clipboard: s(`<rect x="8" y="3.5" width="8" height="4" rx="1.6"/><path d="M16 6.5h1.6A1.4 1.4 0 0 1 19 7.9v11.2A1.4 1.4 0 0 1 17.6 20.5H6.4A1.4 1.4 0 0 1 5 19.1V7.9A1.4 1.4 0 0 1 6.4 6.5H8"/><path d="M9 13.5h6M9 17h4"/>`),
    x: s(`<path d="M7 7l10 10M17 7L7 17"/>`),
    gear: s(`<circle cx="12" cy="12" r="3.1"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6h.09A1.7 1.7 0 0 0 10.6 3.05V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 16.1 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 20.4 9v.09a1.7 1.7 0 0 0 1.55 1H22a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" transform="scale(.86) translate(2 2)"/>`),
    home: s(`<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19Z"/><path d="M9.5 20.5V14h5v6.5"/>`),
    download: s(`<path d="M12 4v10"/><path d="m7.5 10 4.5 4.5L16.5 10"/><path d="M5 19.5h14"/>`),
    play: s(`<path d="M8.5 5.5 18 12l-9.5 6.5Z" fill="currentColor" stroke-width="0"/>`, 'width="20" height="20"'),
    pause: s(`<rect x="7.5" y="6" width="3.4" height="12" rx="1.4" fill="currentColor" stroke-width="0"/><rect x="13.1" y="6" width="3.4" height="12" rx="1.4" fill="currentColor" stroke-width="0"/>`, 'width="20" height="20"'),
    search: s(`<circle cx="11" cy="11" r="6.2"/><path d="m16 16 4 4"/>`),
    sliders: s(`<path d="M5 8h14M5 16h14"/><circle cx="9.5" cy="8" r="2.1" fill="var(--bg)"/><circle cx="14.5" cy="16" r="2.1" fill="var(--bg)"/>`),
    filter: s(`<path d="M4 6h16M7 12h10M10 18h4"/>`),
    dots: s(`<circle cx="12" cy="5.5" r="1.5" fill="currentColor" stroke-width="0"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke-width="0"/><circle cx="12" cy="18.5" r="1.5" fill="currentColor" stroke-width="0"/>`),
    share: s(`<path d="M12 15V4"/><path d="m8.5 7.5 3.5-3.5 3.5 3.5"/><path d="M6 13v5.5A1.5 1.5 0 0 0 7.5 20h9A1.5 1.5 0 0 0 18 18.5V13"/>`),
    folder: s(`<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h3.2l1.6 2H18.5A1.5 1.5 0 0 1 20 10.5v7A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z"/>`),
    trash: s(`<path d="M5 7.5h14"/><path d="M9.5 7.5V6a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 6v1.5"/><path d="M6.5 7.5 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4A1.5 1.5 0 0 0 16.7 19l.8-11.5"/>`),
    edit: s(`<path d="M15.5 4.5 19.5 8.5"/><path d="M4 20l1-4.5L16 4.5 19.5 8 8.5 19Z"/>`),
    check: s(`<path d="m5 12.5 4.5 4.5L19 7.5" stroke-width="2.4"/>`, 'width="20" height="20"'),
    chev: s(`<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>`, 'width="18" height="18"'),
    chevL: s(`<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>`, 'width="18" height="18"'),
    back: s(`<path d="m14.5 5-7 7 7 7"/>`, 'width="20" height="20" stroke-width="1.9"'),
    clock: s(`<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>`),
    bolt: s(`<path d="M13.5 3 5.5 13.5H11L10.5 21 18.5 10.5H13Z" fill="currentColor" stroke-width="0"/>`),
    bell: s(`<path d="M6.5 10a5.5 5.5 0 1 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10Z"/><path d="M10 19a2 2 0 0 0 4 0"/>`),
    globe: s(`<circle cx="12" cy="12" r="8.2"/><path d="M3.8 12h16.4M12 3.8c2.4 2.4 2.4 14 0 16.4-2.4-2.4-2.4-14 0-16.4Z"/>`),
    shield: s(`<path d="M12 3.5 19 6v6c0 4-3 7.2-7 8.5-4-1.3-7-4.5-7-8.5V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>`),
    info: s(`<circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.5M12 8.2v.6"/>`),
    alert: s(`<path d="M12 4.5 21 19.5H3Z"/><path d="M12 10v4.2M12 17.2v.4"/>`),
    wifiOff: s(`<path d="M4 8.5a14 14 0 0 1 8-3.2M20 8.5a14 14 0 0 0-3.4-2"/><path d="M7 12a10 10 0 0 1 3.2-1.3M17 12c-.5-.4-1-.7-1.6-1"/><path d="M10.5 15.2c.9-.5 2-.5 3 0"/><path d="M12 18.5v.2"/><path d="m4 4 16 16"/>`),
    server: s(`<rect x="4" y="4.5" width="16" height="6" rx="2"/><rect x="4" y="13.5" width="16" height="6" rx="2"/><path d="M8 7.5h.01M8 16.5h.01"/>`),
    globeOff: s(`<circle cx="12" cy="12" r="8.2"/><path d="m5 5 14 14"/>`),
    film: s(`<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M8 4.5v15M16 4.5v15M3.5 9.5h17M3.5 14.5h17"/>`),
    music: s(`<path d="M9 17.5V6.2l9-1.7v11.3"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="15.5" cy="15.8" r="2.5"/>`),
    subtitle: s(`<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M7 11h4M13 11h4M7 14.5h5M14 14.5h3"/>`),
    sparkle: s(`<path d="M12 4l1.6 4.6L18 10l-4.4 1.4L12 16l-1.6-4.6L6 10l4.4-1.4Z" fill="currentColor" stroke-width="0"/>`),
    lock: s(`<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.4"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>`),
    cloud: s(`<path d="M7.5 18.5h9.2a3.8 3.8 0 0 0 .3-7.58A5.3 5.3 0 0 0 7.1 9.2 3.9 3.9 0 0 0 7.5 18.5Z"/>`),
    refresh: s(`<path d="M19 12a7 7 0 1 1-2.2-5.1"/><path d="M19.5 4.5V9H15"/>`),
    plus: s(`<path d="M12 5.5v13M5.5 12h13"/>`),
    eye: s(`<path d="M2.8 12S6 6.5 12 6.5 21.2 12 21.2 12 18 17.5 12 17.5 2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.8"/>`),
    external: s(`<path d="M14 5.5h4.5V10"/><path d="M18.5 5.5 11 13"/><path d="M17 14.5v3.4a1.6 1.6 0 0 1-1.6 1.6H6.1A1.6 1.6 0 0 1 4.5 17.9V8.6A1.6 1.6 0 0 1 6.1 7h3.4"/>`),
    copy: s(`<rect x="8.5" y="8.5" width="11" height="11" rx="2.2"/><path d="M15.5 8.5v-1A2.5 2.5 0 0 0 13 5H6.5A2.5 2.5 0 0 0 4 7.5V14a2.5 2.5 0 0 0 2.5 2.5h1"/>`),
    chart: s(`<path d="M4 19.5h16"/><path d="M7 19.5V13M12 19.5V8M17 19.5v-4.5"/>`),
    moon: s(`<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.8 7.8 0 1 0 9.5 9.5Z"/>`),
    sun: s(`<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>`),
    monitor: s(`<rect x="3" y="4.5" width="18" height="12" rx="2.2"/><path d="M9 20h6M12 16.5V20"/>`),
    phone: s(`<rect x="7" y="3" width="10" height="18" rx="2.6"/><path d="M11 18.5h2"/>`),
    android: s(`<path d="M6.5 10.5h11v6.2a1.3 1.3 0 0 1-1.3 1.3H7.8a1.3 1.3 0 0 1-1.3-1.3Z"/><path d="M6.5 10.5a5.5 5.5 0 0 1 11 0"/><path d="M8 5.5 6.8 4M16 5.5 17.2 4M4.5 11.5v5M19.5 11.5v5M9.8 7.8h.01M14.2 7.8h.01"/>`),
    tablet: s(`<rect x="4.5" y="3" width="15" height="18" rx="2.4"/><path d="M11 18.2h2"/>`),
    laptop: s(`<rect x="5" y="4.5" width="14" height="10" rx="1.8"/><path d="M2.5 18h19"/>`),
    layers: s(`<path d="M12 3.5 20 8l-8 4.5L4 8Z"/><path d="m4 12.5 8 4.5 8-4.5"/>`),
    cut: s(`<path d="M4 18 18 4"/><path d="M4 6l14 14"/><circle cx="7" cy="7" r="2.4"/><circle cx="7" cy="17" r="2.4"/>`),
    speed: s(`<path d="M12 20a8 8 0 1 1 8-8"/><path d="M12 12l4.5-3.5"/>`),
    order: s(`<path d="M4 7h12M4 12h9M4 17h6"/><path d="m17 15 3 3-3 3" transform="translate(0 -4)"/>`),
    appleLogo: `<svg class="sv-ico" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.1 12.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.3-.1-2.5.8-3.2.8-.6 0-1.7-.8-2.8-.7-1.4 0-2.7.8-3.5 2.1-1.5 2.6-.4 6.4 1 8.5.7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.6 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.2-.9-2.2-3.2ZM14 5.7c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2Z"/></svg>`,
    androidLogo: `<svg class="sv-ico" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.6 9.5H6.4c-.5 0-.9.4-.9.9v5.7c0 1.3 1.1 2.4 2.4 2.4h.9v2.3c0 .7.5 1.2 1.2 1.2s1.2-.5 1.2-1.2v-2.3h1.6v2.3c0 .7.5 1.2 1.2 1.2s1.2-.5 1.2-1.2v-2.3h.9c1.3 0 2.4-1.1 2.4-2.4v-5.7c0-.5-.4-.9-.9-.9ZM3.6 9.9c-.7 0-1.2.5-1.2 1.2v4.3c0 .7.5 1.2 1.2 1.2s1.2-.5 1.2-1.2v-4.3c0-.7-.5-1.2-1.2-1.2Zm16.8 0c-.7 0-1.2.5-1.2 1.2v4.3c0 .7.5 1.2 1.2 1.2s1.2-.5 1.2-1.2v-4.3c0-.7-.5-1.2-1.2-1.2ZM15.3 3.6l.9-1.6c.1-.1 0-.2-.1-.3-.1-.1-.2 0-.3.1l-.9 1.6c-1.7-.7-3.7-.7-5.4 0L8.6 1.8c-.1-.1-.2-.2-.3-.1-.1.1-.2.2-.1.3l.9 1.6C6.4 4.9 4.6 7.1 4.4 9.6h15.2c-.2-2.5-2-4.7-4.3-6ZM9.3 7.5c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7Zm5.4 0c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7Z"/></svg>`,
  };
})();

/* ------------------------------- MEDIA ---------------------------------- */
const VIDEOS = {
  iceland: {
    id: "iceland", title: "Iceland From Above — Glaciers, Rivers & Highlands in 4K",
    source: "Northframe Studio", handle: "@northframe", dur: "12:04", thumb: "thumb-iceland",
    stats: "4.2M views · 2 weeks ago", license: "Creative Commons — the creator allows downloads",
    kind: "video",
    formats: [
      { id: "2160", label: "2160p", badge: "4K", size: "412 MB", fmt: "MP4 · H.264", meta: "3840×2160 · 60 fps", tag: "Best quality" },
      { id: "1080", label: "1080p", badge: "HD", size: "168 MB", fmt: "MP4 · H.264", meta: "1920×1080 · 60 fps" },
      { id: "720", label: "720p", badge: "HD", size: "84 MB", fmt: "MP4 · H.264", meta: "1280×720 · 30 fps", tag: "Recommended" },
      { id: "480", label: "480p", size: "38 MB", fmt: "MP4 · H.264", meta: "854×480 · 30 fps", tag: "Saves data" },
      { id: "360", label: "360p", size: "21 MB", fmt: "MP4 · H.264", meta: "640×360 · 30 fps" },
      { id: "audio", label: "Audio", badge: "M4A", size: "11 MB", fmt: "M4A · AAC 192 kbps", meta: "Audio only", kind: "audio" },
    ],
  },
  pasta: {
    id: "pasta", title: "Creamy Garlic Pasta in 15 Minutes — One Pan Recipe",
    source: "Weeknight Kitchen", handle: "@weeknightkitchen", dur: "08:41", thumb: "thumb-pasta",
    stats: "918K views · 5 days ago", license: "Download allowed by publisher",
    kind: "video",
    formats: [
      { id: "1080", label: "1080p", badge: "HD", size: "94 MB", fmt: "MP4 · H.264", meta: "1920×1080 · 30 fps" },
      { id: "720", label: "720p", badge: "HD", size: "47 MB", fmt: "MP4 · H.264", meta: "1280×720 · 30 fps", tag: "Recommended" },
      { id: "480", label: "480p", size: "24 MB", fmt: "MP4 · H.264", meta: "854×480 · 30 fps" },
      { id: "audio", label: "Audio", badge: "M4A", size: "8 MB", fmt: "M4A · AAC 192 kbps", meta: "Audio only", kind: "audio" },
    ],
  },
  tech: {
    id: "tech", title: "M4 MacBook Air Review — 3 Months Later, Still My Main Machine",
    source: "Signal & Syntax", handle: "@signalsyntax", dur: "18:27", thumb: "thumb-tech",
    stats: "2.7M views · 3 weeks ago", license: "Download allowed by publisher",
    kind: "video",
    formats: [
      { id: "2160", label: "2160p", badge: "4K", size: "566 MB", fmt: "MP4 · H.265", meta: "3840×2160 · 60 fps" },
      { id: "1080", label: "1080p", badge: "HD", size: "232 MB", fmt: "MP4 · H.264", meta: "1920×1080 · 60 fps", tag: "Recommended" },
      { id: "720", label: "720p", badge: "HD", size: "112 MB", fmt: "MP4 · H.264", meta: "1280×720 · 30 fps" },
      { id: "480", label: "480p", size: "54 MB", fmt: "MP4 · H.264", meta: "854×480 · 30 fps" },
      { id: "audio", label: "Audio", badge: "M4A", size: "16 MB", fmt: "M4A · AAC 192 kbps", meta: "Audio only", kind: "audio" },
    ],
  },
  music: {
    id: "music", title: "Rooftop Sessions — Live Acoustic Set at Golden Hour",
    source: "Anar & The Blue Hour", handle: "@anarbluehour", dur: "24:12", thumb: "thumb-music",
    stats: "1.1M views · 1 month ago", license: "Artist permits personal downloads",
    kind: "video",
    formats: [
      { id: "1080", label: "1080p", badge: "HD", size: "289 MB", fmt: "MP4 · H.264", meta: "1920×1080 · 30 fps" },
      { id: "720", label: "720p", badge: "HD", size: "148 MB", fmt: "MP4 · H.264", meta: "1280×720 · 30 fps", tag: "Recommended" },
      { id: "audio", label: "Audio", badge: "M4A", size: "29 MB", fmt: "M4A · AAC 256 kbps", meta: "Audio only", kind: "audio" },
    ],
  },
};

const DEMO_URLS = {
  iceland: "northframe.video/watch/iceland-from-above-4k",
  pasta: "weeknightkitchen.tv/recipes/creamy-garlic-pasta",
  tech: "signalsyntax.com/v/m4-macbook-air-review",
  music: "bluehoursessions.fm/live/rooftop-golden-hour",
};

/* ------------------------------- ERRORS --------------------------------- */
const ERRORS = {
  invalid: {
    key: "invalid", tone: "warn", icon: "alert", code: "E·URL",
    title: "We couldn't process this link.",
    body: "Check the URL or try another supported source. Links should start with https:// and point to a video page.",
    actions: ["Try again", "Paste again"],
    hint: "Example: northframe.video/watch/iceland-from-above-4k",
  },
  unsupported: {
    key: "unsupported", tone: "danger", icon: "globeOff", code: "E·SRC",
    title: "This source isn't supported.",
    body: "SnapVid works only with sources that permit downloading. Sites with DRM, paywalls or login-only playback can't be processed.",
    actions: ["Try another link", "See supported sources"],
    hint: "We never bypass DRM, logins or access controls.",
  },
  unavailable: {
    key: "unavailable", tone: "warn", icon: "film", code: "E·404",
    title: "This video isn't available.",
    body: "It may have been removed, made private, or blocked in your region. Try another link or check the source page.",
    actions: ["Try again", "Open source page"],
  },
  permission: {
    key: "permission", tone: "danger", icon: "lock", code: "E·LIC",
    title: "Downloading isn't permitted for this video.",
    body: "The publisher hasn't allowed downloads for this file. SnapVid respects each platform's download rules — no workarounds.",
    actions: ["Understand policy", "Try another link"],
  },
  network: {
    key: "network", tone: "warn", icon: "wifiOff", code: "E·NET",
    title: "You appear to be offline.",
    body: "Check your connection and try again. Your queued downloads will resume automatically when you're back online.",
    actions: ["Retry", "Resume when online"],
  },
  busy: {
    key: "busy", tone: "info", icon: "server", code: "E·503",
    title: "Our servers are busy right now.",
    body: "There's a short queue at the moment. We'll keep your link ready — retry in a few seconds.",
    actions: ["Retry now", "Notify me"],
  },
  filegen: {
    key: "filegen", tone: "danger", icon: "layers", code: "E·PREP",
    title: "We couldn't prepare your file.",
    body: "The video was processed, but the file could not be generated. You can retry, or download a different quality.",
    actions: ["Retry", "Choose another quality"],
  },
};

/* --------------------------- EMPTY STATES ------------------------------- */
const EMPTIES = {
  library: {
    key: "library", art: "tray", title: "No downloads yet",
    body: "Your saved videos will appear here.",
    primary: "Paste a link", secondary: "See how it works",
    note: "Completed downloads are stored on your device and stay private to you.",
  },
  search: {
    key: "search", art: "search", title: "No matches",
    body: "Try a different title, source or file format.",
    primary: "Clear filter", secondary: null,
  },
  wifi: {
    key: "wifi", art: "wifi", title: "Waiting for Wi‑Fi",
    body: "2 downloads are queued. They'll start automatically on a trusted Wi‑Fi network.",
    primary: "Download anyway", secondary: "Turn off Wi‑Fi only",
    note: "Set in Settings → Download → Wi‑Fi only.",
  },
  offline: {
    key: "offline", art: "cloud", title: "You're offline",
    body: "Saved downloads are still available. Reconnect to analyze new links.",
    primary: "Retry", secondary: "Open saved files",
  },
};

/* ------------------------ SUPPORTED SOURCES ----------------------------- */
const SOURCES = [
  { id: "selfhost", name: "Self-hosted / Studio sites", note: "Publisher-enabled downloads" },
  { id: "creativecommons", name: "Creative Commons libraries", note: "Licensed for reuse" },
  { id: "publicdomain", name: "Public domain archives", note: "Free to download" },
  { id: "owncontent", name: "Your own uploads", note: "Account-verified" },
  { id: "business", name: "Business & education portals", note: "With download rights" },
];

const DOWNLOADS = [
  { vid: "iceland", q: "720p", size: "84 MB", fmt: "MP4", when: "today", time: "9:41 AM", status: "complete", group: "Today" },
  { vid: "pasta", q: "1080p", size: "94 MB", fmt: "MP4", when: "today", time: "8:12 AM", status: "complete", group: "Today" },
  { vid: "music", q: "Audio", size: "29 MB", fmt: "M4A", when: "today", time: "7:03 AM", status: "complete", group: "Today" },
  { vid: "tech", q: "1080p", size: "232 MB", fmt: "MP4", when: "yesterday", time: "Yesterday · 6:28 PM", status: "complete", group: "Yesterday" },
  { vid: "iceland", q: "2160p", size: "412 MB", fmt: "MP4", when: "older", time: "24 Sep · 2:19 PM", status: "complete", group: "Older" },
  { vid: "music", q: "720p", size: "148 MB", fmt: "MP4", when: "older", time: "18 Sep · 11:04 AM", status: "complete", group: "Older" },
];

/* --------------------------- STUDIO NOTES ------------------------------- */
const NOTES = {
  splash: {
    title: "Splash", lead: "Cold start, 1.2s maximum. Brand mark, wordmark, one trust line.",
    specs: ["Mark 96px inside a 128px optical box", "Tagline: SF Pro 15/600, --text-2", "Fade + 6px rise, 420ms ease-out", "Auto-advance to Onboarding on first run, Home on return"],
    a11y: ["Respects prefers-reduced-motion (static mark)", "No interactive elements — nothing to focus"],
  },
  onboarding: {
    title: "Onboarding", lead: "Three pages, skippable at any point. Each page teaches one thing.",
    specs: ["Page 1 · Paste a link", "Page 2 · Pick your quality", "Page 3 · Saved & private", "Dots: 7px, active step becomes a 22px pill"],
    a11y: ["48px+ touch targets on Skip / Next", "Page dots announce 'Page 2 of 3'", "Copy is inside an aria-live polite region on change"],
  },
  home: {
    title: "Home", lead: "One job: get a link in, get an answer fast.",
    specs: ["Hero: 33/730, gradient on 'Your way.'", "Field: 60px tall, radius 22px, 4px accent focus ring", "Primary CTA: 56px tall, accent gradient, ink label", "Sources strip: text only, no implied permission"],
    a11y: ["Input has a visible label for screen readers plus a placeholder", "Paste / Clear are 44px icon buttons with aria-labels", "Contrast: white on #08090B = 19.4:1"],
  },
  analyze: {
    title: "URL analysis", lead: "Perceived speed: skeleton appears instantly, real content within ~1.4s.",
    specs: ["Button enters 'Analyzing…' with inline ringlet", "Skeleton blocks use --skeleton shimmer", "Stages: Reading link → Checking source → Fetching formats"],
    a11y: ["aria-busy on the card", "aria-live polite announces each stage", "Cancel is always reachable"],
  },
  preview: {
    title: "Video preview", lead: "Confirm it's the right video before committing to a download.",
    specs: ["Player 16:9, radius 28px, glass play button 62px", "Meta row: duration, source, file info as chips", "Thumbnail fades in with a 620ms blur-up"],
    a11y: ["Titles are real <h1>, not styled spans", "Play button has an aria-label including the video title"],
  },
  quality: {
    title: "Quality selection", lead: "Bottom sheet with a recommended default already selected.",
    specs: ["Row 68px, radius 22px, accent border + tint when checked", "Shows resolution, size, format and a quality badge", "CTA label mirrors the selection: 'Download 720p'"],
    a11y: ["radiogroup semantics, arrow-key navigable", "Selection uses tick + border, never colour alone", "Sheet traps focus and restores it on close"],
  },
  progress: {
    title: "Download progress", lead: "The screen users watch. Everything important is above the fold.",
    specs: ["Ring: 208px, 12px stroke, round caps, glow", "Percent 46/700 tabular numerals", "Live row: size, speed, ETA", "Pause ↔ Resume, Cancel is secondary"],
    a11y: ["Announces on 10% steps, not every tick", "Ring is decorative; the text carries the value", "Pause/Resume swap label AND icon"],
  },
  complete: {
    title: "Download complete", lead: "Small reward, immediate next action.",
    specs: ["Check draws in 520ms, disc springs in", "Halo: radial accent-soft, 900ms", "Actions: Open (primary), Share, Download another"],
    a11y: ["Success announced via role=status", "Actions stay in the thumb zone above the safe area"],
  },
  library: {
    title: "Downloads", lead: "Grouped by time, searchable, with Wi-Fi-aware states.",
    specs: ["Search field + filter chips (All / Video / Audio)", "Groups: Today, Yesterday, Older", "Row: 108px thumb, quality badge, size, date, overflow menu"],
    a11y: ["Overflow menu is a labelled button with a real menu role", "Delete asks for confirmation, undo available in a toast"],
  },
  settings: {
    title: "Settings", lead: "Four sections, each answerable in one tap.",
    specs: ["Appearance: segmented Dark / Light / System", "Download: default quality, format, Wi-Fi only, auto-download", "General: language, notifications, clear history, about", "Privacy: data usage + supported-source policy"],
    a11y: ["Switches are role=switch with aria-checked", "Every destructive action states its consequence"],
  },
  errors: {
    title: "Error states", lead: "Seven realistic failures, each with an icon, plain language and a way forward.",
    specs: ["Tone maps to severity: warn, danger, info", "Pattern: what happened → why → what to do", "Never blame the user; never dead-end"],
    a11y: ["Reaches the user via role=alert", "Tone is carried by icon + text, not colour alone", "Recovery action is the first focusable element"],
  },
  empty: {
    title: "Empty states", lead: "Four situations where there's nothing to show — each still useful.",
    specs: ["Art: single-stroke geometric illustration, accent at 100%", "Headline + one line of body + one primary action", "Educational note where behaviour is non-obvious"],
    a11y: ["Illustrations are aria-hidden", "The primary action is the only button with accent fill"],
  },
  desktop: {
    title: "Desktop website", lead: "Same identity, more air. Centred 1120px container, two-column workbench.",
    specs: ["Top nav: logo, Home, Downloads, Settings, theme + profile", "Hero input centred at 1120px max-width", "Workbench: preview + quality panel left, progress panel right", "Library: 3-up card grid"],
    a11y: ["Focus rings visible on all dark surfaces", "Keyboard: tab order follows visual order", "Hover states mirror mobile pressed states"],
  },
};

const POLICY = {
  short: "Only download videos you own or that the source explicitly permits.",
  long: "SnapVid processes links from sources that allow downloading. It does not bypass DRM, paywalls, login restrictions or platform download limits — links without download rights will show a clear message instead.",
};
