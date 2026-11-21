// Golden Hour — the cover renderer. Draws the whole poster to any canvas at
// any of the three sizes, from state + loaded photos. No network, no text
// outside the words in state.

import { layoutFor } from './layouts.js';
import { drawPhoto } from './imaging.js';
import { PRESETS } from './state.js';

const BARCODE_DIGITS = '0 42669 2026';

function star(ctx, cx, cy, rOuter, rInner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawStars(ctx, x, y, size, count) {
  ctx.fillStyle = '#ffd23e';
  for (let i = 0; i < count; i++) {
    const cx = x + i * size * 1.25;
    star(ctx, cx, y, size * 0.5, size * 0.22, 5);
    ctx.fill();
  }
}

function fitFont(ctx, text, targetW, family, weight, startPx) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  const w = ctx.measureText(text).width;
  if (w > 0) px = (px * targetW) / w;
  ctx.font = `${weight} ${px}px ${family}`;
  return px;
}

function stripedTitle(ctx, text, cx, capTop, px) {
  const capH = px * 0.72;
  const baseY = capTop + capH;
  // Hard shadow, offset down-right.
  ctx.save();
  ctx.font = `${px}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#1c0b2e';
  ctx.fillText(text, cx + px * 0.03, baseY + px * 0.035);
  // Striped gradient fill.
  const g = ctx.createLinearGradient(0, capTop, 0, capTop + capH);
  g.addColorStop(0.0, '#ffe27a');
  g.addColorStop(0.28, '#ffd23e');
  g.addColorStop(0.3, '#ff9d2e');
  g.addColorStop(0.52, '#ff7a3d');
  g.addColorStop(0.54, '#ff5e8a');
  g.addColorStop(0.74, '#e84fd0');
  g.addColorStop(0.76, '#9b4dff');
  g.addColorStop(1.0, '#7a3cff');
  ctx.lineWidth = Math.max(2, px * 0.055);
  ctx.strokeStyle = '#1c0b2e';
  ctx.lineJoin = 'round';
  ctx.strokeText(text, cx, baseY);
  ctx.fillStyle = g;
  ctx.fillText(text, cx, baseY);
  ctx.restore();
  return { px, capH, baseY };
}

function drawSeal(ctx, seal, line1, line2) {
  const { cx, cy, r } = seal;
  ctx.save();
  ctx.translate(cx, cy);
  const g = ctx.createRadialGradient(0, -r * 0.3, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#ffe27a');
  g.addColorStop(0.6, '#f5b93a');
  g.addColorStop(1, '#c98a1b');
  star(ctx, 0, 0, r, r * 0.82, 14);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.strokeStyle = '#7a4d05';
  ctx.stroke();
  ctx.fillStyle = '#2a1503';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const starR = Math.max(3, r * 0.09);
  star(ctx, 0, -r * 0.52, starR, starR * 0.45, 5);
  ctx.fill();
  const fs1 = fitFont(ctx, line1, r * 1.15, 'Anton, sans-serif', 400, 40);
  ctx.fillText(line1, 0, -r * 0.18);
  fitFont(ctx, line2, r * 1.15, 'Anton, sans-serif', 400, 40);
  ctx.fillText(line2, 0, r * 0.22);
  void fs1;
  star(ctx, 0, r * 0.52, starR, starR * 0.45, 5);
  ctx.fill();
  ctx.restore();
}

function drawBarcode(ctx, box) {
  const { x, y, w, h } = box;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = Math.max(1, w * 0.008);
  ctx.strokeRect(x, y, w, h);
  // Deterministic bars from the digit string.
  let seed = 0;
  for (const ch of BARCODE_DIGITS) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  let s = seed;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const barTop = y + h * 0.1;
  const barBot = y + h * 0.68;
  let bx = x + w * 0.06;
  ctx.fillStyle = '#111111';
  while (bx < x + w * 0.94) {
    const bw = w * (0.012 + rnd() * 0.03);
    if (rnd() > 0.42) ctx.fillRect(bx, barTop, bw, barBot - barTop);
    bx += bw + w * (0.008 + rnd() * 0.02);
  }
  ctx.fillStyle = '#111111';
  ctx.font = `${Math.max(8, h * 0.16)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(BARCODE_DIGITS, x + w / 2, y + h * 0.84);
  ctx.restore();
}

function drawTag(ctx, text, x, y, size, gold) {
  ctx.save();
  ctx.font = `${size}px Anton, sans-serif`;
  const pad = size * 0.45;
  const w = ctx.measureText(text).width + pad * 2;
  const h = size * 1.7;
  ctx.fillStyle = 'rgba(10, 4, 20, 0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = gold ? '#ffd23e' : '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pad, y + h / 2 + size * 0.04);
  ctx.restore();
  return { x, y, w, h };
}

function drawTagRight(ctx, text, cell, y, size) {
  ctx.save();
  ctx.font = `${size}px Anton, sans-serif`;
  const pad = size * 0.45;
  const w = ctx.measureText(text).width + pad * 2;
  const h = size * 1.7;
  const x = cell.x + cell.w - cell.w * 0.03 - w;
  ctx.fillStyle = 'rgba(10, 4, 20, 0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pad, y + h / 2 + size * 0.04);
  ctx.restore();
  return { x, y, w, h };
}

export async function renderCover(canvas, sizeName, state, images) {
  const { w: W, h: H } = { w: canvas.width, h: canvas.height };
  const ctx = canvas.getContext('2d');
  const L = layoutFor(sizeName);
  const preset = PRESETS[state.preset] || PRESETS.golden;
  const t = state.treatment;
  const ink = state.ink;
  const words = state.words;

  // Background + gold frame.
  ctx.fillStyle = '#160a26';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = L.gold;
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.strokeRect(L.frame.x, L.frame.y, L.frame.w, L.frame.h);
  ctx.strokeStyle = 'rgba(217, 164, 65, 0.45)';
  ctx.lineWidth = Math.max(1, W * 0.0012);
  ctx.strokeRect(L.frame.x + W * 0.006, L.frame.y + H * 0.006, L.frame.w - W * 0.012, L.frame.h - H * 0.012);

  // Photos.
  const grainAlpha = 0.05 + t * 0.05;
  for (let i = 0; i < 6; i++) {
    const cell = L.cells[i];
    const panel = state.panels[i];
    const img = images[panel.id];
    if (img) drawPhoto(ctx, img, cell, panel, t, preset.hue, preset.sat, ink, grainAlpha);
    ctx.strokeStyle = L.gold;
    ctx.lineWidth = Math.max(2, W * 0.002);
    ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);
  }

  // Title metrics first: Anton is condensed, so the fitted size (and the
  // title's real bottom edge) comes from a real measurement, not an estimate.
  // Tags below must clear that edge.
  const titlePx = fitFont(ctx, words.title, L.titleTargetW, 'Anton, sans-serif', 400, 200);
  const titleBottom = L.titleTop + titlePx * 0.72;
  // Real glyph top, measured from the font: Anton's ascent is ~0.875em, not
  // the 0.72em the gradient assumes, so the ink starts ~0.045H above the
  // nominal cap-top. The QA proves the title clears the hero mouth/chin
  // against THIS edge, never the nominal one.
  const ascent = ctx.measureText(words.title).actualBoundingBoxAscent;
  L.titleRealTop = (L.titleTop + titlePx * 0.72 - ascent) / H;

  // Role + location tags on every panel. The title band crosses the middle of
  // the cover, so no tag may sit in it. Landscape (wide side panels): top row
  // role top-left / location top-right; bottom row role bottom-left / location
  // bottom-right — except the car panel, whose bottom-right corner belongs to
  // the seal, so its location sits just below the title's real bottom edge.
  // Portrait/square (narrow side panels, ~260px): tags stack vertically so
  // role and location never collide.
  const tagSize = Math.round(H * 0.02);
  const locSize = Math.round(H * 0.016);
  const narrow = sizeName !== 'landscape';
  const tagRects = [];
  for (let i = 0; i < 6; i++) {
    const cell = L.cells[i];
    const panel = state.panels[i];
    const topY = cell.y + cell.h * 0.045;
    const botY = cell.y + cell.h - tagSize * 1.7 - cell.h * 0.045;
    const botLocY = cell.y + cell.h - locSize * 1.7 - cell.h * 0.045;
    if (narrow) {
      if (i < 3) {
        tagRects.push(drawTag(ctx, panel.role, cell.x + cell.w * 0.03, topY, tagSize, true));
        tagRects.push(drawTag(ctx, panel.loc, cell.x + cell.w * 0.03, topY + tagSize * 1.7 + cell.h * 0.02, locSize, false));
      } else {
        tagRects.push(drawTag(ctx, panel.role, cell.x + cell.w * 0.03, botY, tagSize, true));
        tagRects.push(drawTag(ctx, panel.loc, cell.x + cell.w * 0.03, botY - locSize * 1.7 - cell.h * 0.02, locSize, false));
      }
    } else if (i < 3) {
      tagRects.push(drawTag(ctx, panel.role, cell.x + cell.w * 0.03, topY, tagSize, true));
      tagRects.push(drawTagRight(ctx, panel.loc, cell, topY, locSize));
    } else if (i === 5) {
      tagRects.push(drawTag(ctx, panel.role, cell.x + cell.w * 0.03, botY, tagSize, true));
      tagRects.push(drawTag(ctx, panel.loc, cell.x + cell.w * 0.03, Math.max(cell.y + cell.h * 0.19, titleBottom + H * 0.012), locSize, false));
    } else {
      tagRects.push(drawTag(ctx, panel.role, cell.x + cell.w * 0.03, botY, tagSize, true));
      tagRects.push(drawTagRight(ctx, panel.loc, cell, botLocY, locSize));
    }
  }
  L.tags = tagRects;
  L.titleBottom = titleBottom;
  L.titlePx = titlePx;

  // Press bar: stars, quote, paper, VOL badge.
  const press = L.press;
  const starSize = press.h * 0.62;
  drawStars(ctx, L.frame.x + W * 0.012, press.y + press.h / 2, starSize, 5);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(H * 0.02)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const quote = `\u201C${words.quote}\u201D  — ${words.paper}`;
  ctx.fillText(quote, W / 2, press.y + press.h / 2);
  ctx.restore();
  const volSize = Math.round(H * 0.02);
  ctx.save();
  ctx.font = `${volSize}px Anton, sans-serif`;
  const volW = ctx.measureText(words.vol).width + volSize * 1.4;
  const volH = press.h * 0.9;
  const volX = L.frame.x + L.frame.w - W * 0.012 - volW;
  const volY = press.y + (press.h - volH) / 2;
  ctx.fillStyle = '#ffd23e';
  ctx.beginPath();
  ctx.roundRect(volX, volY, volW, volH, volH / 2);
  ctx.fill();
  ctx.fillStyle = '#2a1503';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(words.vol, volX + volW / 2, volY + volH / 2 + volSize * 0.05);
  ctx.restore();

  // Giant striped title + neon script. The script hugs the title's bottom
  // edge so it never crosses a face's eyes in any size.
  const title = stripedTitle(ctx, words.title, W / 2, L.titleTop, titlePx);
  ctx.save();
  ctx.font = `${Math.round(H * 0.038)}px Pacifico, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff5ea8';
  ctx.shadowBlur = H * 0.02;
  ctx.fillStyle = '#ff8fd0';
  ctx.fillText(words.script, W / 2, title.baseY + H * 0.02);
  ctx.restore();

  // Full-width gradient ribbon.
  const rb = L.ribbon;
  const rg = ctx.createLinearGradient(L.frame.x, 0, L.frame.x + L.frame.w, 0);
  rg.addColorStop(0, '#ff5e8a');
  rg.addColorStop(0.5, '#ff8a3d');
  rg.addColorStop(1, '#ff5e8a');
  ctx.fillStyle = rg;
  ctx.fillRect(L.frame.x, rb.y, L.frame.w, rb.h);
  ctx.save();
  ctx.fillStyle = '#2a0a1e';
  ctx.font = `${Math.round(rb.h * 0.52)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(words.ribbon, W / 2, rb.y + rb.h / 2 + rb.h * 0.03);
  ctx.restore();

  // Billing block.
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(H * 0.021)}px Anton, sans-serif`;
  ctx.fillText(words.billing1, W / 2, L.billing1Y);
  ctx.font = `${Math.round(H * 0.017)}px Anton, sans-serif`;
  ctx.fillStyle = '#e8d9ff';
  ctx.fillText(words.billing2, W / 2, L.billing2Y);
  ctx.fillStyle = '#ff7ad9';
  ctx.font = `${Math.round(H * 0.02)}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(words.bottomLeft, L.frame.x + W * 0.012, L.bottomLeftY);
  ctx.restore();

  // Seal, then barcode (barcode box stays clear of the frame edge by the
  // margins baked into the layout).
  drawSeal(ctx, L.seal, words.sealLine1, words.sealLine2);
  drawBarcode(ctx, L.barcode);

  return L;
}
