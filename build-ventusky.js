// build-ventusky.js — Generates a Ventusky redirect page for the next tee time
// Output: /tee-forecast/index.html → redirects to ventusky.com at the correct time/location

import fs from "fs/promises";

// ---- Config ----
const DATA_URL = "https://gist.githubusercontent.com/OdysseyDFX/d442348046a1a5f66bf882fb8a7e2d51/raw/iggolf.json";
const OUTPUT_FILE = "tee-forecast/index.html";
const ZOOM_LEVEL = 13;

// ---- Helpers ----
function formatDateYYYYMMDD(date) {
  return date.toISOString().split("T")[0];
}

function pad(num) {
  return num.toString().padStart(2, "0");
}

// ---- Main ----
const res = await fetch(DATA_URL);
const data = await res.json();

const nextTee = data?.nextTee;
if (!nextTee || !nextTee.whenISO) {
  throw new Error("No next tee time found in JSON");
}

const when = new Date(nextTee.whenISO);
const dateStr = formatDateYYYYMMDD(when);
const hourStr = pad(when.getHours());

// Update these coordinates if needed
const latitude = 51.733;
const longitude = -1.037;

const ventuskyURL = `https://www.ventusky.com/${dateStr}/${hourStr}/${latitude}/${longitude}/${ZOOM_LEVEL}/rain`;

const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="refresh" content="0; URL='${ventuskyURL}'" />
    <title>Redirecting to Ventusky Forecast...</title>
  </head>
  <body>
    <p>Redirecting to <a href="${ventuskyURL}">${ventuskyURL}</a></p>
  </body>
</html>
`;

await fs.mkdir("tee-forecast", { recursive: true });
await fs.writeFile(OUTPUT_FILE, html.trim());

console.log("✅ Redirect page generated:", OUTPUT_FILE);
console.log("➡️  " + ventuskyURL);
