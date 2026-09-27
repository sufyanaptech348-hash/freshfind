/* Live check of the home page additions in a real browser.
   Confirms Quick Find filtering, the rotating highlights, the
   clock/visitor strip, and that the 3D hero still mounts.
   Uses the locally installed Chrome via puppeteer-core. */

import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error('No Chrome or Edge binary found.');
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--allow-file-access-from-files']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const url = 'file:///' + path.resolve(here, 'index.html').replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));

  const report = await page.evaluate(() => {
    const rail = document.getElementById('homeRail');
    const r = rail ? rail.getBoundingClientRect() : null;
    const cs = rail ? getComputedStyle(rail) : null;
    const shoe = document.getElementById('shoe-info');
    const sr = shoe ? shoe.getBoundingClientRect() : null;
    const nav = document.getElementById('freshFindNav');
    const nr = nav ? nav.getBoundingClientRect() : null;
    return {
      railExists: !!rail,
      rail: r ? { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width) } : null,
      railPosition: cs ? cs.position : null,
      canvasMounted: (() => {
        const c = document.getElementById('gl');
        return !!c && c.width > 0;
      })(),
      areaOptions: document.getElementById('hfArea').options.length,
      dayOptions: document.getElementById('hfDay').options.length,
      produceOptions: document.getElementById('hfProduce').options.length,
      slideCount: document.getElementById('hfHighlights').children.length,
      dotCount: document.getElementById('hfDots').children.length,
      activeSlideText: (document.querySelector('.home-highlight.is-active .home-highlight-title') || {}).textContent,
      activeCount: document.querySelectorAll('.home-highlight.is-active').length,
      slideHasBg: (() => {
        const s = document.querySelector('.home-highlight.is-active');
        return s ? getComputedStyle(s).backgroundImage.slice(0, 24) : null;
      })(),
      clock: document.getElementById('hfClock').textContent,
      visitor: document.getElementById('hfVisitor').textContent,
      openNow: document.getElementById('hfOpenNow').textContent,
      shoeInfo: sr ? { left: Math.round(sr.left), right: Math.round(sr.right) } : null,
      nav: nr ? { top: Math.round(nr.top), bottom: Math.round(nr.bottom) } : null,
      overlapsShoeInfo: r && sr ? !(r.right <= sr.left || r.left >= sr.right) : null,
      overlapsNav: r && nr ? !(r.bottom <= nr.top || r.top >= nr.bottom) : null
    };
  });

  console.log('--- initial ---');
  console.log(JSON.stringify(report, null, 2));

  /* Filter by area and confirm the results list updates. */
  const filter = await page.evaluate(async () => {
    const sel = document.getElementById('hfArea');
    sel.value = 'Clifton';
    sel.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 300));
    return {
      status: document.getElementById('hfStatus').textContent,
      results: [...document.querySelectorAll('.home-result-name')].map((n) => n.textContent.trim())
    };
  });
  console.log('--- area=Clifton ---');
  console.log(JSON.stringify(filter, null, 2));

  /* Text search that should match nothing. */
  const noMatch = await page.evaluate(async () => {
    document.getElementById('hfReset').click();
    const q = document.getElementById('hfQuery');
    q.value = 'zzzznotathing';
    q.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 300));
    return {
      status: document.getElementById('hfStatus').textContent,
      empty: !!document.querySelector('.home-result-empty')
    };
  });
  console.log('--- no match ---');
  console.log(JSON.stringify(noMatch, null, 2));

  /* Wait for the rotation to advance. */
  const rotated = await page.evaluate(async () => {
    document.getElementById('hfReset').click();
    const first = document.querySelector('.home-highlight.is-active .home-highlight-title').textContent;
    await new Promise((r) => setTimeout(r, 6500));
    return {
      first,
      second: document.querySelector('.home-highlight.is-active .home-highlight-title').textContent,
      activeCount: document.querySelectorAll('.home-highlight.is-active').length
    };
  });
  console.log('--- rotation ---');
  console.log(JSON.stringify(rotated, null, 2));

  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 800));
  const mobile = await page.evaluate(() => {
    const rail = document.getElementById('homeRail');
    const r = rail.getBoundingClientRect();
    return {
      position: getComputedStyle(rail).position,
      left: Math.round(r.left), right: Math.round(r.right),
      viewport: window.innerWidth,
      overflowsRight: r.right > window.innerWidth + 1
    };
  });
  console.log('--- mobile 390px ---');
  console.log(JSON.stringify(mobile, null, 2));

  await page.screenshot({ path: '_shot-home-desktop.png' });
  await page.screenshot({ path: '_shot-home-mobile.png', fullPage: false });

  console.log('--- page errors ---');
  console.log(errors.length ? errors.join('\n') : '(none)');

  await browser.close();
})();
