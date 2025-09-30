import fs from "fs/promises";
import fetch from "node-fetch";

const GIST_URL = process.env.GIST_URL;           // <- comes from secret
if (!GIST_URL) throw new Error("Missing GIST_URL env var.");

const LAT = 51.730, LON = -1.037, ZOOM = 10, LAYER = "rain-3h";
const pad = n => String(n).padStart(2, "0");

const res = await fetch(GIST_URL);
if (!res.ok) throw new Error(`Failed to fetch gist: ${res.status}`);
const data = await res.json();

const tee = data.nextTee || data.todayTee;
if (!tee?.whenISO) throw new Error("nextTee.whenISO not found");

const d = new Date(tee.whenISO); // UTC
const tParam = `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}/${pad(d.getUTCHours())}`;
const src = `https://embed.ventusky.com/?p=${LAT};${LON};${ZOOM}&l=${LAYER}&t=${tParam}`;

const html = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
<iframe src="${src}" style="border:0;width:100%;height:100vh" allowfullscreen></iframe>`;

await fs.mkdir("site", { recursive: true });
await fs.writeFile("site/index.html", html, "utf-8");
console.log("Ventusky embed:", src);
