// Golden Hour — the editor: loads fonts + photos, renders the stage, wires
// every control. Fully offline; every asset is local.

import { SIZES, PRESETS, defaultState, cloneState } from './state.js';
import { layoutFor, heroMouthY, heroChinY, heroFaceY } from './layouts.js';
import { loadImage } from './imaging.js';
import { renderCover } from './renderer.js';
import { exportPNG } from './export.js';

const state = defaultState();
const images = {};
let fontsReady = false;

const $ = (id) => document.getElementById(id);
const statusEl = $('status');

function setStatus(msg, isError) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('error', !!isError);
}

async function loadFonts() {
  try {
    const anton = new FontFace('Anton', 'url(./fonts/Anton-Regular.ttf)');
    const pacifico = new FontFace('Pacifico', 'url(./fonts/Pacifico-Regular.ttf)');
    const [a, p] = await Promise.all([anton.load(), pacifico.load()]);
    document.fonts.add(a);
    document.fonts.add(p);
    await Promise.all([document.fonts.load('40px Anton'), document.fonts.load('40px Pacifico')]);
    fontsReady = true;
  } catch (e) {
    setStatus('Fonts failed to load: ' + e.message, true);
  }
}

async function loadPhotos() {
  for (const panel of state.panels) {
    try {
      images[panel.id] = await loadImage(panel.src || './' + panel.file);
    } catch (e) {
      setStatus('Photo failed to load: ' + panel.file, true);
    }
  }
}

function currentSize() {
  return SIZES[state.size];
}

async function render() {
  if (!fontsReady) return;
  const stage = $('stage');
  const { w, h } = currentSize();
  stage.width = w;
  stage.height = h;
  window.__goldenHour.lastLayout = await renderCover(stage, state.size, state, images);
  stage.dataset.rendered = '1';
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

function isImageFile(file) {
  return file && file.type && file.type.startsWith('image/');
}

async function applyUpload(panelId, file) {
  if (!isImageFile(file)) {
    setStatus('That file is not an image — pick a JPG or PNG photo.', true);
    return false;
  }
  try {
    const url = await readFileAsDataURL(file);
    const img = await loadImage(url);
    images[panelId] = img;
    const panel = state.panels.find((p) => p.id === panelId);
    panel.src = url;
    panel.file = file.name;
    await render();
    setStatus('Photo updated.');
    return true;
  } catch (e) {
    setStatus('Could not use that photo: ' + e.message, true);
    return false;
  }
}

function buildPhotoControls() {
  const wrap = $('photo-slots');
  state.panels.forEach((panel, i) => {
    const div = document.createElement('div');
    div.className = 'slot';
    div.innerHTML = `
      <div class="slot-head"><strong>${i + 1}. ${panel.role}</strong><span class="loc">${panel.loc}</span></div>
      <label>Photo <input type="file" accept="image/*" data-panel="${panel.id}"></label>
      <label>Zoom <input type="range" min="1" max="2.2" step="0.05" value="${panel.zoom}" data-crop="zoom" data-panel="${panel.id}"></label>
      <label>Focus X <input type="range" min="0" max="1" step="0.01" value="${panel.fx}" data-crop="fx" data-panel="${panel.id}"></label>
      <label>Focus Y <input type="range" min="0" max="1" step="0.01" value="${panel.fy}" data-crop="fy" data-panel="${panel.id}"></label>
      <label class="inline"><input type="checkbox" data-crop="flip" data-panel="${panel.id}" ${panel.flip ? 'checked' : ''}> Flip</label>`;
    wrap.appendChild(div);
  });
  wrap.addEventListener('change', async (ev) => {
    const el = ev.target;
    const id = el.dataset.panel;
    if (!id) return;
    const panel = state.panels.find((p) => p.id === id);
    if (el.type === 'file' && el.files[0]) {
      await applyUpload(id, el.files[0]);
      el.value = '';
      return;
    }
    if (el.dataset.crop === 'zoom') panel.zoom = parseFloat(el.value);
    if (el.dataset.crop === 'fx') panel.fx = parseFloat(el.value);
    if (el.dataset.crop === 'fy') panel.fy = parseFloat(el.value);
    if (el.dataset.crop === 'flip') panel.flip = el.checked;
    await render();
  });
}

function buildWordControls() {
  const wrap = $('word-fields');
  const labels = {
    title: 'Title', script: 'Script line', quote: 'Quote', paper: 'Paper',
    vol: 'Volume badge', ribbon: 'Ribbon', billing1: 'Billing line 1',
    billing2: 'Billing line 2', bottomLeft: 'Bottom-left line',
    sealLine1: 'Seal line 1', sealLine2: 'Seal line 2',
  };
  for (const [key, label] of Object.entries(labels)) {
    const lab = document.createElement('label');
    lab.textContent = label;
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = state.words[key];
    inp.maxLength = 60;
    inp.dataset.word = key;
    lab.appendChild(inp);
    wrap.appendChild(lab);
  }
  wrap.addEventListener('input', async (ev) => {
    const key = ev.target.dataset.word;
    if (!key) return;
    state.words[key] = ev.target.value;
    await render();
  });
}

function buildPresetButtons() {
  const wrap = $('presets');
  for (const [key, p] of Object.entries(PRESETS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.label;
    b.dataset.preset = key;
    if (key === state.preset) b.classList.add('active');
    b.addEventListener('click', async () => {
      state.preset = key;
      state.treatment = p.treatment;
      state.ink = p.ink;
      $('treatment').value = p.treatment;
      $('ink').value = p.ink;
      wrap.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
      await render();
    });
    wrap.appendChild(b);
  }
}

function wireStatic() {
  $('treatment').addEventListener('input', async (ev) => {
    state.treatment = parseFloat(ev.target.value);
    await render();
  });
  $('ink').addEventListener('input', async (ev) => {
    state.ink = parseFloat(ev.target.value);
    await render();
  });
  $('upload-all').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file || !isImageFile(file)) {
      setStatus('Pick a JPG or PNG photo.', true);
      return;
    }
    for (const panel of state.panels) await applyUpload(panel.id, file);
    ev.target.value = '';
  });
  $('upload-multi').addEventListener('change', async (ev) => {
    const files = [...ev.target.files].filter(isImageFile);
    if (!files.length) {
      setStatus('No image files in that selection.', true);
      return;
    }
    for (let i = 0; i < Math.min(files.length, 6); i++) {
      await applyUpload(state.panels[i].id, files[i]);
    }
    ev.target.value = '';
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.addEventListener('click', async () => {
      state.size = b.dataset.size;
      document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('active', x === b));
      await render();
    });
  });
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', async () => {
      try {
        const r = await exportPNG(b.dataset.export, state, images);
        setStatus(`Exported ${r.w} x ${r.h} PNG (${Math.round(r.bytes / 1024)} KB).`);
      } catch (e) {
        setStatus('Export failed: ' + e.message, true);
      }
    });
  });
  document.querySelectorAll('[data-role-edit]').forEach((inp) => {
    inp.addEventListener('input', async (ev) => {
      const panel = state.panels.find((p) => p.id === ev.target.dataset.roleEdit);
      if (panel) {
        panel.role = ev.target.value.toUpperCase();
        await render();
      }
    });
  });
  document.querySelectorAll('[data-loc-edit]').forEach((inp) => {
    inp.addEventListener('input', async (ev) => {
      const panel = state.panels.find((p) => p.id === ev.target.dataset.locEdit);
      if (panel) {
        panel.loc = ev.target.value.toUpperCase();
        await render();
      }
    });
  });
}

// Role/location quick-edit rows, built from state so the editor stays in sync.
function buildRoleEditors() {
  const wrap = $('role-fields');
  for (const panel of state.panels) {
    const row = document.createElement('div');
    row.className = 'role-row';
    row.innerHTML = `<label>Role <input type="text" value="${panel.role}" data-role-edit="${panel.id}" maxlength="24"></label>
      <label>Location <input type="text" value="${panel.loc}" data-loc-edit="${panel.id}" maxlength="40"></label>`;
    wrap.appendChild(row);
  }
}

function applyShotMode() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  const size = q.get('size');
  if (size && SIZES[size]) state.size = size;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('active', x.dataset.size === state.size));
  }
}

async function init() {
  applyShotMode();
  buildPhotoControls();
  buildWordControls();
  buildPresetButtons();
  buildRoleEditors();
  wireStatic();
  await loadFonts();
  await loadPhotos();
  await render();
  setStatus('Ready — Golden Hour.');
}

// Test hooks for the QA script (not part of the visible UI).
window.__goldenHour = {
  state,
  images,
  layoutFor,
  heroMouthY,
  heroChinY,
  heroFaceY,
  cloneState,
  render: async (sizeName) => {
    if (sizeName) state.size = sizeName;
    await render();
    return { w: currentSize().w, h: currentSize().h };
  },
  exportPNG: (sizeName) => exportPNG(sizeName, state, images),
  setPanel: async (id, patch) => {
    Object.assign(state.panels.find((p) => p.id === id), patch);
    await render();
  },
  setWords: async (patch) => {
    Object.assign(state.words, patch);
    await render();
  },
  setGrade: async (treatment, ink) => {
    state.treatment = treatment;
    state.ink = ink;
    await render();
  },
  setPreset: async (name) => {
    const p = PRESETS[name];
    state.preset = name;
    state.treatment = p.treatment;
    state.ink = p.ink;
    await render();
  },
  uploadDataUrl: async (id, dataUrl) => {
    const img = await loadImage(dataUrl);
    images[id] = img;
    const panel = state.panels.find((p) => p.id === id);
    panel.src = dataUrl;
    await render();
    return true;
  },
};

init();
