// ── state.js ─────────────────────────────────────────
// All mutable game state variables + initLevel + updateHUD

let ROWS =14, COLS=22;
let grid, playerX, playerY;
let score =0, lives=3, level=0;
let gemsGot =0, gemsNeeded=0, timeLeft=150, pts=20;
let running =false, exitOpen=false;
let loopId =null, timerInt=null;
let animFrame =0, lastPhys=0;
let explosions =[];
let playerDying =false, dyingLock=false, levelDone=false;
let lastMove =0, moveDelay=160;
let walkFrame=0, lastMoveTime=0;
let holdInt =null;
let pendingScore =0;
let levelStartTime = 0;  // time when level started
let levelStartTimeLeft = 150;  // timeLeft at level start
const STARS_KEY = 'rfd_stars_v1';
const SAVE_KEY  = 'rfd_save_v1';

function saveGame() {
  try {
    const data = { level, score, lives, ts: Date.now() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch(e) {}
}

function loadSave() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!data) return null;
    return data;
  } catch(e) { return null; }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
}
function starsLoad() { try { return JSON.parse(localStorage.getItem(STARS_KEY))||{}; } catch(e) { return {}; } }
function starsGet(lvl) { return starsLoad()[lvl] || 0; }
function starsSet(lvl, s) { const d=starsLoad(); d[lvl]=Math.max(d[lvl]||0,s); localStorage.setItem(STARS_KEY,JSON.stringify(d)); }
function calcStars(timeLeft, startTimeLeft, allGems) {
  const ratio = timeLeft / startTimeLeft;
  if (ratio > 0.6 && allGems) return 3;
  if (ratio > 0.3) return 2;
  return 1;
}
let scorePopups = [];
let butterflies = [];  // [{r, c, dir}] dir: 0=up,1=right,2=down,3=left
let amoebaTimer = 0;   // ticks since last amoeba growth
let amoebaSize  = 0;   // total amoeba tile count
let magicTimer  = 0;   // ticks magic wall is active
let magicActive = false;

function initLevel() {
  let gen = generateLevel(level);
  ROWS=gen.rows; COLS=gen.cols;
  gemsNeeded=gen.gemsNeeded; gemsGot=0;
  timeLeft=gen.time; pts=gen.pts;
  levelStartTimeLeft=gen.time;
  exitOpen=false; explosions=[];
  playerDying=false; levelDone=false;
  playerX=gen.playerX; playerY=gen.playerY;
  grid=[]; falling=[];
  scorePopups = [];
  butterflies = [];
  amoebaTimer = 0; amoebaSize = 0;
  magicTimer = 0; magicActive = false;
  for (let r=0; r<ROWS; r++) {
    grid[r]=gen.grid[r].slice();
    falling[r]=[];
    for (let c=0; c<COLS; c++) {
      falling[r][c]=false;
      // Collect butterfly positions into butterflies array
      if (grid[r][c] === BUTTERFLY) {
        butterflies.push({ r, c, dir: Math.floor(Math.random()*4) });
        grid[r][c] = EMPTY; // butterflies tracked separately
      }
    }
  }
  applyWorld(level);
  updateHUD();
}

function updateHUD() {
  document.getElementById('h-score').textContent  = score;
  document.getElementById('h-gems').textContent   = `${gemsGot}/${gemsNeeded}`;
  document.getElementById('h-time').textContent   = timeLeft;
  document.getElementById('h-lives').textContent  = lives;
  document.getElementById('h-level').textContent  = level+1;
  document.getElementById('h-time').style.color   = timeLeft<30?'#ff2222':'#ff4444';
}