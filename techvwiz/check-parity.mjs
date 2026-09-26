
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const EDGE_CANDIDATES = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

const EXECUTABLE = EDGE_CANDIDATES.find(existsSync);

if (!EXECUTABLE) {
  console.error("No Edge/Chrome found");
  process.exit(1);
}
console.log("browser: " + EXECUTABLE);

const VIEWS = [
  { name: "LOCAL (dev)", url: "http://localhost:5173/" },
  { name: "LIVE (build)", url: "http://localhost:4173/" },
];

const SETTLE_MS = 1600; // scrub:1 + lenis need >1s to settle
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEWPORT_W = 1440;
const VIEWPORT_H = 900;

async function snapAt(page, progress) {
  await page.evaluate(
    (y) => window.scrollTo(0, y),
    Math.round(progress * 3.5 * VIEWPORT_H),
  );
  await wait(SETTLE_MS);
  return page.evaluate(() => {
    const header = document.querySelector(".hero-header");
    const img = document.querySelector(".hero-img");
    const h3 = document.querySelector(".hero-copy h3");
    const words = [...document.querySelectorAll(".hero-copy h3 .word")];
    const r = img.getBoundingClientRect();
    return {
      scrollY: Math.round(window.scrollY),
      headerBottom: Math.round(header.getBoundingClientRect().bottom),
      imgW: Math.round(r.width),
      imgH: Math.round(r.height),
      imgCX: Math.round(r.left + r.width / 2),
      imgCY: Math.round(r.top + r.height / 2),
      radius: Math.round(parseFloat(getComputedStyle(img).borderTopLeftRadius)),
      copyOp: +(+getComputedStyle(h3).opacity).toFixed(2),
      words: words.map((w) => +(+getComputedStyle(w).opacity).toFixed(1)),
      wordCount: words.length,
    };
  });
}

async function probe(view) {
  const browser = await puppeteer.launch({
    executablePath: EXECUTABLE,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_W, height: VIEWPORT_H });

  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console: " + m.text());
  });
  page.on("requestfailed", (r) =>
    errors.push("requestfailed: " + r.url().slice(0, 120)),
  );

  const report = {
    name: view.name,
    url: view.url,
    errors,
    snaps: {},
    columns: null,
    outro: null,
  };

  try {
    await page.goto(view.url, { waitUntil: "load", timeout: 30000 });
    await page.waitForSelector(".hero-img", { timeout: 10000 });
    await page.waitForFunction(
      () => document.querySelectorAll(".hero-copy h3 .word").length === 7,
      { timeout: 10000 },
    );
    await wait(1200);

    for (const p of [0, 0.3, 0.45, 0.6, 0.7, 1]) {
      report.snaps[p] = await snapAt(page, p);
    }

  
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(3.75 * VIEWPORT_H));
    await wait(SETTLE_MS);
    report.columns = await page.evaluate(() => {
      const y = (id) => {
        const t = getComputedStyle(document.getElementById(id)).transform;
        return t === "none" ? 0 : Math.round(new DOMMatrix(t).m42);
      };
      return {
        col1: y("about-imgs-col-1"),
        col2: y("about-imgs-col-2"),
        col3: y("about-imgs-col-3"),
        col4: y("about-imgs-col-4"),
      };
    });

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await wait(SETTLE_MS);
    report.outro = await page.evaluate(() => {
      const r = document.querySelector(".outro").getBoundingClientRect();
      return { visible: r.top < innerHeight && r.bottom > 0, top: Math.round(r.top) };
    });
  } catch (e) {
    errors.push("probe failed: " + e.message);
  }

  await browser.close();
  return report;
}

function assertPhases(rep) {
  const fails = [];
  const s = rep.snaps;
  if (!s[0] || !s[1]) return ["missing snapshots (script did not run)"];

  if (s[0].wordCount !== 7) fails.push(`word count ${s[0].wordCount} != 7`);
  if (Math.abs(s[0].headerBottom - VIEWPORT_H) > 4)
    fails.push(`p0 headerBottom ${s[0].headerBottom} != ${VIEWPORT_H}`);
  if (s[0.3].headerBottom > 5)
    fails.push(`p0.3 header not exited: bottom=${s[0.3].headerBottom}`);
  if (s[0.6].copyOp < 0.95) fails.push(`p0.6 copy faded early: ${s[0.6].copyOp}`);
  if (s[0.7].copyOp > 0.05) fails.push(`p0.7 copy not faded: ${s[0.7].copyOp}`);

  const w = s[0.45].words;
  const lit = w.filter((o) => o > 0.9).length;
  const dark = w.filter((o) => o < 0.1).length;
  if (!(lit > 0 && dark > 0)) fails.push(`p0.45 word reveal not mid-flight: [${w}]`);

  const one = s[1];
  if (Math.abs(one.imgW - 150) > 6 || Math.abs(one.imgH - 150) > 6)
    fails.push(`p1 image ${one.imgW}x${one.imgH} != 150x150`);
  if (Math.abs(one.imgCX - VIEWPORT_W / 2) > 8)
    fails.push(`p1 centerX ${one.imgCX} != ${VIEWPORT_W / 2}`);
  if (Math.abs(one.imgCY - VIEWPORT_H / 2) > 8)
    fails.push(`p1 centerY ${one.imgCY} != ${VIEWPORT_H / 2}`);
  if (one.radius < 9) fails.push(`p1 radius ${one.radius} < 10`);

  const c = rep.columns;
  const ratio =
    Math.abs((1000 - c.col1) / (500 - c.col2));
  if (!(c.col1 < c.col2 && c.col1 < 0 && c.col2 < 0 && Math.abs(ratio - 2) < 0.25))
    fails.push(`parallax not layered 2:1: ${JSON.stringify(c)} ratio=${ratio.toFixed(2)}`);
  if (!rep.outro.visible) fails.push("outro not visible at end");
  if (rep.errors.length)
    fails.push(
      `${rep.errors.length} errors: ` + rep.errors.slice(0, 3).join(" | "),
    );
  return fails;
}

const results = [];
for (const v of VIEWS) {
  console.log(`\nprobing ${v.name} ${v.url} ...`);
  results.push(await probe(v));
}

console.log("\n================ RESULTS ================");
for (const r of results) {
  console.log(`\n--- ${r.name} (${r.url}) ---`);
  console.log(JSON.stringify(r.snaps, null, 1));
  console.log("columns:", JSON.stringify(r.columns));
  console.log("outro:", JSON.stringify(r.outro));
  console.log("errors:", r.errors.length ? r.errors : "none");
  const fails = assertPhases(r);
  console.log(
    fails.length ? "FAILS:\n - " + fails.join("\n - ") : "ALL PHASE CHECKS PASSED",
  );
}

const [a, b] = results;
const diffs = [];
if (a.snaps[0] && b.snaps[0]) {
  for (const p of Object.keys(a.snaps)) {
    for (const k of ["headerBottom", "imgW", "imgH", "imgCX", "imgCY", "radius", "copyOp"]) {
      const d = Math.abs(Number(a.snaps[p][k]) - Number(b.snaps[p][k]));
      if (d > 4) diffs.push(`p${p}.${k}: ${a.snaps[p][k]} vs ${b.snaps[p][k]} (Δ${d})`);
    }
    const wd = a.snaps[p].words.some(
      (o, i) => Math.abs(o - b.snaps[p].words[i]) > 0.15,
    );
    if (wd) diffs.push(`p${p}.words: [${a.snaps[p].words}] vs [${b.snaps[p].words}]`);
  }
  for (const k of Object.keys(a.columns)) {
    const d = Math.abs(a.columns[k] - b.columns[k]);
    if (d > 6) diffs.push(`columns.${k}: ${a.columns[k]} vs ${b.columns[k]} (Δ${d})`);
  }
} else {
  diffs.push("a probe failed before snapshots");
}

console.log("\n================ PARITY ================");
console.log(
  diffs.length
    ? "MISMATCHES:\n - " + diffs.join("\n - ")
    : "DEV AND LIVE BEHAVIOUR IDENTICAL",
);
process.exit(diffs.length ? 1 : 0);
