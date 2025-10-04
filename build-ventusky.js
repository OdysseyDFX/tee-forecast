// build-ventusky.js — Generates a Ventusky redirect page for the NEXT tee time
// Output: /tee-forecast/index.html → opens Ventusky at correct date/time, zoomed on The Oxfordshire

import fs from "fs/promises";

// ---- Config ----
const DATA_URL    = "https://gist.githubusercontent.com/OdysseyDFX/d442348046a1a5f66bf882fb8a7e2d51/raw/iggolf.json";
const OUTPUT_DIR  = "tee-forecast";
const OUTPUT_FILE = `${OUTPUT_DIR}/index.html`;

// The Oxfordshire Golf Club (precise)
const LAT   = 51.72987;
const LON   = -1.01528;
const ZOOM  = 15;          // 14–16 works well for course view
const LAYER_PATH = "rain"; // path layer (e.g., "rain", "temperature", "wind"); use "rain" to match your widget

// ---- Helpers ----
const pad2 = n => String(n).padStart(2, "0");

// ---- Main ----
const res = await fetch(DATA_URL);
const data = await res.json();

const teeISO = data?.nextTee?.whenISO;
if (!teeISO) throw new Error("No next tee time found in JSON");

const dUTC = new Date(teeISO);
// Build UTC date/hour for Ventusky PATH format
const dateUTC = `${dUTC.getUTCFullYear()}-${pad2(dUTC.getUTCMonth()+1)}-${pad2(dUTC.getUTCDate())}`;
const hourUTC = pad2(dUTC.getUTCHours());

// ✅ Use PATH for date/hour/coords/zoom/layer (this enforces zoom + layer on iOS)
// Also add t= as a query param for belt-and-braces time targeting, plus play=0.
const base = `https://www.ventusky.com/${dateUTC}/${hourUTC}/${LAT}/${LON}/${ZOOM}/${LAYER_PATH}`;
const q = new URLSearchParams({
  t: `${dUTC.getUTCFullYear()}${pad2(dUTC.getUTCMonth()+1)}${pad2(dUTC.getUTCDate())}/${pad2(dUTC.getUTCHours())}`,
  play: "0",
  _: Date.now().toString() // cache-buster while testing
});
const ventuskyURL = `${base}?${q.toString()}`;

// Build the redirect page
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