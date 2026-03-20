// ── render.js ────────────────────────────────────────
// Canvas rendering: tiles, sprites, HUD, score popups

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