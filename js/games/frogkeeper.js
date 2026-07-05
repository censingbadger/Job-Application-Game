/* ============================================================
   FROG KEEPER 🐸 — CATCH FALLING STUFF (legendary!).
   Catch the frogs in your net. The rare GOLDEN frog pays big —
   but skip the red poison frogs, they make you drop everything!
   ============================================================ */

GAMES.frogkeeper = defineShift({
  hint: 'Catch the frogs 🐸 in your net (finger/mouse, or ← →). Grab the rare <b>golden</b> frog for big money — skip the <b>red poison</b> ones!',
  duration: r => 46 + r * 6,

  init(g) {
    g.net = { x: GW / 2, target: GW / 2, w: 150 };
    g.items = [];
    g.spawnEvery = 0.72 / g.diff;
    g.spawnT = 0;
    g.fall = 140 + g.rank * 40;
    g.unit = Math.max(2, Math.floor(State.salary() / 12));
    g.caught = 0; g.stun = 0;
  },

  move(g, x) { g.net.target = Math.max(g.net.w / 2, Math.min(GW - g.net.w / 2, x)); },
  key(g, e) {
    if (e.code === 'ArrowLeft') g.net.target = Math.max(g.net.w / 2, g.net.target - 60);
    if (e.code === 'ArrowRight') g.net.target = Math.min(GW - g.net.w / 2, g.net.target + 60);
  },

  update(g, dt) {
    g.net.x += (g.net.target - g.net.x) * Math.min(1, dt * 14);
    if (g.stun > 0) g.stun -= dt;
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.7 + Math.random() * 0.6);
      const roll = Math.random();
      const kind = roll < 0.12 ? { worth: 6, gold: true } : roll < 0.30 ? { worth: 0, poison: true } : { worth: 1 + Math.random() };
      g.items.push({ ...kind, x: 40 + Math.random() * (GW - 80), y: -30, vy: g.fall * (0.85 + Math.random() * 0.5), spin: 0 });
    }
    const catchY = GH - 96;
    for (let i = g.items.length - 1; i >= 0; i--) {
      const it = g.items[i];
      it.y += it.vy * dt; it.spin += dt * 3;
      if (it.y >= catchY && it.y <= catchY + 48 && Math.abs(it.x - g.net.x) < g.net.w / 2) {
        if (it.poison) { g.stun = 0.5; g.flash('#d9534f'); Sound.thud(); UI.toast('A poison frog! Yuck!', '🐸'); }
        else { g.earn(g.unit * it.worth); g.caught++; if (it.gold) { UI.confetti(12); Sound.jackpot(); } else Sound.coin(); }
        g.items.splice(i, 1); continue;
      }
      if (it.y > GH + 40) g.items.splice(i, 1);
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    const sky = ctx.createLinearGradient(0, 0, 0, GH);
    sky.addColorStop(0, '#bfe3c0'); sky.addColorStop(1, '#e6f4e0');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, GW, GH);
    // lily pads at the bottom
    ctx.fillStyle = '#6fbf72';
    for (let x = 40; x < GW; x += 120) { ctx.beginPath(); ctx.ellipse(x, GH - 40, 40, 16, 0, 0, Math.PI * 2); ctx.fill(); }
    Draw.bigText(ctx, '🐸 THE FROG POND', GW / 2, 40, 28, '#2f7d4a');

    g.items.forEach(it => {
      ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(Math.sin(it.spin) * 0.25);
      if (it.gold) { ctx.fillStyle = 'rgba(232,184,48,.6)'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill(); }
      if (it.poison) { ctx.fillStyle = 'rgba(217,83,79,.55)'; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill(); }
      Draw.emoji(ctx, '🐸', 0, 0, 42); ctx.restore();
    });

    // the net
    const cx = g.net.x, cy = GH - 92, w = g.net.w;
    if (g.stun > 0) ctx.globalAlpha = 0.5 + Math.sin(t * 40) * 0.3;
    ctx.fillStyle = 'rgba(120,200,120,.4)'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(cx, cy + 18, w / 2, 30, 0, 0, Math.PI, false); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - w / 2, cy + 18); ctx.lineTo(cx + w / 2, cy + 18); ctx.stroke();
    // net mesh
    for (let i = 1; i < 5; i++) { const x = cx - w / 2 + (w / 5) * i; ctx.beginPath(); ctx.moveTo(x, cy + 18); ctx.lineTo(cx + (x - cx) * 0.4, cy + 44); ctx.stroke(); }
    ctx.globalAlpha = 1;

    Draw.bigText(ctx, `Frogs: ${g.caught}`, GW / 2, GH - 12, 22, '#2f7d4a');
  },
});
