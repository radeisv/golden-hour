// Golden Hour — PNG export: render the cover at its exact size and download
// it as a PNG. Used by the editor buttons and by the QA script.

import { SIZES } from './state.js';
import { renderCover } from './renderer.js';

export function renderToCanvas(sizeName, state, images) {
  const { w, h } = SIZES[sizeName];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return renderCover(canvas, sizeName, state, images).then(() => canvas);
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encode failed'))), 'image/png');
  });
}

export async function exportPNG(sizeName, state, images) {
  const canvas = await renderToCanvas(sizeName, state, images);
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `golden-hour-${sizeName}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return { w: canvas.width, h: canvas.height, bytes: blob.size };
}
