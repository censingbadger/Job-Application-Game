/* ============================================================
   ENGINEER 🛠️ — PERFECT TIMING (build the bridge).
   A power meter bounces up and down. Tap to set a rivet when
   it's in the green. Enough rivets finish a girder — and pay!
   ============================================================ */

function engNewZone(g) {
  const w = Math.max(0.12, 0.28 / g.diff);
  g.lo = 0.1 + Math.random() * (0.8 - w);
  g.hi = g.lo + w;
}

function engRivet(g) {
  g.spark = 0.15;
  if (g.marker >= g.lo && g.marker <= g.hi) {
    g.pieces++; g.lastHit = 'SOLID!'; g.hitText = 0.5; Sound.zap();
    if (g.pieces >= g.need) { g.earn(g.unit); g.built++; g.pieces = 0; g.burst = 0.4; Sound.coin(); }
    engNewZone(g);
  } else { g.lastHit = 'clang!'; g.hitText = 0.4; Sound.thud(); }
}

GAMES.engineer = defineShift({
  hint: 'Tap (or <b>space</b>) to set a rivet when the meter is in the <b>green</b>. Fill the bar to finish each girder! 🛠️',
  duration: r => 46 + r * 6,

  init(g) {
    g.unit = Math.max(2, Math.floor(State.salary() / 6));
    g.built = 0; g.pieces = 0; g.need = 4;
    g.marker = 0; g.dir = 1; g.speed = 0.95 * g.diff;
    g.spark = 0; g.hitText = 0; g.lastHit = ''; g.burst = 0;
    engNewZone(g);
  },

  pointer(g) { engRivet(g); },
  key(g, e) { if (e.code === 'Space') { e.preventDefault(); engRivet(g); } },

  update(g, dt) {
    g.marker += g.dir * g.speed * dt;
    if (g.marker > 1) { g.marker = 1; g.dir = -1; }
    if (g.marker < 0) { g.marker = 0; g.dir = 1; }
    if (g.spark > 0) g.spark -= dt;
    if (g.hitText > 0) g.hitText -= dt;
    if (g.burst > 0) g.burst -= dt;
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#cfe0ea'; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#9fb3c0'; ctx.fillRect(0, GH - 80, GW, 80);
    Draw.bigText(ctx, '🛠️ BUILD THE BRIDGE', GW / 2, 40, 28, '#3a5a70');

    // the bridge being built (girders)
    const total = 8;
    for (let i = 0; i < total; i++) {
      const x = 120 + i * 84, done = i < g.built;
      ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 4;
      ctx.fillStyle = done ? '#e8b830' : 'rgba(43,43,51,.12)';
      ctx.beginPath();
      ctx.moveTo(x, GH - 90); ctx.lineTo(x + 42, GH - 140); ctx.lineTo(x + 84, GH - 90);
      ctx.stroke();
      if (done) { ctx.fill(); }
    }
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(90, GH - 90); ctx.lineTo(GW - 60, GH - 90); ctx.stroke();

    // vertical power meter
    const bx = GW / 2 - 30, by = 100, bh = 250, bw = 60;
    Draw.panel(ctx, bx, by, bw, bh, '#2b2b33');
    // green zone (measured from the bottom up)
    ctx.fillStyle = '#3fa555'; ctx.fillRect(bx, by + bh * (1 - g.hi), bw, bh * (g.hi - g.lo));
    ctx.strokeStyle = '#cdeccf'; ctx.lineWidth = 2; ctx.strokeRect(bx, by + bh * (1 - g.hi), bw, bh * (g.hi - g.lo));
    // marker
    const my = by + bh * (1 - g.marker);
    ctx.fillStyle = g.spark > 0 ? '#e8b830' : '#fff'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.rect(bx - 12, my - 8, bw + 24, 16); ctx.fill(); ctx.stroke();
    Draw.emoji(ctx, '🔧', bx + bw + 34, my, 34);

    // progress dots
    for (let i = 0; i < g.need; i++) {
      ctx.fillStyle = i < g.pieces ? '#e8b830' : '#fff'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bx + 8 + i * 16, by - 20, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (g.hitText > 0) Draw.bigText(ctx, g.lastHit, GW / 2, by - 44, 24, g.lastHit === 'SOLID!' ? '#2f7d3f' : '#d9534f');

    Draw.bigText(ctx, `Girders built: ${g.built}`, GW / 2, GH - 24, 22, '#3a5a70');
  },
});
