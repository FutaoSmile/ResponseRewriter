#!/usr/bin/env node
/* Generates icon48.png and icon128.png — a rounded indigo square with a white "R".
   Pure Node.js, no external dependencies. */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT = path.join(__dirname, "..", "src", "icons");
fs.mkdirSync(OUT, { recursive: true });

/* ---------- tiny PNG encoder ---------- */
function crc32(buf) {
  let c;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const h = Buffer.alloc(8);
  h.writeUInt32BE(data.length, 0);
  t.copy(h, 4);
  const full = Buffer.concat([h, data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc32(full), 0);
  return Buffer.concat([h.slice(4), data, c]);
}

function makePng(w, h, pixels) {
  /* pixels: flat RGBA, top-to-bottom */
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  ihdr[9] = 6; /* 8-bit RGBA */

  const raw = [];
  for (let y = 0; y < h; y++) {
    raw.push(0); /* filter: None */
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      raw.push(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]);
    }
  }
  const deflated = zlib.deflateSync(Buffer.from(raw));

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), /* signature */
    chunk("IHDR", ihdr),
    chunk("IDAT", deflated),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- drawing helpers ---------- */
function rgba(r, g, b, a) { return [r, g, b, a]; }

function blend(fg, bg) {
  const fa = fg[3] / 255;
  return [
    Math.round(fg[0] * fa + bg[0] * (1 - fa)),
    Math.round(fg[1] * fa + bg[1] * (1 - fa)),
    Math.round(fg[2] * fa + bg[2] * (1 - fa)),
    255,
  ];
}

/* ---------- "R" letter pixel mask (6×10 grid within the icon) ---------- */
/*    012345
   0  XXXX..
   1  X...X.
   2  X...X.
   3  X...X.
   4  XXXX..
   5  X.X...
   6  X..X..
   7  X..X..
   8  X...X.
   9  X...X.   */
const R_MASK = [
  [1,1,1,1,0,0],
  [1,0,0,0,1,0],
  [1,0,0,0,1,0],
  [1,0,0,0,1,0],
  [1,1,1,1,0,0],
  [1,0,1,0,0,0],
  [1,0,0,1,0,0],
  [1,0,0,1,0,0],
  [1,0,0,0,1,0],
  [1,0,0,0,1,0],
];

const BRAND = rgba(79, 70, 229, 255);  /* indigo-600 */
const WHITE = rgba(255, 255, 255, 255);

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const pad = Math.round(size * 0.18);
  const inner = size - pad * 2;

  /* rounded-rect corner radius */
  const r = Math.round(size * 0.22);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let alpha = 1;
      /* top-left */
      if (x < pad + r && y < pad + r) {
        const dx = (pad + r) - x, dy = (pad + r) - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        alpha = d > r ? 0 : d > r - 0.5 ? (r - d) + 0.5 : 1;
      }
      /* top-right */
      else if (x >= size - pad - r && y < pad + r) {
        const dx = x - (size - pad - r - 1), dy = (pad + r) - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        alpha = d > r ? 0 : d > r - 0.5 ? (r - d) + 0.5 : 1;
      }
      /* bottom-left */
      else if (x < pad + r && y >= size - pad - r) {
        const dx = (pad + r) - x, dy = y - (size - pad - r - 1);
        const d = Math.sqrt(dx * dx + dy * dy);
        alpha = d > r ? 0 : d > r - 0.5 ? (r - d) + 0.5 : 1;
      }
      /* bottom-right */
      else if (x >= size - pad - r && y >= size - pad - r) {
        const dx = x - (size - pad - r - 1), dy = y - (size - pad - r - 1);
        const d = Math.sqrt(dx * dx + dy * dy);
        alpha = d > r ? 0 : d > r - 0.5 ? (r - d) + 0.5 : 1;
      }
      /* outside bounds */
      else if (x < pad || x >= size - pad || y < pad || y >= size - pad) {
        alpha = 0;
      }

      const [cr, cg, cb] = BRAND;
      const off = (y * size + x) * 4;
      pixels[off] = cr;
      pixels[off + 1] = cg;
      pixels[off + 2] = cb;
      pixels[off + 3] = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
    }
  }

  /* draw "R" letter */
  const glyphW = 6, glyphH = 10;
  const glyphPadX = Math.round((size - glyphW * (inner / glyphW)) / 2);
  const glyphPadY = Math.round((size - glyphH * (inner / glyphH)) / 2);
  const cellW = (size - glyphPadX * 2) / glyphW;
  const cellH = (size - glyphPadY * 2) / glyphH;

  for (let gy = 0; gy < glyphH; gy++) {
    for (let gx = 0; gx < glyphW; gx++) {
      if (!R_MASK[gy][gx]) continue;
      const x0 = Math.round(glyphPadX + gx * cellW);
      const y0 = Math.round(glyphPadY + gy * cellH);
      const x1 = Math.round(glyphPadX + (gx + 1) * cellW);
      const y1 = Math.round(glyphPadY + (gy + 1) * cellH);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          if (x < 0 || x >= size || y < 0 || y >= size) continue;
          const off = (y * size + x) * 4;
          const bg = [pixels[off], pixels[off + 1], pixels[off + 2], pixels[off + 3]];
          const fg = [WHITE[0], WHITE[1], WHITE[2], Math.round(255 * 0.92)];
          const out = blend(fg, bg);
          pixels[off] = out[0];
          pixels[off + 1] = out[1];
          pixels[off + 2] = out[2];
          pixels[off + 3] = out[3];
        }
      }
    }
  }

  return makePng(size, size, pixels);
}

["icon-16", "icon-32", "icon-48", "icon-128"].forEach(function (name) {
  const size = parseInt(name.split("-")[1], 10);
  fs.writeFileSync(path.join(OUT, name + ".png"), drawIcon(size));
  console.log("Generated " + name + ".png");
});
