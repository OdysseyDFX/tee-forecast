// build-ventusky.js — Redirect to Ventusky at the next tee time
// Uses query params for time (reliable) + dual zoom hints (p=…;ZOOM and z=…)
// Output: tee-forecast/index.html

import fs from "fs/promises";

// ---- Config ----
const DATA_URL    = "https://gist.githubusercontent.com/OdysseyDFX/d442348046a1a5f66bf882fb8a7e2d51/raw/iggolf.json";
const OUTPUT_DIR  = "tee-forecast";
const OUTPUT_FILE = `${OUTPUT_DIR}/index.html`;

// The Oxfordshire
const LAT   = 51.72987;
const LON   = -1.01528;
const ZOOM  = 15;          // try 14–16
const LAYER = "rain-1h";   // 1‑hour precipitation

// ---- Helpers ----
const pad2 = n => String(n).padStart(2, "0");

// ---- Main ----
const res = await fetch(DATA_URL);
const data = await res.json();

const teeISO = data?.nextTee?.whenISO;
if (!teeISO) throw new Error("No next tee time found in JSON");

// Build UTC time params (Ventusky expects UTC hour)
const d = new Date(teeISO);
const yyyy = d.getUTCFullYear();
const mm   = pad2(d.getUTCMonth() + 1);
const dd   = pad2(d.getUTCDate());
const HH   = pad2(d.getUTCHours());

// Query-style URL (time reliable) + dual zoom hints
const q = new URLSearchParams({
  p: `${LAT};${LON};${ZOOM}`,          // location + zoom (hint #1)
  l: LAYER,
  t: `${yyyy}${mm}${dd}/${HH}`,        // classic time param
  d: `${yyyy}-${mm}-${dd}`,            // UI date param (iOS-friendly)
  h: HH,                               // UI hour param (iOS-friendly)
  z: String(ZOOM),                     // zoom hint #2
  play: "0",
  _: Date.now().toString()             // cache buster
});

const ventuskyURL = `https://www.ventusky.com/?${q.toString()}`;

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
  <p><small>Tee (UTC): ${teeISO}</small></p>
</body>
</html>`;

await fs.mkdir(OUTPUT_DIR, { recursive: true });
await fs.writeFile(OUTPUT_FILE, html);

console.log("✅ Redirect page generated:", OUTPUT_FILE);
console.log("➡️ ", ventuskyURL);