/* ============================================================
   EXECUTIONER 🪓 — PERFECT TIMING (drop the axe).
   The log slides back and forth under the blade. Tap to drop
   the axe when the log's mark is in the green. One clean chop!
   ============================================================ */

function exeChop(g) {
  if (g.cool > 0) return;
  g.spark = 0.2; g.dropT = 0;
  if (g.block >= g.lo && g.block <= g.hi) {
    const perfect = Math.abs(g.block - (g.lo + g.hi) / 2) < 0.04;
    g.earn(g.unit * (perfect ? 1.8 : 1)); g.chops++;
    g.lastHit = perfect ? 'CLEAN CHOP!' : 'chop!'; Sound.zap();
  } else { g.lastHit = 'missed!'; Sound.thud(); g.flash('#d9534f'); }
  g.hitText = 0.6; g.cool = 0.4;
}

GAMES.executioner = defineShift({
  hint: 'Tap (or <b>space</b>) to drop the axe 🪓 when the log is in the <b>green</b>. Line it up for a clean chop!',
  duration: r => 46 + r * 6,

  init(g) {
    g.unit = Math.max(2, Math.floor(State.salary() / 8));
    g.chops = 0;
    g.block = 0; g.dir = 1; g.speed = 0.5 * g.diff + 0.3;
    const w = Math.max(0.14, 0.3 / g.diff);
    g.lo = 0.5 - w / 2; g.hi = 0.5 + w / 2;   // green zone in the middle
    g.spark = 0; g.hitText = 0; g.lastHit = ''; g.cool = 0; g.dropT = 1;
  },

  pointer(g) { exeChop(g); },
  key(g, e) { if (e.code === 'Space') { e.preventDefault(); exeChop(g); } },

  update(g, dt) {
    if (g.spark > 0) g.spark -= dt;
    if (g.hitText > 0) g.hitText -= dt;
    if (g.dropT < 1) g.dropT += dt * 5;
    if (g.cool > 0) { g.cool -= dt; return; }
    g.block += g.dir * g.speed * dt;
    if (g.block > 1) { g.block = 1; g.dir = -1; }
    if (g.block < 0) { g.block = 0; g.dir = 1; }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#5a4a5a'; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#4a3d4a'; ctx.fillRect(0, GH - 90, GW, 90);
    Draw.bigText(ctx, '🪓 THE CHOPPING BLOCK', GW / 2, 40, 28, '#e8b830');

    const trackX = 120, trackW = GW - 240, y = GH - 150;
    // the track with green zone
    Draw.panel(ctx, trackX, y, trackW, 24, '#2b2b33');
    ctx.fillStyle = '#3fa555'; ctx.fillRect(trackX + trackW * g.lo, y, trackW * (g.hi - g.lo), 24);
    ctx.strokeStyle = '#cdeccf'; ctx.lineWidth = 2; ctx.strokeRect(trackX + trackW * g.lo, y, trackW * (g.hi - g.lo), 24);

    // the log
    const bx = trackX + trackW * g.block;
    Draw.emoji(ctx, '🪵', bx, y - 4, 54);

    // the axe (drops on chop)
    const axeY = 120 + (g.dropT < 1 ? (1 - Math.abs(g.dropT - 0.5) * 2) * 140 : 0);
    Draw.emoji(ctx, '🪓', (g.lo + g.hi) / 2 * trackW + trackX, axeY, 60);
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo((g.lo + g.hi) / 2 * trackW + trackX, 150); ctx.lineTo((g.lo + g.hi) / 2 * trackW + trackX, y); ctx.stroke();
    ctx.setLineDash([]);

    if (g.hitText > 0) Draw.bigText(ctx, g.lastHit, GW / 2, 230, 30, g.lastHit.includes('CHOP') || g.lastHit === 'chop!' ? '#2f7d3f' : '#d9534f');

    Draw.bigText(ctx, `Logs chopped: ${g.chops}`, GW / 2, GH - 24, 22, '#e8b830');
  },
});
