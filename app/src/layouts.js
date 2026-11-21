// Golden Hour — cover geometry. Every band is a fraction of the cover size.
// Composition: 3x2 grid, hero top-centre (wider), giant striped title over the
// hero band, press bar on top, ribbon + billing below. The title's cap-top is
// always BELOW the hero's mouth (computed from the hero focal point), so the
// title never covers a mouth or a smile in any size.

import { SIZES } from './state.js';

const GOLD = '#d9a441';
const DARK = '#160a26';

// Grid column split: side columns share the width, centre takes centreFrac.
// Landscape uses a narrower hero (0.40) so the hero's whole face — brows to
// chin — fits above the title's real top: the hero photo is an extreme
// close-up, and at the old 0.50 split the face rendered 0.368H tall while
// only 0.274H of clear space sits above the title. Portrait/square keep 0.50.
function gridCells(W, H, top, rowTopH, rowBotH, gap, centreFrac = 0.5) {
  const x0 = 0.012 * W;
  const x1 = 0.988 * W;
  const inner = x1 - x0;
  const side = (inner - 2 * gap) * (1 - centreFrac) / 2;
  const centre = (inner - 2 * gap) * centreFrac;
  const xs = [x0, x0 + side + gap, x0 + side + gap + centre + gap];
  const ws = [side, centre, side];
  const cells = [];
  for (let r = 0; r < 2; r++) {
    const y = r === 0 ? top : top + rowTopH + gap;
    const h = r === 0 ? rowTopH : rowBotH;
    for (let c = 0; c < 3; c++) cells.push({ x: xs[c], y, w: ws[c], h });
  }
  return cells;
}

export function layoutFor(sizeName) {
  const { w: W, h: H } = SIZES[sizeName];
  const gap = 0.006 * W;
  let L;
  if (sizeName === 'landscape') {
    const top = 0.07 * H;
    const rowTopH = 0.43 * H;
    const rowBotH = 0.255 * H;
    L = {
      frame: { x: 0.008 * W, y: 0.008 * H, w: 0.984 * W, h: 0.984 * H },
      press: { y: 0.018 * H, h: 0.04 * H },
      cells: gridCells(W, H, top, rowTopH, rowBotH, gap, 0.4),
      // Title: nominal cap-top 0.435H. Anton's real ascent is ~0.875em, not
      // the 0.72em the gradient assumes, so the glyphs really start at
      // ~0.39H and end at ~0.60H: the hero chin (0.374H at fy 0.66) clears
      // the top, and the rider's face (ends x 0.135W, left of the 0.68W
      // title's 0.16W left edge) clears the bottom. The title stays giant
      // (0.68W) — it only looks narrower because the hero panel did.
      titleTop: 0.435 * H,
      titleTargetW: 0.68 * W,
      ribbon: { y: 0.775 * H, h: 0.04 * H },
      billing1Y: 0.845 * H,
      billing2Y: 0.885 * H,
      bottomLeftY: 0.945 * H,
      seal: { cx: 0.88 * W, cy: 0.79 * H, r: 0.075 * W },
      barcode: { x: 0.855 * W, y: 0.93 * H, w: 0.12 * W, h: 0.038 * H },
    };
  } else if (sizeName === 'portrait') {
    const top = 0.05 * H;
    const rowTopH = 0.37 * H;
    const rowBotH = 0.25 * H;
    L = {
      frame: { x: 0.008 * W, y: 0.006 * H, w: 0.984 * W, h: 0.988 * H },
      press: { y: 0.014 * H, h: 0.032 * H },
      cells: gridCells(W, H, top, rowTopH, rowBotH, gap),
      titleTop: 0.35 * H,
      titleTargetW: 0.82 * W,
      ribbon: { y: 0.72 * H, h: 0.032 * H },
      billing1Y: 0.785 * H,
      billing2Y: 0.82 * H,
      bottomLeftY: 0.92 * H,
      seal: { cx: 0.88 * W, cy: 0.78 * H, r: 0.08 * W },
      barcode: { x: 0.80 * W, y: 0.92 * H, w: 0.175 * W, h: 0.034 * H },
    };
  } else {
    // square
    const top = 0.06 * H;
    const rowTopH = 0.37 * H;
    const rowBotH = 0.25 * H;
    L = {
      frame: { x: 0.008 * W, y: 0.008 * H, w: 0.984 * W, h: 0.984 * H },
      press: { y: 0.016 * H, h: 0.036 * H },
      cells: gridCells(W, H, top, rowTopH, rowBotH, gap),
      titleTop: 0.35 * H,
      titleTargetW: 0.82 * W,
      ribbon: { y: 0.72 * H, h: 0.036 * H },
      billing1Y: 0.785 * H,
      billing2Y: 0.82 * H,
      bottomLeftY: 0.92 * H,
      seal: { cx: 0.88 * W, cy: 0.78 * H, r: 0.08 * W },
      barcode: { x: 0.80 * W, y: 0.92 * H, w: 0.175 * W, h: 0.036 * H },
    };
  }
  L.W = W;
  L.H = H;
  L.gold = GOLD;
  L.dark = DARK;
  return L;
}

// Where the hero's mouth/chin lands (in cover fractions), from the hero panel
// geometry and focal point. The QA script uses this to prove the title
// clears it. photoAspect is the hero photo's w/h; mouthFrac/chinFrac are the
// mouth's / chin's height fractions inside the source photo (0.57 / 0.79 for
// our hero shot, measured from the photo itself).
// Cover-fit visible window: the photo is scaled by max(w/iw, h/ih), so the
// visible height fraction is photoAspect/panelAspect when the panel is wider
// than the photo (and 1 when it is not). An earlier version had this ratio
// inverted, which made the QA pass while the render hid the smile.
export function heroFaceY(sizeName, photoAspect, frac) {
  const L = layoutFor(sizeName);
  const cell = L.cells[1]; // hero panel, top-centre
  const panelAspect = cell.w / cell.h;
  const visH = Math.min(1, photoAspect / panelAspect);
  const fy = 0.66; // hero focal y from state
  const top = Math.max(0, Math.min(1 - visH, fy - visH / 2));
  const inPanel = (frac - top) / visH;
  return (cell.y + inPanel * cell.h) / L.H;
}

export function heroMouthY(sizeName, photoAspect, mouthFrac = 0.57) {
  return heroFaceY(sizeName, photoAspect, mouthFrac);
}

export function heroChinY(sizeName, photoAspect, chinFrac = 0.79) {
  return heroFaceY(sizeName, photoAspect, chinFrac);
}
