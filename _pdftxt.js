

const fs = require('fs');
const zlib = require('zlib');

const src = process.argv[2];
if (!src) {
  console.error('usage: node _pdftxt.js <file.pdf>');
  process.exit(1);
}

const buf = fs.readFileSync(src);
const latin = buf.toString('latin1');

const objRe = /(\d+)\s+0\s+obj[\s\S]{0,600}?\/Length\s+(\d+)[\s\S]{0,200}?>>\s*stream\r?\n/g;

const pages = [];
let ok = 0;
let bad = 0;
let m;

while ((m = objRe.exec(latin)) !== null) {
  const num = parseInt(m[1], 10);
  const len = parseInt(m[2], 10);
  const start = m.index + m[0].length;

  if (!len || start + len > buf.length) { bad++; continue; }

  let text;
  try {
    text = zlib.inflateSync(buf.slice(start, start + len)).toString('latin1');
  } catch (e) {
    bad++;
    continue;
  }
  ok++;

  if (!/\bTJ\b|\bTj\b/.test(text)) continue;

  const chunks = [];
  
  const tre = /\((?:\\.|[^\\()])*\)|-?[\d.]+|\bTJ\b|\bTj\b|\bTd\b|\bTD\b|\bT\*\b|\bET\b|\bTm\b/g;
  let t;
  let cur = '';

  while ((t = tre.exec(text)) !== null) {
    const tok = t[0];

    if (tok[0] === '(') {
      cur += tok.slice(1, -1)
        .replace(/\\([nrtbf()\\])/g, (s, c) => ({ n: '\n', r: '\r', t: '\t' }[c] ?? c))
        .replace(/\\([0-7]{1,3})/g, (s, o) => String.fromCharCode(parseInt(o, 8)));
    } else if (tok === 'TJ' || tok === 'Tj') {
      
    } else if (/^-?[\d.]+$/.test(tok)) {
      
    } else {
      
      if (cur.trim()) chunks.push(cur.trim());
      cur = '';
    }
  }
  if (cur.trim()) chunks.push(cur.trim());

  const body = chunks
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();

  if (body) pages.push({ num, body });
}

pages.sort((a, b) => a.num - b.num);
console.error(`inflated: ${ok}, skipped: ${bad}, text streams: ${pages.length}`);
console.log(pages.map((p) => p.body).join('\n\n'));


