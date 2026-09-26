import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const EXEC = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);

const PAGE = "file:///C:/Users/GMP/OneDrive/Desktop/techvwiz/market.html";

const browser = await puppeteer.launch({ executablePath: EXEC, headless: "new", args: ["--allow-file-access-from-files"] });

for (const w of [1600, 1280, 1024, 820, 700, 480, 375]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: 900 });
  await page.goto(PAGE, { waitUntil: "load" });
  await new Promise(r => setTimeout(r, 700));
  const out = await page.evaluate(() => {
    const open = document.getElementById("openMenu");
    open && open.click();
    const link = [...document.querySelectorAll(".ff-menu-links a")]
      .find(a => a.textContent.includes("MARKET DIRECTORY"));
    const pv = document.getElementById("ffVideoPreview");
    if (!link) return { err: "link missing" };
    // simulate scrolling the overlay content to its worst case
    const mc = document.querySelector(".ff-menu-content");
    if (mc) mc.scrollTop = mc.scrollHeight;
    const l = link.getBoundingClientRect();
    const v = pv.getBoundingClientRect();
    return {
      font: getComputedStyle(link).fontSize,
      link: [Math.round(l.left), Math.round(l.top), Math.round(l.right), Math.round(l.bottom)],
      video: [Math.round(v.left), Math.round(v.top), Math.round(v.right), Math.round(v.bottom)],
      overlapX: Math.round(Math.max(0, Math.min(l.right, v.right) - Math.max(l.left, v.left))),
      overlapY: Math.round(Math.max(0, Math.min(l.bottom, v.bottom) - Math.max(l.top, v.top))),
    };
  });
  out.clash = out.overlapX > 0 && out.overlapY > 0;
  console.log(w, JSON.stringify(out));
  if (w === 1600 || w === 480) {
    await page.screenshot({ path: `shot-${w}.png` });
  }
  await page.close();
}
await browser.close();
