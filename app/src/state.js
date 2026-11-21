// Golden Hour — the cover state: words, photos, crops, grade.
// Everything the editor mutates lives here; the renderer only reads it.

export const SIZES = {
  landscape: { w: 1920, h: 1080, label: 'Landscape 1920 x 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
};

// Grid order: top row left-to-right, then bottom row left-to-right.
// fx/fy are the focal point inside the source photo (0..1); zoom is the
// cover-fit zoom (1 = fit). flip mirrors the photo horizontally.
export const PANELS = [
  { id: 'admiral', file: 'samples/04-admiral.jpg', role: 'THE COMMODORE', loc: 'MARINA ROW · 6:40 PM', fx: 0.5, fy: 0.35, zoom: 1.0, flip: false },
  { id: 'hero', file: 'samples/01-hero.jpg', role: 'THE HEADLINER', loc: 'SUNSET BEACH · 6:52 PM', fx: 0.5, fy: 0.66, zoom: 1.0, flip: false },
  { id: 'braids', file: 'samples/03-braids.jpg', role: 'THE NIGHT OWL', loc: 'GLOW DISTRICT · 11:20 PM', fx: 0.5, fy: 0.32, zoom: 1.0, flip: false },
  { id: 'rider', file: 'samples/05-rider.jpg', role: 'THE SPEEDSTER', loc: 'CLIFF ROAD · SUNSET', fx: 0.4, fy: 0.5, zoom: 1.0, flip: false },
  { id: 'flame', file: 'samples/02-flame.jpg', role: 'THE LOOKOUT', loc: 'HIGHLINE ROOF · 7:15 PM', fx: 0.42, fy: 0.5, zoom: 1.0, flip: false },
  { id: 'car', file: 'samples/06-car.jpg', role: 'THE PRIZE', loc: 'OLD PIER · 7:05 PM', fx: 0.6, fy: 0.5, zoom: 1.0, flip: false },
];

export const DEFAULT_WORDS = {
  title: 'GOLDEN HOUR',
  script: 'where the sun stays up late',
  quote: 'EVERY SUNSET FEELS LIKE A HEIST',
  paper: 'THE BAY LEDGER',
  vol: 'VOL. 04',
  ribbon: 'SALT AIR · FAST CARS · LOUD LAUGHTER',
  billing1: 'A LOWTIDE PICTURE · STARRING YOU',
  billing2: 'SHOT ON YOUR OWN CAMERA · COLOUR BY HAND',
  bottomLeft: 'OUT THIS SUMMER',
  sealLine1: 'AUTHENTIC',
  sealLine2: 'COVER ART',
};

// Four genuinely different moods. treatment 0..1 drives the warm grade;
// ink 0..1 blends the posterized pass; hue shifts the grade's tint.
export const PRESETS = {
  golden: { label: 'Golden', treatment: 0.55, ink: 0.0, hue: -4, sat: 1.0 },
  neon: { label: 'Neon Nights', treatment: 0.8, ink: 0.25, hue: 14, sat: 1.15 },
  noir: { label: 'Noir', treatment: 0.35, ink: 0.65, hue: 0, sat: 0.55 },
  vintage: { label: 'Vintage', treatment: 0.9, ink: 0.45, hue: -18, sat: 0.85 },
};

export function defaultState() {
  return {
    size: 'landscape',
    preset: 'golden',
    treatment: PRESETS.golden.treatment,
    ink: PRESETS.golden.ink,
    words: { ...DEFAULT_WORDS },
    panels: PANELS.map((p) => ({ ...p, src: null })), // src: object URL or null (use file)
  };
}

export function cloneState(s) {
  return JSON.parse(JSON.stringify(s));
}
