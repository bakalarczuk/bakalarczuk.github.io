// ── levels.js ────────────────────────────────────────
// Procedural level generator

// ── Procedural level generator ───────────────────────
// Difficulty ramps with level number (0-based)
// Returns { rows, cols, gemsNeeded, gemsTotal, time, pts }

const rng = (seed) => {
  // Simple seeded LCG so each level is reproducible but unique
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateLevel(lvl) {
  let diff = lvl;                              // 0 = easy
  // Map size = at least VW/VH (fills screen), grows with difficulty
  let rows = Math.max(VH || 14, Math.min(28, 14 + Math.floor(diff/3)*2));
  let cols = Math.max(VW || 22, Math.min(40, 22 + Math.floor(diff/3)*2));
  // Ensure odd dimensions for centering
  if (rows % 2 === 0) rows++;
  if (cols % 2 === 0) cols++;
  // Difficulty params
  let boulderChance = 0.06 + diff*0.012;       // more boulders
  let wallChance = 0.05 + diff*0.005;       // more walls
  let diamondChance = Math.max(0.04, 0.09 - diff*0.006); // fewer diamonds
  let gemsNeeded = 5 + Math.floor(diff*1.5);
  let time = Math.max(60, 160 - diff*8);
  let pts = 20 + diff*10;
  let rand = rng(lvl * 7919 + 12345);

  let g = [];
  let i, r, c;
  for (r=0; r<rows; r++) {
    g[r]=[];
    for (c=0; c<cols; c++) {
      // Border = steel
      if (r===0||r===rows-1||c===0||c===cols-1) { g[r][c]=STEEL; continue; }
      const roll = rand();
      if      (roll < boulderChance) g[r][c]=BOULDER;
      else if (roll < boulderChance+diamondChance) g[r][c]=DIAMOND;
      else if (roll < boulderChance+diamondChance+wallChance) g[r][c]=WALL;
      else g[r][c]=DIRT;
    }
  }

  // Place player bottom-left area, clear 3x3 around them
  let px =2, py=rows-2;
  g[py][px]=EMPTY;
  for (r=py-1; r<=py; r++) for (c=px; c<=px+2; c++) if(r>0&&c<cols-1) g[r][c]=EMPTY;

  // Place exit top-right area, clear path around it
  let ex =cols-3, ey=2;
  g[ey][ex]=EXIT;
  for (r=ey-1; r<=ey+1; r++) for (c=ex-1; c<=ex+1; c++) if(r>0&&r<rows-1&&c>0&&c<cols-1) { if(g[r][c]!==EXIT) g[r][c]=EMPTY; }

  // Spawn butterflies — 1 on level 0, more as difficulty rises
  const numButterflies = diff < 3 ? 0 : Math.floor((diff - 2) / 3);
  let bAttempts = 0;
  let bPlaced = 0;
  while (bPlaced < numButterflies && bAttempts < 300) {
    bAttempts++;
    const br = 2 + Math.floor(rand() * (rows - 4));
    const bc = 2 + Math.floor(rand() * (cols - 4));
    // Place on dirt, away from player start and exit
    if (g[br][bc] === DIRT &&
        Math.abs(br - py) + Math.abs(bc - px) > 5 &&
        Math.abs(br - ey) + Math.abs(bc - ex) > 5) {
      g[br][bc] = BUTTERFLY;
      bPlaced++;
    }
  }

  // Spawn amoeba (from level 5)
  if (diff >= 5) {
    const numAmoeba = 1 + Math.floor((diff-5) / 4);
    let aAttempts = 0, aPlaced = 0;
    while (aPlaced < numAmoeba && aAttempts < 200) {
      aAttempts++;
      const ar = 3 + Math.floor(rand()*(rows-6));
      const ac = 3 + Math.floor(rand()*(cols-6));
      if (g[ar][ac] === DIRT &&
          Math.abs(ar-py)+Math.abs(ac-px) > 6 &&
          Math.abs(ar-ey)+Math.abs(ac-ex) > 6) {
        g[ar][ac] = AMOEBA; aPlaced++;
      }
    }
  }

  // Spawn magic wall (from level 3) — replace some wall tiles
  if (diff >= 3) {
    let mPlaced = 0;
    for (let r=1; r<rows-1 && mPlaced < 2+Math.floor(diff/4); r++) {
      for (let c=1; c<cols-1 && mPlaced < 2+Math.floor(diff/4); c++) {
        if (g[r][c] === WALL && rand() < 0.15) {
          g[r][c] = MAGIC; mPlaced++;
        }
      }
    }
  }

  // Count diamonds
  let dCount = 0;
  for (r=1; r<rows-1; r++) for (c=1; c<cols-1; c++) if(g[r][c]===DIAMOND) dCount++;
  // Extra diamonds for bonus: just 1-2 on early levels, up to 5 on harder ones
  const extraBonus = 1 + Math.min(4, Math.floor(diff/2));
  const needed = gemsNeeded + extraBonus;
  // Remove excess diamonds if too many spawned randomly
  if (dCount > needed + 2) {
    let toRemove = dCount - (needed + 2);
    for (r=1; r<rows-1 && toRemove>0; r++) {
      for (c=1; c<cols-1 && toRemove>0; c++) {
        if (g[r][c]===DIAMOND) { g[r][c]=DIRT; dCount--; toRemove--; }
      }
    }
  }
  // Add diamonds if not enough
  let attempts = 0;
  while (dCount < needed && attempts < 500) {
    attempts++;
    const dr2 = 1+Math.floor(rand()*(rows-2));
    const dc2 = 1+Math.floor(rand()*(cols-2));
    if (g[dr2][dc2]===DIRT) { g[dr2][dc2]=DIAMOND; dCount++; }
  }
  gemsNeeded = Math.min(gemsNeeded, dCount);

  return { rows:rows, cols:cols, gemsNeeded:gemsNeeded, time:time, pts:pts, grid:g, playerX:px, playerY:py };
}