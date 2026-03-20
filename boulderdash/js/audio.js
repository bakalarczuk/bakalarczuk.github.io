// ── audio.js ─────────────────────────────────────────
// Web Audio API sound effects

// ── Sound ───────────────────────────────────────────────
let audioCtx = null;
function playSound(type) {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return; }
  }
  let o = audioCtx.createOscillator();
  let g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  let now = audioCtx.currentTime;
  if (type === 'boulder') {
    o.type = 'square';
    o.frequency.setValueAtTime(180, now);
    o.frequency.linearRampToValueAtTime(90, now+0.18);
    g.gain.setValueAtTime(0.13, now);
    g.gain.linearRampToValueAtTime(0, now+0.2);
    o.start(now);
    o.stop(now+0.2);
    return;
  }
  if (type === 'diamond') {
    o.type = 'triangle';
    o.frequency.setValueAtTime(880, now);
    o.frequency.linearRampToValueAtTime(1320, now+0.15);
    g.gain.setValueAtTime(0.12, now);
    g.gain.linearRampToValueAtTime(0, now+0.18);
    o.start(now);
    o.stop(now+0.18);
  } else if (type === 'death') {
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, now);
    o.frequency.linearRampToValueAtTime(110, now+0.4);
    g.gain.setValueAtTime(0.18, now);
    g.gain.linearRampToValueAtTime(0, now+0.45);
    o.start(now);
    o.stop(now+0.45);
  } else if (type === 'level') {
    o.type = 'square';
    o.frequency.setValueAtTime(660, now);
    o.frequency.linearRampToValueAtTime(990, now+0.25);
    g.gain.setValueAtTime(0.15, now);
    g.gain.linearRampToValueAtTime(0, now+0.28);
    o.start(now);
    o.stop(now+0.28);
  }
}