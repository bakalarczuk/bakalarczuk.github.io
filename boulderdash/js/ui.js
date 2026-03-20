// ── ui.js ────────────────────────────────────────────
// Screens, leaderboard, loading screen, startGame

function showLoadingScreen(earnedStars) {
  // Stop game loop, show loading screen with animated bar
  running = false;
  clearInterval(timerInt);
  const nextLevel = level + 1;
  const gen = generateLevel(nextLevel);

  const ov = document.getElementById('ov-loading');
  ov.style.display = 'flex';
  const nextWorld = getWorld(nextLevel);
  const curWorld  = getWorld(level);
  const worldChanged = nextWorld.name !== curWorld.name;
  document.getElementById('loading-level').textContent = `POZIOM ${nextLevel + 1}`;
  document.getElementById('loading-title').textContent =
    worldChanged ? `✦ ${nextWorld.name} ✦` : 'POZIOM UKOŃCZONY!';
  document.getElementById('loading-stars').textContent =
    earnedStars ? '★'.repeat(earnedStars) + '☆'.repeat(3-earnedStars) : '';
  document.getElementById('loading-info').innerHTML =
    `DIAMENTY: ${gen.gemsNeeded} &nbsp; CZAS: ${gen.time}s`;

  // Animate bar 0→100% over 1.8s then load next level
  const bar = document.getElementById('loading-bar');
  bar.style.width = '0%';
  const startTime = performance.now();
  const duration = 1800;

  function animBar(ts) {
    const pct = Math.min(100, ((ts - startTime) / duration) * 100);
    bar.style.width = pct + '%';
    // Flash color near end
    bar.style.background = pct > 80 ? '#00ff44' : '#f5a623';
    if (pct < 100) {
      requestAnimationFrame(animBar);
    } else {
      // Done — load next level
      ov.style.display = 'none';
      playSound('level');
      level++;
      levelDone = false;
      dyingLock = false;
      initLevel();
      running = true;
      lastPhys = 0;
      timerInt = setInterval(() => {
        if (!running || playerDying || dyingLock || levelDone) return;
        timeLeft--; updateHUD();
        if (timeLeft <= 0) playerDie();
      }, 1000);
      loopId = requestAnimationFrame(gameLoop);
    }
  }
  requestAnimationFrame(animBar);
}

function startGame() {
  if (loopId) cancelAnimationFrame(loopId);
  clearInterval(timerInt);
  score=0; lives=3; level=0; dyingLock=false; playerDying=false; pts=20;
  initLevel();
  showOv(null);
  running=true; lastPhys=0; animFrame=0;
  timerInt=setInterval(() => {
    if (!running||playerDying||dyingLock||levelDone) return;
    timeLeft--; updateHUD();
    if (timeLeft<=0) playerDie();
  }, 1000);
  loopId=requestAnimationFrame(gameLoop);
}

// ── Screens ───────────────────────────────────────────
function showOv(id) {
  ['ov-title','ov-gameover','ov-lb'].forEach((s) => {
    let el =document.getElementById(s);
    if (!el) return;
    el.style.display = s===id ? 'flex' : 'none';
  });
}

// ── Leaderboard ───────────────────────────────────────
const LB_KEY ='rfd_lb_v1';
function lbLoad() { try { return JSON.parse(localStorage.getItem(LB_KEY))||[]; } catch(e) { return []; } }
function lbSave(a) { localStorage.setItem(LB_KEY, JSON.stringify(a)); }
function lbAdd(name, pts) {
  let a =lbLoad();
  a.push({name:name.toUpperCase().slice(0,3).padEnd(3,'.'), score:pts});
  a.sort((x, y) => { return y.score-x.score; });
  const top =a.slice(0,10); lbSave(top);
  return top.findIndex((e) => { return e.score===pts; });
}
function lbRender(hi) {
  if (hi===undefined) hi=-1;
  let a =lbLoad();
  let el =document.getElementById('lb-list');
  if (!el) return;
  if (!a.length) { el.innerHTML='<div style="font-size:8px;color:#666;text-align:center;padding:10px;">BRAK WYNIKÓW</div>'; return; }
  el.innerHTML=a.map((e, i) => {
    const col =i===hi?'#00ffff':i===0?'#ffd700':i===1?'#c0c0c0':i===2?'#cd7f32':'#666';
    return '<div class="lbr" style="color:'+col+'">'
      +'<span>'+(i+1)+'.</span>'
      +'<span style="flex:1;text-align:center;">'+e.name+'</span>'
      +'<span>'+e.score+'</span></div>';
  }).join('');
}
function showGameOver(pts) {
  document.getElementById('go-score').textContent=`WYNIK: ${pts}`;
  let a =lbLoad();
  let isTop =a.length<10||pts>(a.length?a[a.length-1].score:0);
  document.getElementById('go-namewrap').style.display=isTop?'flex':'none';
  let rank =a.filter((e) => { return e.score>pts; }).length+1;
  document.getElementById('go-rank').textContent=isTop?`MIEJSCE #${rank} REKORD!`:`MIEJSCE #${Math.min(rank,99)}`;
  document.getElementById('go-name').value='';
  showOv('ov-gameover');
}