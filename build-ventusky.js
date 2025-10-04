// build-ventusky.js — Generates a Ventusky redirect page for the next tee time
// Output: /tee-forecast/index.html → redirects to ventusky.com at the correct time/location

import fs from "fs/promises";

// ---- Config ----
const DATA_URL    = "https://gist.githubusercontent.com/OdysseyDFX/d442348046a1a5f66bf882fb8a7e2d51/raw/iggolf.json";
const OUTPUT_DIR  = "tee-forecast";
const OUTPUT_FILE = `${OUTPUT_DIR}/index.html`;

// The Oxfordshire Golf Club coordinates
const LAT   = 51.72987;
const LON   = -1.01528;
const ZOOM  = 14;           // 14–15 = golf-course zoom level
const LAYER = "rain-1h";    // 1-hour precipitation layer

// ---- Helpers ----
function pad2(n) {
  return String(n).padStart(2, "0");
}

// ---- Main ----
const res = await fetch(DATA_URL);
const data = await res.json();

const teeISO = data?.nextTee?.whenISO;
if (!teeISO) {
  throw new Error("No next tee time found in JSON");
}

// Convert to UTC-based Ventusky t=YYYYMMDD/HH format
const d = new Date(teeISO);
const tParam = `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}/${pad2(d.getUTCHours())}`;

// Build Ventusky URL with full location + zoom
const query = new URLSearchParams({
  p: `${LAT};${LON};${ZOOM}`,
  l: LAYER,
  t: tParam,
  play: "0",
  _: Date.now().toString() // cache-buster while testing
});
const ventuskyURL = `https://www.ventusky.com/?${query.toString()}`;

// Output HTML redirect page
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; URL='${ventuskyURL}'" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting to Ventusky Forecast…</title>
  <style>
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      padding: 24px;
    }
  </style>
</head>
<body>
  <p>Redirecting to <a href="${ventuskyURL}">Ventusky forecast at next tee time</a>…</p>
  <p><small>Tee time (UTC): ${teeISO}</small></p>
</body>
</html>`;

// Write to disk
await fs.mkdir(OUTPUT_DIR, { recursive: true });
await fs.writeFile(OUTPUT_FILE, html);

console.log("✅ Redirect page generated:", OUTPUT_FILE);
console.log("➡️ ", ventuskyURL);