// build-ventusky.js
// Builds a GitHub Pages site that opens a Ventusky embed at your next tee-time hour.
// Requires repo secret: GIST_URL = https://gist.githubusercontent.com/.../iggolf.json

import fs from "fs/promises";
import fetch from "node-fetch"; // installed in the workflow

// ---- Config ----
const LAT   = 51.730;        // The Oxfordshire
const LON   = -1.037;
const ZOOM  = 10;
const LAYER = "rain-3h";     // try: "wind", "temp-2m", "clouds", "rain", "rain-1h"
// -----------------

const GIST_URL = process.env.GIST_URL;
if (!GIST_URL) {
  console.error("❌ Missing GIST_URL env var (set it as a repo secret).");
  process.exit(1);
}

const pad = (n) => String(n).padStart(2, "0");

function pickTee(data) {
  // Prefer a future nextTee; fall back to todayTee only if nextTee missing.
  const now = Date.now();
  const next = data?.nextTee?.whenISO ? new Date(data.nextTee.whenISO) : null;
  const today = data?.todayTee?.whenISO ? new Date(data.todayTee.whenISO) : null;

  if (next && !Number.isNaN(next.getTime()) && next.getTime() > now) return data.nextTee;
  if (data?.nextTee?.whenISO) return data.nextTee; // even if past, still use it
  if (today) return data.todayTee;

  throw new Error("No usable tee time in JSON (need nextTee.whenISO or todayTee.whenISO).");
}

function toVentuskyTParam(whenISO) {
  // Ventusky expects UTC hour: t=YYYYMMDD/HH
  const d = new Date(whenISO);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid whenISO: ${whenISO}`);
  const yyyy = d.getUTCFullYear();
  const mm   = pad(d.getUTCMonth() + 1);
  const dd   = pad(d.getUTCDate());
  const hh   = pad(d.getUTCHours());
  return { tParam: `${yyyy}${mm}${dd}/${hh}`, d };
}

function humanLocal(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

try {
  // 1) Fetch latest JSON from your (secret) Gist
  const res = await fetch(GIST_URL, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`Failed to fetch Gist JSON: ${res.status} ${res.statusText}`);
  const data = await res.json();

  // 2) Choose tee time and compute Ventusky t=
  const tee = pickTee(data);
  if (!tee?.whenISO) throw new Error("Chosen tee has no whenISO.");
  const { tParam, d } = toVentuskyTParam(tee.whenISO);

  // 3) Compute “days ahead” for warning
  const now = new Date();
  const daysAhead = (d.getTime() - now.getTime()) / 86400000; // ms→days
  const needsFarAheadWarning = daysAhead > 5; // Ventusky embeds often ignore t= if >~5 days ahead

  // 4) Build Ventusky embed URL
  const src = `https://embed.ventusky.com/?p=${LAT};${LON};${ZOOM}&l=${LAYER}&t=${tParam}`;

  // 5) Minimal HTML with banner + warning
  const localLabel = tee?.dateISO && tee?.timeHHMM ? `${tee.dateISO} ${tee.timeHHMM}` : humanLocal(tee.whenISO);
  const warning = needsFarAheadWarning
    ? ` <span class="warn">⚠ Ventusky may show <em>Today</em> when the target is more than ~5 days ahead.</span>`
    : "";
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Tee Forecast</title>
  <style>
    :root { color-scheme: dark; }
    body { margin:0; background:#000; }
    .bar {
      font: 14px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
      color:#eee; background:#111; padding:8px 12px; position:sticky; top:0; z-index:1;
    }
    .bar a { color:#9cf; text-decoration:underline; }
    .warn { color:#ffb84d; margin-left:8px; }
    iframe { border:0; width:100%; height:100vh; }
  </style>
</head>
<body>
  <div class="bar">
    Tee-time target: <strong>${localLabel}</strong> — UTC <strong>${tParam}</strong>${warning}
    &nbsp;|&nbsp; <a href="${src}" target="_blank" rel="noopener">Open raw embed</a>
  </div>
  <iframe src="${src}" allowfullscreen></iframe>
</body>
</html>`;

  // 6) Write site/
  await fs.mkdir("site", { recursive: true });
  await fs.writeFile("site/index.html", html, "utf-8");

  console.log("✅ Built site/index.html");
  console.log("   Ventusky UTC t= ", tParam);
  console.log("   whenISO:         ", tee.whenISO);
  // (deliberately not logging the secret or gist URL)
} catch (err) {
  console.error("❌ build-ventusky failed:", err.message || err);
  process.exit(1);
}
