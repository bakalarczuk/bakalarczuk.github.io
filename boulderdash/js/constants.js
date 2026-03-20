// ── constants.js ─────────────────────────────────────
// Canvas, viewport, tile constants, palette, worlds

// ── Canvas & viewport ─────────────────────────────────
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

let T = 16; // tile px
let VW, VH, PX;

function resize() {
  const wrap = document.getElementById('canvas-wrap');
  const cw = wrap.clientWidth;
  const ch = wrap.clientHeight;
  if (cw < 1 || ch < 1) return;
  PX = Math.max(2, Math.min(4, Math.floor(cw / (T * 11))));
  VW = Math.floor(cw / (T * PX));
  VH = Math.floor(ch / (T * PX));
  if (VW % 2 === 0) VW--;
  if (VH % 2 === 0) VH--;
  canvas.width  = VW * T;
  canvas.height = VH * T;
  canvas.style.width  = (VW * T * PX) + 'px';
  canvas.style.height = (VH * T * PX) + 'px';
  // Regenerate level to fit new viewport if game running
  if (typeof ROWS !== 'undefined' && running) initLevel();
}

// ── Tile constants ────────────────────────────────────
const EMPTY =0, DIRT=1, WALL=2, STEEL=3, BOULDER=4, DIAMOND=5, EXIT=7, BUTTERFLY=11, AMOEBA=12, MAGIC=13;