// ── sprites.js ───────────────────────────────────────
// All sprite drawing functions

// ── Pixel sprites — fillRect only ─────────────────────
// Each entry: [x,y,w,h, colorIndex]
// PAL: 0=black 1=dirt-brown 2=dirt-hi 3=wall-dk 4=wall-gr 5=wall-sh
//      6=steel-dk 7=steel-md 8=steel-lt 9=steel-sh 10=bould-dk 11=bould-md
//      12=bould-lt 13=white 14=cyan 15=cyan-dk 16=player-y 17=player-o
//      18=exit-gr 19=exit-dk 20=expl-o 21=expl-y 22=expl-r 25=dgrey
const PAL = [
  '#000000','#5c3317','#7a4a1e','#3b5e1f','#4e7a28','#2a4a18',
  '#1a1a2e','#2a2a4e','#4444aa','#aaaacc','#8b3a0a','#c46820',
  '#e8943a','#ffffff','#00ccff','#0088cc','#ffd700','#ffaa00',
  '#00ff44','#00cc33','#ff8800','#ffff00','#ff0000','#222222','#ff6600','#333333'
];

// ── Worlds — color themes every 5 levels ────────────
const WORLDS = [
  { name:'CAVE',  minLvl:0,  pal:{1:'#5c3317',2:'#7a4a1e',3:'#3b5e1f',4:'#4e7a28',10:'#8b3a0a',11:'#c46820',12:'#e8943a'} },
  { name:'LAVA',  minLvl:5,  pal:{1:'#3a1010',2:'#5a1818',3:'#6a1a0a',4:'#8a2a10',10:'#8b2200',11:'#c43800',12:'#e86020'} },
  { name:'ICE',   minLvl:10, pal:{1:'#1a2a4a',2:'#2a3a6a',3:'#1a3a5a',4:'#2a5a7a',10:'#4a6a9a',11:'#7aaacc',12:'#aaddff'} },
  { name:'DARK',  minLvl:15, pal:{1:'#111111',2:'#1a1a1a',3:'#0a0a0a',4:'#161616',10:'#2a1a0a',11:'#3a2a10',12:'#4a3a18'} },
];

function getWorld(lvl) {
  for (let i = WORLDS.length-1; i >= 0; i--)
    if (lvl >= WORLDS[i].minLvl) return WORLDS[i];
  return WORLDS[0];
}

let currentPAL = PAL.slice(); // working copy

function applyWorld(lvl) {
  currentPAL = PAL.slice();
  const w = getWorld(lvl);
  for (const [idx, col] of Object.entries(w.pal))
    currentPAL[parseInt(idx)] = col;
}

const DIRT_S = [[0,0,16,16,1],[2,2,3,3,2],[9,1,2,2,2],[13,5,2,2,2],[1,10,2,2,2],[7,13,3,3,2],[11,11,2,2,2],[4,7,2,2,0],[10,8,2,2,0]];
const WALL_S = [[0,0,16,16,3],[1,1,14,14,4],[0,0,16,1,5],[0,15,16,1,5],[0,0,1,16,5],[15,0,1,16,5],[4,4,8,8,3],[5,5,6,6,4]];
const STEEL_S = [[0,0,16,16,6],[1,1,14,14,7],[2,2,12,12,8],[1,1,14,2,9],[1,1,2,14,9],[5,5,6,6,6],[6,6,4,4,9]];
const BOULD_S = [[3,0,10,1,10],[1,1,14,2,10],[0,3,16,6,10],[1,9,14,2,10],[3,11,10,1,10],[2,1,10,1,11],[1,2,12,7,11],[1,2,8,5,12],[2,2,3,2,13],[10,8,5,3,25]];

function drawSpr(rects, ox, oy) {
  for (let i = 0; i < rects.length; i++) {
    let r = rects[i];
    ctx.fillStyle = currentPAL[r[4]];
    ctx.fillRect(ox+r[0], oy+r[1], r[2], r[3]);
  }
}

function drawDiamond(ox, oy, frame, gr, gc) {
  let t = (frame*3 + gr*7 + gc*11) % 16;
  let cols = [14,16,14,15,14,16,13,16,14,15,14,16,14,15,16,14];
  let c = PAL[cols[t]];
  let d = PAL[15];
  ctx.fillStyle = c;
  ctx.fillRect(ox+7,oy+0,2,2); ctx.fillRect(ox+5,oy+2,6,2); ctx.fillRect(ox+3,oy+4,10,2);
  ctx.fillRect(ox+1,oy+6,14,2); ctx.fillRect(ox+1,oy+8,14,2); ctx.fillRect(ox+3,oy+10,10,2);
  ctx.fillRect(ox+5,oy+12,6,2); ctx.fillRect(ox+7,oy+14,2,2);
  ctx.fillStyle = PAL[13]; ctx.fillRect(ox+6,oy+3,4,1); ctx.fillRect(ox+5,oy+4,2,1);
  ctx.fillStyle = d; ctx.fillRect(ox+3,oy+6,1,4); ctx.fillRect(ox+12,oy+6,1,4);
}

function drawPlayer(ox, oy, frame) {
  const blink = frame % 60 < 55;
  const moving = (performance.now() - lastMoveTime) < 250;
  const walk = moving ? Math.floor(walkFrame/2) % 2 : 0;
  ctx.fillStyle = PAL[13];
  ctx.fillRect(ox+3,oy+0,10,1); ctx.fillRect(ox+2,oy+1,12,1); ctx.fillRect(ox+1,oy+2,14,1);
  ctx.fillRect(ox+1,oy+3,14,6); ctx.fillRect(ox+0,oy+5,2,3); ctx.fillRect(ox+14,oy+5,2,3);
  ctx.fillRect(ox+3,oy+9,4,7); ctx.fillRect(ox+9,oy+9,4,7);
  ctx.fillStyle = PAL[17];
  ctx.fillRect(ox+(walk?2:3),oy+14,5,2); ctx.fillRect(ox+(walk?9:8),oy+14,4,2);
  ctx.fillRect(ox+2,oy+0,12,2); ctx.fillRect(ox+0,oy+2,2,2); ctx.fillRect(ox+14,oy+2,2,2);
  ctx.fillStyle = PAL[21]; ctx.fillRect(ox+7,oy+0,2,2);
  if (blink) {
    ctx.fillStyle = PAL[0]; ctx.fillRect(ox+4,oy+3,2,2); ctx.fillRect(ox+10,oy+3,2,2);
    ctx.fillStyle = PAL[25]; ctx.fillRect(ox+4,oy+3,1,1); ctx.fillRect(ox+10,oy+3,1,1);
  } else {
    ctx.fillStyle = PAL[0]; ctx.fillRect(ox+4,oy+3,2,1); ctx.fillRect(ox+10,oy+3,2,1);
  }
}

function drawExit(ox, oy, open, frame) {
  if (!open) { drawSpr(STEEL_S,ox,oy); ctx.fillStyle='#222'; ctx.fillRect(ox+4,oy+4,8,8); return; }
  let fl = Math.floor(frame/6)%2;
  ctx.fillStyle = fl ? PAL[18] : PAL[19]; ctx.fillRect(ox,oy,16,16);
  ctx.fillStyle = fl ? PAL[21] : PAL[18]; ctx.fillRect(ox+2,oy+2,12,12);
  ctx.fillStyle = fl ? PAL[13] : PAL[21]; ctx.fillRect(ox+5,oy+5,6,6);
}

function drawExplosion(ox, oy, t) {
  let cols = [22,24,20,21,13];
  let ci = Math.min(4, Math.floor((10-t)/2));
  ctx.fillStyle = PAL[cols[ci]];
  ctx.fillRect(ox,oy,16,16);
  ctx.fillStyle = PAL[cols[Math.min(4,ci+1)]];
  let m = t*1.2|0;
  ctx.fillRect(ox+m,oy+m,16-m*2,16-m*2);
}

// ── Draw butterfly ──────────────────────────────────
function drawButterfly(ox, oy, frame) {
  // Alternates between two wing positions every 8 frames
  const wing = Math.floor(frame / 8) % 2;
  // Body — dark orange center
  ctx.fillStyle = '#c86020';
  ctx.fillRect(ox+6, oy+6, 4, 4);
  ctx.fillStyle = '#f89040';
  ctx.fillRect(ox+7, oy+7, 2, 2);
  if (wing === 0) {
    // Wings spread
    ctx.fillStyle = '#f84800';
    ctx.fillRect(ox+1, oy+2, 5, 5);   // top-left wing
    ctx.fillRect(ox+10, oy+2, 5, 5);  // top-right wing
    ctx.fillRect(ox+2, oy+8, 4, 4);   // bottom-left wing
    ctx.fillRect(ox+10, oy+8, 4, 4);  // bottom-right wing
    ctx.fillStyle = '#fc8800';
    ctx.fillRect(ox+2, oy+3, 3, 3);
    ctx.fillRect(ox+11, oy+3, 3, 3);
    ctx.fillRect(ox+3, oy+9, 2, 2);
    ctx.fillRect(ox+11, oy+9, 2, 2);
  } else {
    // Wings folded (smaller)
    ctx.fillStyle = '#f84800';
    ctx.fillRect(ox+3, oy+4, 4, 4);   // top-left wing
    ctx.fillRect(ox+9, oy+4, 4, 4);   // top-right wing
    ctx.fillRect(ox+3, oy+9, 3, 3);   // bottom-left wing
    ctx.fillRect(ox+10, oy+9, 3, 3);  // bottom-right wing
    ctx.fillStyle = '#fc8800';
    ctx.fillRect(ox+4, oy+5, 2, 2);
    ctx.fillRect(ox+10, oy+5, 2, 2);
    ctx.fillRect(ox+4, oy+10, 2, 2);
    ctx.fillRect(ox+10, oy+10, 2, 2);
  }
  // Antennae
  ctx.fillStyle = '#fc8800';
  ctx.fillRect(ox+6, oy+4, 1, 2);
  ctx.fillRect(ox+9, oy+4, 1, 2);
  ctx.fillRect(ox+5, oy+3, 2, 1);
  ctx.fillRect(ox+9, oy+3, 2, 1);
}

// ── Draw amoeba ──────────────────────────────────────
function drawAmoeba(ox, oy, frame) {
  const pulse = Math.floor(frame / 6) % 2;
  ctx.fillStyle = pulse ? '#9932cc' : '#7a20aa';
  ctx.fillRect(ox, oy, T, T);
  ctx.fillStyle = pulse ? '#cc66ff' : '#aa44dd';
  ctx.fillRect(ox+2, oy+2, 5, 5);
  ctx.fillRect(ox+9, oy+5, 5, 4);
  ctx.fillRect(ox+4, oy+10, 6, 4);
  ctx.fillStyle = '#ff99ff';
  ctx.fillRect(ox+3, oy+3, 2, 2);
}

// ── Draw magic wall ───────────────────────────────
function drawMagicWall(ox, oy, frame, active) {
  drawSpr(STEEL_S, ox, oy);
  const fl = Math.floor(frame / 4) % 2;
  if (active) {
    ctx.fillStyle = fl ? '#ffff00' : '#ff8800';
    ctx.fillRect(ox+3, oy+3, 10, 10);
    ctx.fillStyle = fl ? '#ffffff' : '#ffcc00';
    ctx.fillRect(ox+5, oy+5, 6, 6);
  } else {
    ctx.fillStyle = '#444466';
    ctx.fillRect(ox+4, oy+4, 8, 8);
    ctx.fillStyle = '#222244';
    ctx.fillRect(ox+5, oy+5, 6, 6);
  }
}