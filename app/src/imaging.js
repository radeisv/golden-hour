// Golden Hour — photo pipeline: load, cover-fit crop, warm grade, poster ink,
// deterministic grain. Same inputs always produce the same pixels.

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load image'));
    img.src = src;
  });
}

// Cover-fit source rect for a panel: the (fx, fy) focal point stays centred
// in the window; zoom > 1 tightens the window around it.
export function coverRect(img, pw, ph, fx, fy, zoom) {
  const panelAspect = pw / ph;
  const photoAspect = img.naturalWidth / img.naturalHeight;
  let sw;
  let sh;
  if (photoAspect > panelAspect) {
    // Photo wider than the panel: full height, windowed width.
    sh = img.naturalHeight;
    sw = sh * panelAspect;
  } else {
    // Photo taller than the panel: full width, windowed height.
    sw = img.naturalWidth;
    sh = sw / panelAspect;
  }
  sw /= zoom;
  sh /= zoom;
  const maxX = img.naturalWidth - sw;
  const maxY = img.naturalHeight - sh;
  const sx = Math.max(0, Math.min(maxX, fx * img.naturalWidth - sw / 2));
  const sy = Math.max(0, Math.min(maxY, fy * img.naturalHeight - sh / 2));
  return { sx, sy, sw, sh };
}

// CSS filter string for the warm grade. t = treatment 0..1.
export function gradeFilter(t, hue, sat) {
  const s = (1.08 + t * 0.35) * sat;
  const c = 1.04 + t * 0.12;
  const b = 1.0 + t * 0.04;
  const sep = t * 0.22;
  return `saturate(${s.toFixed(3)}) contrast(${c.toFixed(3)}) brightness(${b.toFixed(3)}) sepia(${sep.toFixed(3)}) hue-rotate(${hue}deg)`;
}

// Deterministic pseudo-random generator (mulberry32). One seed, one pattern.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A 256x256 grayscale noise tile, built once from the fixed seed.
let noiseTile = null;
export function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const data = ctx.createImageData(256, 256);
  const rnd = mulberry32(20261121);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  noiseTile = c;
  return c;
}

// Posterize an offscreen copy of a panel: quantize each channel to levels.
export function posterize(source, w, h, levels = 6) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext('2d');
  ctx.drawImage(source, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const step = 255 / (levels - 1);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.round(d[i] / step) * step;
    d[i + 1] = Math.round(d[i + 1] / step) * step;
    d[i + 2] = Math.round(d[i + 2] / step) * step;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// Draw one photo into a panel rect with the full pipeline.
export function drawPhoto(ctx, img, cell, panel, t, hue, sat, ink, grainAlpha) {
  const { sx, sy, sw, sh } = coverRect(img, cell.w, cell.h, panel.fx, panel.fy, panel.zoom);
  const off = document.createElement('canvas');
  off.width = Math.max(1, Math.round(cell.w));
  off.height = Math.max(1, Math.round(cell.h));
  const octx = off.getContext('2d');
  octx.filter = gradeFilter(t, hue, sat);
  if (panel.flip) {
    octx.translate(off.width, 0);
    octx.scale(-1, 1);
  }
  octx.drawImage(img, sx, sy, sw, sh, 0, 0, off.width, off.height);
  octx.filter = 'none';
  if (ink > 0) {
    const post = posterize(off, off.width, off.height, 6);
    octx.globalAlpha = ink;
    octx.drawImage(post, 0, 0);
    octx.globalAlpha = 1;
  }
  if (grainAlpha > 0) {
    const tile = getNoiseTile();
    octx.globalAlpha = grainAlpha;
    const pat = octx.createPattern(tile, 'repeat');
    octx.fillStyle = pat;
    octx.fillRect(0, 0, off.width, off.height);
    octx.globalAlpha = 1;
  }
  ctx.drawImage(off, cell.x, cell.y, cell.w, cell.h);
}
