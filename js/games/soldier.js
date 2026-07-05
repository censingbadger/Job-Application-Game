/* ============================================================
   SOLDIER 🪖 — AIM & SHOOT.
   Tap the targets as they pop up — before they disappear and
   fire back. Bullseyes pay the most.
   Danger: Incoming! (tap fast to take cover)
   ============================================================ */

GAMES.soldier = defineShift({
  hint: 'Tap the targets 🎯 as they pop up — before they shoot back! The smaller the target, the more it pays.',
  duration: r => 44 + r * 6,

  init(g) {
    g.targets = [];
    g.spawnEvery = 0.9 / g.diff;         // pop up faster as you rank up
    g.spawnT = 0.4;
    g.life = Math.max(0.75, 1.7 - g.rank * 0.25);   // less time to react at higher ranks
    g.unit = Math.max(2, Math.floor(State.salary() / 12));
    g.hits = 0;
    g.aim = { x: GW / 2, y: GH / 2 };
    g.shotT = 0;
  },

  move(g, x, y) { g.aim.x = x; g.aim.y = y; },

  pointer(g, x, y) {
    g.aim.x = x; g.aim.y = y; g.shotT = 0.12;
    Sound.zap();
    for (let i = g.targets.length - 1; i >= 0; i--) {
      const tg = g.targets[i];
      if (Math.hypot(tg.x - x, tg.y - y) <= tg.r) {
        const bull = Math.hypot(tg.x - x, tg.y - y) <= tg.r * 0.4;
        g.earn(g.unit * (bull ? 2 : 1) * tg.mult);
        g.hits++;
        g.targets.splice(i, 1);
        Sound.coin();
        return;
      }
    }
  },

  update(g, dt) {
    if (g.shotT > 0) g.shotT -= dt;
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.6 + Math.random() * 0.7);
      const r = 34 + Math.random() * 30;                 // smaller = worth more
      g.targets.push({
        x: 70 + Math.random() * (GW - 140),
        y: 90 + Math.random() * (GH - 200),
        r, mult: r < 44 ? 2 : 1, life: g.life, max: g.life, born: 0,
      });
    }
    for (let i = g.targets.length - 1; i >= 0; i--) {
      const tg = g.targets[i];
      tg.born += dt;
      tg.life -= dt;
      if (tg.life <= 0) { g.targets.splice(i, 1); g.flash('#d9534f'); Sound.thud(); }   // it fired back
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    // battlefield
    ctx.fillStyle = '#c9c07a'; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#b3a95f'; ctx.fillRect(0, GH - 90, GW, 90);
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GH - 90); ctx.lineTo(GW, GH - 90); ctx.stroke();
    // sandbags
    ctx.fillStyle = '#9a8f4f';
    for (let x = 20; x < GW; x += 70) { ctx.beginPath(); ctx.ellipse(x, GH - 70, 34, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    Draw.bigText(ctx, '🪖 THE FRONT LINE', GW / 2, 40, 28, '#5a5320');

    // targets (pop in, pulse)
    g.targets.forEach(tg => {
      const pop = Math.min(1, tg.born * 6);
      const r = tg.r * pop;
      const warn = tg.life < tg.max * 0.35;
      ctx.lineWidth = 4; ctx.strokeStyle = '#2b2b33';
      ctx.fillStyle = warn ? '#f6cccb' : '#fff';
      ctx.beginPath(); ctx.arc(tg.x, tg.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d9534f'; ctx.beginPath(); ctx.arc(tg.x, tg.y, r * 0.66, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tg.x, tg.y, r * 0.33, 0, Math.PI * 2); ctx.fill();
      if (warn) Draw.emoji(ctx, '⚠️', tg.x, tg.y - r - 16, 26);
    });

    // crosshair
    const a = g.aim;
    ctx.strokeStyle = g.shotT > 0 ? '#d9534f' : '#2b2b33';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(a.x, a.y, 20, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(a.x - 30, a.y); ctx.lineTo(a.x - 8, a.y); ctx.moveTo(a.x + 8, a.y); ctx.lineTo(a.x + 30, a.y);
    ctx.moveTo(a.x, a.y - 30); ctx.lineTo(a.x, a.y - 8); ctx.moveTo(a.x, a.y + 8); ctx.lineTo(a.x, a.y + 30); ctx.stroke();

    Draw.bigText(ctx, `Targets hit: ${g.hits}`, GW / 2, GH - 16, 22, '#5a5320');
  },
});
