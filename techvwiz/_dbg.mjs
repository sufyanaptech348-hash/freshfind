import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";
const EXEC = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: EXEC, headless: "new", args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
page.on("pageerror", e => console.log("PAGEERROR:", String(e).split("\n")[0]));
page.on("console", m => { const t = m.text(); if (!/net::|Failed to load|THREE|Favicon/.test(t)) console.log("CONSOLE:", m.type(), t.split("\n")[0].slice(0, 160)); });
await page.setViewport({ width: 1440, height: 900 });
await page.goto("file:///C:/Users/GMP/OneDrive/Desktop/techvwiz/progress .html", { waitUntil: "load" });
await new Promise(r => setTimeout(r, 3000));
console.log(await page.evaluate(() => ({
  catalogueCards: document.querySelectorAll(".catalogue-card").length,
  seasonArticles: document.querySelectorAll("article.product-item").length,
  gridChildren: document.getElementById("catalogue-grid")?.children.length,
  widget: !!document.getElementById("ffbWidget"),
  buttons: document.querySelectorAll(".ffb-btn").length,
  api: typeof window.FreshFindBookmarks,
  listLength: (() => { try { return window.FreshFindBookmarks.list().length; } catch (e) { return "err " + e.message; } })()
})));
await browser.close();
