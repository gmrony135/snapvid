/*
 * The app is a single self-contained file, so live.js is embedded into
 * index.html. Run this after editing live.js:
 *
 *   cd design-system && node tools/inline-live.js
 */
const fs = require("fs");
const path = require("path");

const app = path.join(__dirname, "..", "..", "index.html");
const live = path.join(__dirname, "..", "..", "live.js");
const START = "/* ============================ live server mode";

let html = fs.readFileSync(app, "utf8");
const source = fs.readFileSync(live, "utf8");
const start = html.indexOf(START);
if (start === -1) throw new Error("live block not found in index.html");
const open = html.lastIndexOf("<script>", start);
const close = html.indexOf("</script>", start);
if (open === -1 || close === -1) throw new Error("script tags around the live block not found");

const before = html.slice(0, open + "<script>\n".length);
const after = html.slice(close);
html = before + source + after;
fs.writeFileSync(app, html);
console.log("inlined live.js → index.html (" + (fs.statSync(app).size / 1024).toFixed(0) + " KB)");
