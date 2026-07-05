/* ============================================================
   MINER ⛏️ — PERFECT TIMING (pickaxe swings).
   A marker sweeps across the rock. Tap to swing your pickaxe
   when it's in the GREEN vein to crack the rock for gems.
   The sweet spot gets narrower and faster as you rank up.
   ============================================================ */

function minerNewRock(g) {
  const w = Math.max(0.1, 0.24 / g.diff);          // narrower vein at higher ranks
  const lo = 0.08 + Math.random() * (0.84 - w);
  g.rock = { hp: 3, maxhp: 3, value: 1 + Math.random() * 1.4, lo, hi: lo + w };
}

function minerSwing(g) {
  const m = g.marker, rk = g.rock;
  g.spark = 0.18; g.hitFlash = 0.16;
  if (m >= rk.lo && m <= rk.hi) { rk.hp -= 2; g.lastHit = 'CRACK!'; Sound.zap(); }
  else if (m >= rk.lo - 0.07 && m <= rk.hi + 0.07) { rk.hp -= 1; g.lastHit = 'hit'; Sound.ding(); }
  else { g.lastHit = 'miss'; Sound.thud(); }
  g.hitText = 0.5;
  if (rk.hp <= 0) {
    const gems = 2 + Math.floor(Math.random() * 3);
    g.earn(g.unit * rk.value * gems);
    g.broken++; g.burst = 0.5; g.burstX = GW / 2; g.burstY = 250;
    Sound.coin();
    minerNewRock(g);
  }
}

GAMES.miner = defineShift({
  hint: 'Tap (or press <b>space</b>) to <b>swing your pickaxe</b> when the marker is in the <b>green vein</b>! Crack rocks for gems. ⛏️',
  duration: r => 46 + r * 6,

  init(g) {
    g.unit = Math.max(2, Math.floor(State.salary() / 8));
    g.broken = 0;
    g.marker = 0; g.dir = 1;
    g.sweep = 0.85 * g.diff;      // sweeps faster as you rank up
    g.spark = 0; g.hitFlash = 0; g.hitText = 0; g.burst = 0; g.lastHit = '';
    minerNewRock(g);
  },

  pointer(g) { minerSwing(g); },
  key(g, e) { if (e.code === 'Space') { e.preventDefault(); minerSwing(g); } },

  update(g, dt) {
    g.marker += g.dir * g.sweep * dt;
    if (g.marker > 1) { g.marker = 1; g.dir = -1; }
    if (g.marker < 0) { g.marker = 0; g.dir = 1; }
    if (g.spark > 0) g.spark -= dt;
    if (g.hitFlash > 0) g.hitFlash -= dt;
    if (g.hitText > 0) g.hitText -= dt;
    if (g.burst > 0) g.burst -= dt;
  },

  draw(g, t) {
    const ctx = g.ctx;
    // cave
    ctx.fillStyle = '#3a2f28'; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#332a23';
    for (let i = 0; i < 10; i++) { const x = (i * 149 + 30) % GW; Draw.emoji(ctx, '⬤', x, 30 + (i % 3) * 24, 22); }
    Draw.bigText(ctx, '⛏️ THE MINE', GW / 2, 40, 30, '#e8b830');

    const cx = GW / 2, cy = 250, rk = g.rock;
    // the rock
    const shake = g.hitFlash > 0 ? Math.sin(t * 80) * 5 : 0;
    ctx.save(); ctx.translate(cx + shake, cy);
    ctx.fillStyle = g.hitFlash > 0 ? '#8a7a5a' : '#6b6257';
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-110, -20); ctx.lineTo(-70, -80); ctx.lineTo(30, -92);
    ctx.lineTo(108, -40); ctx.lineTo(96, 60); ctx.lineTo(10, 92);
    ctx.lineTo(-84, 66); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // cracks appear as hp drops
    ctx.lineWidth = 3; ctx.strokeStyle = '#2b2b33';
    const cracks = rk.maxhp - rk.hp;
    if (cracks >= 1) { ctx.beginPath(); ctx.moveTo(-40, -60); ctx.lineTo(0, 0); ctx.lineTo(-20, 60); ctx.stroke(); }
    if (cracks >= 2) { ctx.beginPath(); ctx.moveTo(60, -50); ctx.lineTo(0, 0); ctx.lineTo(50, 50); ctx.stroke(); }
    // a glint of gems inside
    Draw.emoji(ctx, '💎', 20, -10, 26);
    ctx.restore();

    // gem burst on break
    if (g.burst > 0) {
      const p = 1 - g.burst / 0.5;
      ['💰', '💎', '💛', '💚'].forEach((e, i) => {
        const a = (Math.PI / 2) + i * 1.4;
        Draw.emoji(ctx, e, cx + Math.cos(a) * p * 130, cy - Math.sin(a) * p * 90, 30);
      });
    }

    // hit word
    if (g.hitText > 0) {
      const col = g.lastHit === 'CRACK!' ? '#2f7d3f' : (g.lastHit === 'miss' ? '#d9534f' : '#9a7714');
      Draw.bigText(ctx, g.lastHit, cx, cy - 120, 30, col);
    }

    // the strike bar
    const bx = cx - 230, bw = 460, by = 400;
    Draw.panel(ctx, bx, by, bw, 30, '#2b2b33');
    // green vein
    ctx.fillStyle = '#3fa555'; ctx.fillRect(bx + bw * rk.lo, by, bw * (rk.hi - rk.lo), 30);
    ctx.strokeStyle = '#cdeccf'; ctx.lineWidth = 2; ctx.strokeRect(bx + bw * rk.lo, by, bw * (rk.hi - rk.lo), 30);
    // sweeping marker (the pickaxe)
    const mx = bx + bw * g.marker;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(mx, by - 8); ctx.lineTo(mx, by + 38); ctx.stroke();
    Draw.emoji(ctx, '⛏️', mx, by - 30, 40 * (g.spark > 0 ? 1.3 : 1));

    Draw.bigText(ctx, `Rocks cracked: ${g.broken}`, GW / 2, GH - 20, 22, '#e8b830');
  },
});
