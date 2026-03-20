// ── game.js ──────────────────────────────────────────
// Movement, playerDie, game loop, controls, boot

// ── Movement ──────────────────────────────────────────
function move(dr, dc) {
  if (!running || playerDying || dyingLock || levelDone) return;
  let now = Date.now();
  if (now - lastMove < moveDelay) return;
  lastMove = now;
  let nr =playerY+dr, nc=playerX+dc;
  if (nr<0||nr>=ROWS||nc<0||nc>=COLS) return;
  let tgt = grid[nr][nc];
  if (tgt===STEEL||tgt===WALL||tgt===AMOEBA||tgt===MAGIC) return;
  if (tgt===BOULDER) {
    // Sprawdź, czy za kamieniem jest puste pole
    let nnr = nr + dr, nnc = nc + dc;
    if (nnr >= 0 && nnr < ROWS && nnc >= 0 && nnc < COLS && grid[nnr][nnc] === EMPTY) {
      // Przesuń kamień
      grid[nnr][nnc] = BOULDER;
      grid[nr][nc] = EMPTY;
    } else {
      return;
    }
  }
  if (tgt===EXIT) {
    if (!exitOpen) return;
    // Player steps into exit — move them there, then trigger transition
    levelDone=true;
    try { navigator.vibrate(150); } catch(e) {}
    // Count total diamonds on map for 3-star check
    let totalGems = 0;
    for (let _r=0;_r<ROWS;_r++) for (let _c=0;_c<COLS;_c++) if(grid[_r][_c]===DIAMOND) totalGems++;
    const allGems = (gemsGot >= gemsNeeded + totalGems);
    const stars = calcStars(timeLeft, levelStartTimeLeft || timeLeft+1, allGems);
    starsSet(level, stars);
    score+=timeLeft*5;
    grid[playerY][playerX]=EMPTY;
    playerY=nr; playerX=nc;
    updateHUD();
    setTimeout(() => { showLoadingScreen(stars); }, 400);
    return;
  }
  if (tgt===DIAMOND) {
    gemsGot++;
    try { navigator.vibrate(30); } catch(e) {}
    playSound('diamond');
    // Bonus multiplier for gems collected beyond minimum
    let bonus = gemsGot > gemsNeeded ? 3 : 1;
    score += pts * bonus;
    scorePopups.push({x: playerX*T, y: playerY*T, val: pts*bonus, t: 80, bonus: bonus>1});
    if (bonus > 1) {
      // Flash score element to signal bonus
      let el = document.getElementById('h-score');
      el.style.color='#ff0';
      setTimeout(() => { el.style.color='#f5a623'; }, 300);
    }
    if (gemsGot>=gemsNeeded) exitOpen=true;
    updateHUD();
  }
  grid[playerY][playerX]=EMPTY;
  playerY=nr; playerX=nc;
  if (grid[playerY][playerX]!==EXIT) grid[playerY][playerX]=EMPTY;
  lastMoveTime=performance.now();
  walkFrame++;
}

// ── Player death ──────────────────────────────────────
function playerDie() {
  if (dyingLock || playerDying || !running) return;
  dyingLock=true; playerDying=true;
  try { navigator.vibrate([100,50,100]); } catch(e) {}
  playSound('death');
  lives--; updateHUD();
  for (let dr=-1; dr<=1; dr++) {
    for (let dc=-1; dc<=1; dc++) {
      let er =playerY+dr, ec=playerX+dc;
      if (er>=0&&er<ROWS&&ec>=0&&ec<COLS&&grid[er][ec]!==STEEL) {
        explosions.push({r:er,c:ec,t:10});
        grid[er][ec]=EMPTY;
      }
    }
  }
  if (lives<=0) {
    running=false; clearInterval(timerInt);
    setTimeout(() => {
      dyingLock=false; playerDying=false;
      clearSave();
      pendingScore=score; showGameOver(score);
    }, 1400);
  } else {
    setTimeout(() => {
      saveGame();
      dyingLock=false; playerDying=false; initLevel();
    }, 1000);
  }
}

// ── Render ────────────────────────────────────────────
function render() {
  let camC = playerX - Math.floor(VW/2);
  let camR = playerY - Math.floor(VH/2);
  camC = Math.max(0, Math.min(camC, COLS-VW));
  camR = Math.max(0, Math.min(camR, ROWS-VH));
  ctx.fillStyle='#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
  for (let vr=0; vr<VH; vr++) {
    for (let vc=0; vc<VW; vc++) {
      let gr =camR+vr, gc=camC+vc;
      let ox =vc*T, oy=vr*T;
      if (gr<0||gr>=ROWS||gc<0||gc>=COLS) { ctx.fillStyle='#000'; ctx.fillRect(ox,oy,T,T); continue; }
      let tile =grid[gr][gc];
      if      (tile===EMPTY)   { ctx.fillStyle='#050508'; ctx.fillRect(ox,oy,T,T); }
      else if (tile===DIRT)    drawSpr(DIRT_S,ox,oy);
      else if (tile===WALL)    drawSpr(WALL_S,ox,oy);
      else if (tile===STEEL)   drawSpr(STEEL_S,ox,oy);
      else if (tile===BOULDER) drawSpr(BOULD_S,ox,oy);
      else if (tile===DIAMOND) drawDiamond(ox,oy,animFrame,gr,gc);
      else if (tile===EXIT)    drawExit(ox,oy,exitOpen,animFrame);
      else if (tile===AMOEBA)  drawAmoeba(ox,oy,animFrame);
      else if (tile===MAGIC)   drawMagicWall(ox,oy,animFrame,magicActive);
      else { ctx.fillStyle='#050508'; ctx.fillRect(ox,oy,T,T); }
    }
  }
  for (let i=explosions.length-1; i>=0; i--) {
    let ex =explosions[i];
    const vc2 =ex.c-camC, vr2=ex.r-camR;
    if (vc2>=0&&vc2<VW&&vr2>=0&&vr2<VH) drawExplosion(vc2*T,vr2*T,ex.t);
    ex.t--;
    if (ex.t<=0) explosions.splice(i,1);
  }
  // Draw butterflies
  for (let i = 0; i < butterflies.length; i++) {
    const b = butterflies[i];
    const bvc = b.c - camC, bvr = b.r - camR;
    if (bvc >= 0 && bvc < VW && bvr >= 0 && bvr < VH) {
      drawButterfly(bvc*T, bvr*T, animFrame);
    }
  }

  let pvc =playerX-camC, pvr=playerY-camR;
  if (pvc>=0&&pvc<VW&&pvr>=0&&pvr<VH) {
    if (!playerDying||animFrame%8<4) drawPlayer(pvc*T,pvr*T,animFrame);
  }
  // Score popups
  ctx.save();
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    let s = scorePopups[i];
    let color = s.bonus ? '#00ffff' : '#ffd700';
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.max(0, s.t / 80);
    // Move slower: vertical offset increases slower
    ctx.fillText('+' + s.val, s.x - camC*T + T/2, s.y - camR*T - ((80 - s.t) * 0.5) + T/2);
    s.t--;
    if (s.t <= 0) scorePopups.splice(i, 1);
  }
  ctx.restore();
}

// ── Game loop ─────────────────────────────────────────
function gameLoop(ts) {
  if (!running) return;
  animFrame++;
  if (ts-lastPhys>220) { physics(); lastPhys=ts; }
  render();
  loopId=requestAnimationFrame(gameLoop);
}

// ── Game loop ─────────────────────────────────────────
function gameLoop(ts) {
  if (!running) return;
  animFrame++;
  if (ts-lastPhys>220) { physics(); lastPhys=ts; }
  render();
  loopId=requestAnimationFrame(gameLoop);
}

// ── Controls ──────────────────────────────────────────
function setupBtn(id, dr, dc) {
  let el =document.getElementById(id);
  function startM(e) { e.preventDefault(); el.classList.add('on'); move(dr,dc); holdInt=setInterval(() => { move(dr,dc); }, moveDelay); }
  function stopM(e)  { e.preventDefault(); el.classList.remove('on'); clearInterval(holdInt); }
  el.addEventListener('touchstart', startM, {passive:false});
  el.addEventListener('touchend',   stopM,  {passive:false});
  el.addEventListener('touchcancel',stopM,  {passive:false});
  el.addEventListener('mousedown',  startM);
  el.addEventListener('mouseup',    stopM);
  el.addEventListener('mouseleave', stopM);
}

// ── Boot ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {

  // ── SPLASH SCREEN ────────────────────────────────────
  function runSplash(onDone) {
    const splash = document.getElementById('splash');
    const sc     = document.getElementById('splash-canvas');
    const sctx   = sc.getContext('2d');
    sc.width = window.innerWidth;
    sc.height = window.innerHeight;

    const PCOLS = ['#8b3a0a','#c46820','#e8943a','#00ccff','#0088cc','#f5a623','#ffffff'];
    const particles = Array.from({length:40}, () => ({
      x: Math.random()*sc.width, y: Math.random()*sc.height,
      size: 4+Math.random()*8, speed: 0.4+Math.random()*1.4,
      col: PCOLS[Math.floor(Math.random()*PCOLS.length)],
      type: Math.random()<0.5?'b':'d', rot: Math.random()*Math.PI*2,
    }));

    let animId;
    function animParticles() {
      sctx.fillStyle='rgba(0,0,0,0.15)';
      sctx.fillRect(0,0,sc.width,sc.height);
      for (const p of particles) {
        p.y+=p.speed; p.rot+=0.02;
        if (p.y>sc.height+20) { p.y=-20; p.x=Math.random()*sc.width; }
        if (p.type==='b') {
          sctx.fillStyle=p.col;
          sctx.beginPath(); sctx.arc(p.x,p.y,p.size,0,Math.PI*2); sctx.fill();
          sctx.fillStyle='rgba(255,255,255,0.2)';
          sctx.beginPath(); sctx.arc(p.x-p.size*0.3,p.y-p.size*0.3,p.size*0.3,0,Math.PI*2); sctx.fill();
        } else {
          sctx.save(); sctx.translate(p.x,p.y); sctx.rotate(p.rot);
          sctx.fillStyle=p.col;
          sctx.beginPath();
          sctx.moveTo(0,-p.size); sctx.lineTo(p.size*0.6,0);
          sctx.lineTo(0,p.size); sctx.lineTo(-p.size*0.6,0);
          sctx.closePath(); sctx.fill(); sctx.restore();
        }
      }
      animId=requestAnimationFrame(animParticles);
    }
    animParticles();

    // Sequence
    setTimeout(()=>document.getElementById('splash-title').classList.add('show'), 300);
    setTimeout(()=>document.getElementById('splash-sub').classList.add('show'), 700);
    setTimeout(()=>document.getElementById('splash-year').classList.add('show'), 1000);
    setTimeout(()=>document.getElementById('splash-bar-wrap').classList.add('show'), 1100);

    // Fill bar over 2s
    const bar = document.getElementById('splash-bar');
    const barStart = performance.now() + 1100;
    const barDur = 2200;
    function fillBar(ts) {
      const pct = Math.max(0, Math.min(100, (ts-barStart)/barDur*100));
      bar.style.width = pct+'%';
      if (pct<100) requestAnimationFrame(fillBar);
      else document.getElementById('splash-press').classList.add('show');
    }
    requestAnimationFrame(fillBar);

    let dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      // Instantly fill bar then fade out
      bar.style.transition = 'width 0.2s';
      bar.style.width = '100%';
      cancelAnimationFrame(animId);
      setTimeout(() => {
        splash.style.transition = 'opacity 0.4s';
        splash.style.opacity = '0';
        setTimeout(() => { splash.style.display='none'; onDone(); }, 400);
      }, 200);
    }
    splash.addEventListener('click', dismiss);
    splash.addEventListener('touchstart', (e) => { e.preventDefault(); dismiss(); }, {passive:false});
    setTimeout(dismiss, 10000);
  }

  // ── BOOT GAME ────────────────────────────────────────
  function boot() {
    let wrap =document.getElementById('canvas-wrap');
    if (!wrap||wrap.clientHeight<10) { requestAnimationFrame(boot); return; }
    resize();
    applyLang();  // apply translations
    window.addEventListener('resize', resize);
    initLevel(); render();
    // Wire buttons
    setupBtn('db-up',   -1, 0);
    setupBtn('db-down',  1, 0);
    setupBtn('db-left',  0,-1);
    setupBtn('db-right', 0, 1);
    // Show continue button if save exists
    const save = loadSave();
    const btnContinue = document.getElementById('btn-continue');
    if (save) {
      btnContinue.style.display = '';
      btnContinue.textContent = `${t('btn_continue')} (LVL ${save.level+1})`;
    }
    btnContinue.addEventListener('click', continueGame);
    btnContinue.addEventListener('touchend', (e) => { e.preventDefault(); continueGame(); }, {passive:false});
    document.getElementById('btn-start').addEventListener('click', startGame);
    document.getElementById('btn-start').addEventListener('touchend', (e) => { e.preventDefault(); startGame(); }, {passive:false});
    document.getElementById('btn-scores').addEventListener('click', () => { lbRender(); showOv('ov-lb'); });
    document.getElementById('btn-scores').addEventListener('touchend', (e) => { e.preventDefault(); lbRender(); showOv('ov-lb'); }, {passive:false});
    document.getElementById('btn-lbback').addEventListener('click', () => { showOv('ov-title'); });
    document.getElementById('btn-lbback').addEventListener('touchend', (e) => { e.preventDefault(); showOv('ov-title'); }, {passive:false});
    document.getElementById('btn-gomenu').addEventListener('click', () => { showOv('ov-title'); });
    document.getElementById('btn-gomenu').addEventListener('touchend', (e) => { e.preventDefault(); showOv('ov-title'); }, {passive:false});
    document.getElementById('btn-gosave').addEventListener('click', () => {
      let name =document.getElementById('go-name').value.trim()||'AAA';
      let idx =lbAdd(name, pendingScore); lbRender(idx); showOv('ov-lb');
    });
    document.getElementById('btn-gosave').addEventListener('touchend', (e) => {
      e.preventDefault();
      let name =document.getElementById('go-name').value.trim()||'AAA';
      let idx =lbAdd(name, pendingScore); lbRender(idx); showOv('ov-lb');
    }, {passive:false});
    document.getElementById('go-name').addEventListener('input', (e) => {
      e.target.value=e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3);
    });
    document.getElementById('go-name').addEventListener('keydown', (e) => {
      if (e.key==='Enter') document.getElementById('btn-gosave').click();
    });
    // Touch steer on canvas
    let tsx = null, tsy = null;
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      tsx = e.touches[0].clientX;
      tsy = e.touches[0].clientY;
    }, {passive:false});
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const dx = e.touches[0].clientX - tsx;
      const dy = e.touches[0].clientY - tsy;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx < -20) move(0, -1);
        else if (dx > 20) move(0, 1);
      } else {
        if (dy < -20) move(-1, 0);
        else if (dy > 20) move(1, 0);
      }
    }, {passive:false});
    canvas.addEventListener('touchend', (e) => { e.preventDefault(); }, {passive:false});
    // Keyboard
    const held ={};
    const keyIntervals = {};  // one interval per key
    document.addEventListener('keydown', (e) => {
      if (held[e.key]) return; held[e.key]=true;
      const map ={'ArrowUp':[-1,0],'ArrowDown':[1,0],'ArrowLeft':[0,-1],'ArrowRight':[0,1],'w':[-1,0],'s':[1,0],'a':[0,-1],'d':[0,1]};
      if (map[e.key]) {
        e.preventDefault();
        const d = map[e.key];
        move(d[0], d[1]);
        clearInterval(keyIntervals[e.key]);
        keyIntervals[e.key] = setInterval(() => { move(d[0], d[1]); }, moveDelay);
      }
    });
    document.addEventListener('keyup', (e) => {
      held[e.key] = false;
      clearInterval(keyIntervals[e.key]);
      delete keyIntervals[e.key];
    });
    // Safety: clear all intervals on window blur
    window.addEventListener('blur', () => {
      for (const k in keyIntervals) { clearInterval(keyIntervals[k]); delete keyIntervals[k]; }
      for (const k in held) held[k] = false;
    });
  }
  // Run splash first, then boot game
  runSplash(() => requestAnimationFrame(boot));
});