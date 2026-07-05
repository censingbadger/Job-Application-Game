/* ============================================================
   DEADSHOT 🎯 — AIM & SHOOT (precision).
   Small, drifting targets worth a lot. Nail the tiny bullseye
   for triple pay. Miss too long and they return fire!
   ============================================================ */

GAMES.deadshot = defineShift({
  hint: 'Precision shots! Tap the small targets 🎯 — hit the tiny <b>bullseye</b> centre for triple. Don\'t let them return fire!',
  duration: r => 46 + r * 6,

  init(g) {
    g.targets = [];
    g.spawnEvery = 1.3 / g.diff;
    g.spawnT = 0.5;
    g.life = Math.max(1.2, 2.5 - g.rank * 0.3);
    g.unit = Math.max(2, Math.floor(State.salary() / 10));
    g.hits = 0; g.aim = { x: GW / 2, y: GH / 2 }; g.shotT = 0; g.pop = null;
  },

  move(g, x, y) { g.aim.x = x; g.aim.y = y; },

  pointer(g, x, y) {
    g.aim.x = x; g.aim.y = y; g.shotT = 0.12; Sound.zap();
    for (let i = g.targets.length - 1; i >= 0; i--) {
      const tg = g.targets[i]; const d = Math.hypot(tg.x - x, tg.y - y);
      if (d <= tg.r) {
        const bull = d <= tg.r * 0.3;
        g.earn(g.unit * (bull ? 3 : 1.3)); g.hits++; g.pop = { x: tg.x, y: tg.y, bull, t: 0 };
        g.targets.splice(i, 1); Sound.coin(); return;
      }
    }
  },

  update(g, dt) {
    if (g.shotT > 0) g.shotT -= dt;
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.5) g.pop = null; }
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.7 + Math.random() * 0.6);
      const r = 24 + Math.random() * 16;
      g.targets.push({ x: 80 + Math.random() * (GW - 160), y: 100 + Math.random() * (GH - 210), r, life: g.life, max: g.life, born: 0, vx: (Math.random() * 2 - 1) * 34, vy: (Math.random() * 2 - 1) * 24 });
    }
    for (let i = g.targets.length - 1; i >= 0; i--) {
      const tg = g.targets[i]; tg.born += dt; tg.life -= dt; tg.x += tg.vx * dt; tg.y += tg.vy * dt;
      if (tg.x < 44 || tg.x > GW - 44) tg.vx *= -1;
      if (tg.y < 90 || tg.y > GH - 54) tg.vy *= -1;
      if (tg.life <= 0) { g.targets.splice(i, 1); g.flash('#d9534f'); Sound.thud(); }
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#2e3a44'; ctx.fillRect(0, 0, GW, GH);
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
    for (let x = 0; x < GW; x += 40) { ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, GH); ctx.stroke(); }
    for (let y = 70; y < GH; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GW, y); ctx.stroke(); }
    Draw.bigText(ctx, '🎯 THE RANGE', GW / 2, 40, 28, '#e8b830');

    g.targets.forEach(tg => {
      const pop = Math.min(1, tg.born * 6), r = tg.r * pop, warn = tg.life < tg.max * 0.35;
      ctx.lineWidth = 3; ctx.strokeStyle = '#2b2b33';
      ctx.fillStyle = warn ? '#f6cccb' : '#fff'; ctx.beginPath(); ctx.arc(tg.x, tg.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d9534f'; ctx.beginPath(); ctx.arc(tg.x, tg.y, r * 0.62, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tg.x, tg.y, r * 0.3, 0, Math.PI * 2); ctx.fill();
      if (warn) Draw.emoji(ctx, '⚠️', tg.x, tg.y - r - 16, 24);
    });

    if (g.pop) Draw.bigText(ctx, g.pop.bull ? 'BULLSEYE! ×3' : 'HIT!', g.pop.x, g.pop.y - 30, g.pop.bull ? 26 : 20, g.pop.bull ? '#2f7d3f' : '#9a7714');

    // crosshair
    const a = g.aim;
    ctx.strokeStyle = g.shotT > 0 ? '#d9534f' : '#e8b830'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(a.x, a.y, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(a.x - 26, a.y); ctx.lineTo(a.x - 6, a.y); ctx.moveTo(a.x + 6, a.y); ctx.lineTo(a.x + 26, a.y);
    ctx.moveTo(a.x, a.y - 26); ctx.lineTo(a.x, a.y - 6); ctx.moveTo(a.x, a.y + 6); ctx.lineTo(a.x, a.y + 26); ctx.stroke();

    Draw.bigText(ctx, `Bullseyes: ${g.hits}`, GW / 2, GH - 20, 22, '#e8b830');
  },
});
