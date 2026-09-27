/* One-off helper: adds the FreshFind bookmark widget to a page,
   preserving the original file bytes (BOM / UTF-8) exactly. */
import fs from 'node:fs';

const targets = process.argv.slice(2);
for (const file of targets) {
  const raw = fs.readFileSync(file);
  const hasBom = raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF;
  let html = raw.toString('utf8');
  const depth = file.includes('subpages/') ? '../' : '';
  let changed = false;

  if (!html.includes('bookmark-widget.css')) {
    for (const anchor of [`<link rel="stylesheet" href="${depth}chat-widget.css">`, '<link rel="stylesheet" href="chat-widget.css">']) {
      if (!html.includes(anchor)) continue;
      html = html.replace(anchor, `${anchor}\n<link rel="stylesheet" href="${depth}bookmark-widget.css">`);
      changed = true;
      break;
    }
  }
  if (!html.includes('bookmark-widget.js')) {
    for (const anchor of [`<script src="${depth}chat-widget.js"></script>`, '<script src="chat-widget.js"></script>']) {
      if (!html.includes(anchor)) continue;
      html = html.replace(anchor, `${anchor}\n<script src="${depth}bookmark-widget.js"></script>`);
      changed = true;
      break;
    }
  }
  // Self-contained pages (e.g. Market.html) inline the shared chrome, so fall
  // back to dropping the widget script in just before </body>.
  if (!html.includes('bookmark-widget.js')) {
    const tag = `<script src="${depth}bookmark-widget.js"></script>`;
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${tag}\n</body>`);
      changed = true;
    }
  }
  if (!html.includes('bookmark-widget.css')) {
    const tag = `<link rel="stylesheet" href="${depth}bookmark-widget.css">`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${tag}\n</head>`);
      changed = true;
    }
  }
  if (!changed) { console.log('skip  ' + file); continue; }

  const out = Buffer.concat([hasBom ? Buffer.from([0xEF, 0xBB, 0xBF]) : Buffer.alloc(0), Buffer.from(html, 'utf8')]);
  fs.writeFileSync(file, out);
  const check = fs.readFileSync(file);
  const text = check.toString('utf8');
  console.log(`ok    ${file} | bom=${check[0] === 0xEF} | nonAscii=${(text.match(/[^\x00-\x7F]/g) || []).length} | widget=${text.includes('bookmark-widget.js')}`);
}
