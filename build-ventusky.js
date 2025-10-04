// build-ventusky.js — Generates a Ventusky redirect page for the next tee time
// Output: /tee-forecast/index.html

import fs from "fs/promises";

// ---- Config ----
const DATA_URL    = "https://gist.githubusercontent.com/OdysseyDFX/d442348046a1a5f66bf882fb8a7e2d51/raw/iggolf.json";
const OUTPUT_DIR  = "tee-forecast";
const OUTPUT_FILE = `${OUTPUT_DIR}/index.html`;

// The Oxfordshire GC
const LAT   = 51.72987;
const LON   = -1.01528;
const ZOOM  = 15;           // try 15 for tighter course view (14–16 are sensible)
const LAYER = "rain-1h";

// ---- Helpers ----
const pad2 = n => String(n).padStart(2, "0");

// ---- Main ----
const res = await fetch(DATA_URL);
const data = await res.json();

const teeISO = data?.nextTee?.whenISO;
if (!teeISO) throw new Error("No next tee time found in JSON");

const d = new Date(teeISO);
// Ventusky wants UTC hour: YYYYMMDD/HH
const tParam = `${d.getUTCFullYear()}${pad2(d.getUTCMonth()+1)}${pad2(d.getUTCDate())}/${pad2(d.getUTCHours())}`;

// ✅ Use PATH for lat;lon;zoom, QUERY for time/layer/flags
const base = `https://www.ventusky.com/${LAT};${LON};${ZOOM}`;
const q = new URLSearchParams({
  l: LAYER,
  t: tParam,
  play: "0",
  _: Date.now().toString()  // cache-buster while testing
});
const ventuskyURL = `${base}?${q.toString()}`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; URL='${ventuskyURL}'" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting to Ventusky…</title>
  <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px}</style>
</head>
<body>
  <p>Redirecting to <a href="${ventuskyURL}">Ventusky at next tee</a>…</p>
  <p><small>Tee time (UTC): ${teeISO}</small></p>
</body>
</html>`;

await fs.mkdir(OUTPUT_DIR, { recursive: true });
await fs.writeFile(OUTPUT_FILE, html);

console.log("✅ Redirect page generated:", OUTPUT_FILE);
console.log("➡️ ", ventuskyURL);