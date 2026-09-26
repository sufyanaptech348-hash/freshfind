import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const EXEC = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const BASE = "file:///C:/Users/GMP/OneDrive/Desktop/techvwiz/";
const browser = await puppeteer.launch({ executablePath: EXEC, headless: "new", args: ["--allow-file-access-from-files"] });

const pages = ["vegmarketdirectory.html", "marketfind.html", "progress .html", "index.html",
  "subpages/vegmarketdirectory.html", "Seasonal.html", "Market.html", "chat.html", "contact.html",
  "about.html", "dairymarketdirectory.html", "fruit marketdiriectory.html", "subpages/dairymarketdirectory.html"];

for (const file of pages) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e).split("\n")[0]));
  page.on("console", m => { if (m.type() === "error" && !/net::ERR|Failed to load resource/.test(m.text())) errors.push("console: " + m.text().split("\n")[0]); });
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + file, { waitUntil: "load" });
  await new Promise(r => setTimeout(r, 4000));

  const out = await page.evaluate(() => {
    const widget = document.getElementById("ffbWidget");
    const styleLoaded = [...document.styleSheets].some(s => (s.href || "").includes("bookmark-widget.css"));
    const buttons = document.querySelectorAll(".ffb-btn:not(.ffb-btn-inline)");
    const kinds = [...document.querySelectorAll(".ffb-item")].map(n => n.querySelector(".ffb-kind")?.textContent);
    return {
      widget: !!widget,
      styleLoaded,
      injectedButtons: buttons.length,
      firstTitle: buttons[0]?.closest("[data-open],.market-card,.catalogue-card,.product-item")?.querySelector("h2,h3")?.textContent?.trim() || null,
      emptyState: !!document.querySelector(".ffb-empty"),
      count: document.getElementById("ffbCount")?.textContent,
      api: typeof window.FreshFindBookmarks
    };
  });

  // exercise: bookmark the first two detected items, add a note, read the export text
  const flow = await page.evaluate(async () => {
    const btns = [...document.querySelectorAll(".ffb-btn:not(.ffb-btn-inline)")].slice(0, 2);
    btns.forEach(b => b.click());
    if (!btns.length) document.getElementById("ffbPageSave").click();   // page-level bookmark
    document.getElementById("ffbLauncher").click();
    await new Promise(r => setTimeout(r, 350));
    const area = document.querySelector(".ffb-note");
    if (area) { area.value = "Ask for the crate deal"; area.dispatchEvent(new Event("input", { bubbles: true })); }
    const stored = JSON.parse(sessionStorage.getItem("ffBookmarkNotes") || "{}");
    const persistent = JSON.parse(localStorage.getItem("ffBookmarks") || "[]");
    return {
      panelOpen: document.getElementById("ffbWidget").classList.contains("is-open"),
      items: document.querySelectorAll(".ffb-item").length,
      titles: [...document.querySelectorAll(".ffb-item-title")].map(n => n.textContent),
      tabs: [...document.querySelectorAll(".ffb-tab")].map(n => n.textContent),
      noteInSession: Object.values(stored),
      persistedKinds: persistent.map(i => i.kind),
      exported: window.FreshFindBookmarks.text().split("\n").slice(0, 12),
      social: [...document.querySelectorAll(".ffb-social a")].map(a => a.title + " -> " + a.href.slice(0, 46)),
      summary: document.getElementById("ffbSummary").textContent
    };
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `_ffb-${file.replace(/[\\/ ]/g, "_")}.png` });
  console.log("\n=== " + file);
  console.log("  boot:", JSON.stringify(out));
  console.log("  flow:", JSON.stringify(flow, null, 1).replace(/\n\s*/g, " "));
  if (errors.length) console.log("  ERRORS:", errors.slice(0, 4));
  await page.close();
}
/* ---------- focused check: heart <-> bookmark widget two-way sync ---------- */
{
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e).split("\n")[0]));
  page.on("console", m => { if (m.type() === "error" && !/net::ERR|Failed to load resource/.test(m.text())) errors.push("console: " + m.text().split("\n")[0]); });
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + "marketfind.html", { waitUntil: "load" });
  await new Promise(r => setTimeout(r, 500));
  // start from a clean slate so the note/export assertions are meaningful
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: "load" });
  await new Promise(r => setTimeout(r, 4000));

  const out = await page.evaluate(async () => {
    const first = document.querySelector(".market-card");
    const name = first.querySelector("h3").textContent.trim();
    const heart = first.querySelector(".save-btn");
    const tag = first.querySelector(".ffb-btn");
    const id = "market:find:" + heart.getAttribute("data-id");
    const snapshot = () => ({
      heart: heart.textContent.trim(),
      heartSaved: heart.classList.contains("is-saved"),
      heartLabel: heart.getAttribute("aria-label"),
      tagSaved: tag.classList.contains("is-active"),
      tagPressed: tag.getAttribute("aria-pressed"),
      inList: window.FreshFindBookmarks.has(id)
    });
    const step = {};
    step.initial = snapshot();

    // 1) tap the HEART -> must appear in the bookmark widget
    heart.click();
    step.afterHeart = snapshot();
    step.listTitle = window.FreshFindBookmarks.list().find(x => x.id === id)?.title ?? null;
    step.widgetCount = document.getElementById("ffbCount").textContent;
    step.controlsPerCard = first.querySelectorAll(".save-btn").length + "+" + first.querySelectorAll(".ffb-btn").length;

    // 2) add a note through the panel, then export
    document.getElementById("ffbLauncher").click();
    await new Promise(r => setTimeout(r, 300));
    const area = [...document.querySelectorAll(".ffb-item")].map(n => ({ id: n.querySelector(".ffb-note"), t: n.querySelector(".ffb-item-title").textContent }))
      .find(x => x.t === name);
    if (area) { area.id.value = "Ring the bell for the crate deal"; area.id.dispatchEvent(new Event("input", { bubbles: true })); }
    step.noteSessionOnly = JSON.parse(sessionStorage.getItem("ffBookmarkNotes") || "{}")[id] ?? null;
    step.noteInLocalStorage = JSON.stringify(JSON.parse(localStorage.getItem("ffBookmarks") || "[]").map(x => x.note ?? "ABSENT"));
    step.exportHasMarket = window.FreshFindBookmarks.text().includes("FAVOURITE MARKETS") && window.FreshFindBookmarks.text().includes(name);
    step.exportHasNote = window.FreshFindBookmarks.text().includes("Ring the bell for the crate deal");
    step.social = document.querySelectorAll(".ffb-social a").length;
    document.getElementById("ffbClose").click();

    // 3) tap the widget's own TAG on the same card -> heart must follow
    tag.click();
    await new Promise(r => setTimeout(r, 250));
    step.afterTag = snapshot();

    // 4) re-save via tag, then confirm heart repainted through the change event
    tag.click();
    await new Promise(r => setTimeout(r, 250));
    step.afterTagAgain = snapshot();
    step.singleEntry = window.FreshFindBookmarks.list().filter(x => x.id === id).length;
    return step;
  });

  // 5) reload -> persistence + no legacy store
  await page.reload({ waitUntil: "load" });
  await new Promise(r => setTimeout(r, 3000));
  const after = await page.evaluate(() => {
    const first = document.querySelector(".market-card");
    const heart = first.querySelector(".save-btn");
    const id = "market:find:" + heart.getAttribute("data-id");
    return {
      persistedInList: window.FreshFindBookmarks.has(id),
      heartSavedAfterReload: heart.classList.contains("is-saved"),
      heartGlyph: heart.textContent.trim(),
      legacyStore: sessionStorage.getItem("freshfind:saved"),
      notesAfterReload: Object.keys(JSON.parse(sessionStorage.getItem("ffBookmarkNotes") || "{}")).length
    };
  });
  await page.screenshot({ path: "_ffb-sync-marketfind.png" });
  // capture the market cards themselves to check the 🔖 / chip / heart layout
  await page.evaluate(() => {
    const c = document.querySelector(".market-card");
    c.scrollIntoView({ block: "center" });
  });
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: "_ffb-sync-cards.png" });
  const layout = await page.evaluate(() => {
    const card = document.querySelector(".market-card");
    const chip = card.querySelector(".mc-area-chip");
    const tag = card.querySelector(".ffb-btn");
    const heart = card.querySelector(".save-btn");
    const r = n => { const b = n.getBoundingClientRect(); return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom) }; };
    const overlaps = (a, b) => !(a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t);
    const chipBox = r(chip), tagBox = r(tag), heartBox = r(heart);
    return {
      chip: chipBox, tag: tagBox, heart: heartBox,
      tagOverlapsChip: overlaps(tagBox, chipBox),
      heartOverlapsTag: overlaps(heartBox, tagBox),
      heartOverlapsChip: overlaps(heartBox, chipBox),
      tagAnimation: getComputedStyle(tag).animationName,
      heartTransition: getComputedStyle(heart).transitionProperty
    };
  });
  console.log("\n=== LAYOUT market cards");
  console.log(JSON.stringify(layout, null, 1));
  // mobile check
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: "_ffb-sync-cards-mobile.png" });
  console.log("\n=== SYNC marketfind.html");
  console.log(JSON.stringify({ ...out, ...after, errors: errors.slice(0, 4) }, null, 1));
  await page.close();
}

await browser.close();
