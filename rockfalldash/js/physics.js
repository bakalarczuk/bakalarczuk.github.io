// ── physics.js ───────────────────────────────────────
// Physics: falling boulders/diamonds, butterflies, amoeba, magic wall

// ── Physics ───────────────────────────────────────────
// falling[r][c] = true means this tile was falling last tick
let falling = [];
for (let _r=0; _r<ROWS; _r++) { falling[_r]=[]; for (let _c=0;_c<COLS;_c++) falling[_r][_c]=false; }

function physics() {
  if (!running || playerDying || dyingLock || levelDone) return;
  let nextFalling = [];
  for (let _r=0; _r<ROWS; _r++) { nextFalling[_r]=[]; for (let _c=0;_c<COLS;_c++) nextFalling[_r][_c]=false; }
  let hit = false;
  for (let r=ROWS-2; r>=0; r--) {
    for (let c=0; c<COLS; c++) {
      let t = grid[r][c];
      if (t===BOULDER || t===DIAMOND) {
        const below = grid[r+1][c];
        const belowIsPlayer = (r+1===playerY && c===playerX);
        // Player blocks boulder/diamond just like a wall
        if (below===EMPTY && !belowIsPlayer) {
          // Check if a butterfly is at r+1 BEFORE moving boulder there
          const bfHit = butterflies.findIndex(b => b.r === r+1 && b.c === c);
          if (bfHit >= 0) {
            // Boulder/diamond hits butterfly — explode regardless of falling state
            grid[r][c] = EMPTY;
            butterflyExplode(butterflies[bfHit].r, butterflies[bfHit].c);
          } else {
            // falls freely
            grid[r+1][c]=t; grid[r][c]=EMPTY;
            nextFalling[r+1][c]=true;
            if (t === BOULDER) playSound('boulder');
            // kill player only if was already falling
            if (r+2===playerY && c===playerX && falling[r][c]) hit=true;
          }
        } else if (!belowIsPlayer && r+1<ROWS &&
                   (below===BOULDER||below===WALL||below===STEEL||below===DIAMOND||below===MAGIC)) {
          // resting on solid — try to roll, but only if was falling
          if (falling[r][c]) {
            if (c+1<COLS && grid[r][c+1]===EMPTY && grid[r+1][c+1]===EMPTY) {
              grid[r][c+1]=t; grid[r][c]=EMPTY;
              nextFalling[r][c+1]=true;
            } else if (c-1>=0 && grid[r][c-1]===EMPTY && grid[r+1][c-1]===EMPTY) {
              grid[r][c-1]=t; grid[r][c]=EMPTY;
              nextFalling[r][c-1]=true;
            }
          }
          // else stable rest — not falling
        }
        // Magic wall: boulder/diamond enters magic tile → transforms below
        if (below === MAGIC && !magicActive) {
          magicActive = true; magicTimer = 0;
        }
        if (below === MAGIC && magicActive) {
          const outTile = (t === BOULDER) ? DIAMOND : BOULDER;
          const nr2 = r+2;
          if (nr2 < ROWS && grid[nr2][c] === EMPTY) {
            grid[r][c] = EMPTY;
            grid[nr2][c] = outTile;
            nextFalling[nr2][c] = true;
          } else {
            grid[r][c] = EMPTY; // boulder disappears
          }
        }
        // if belowIsPlayer — do nothing, player supports it
      }
    }
  }
  falling = nextFalling;
  if (hit && !playerDying && !dyingLock) playerDie();

  // ── Butterfly movement (every other physics tick) ──
  if (animFrame % 2 === 0) moveButterflies();

  // ── Amoeba growth ──
  amoebaTimer++;
  if (amoebaTimer % 8 === 0) tickAmoeba();

  // ── Magic wall timer ──
  if (magicActive) {
    magicTimer++;
    if (magicTimer > 120) { magicActive = false; }
  }
}

function tickAmoeba() {
  const cells = [];
  for (let r=0; r<ROWS; r++)
    for (let c=0; c<COLS; c++)
      if (grid[r][c] === AMOEBA) cells.push({r,c});

  amoebaSize = cells.length;

  // Too large → all become boulders
  if (amoebaSize > 60) {
    for (const a of cells) grid[a.r][a.c] = BOULDER;
    return;
  }

  // Check if enclosed (can't expand) → all become diamonds
  let canExpand = false;
  for (const a of cells) {
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr=a.r+dr, nc=a.c+dc;
      if (nr>0&&nr<ROWS-1&&nc>0&&nc<COLS-1 && (grid[nr][nc]===EMPTY||grid[nr][nc]===DIRT)) {
        canExpand = true; break;
      }
    }
    if (canExpand) break;
  }
  if (!canExpand) {
    for (const a of cells) grid[a.r][a.c] = DIAMOND;
    return;
  }

  // Grow randomly into one adjacent dirt/empty
  if (cells.length > 0) {
    const src = cells[Math.floor(Math.random()*cells.length)];
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]].sort(()=>Math.random()-0.5);
    for (const [dr,dc] of dirs) {
      const nr=src.r+dr, nc=src.c+dc;
      if (nr>0&&nr<ROWS-1&&nc>0&&nc<COLS-1 && (grid[nr][nc]===EMPTY||grid[nr][nc]===DIRT)) {
        grid[nr][nc] = AMOEBA; break;
      }
    }
  }

  // Kill player if amoeba is on same tile
  for (const a of cells) {
    if (a.r===playerY && a.c===playerX) {
      if (!playerDying && !dyingLock) playerDie();
      return;
    }
  }
}

function moveButterflies() {
  // dir: 0=up, 1=right, 2=down, 3=left
  const DR = [-1, 0, 1,  0];
  const DC = [ 0, 1, 0, -1];

  // Check if a cell is passable for butterfly (empty or dirt)
  const passable = (r, c) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
    const t = grid[r][c];
    return t === EMPTY || t === DIRT;
  };

  for (let i = butterflies.length - 1; i >= 0; i--) {
    const b = butterflies[i];

    // Left-hand rule: try turn-left, forward, turn-right, reverse
    const leftDir  = (b.dir + 3) % 4;
    const rightDir = (b.dir + 1) % 4;
    const backDir  = (b.dir + 2) % 4;

    let moved = false;
    for (const tryDir of [leftDir, b.dir, rightDir, backDir]) {
      const nr = b.r + DR[tryDir];
      const nc = b.c + DC[tryDir];
      if (passable(nr, nc)) {
        b.r = nr; b.c = nc; b.dir = tryDir;
        moved = true;
        break;
      }
    }

    // Kill player on contact
    if (!playerDying && !dyingLock) {
      const dr = Math.abs(b.r - playerY);
      const dc = Math.abs(b.c - playerX);
      if (dr <= 1 && dc <= 1 && dr + dc <= 1) {
        playerDie();
        return;
      }
    }
  }
}

function butterflyExplode(r, c) {
  // Remove butterfly at r,c
  butterflies = butterflies.filter(b => !(b.r === r && b.c === c));
  score += 500;  // bonus for killing butterfly
  updateHUD();
  // 3×3 explosion: dirt → diamond, others → empty (except steel)
  for (let er = r-1; er <= r+1; er++) {
    for (let ec = c-1; ec <= c+1; ec++) {
      if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) continue;
      if (grid[er][ec] === STEEL) continue;
      grid[er][ec] = DIAMOND;
      explosions.push({r: er, c: ec, t: 10});
    }
  }
  // Check if player is in explosion zone
  if (!playerDying && !dyingLock) {
    if (Math.abs(playerY - r) <= 1 && Math.abs(playerX - c) <= 1) {
      playerDie();
    }
  }
}