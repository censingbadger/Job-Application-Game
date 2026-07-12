/* ============================================================
   ZOOKEEPER 🦁 — HERD 'EM IN (round up & feed the animals).
   Monkeys and lions roam the yard. Your keeper SHOOS any animal
   nearby — sweep your finger/mouse so they scatter AWAY from you,
   and drive them right into the FEED PEN. Each one you pen gets
   fed (and pays!). Lions are stubborn and worth more. Keep the
   yard under control — and don't let the Lion loose!
   ============================================================ */

GAMES.zookeeper = defineShift({
  hint: 'Move your <b>keeper</b> to <b>shoo</b> the animals — they flee AWAY from you. Herd the 🐒 monkeys and 🦁 lions into the <b>feed pen</b> on the right to feed them! Lions pay more. Watch for <b>Lion loose!</b>',
  duration: r => 46 + r * 6,

  init(g) {
    g.unit = Math.max(2, Math.floor(State.salary() / 10));
    g.penX = GW - 250; g.penY0 = 120; g.penY1 = GH - 40;
    g.keeper = { x: 220, y: GH / 2 };
    g.want = Math.min(7, 4 + g.rank);
    g.animals = [];
    for (let i = 0; i < g.want; i++) this._spawn(g, true);
    g.penned = 0;
    g.pop = null;
  },

  _spawn(g, anywhere) {
    const lion = Math.random() < 0.32;
    const x = anywhere ? 60 + Math.random() * (g.penX - 180) : 42;
    g.animals.push({
      x, y: 140 + Math.random() * (GH - 210),
      vx: 0, vy: 0,
      lion,
      emoji: lion ? '🦁' : '🐒',
      worth: lion ? 2.5 : 1,
      spd: lion ? 58 : 92,
      size: lion ? 46 : 40,
      tx: 60 + Math.random() * (g.penX - 180), ty: 140 + Math.random() * (GH - 210), roamT: 1 + Math.random() * 1.5,
      bob: Math.random() * 6,
    });
  },

  move(g, x, y) { g.keeper.x = x; g.keeper.y = y; },
  pointer(g, x, y) { g.keeper.x = x; g.keeper.y = y; },

  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.6) g.pop = null; }
    const R = 128, k = g.keeper;
    for (let i = g.animals.length - 1; i >= 0; i--) {
      const a = g.animals[i];
      // gentle roam around the open yard
      a.roamT -= dt;
      const rx = a.tx - a.x, ry = a.ty - a.y, rd = Math.hypot(rx, ry) || 1;
      if (a.roamT <= 0 || rd < 24) { a.tx = 60 + Math.random() * (g.penX - 170); a.ty = 140 + Math.random() * (GH - 210); a.roamT = 1.1 + Math.random() * 1.6; }
      a.vx += (rx / rd) * a.spd * 0.5 * dt;
      a.vy += (ry / rd) * a.spd * 0.5 * dt;
      // SHOO — flee away from the keeper
      const dx = a.x - k.x, dy = a.y - k.y, d = Math.hypot(dx, dy) || 1;
      if (d < R) { const push = (R - d) / R * (a.lion ? 1050 : 1500); a.vx += (dx / d) * push * dt; a.vy += (dy / d) * push * dt; }
      // damping + move
      a.vx *= 0.9; a.vy *= 0.9;
      const sp = Math.hypot(a.vx, a.vy), cap = a.spd * 2.4;
      if (sp > cap) { a.vx = a.vx / sp * cap; a.vy = a.vy / sp * cap; }
      a.x += a.vx * dt; a.y += a.vy * dt;
      // yard walls (left / top / bottom bounce)
      if (a.x < 30) { a.x = 30; a.vx = Math.abs(a.vx); }
      if (a.y < 118) { a.y = 118; a.vy = Math.abs(a.vy); }
      if (a.y > GH - 34) { a.y = GH - 34; a.vy = -Math.abs(a.vy); }
      // into the pen? — fed!
      if (a.x >= g.penX + 6 && a.y > g.penY0 + 8 && a.y < g.penY1 - 8) {
        g.earn(g.unit * a.worth); g.penned++;
        g.pop = { x: a.x, y: a.y - 34, food: a.lion ? '🥩' : '🍌', t: 0 };
        if (a.lion) { Sound.jackpot(); UI.confetti(8); } else Sound.coin();
        g.animals.splice(i, 1);
        this._spawn(g, false);                         // a fresh one wanders in from the gate
      }
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#a9d16a'; ctx.fillRect(0, 0, GW, GH);                 // grass yard
    // grass texture
    ctx.strokeStyle = 'rgba(60,110,40,.25)'; ctx.lineWidth = 2;
    for (let x = 20; x < g.penX; x += 34) for (let y = 130; y < GH - 20; y += 30) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y - 8); ctx.moveTo(x + 4, y); ctx.lineTo(x + 6, y - 9); ctx.stroke(); }
    // entrance gate (left)
    Draw.emoji(ctx, '🚪', 40, 100, 30);

    // FEED PEN (right)
    ctx.fillStyle = '#c8a06a'; ctx.fillRect(g.penX, g.penY0, GW - g.penX, g.penY1 - g.penY0);
    ctx.strokeStyle = '#6a4a24'; ctx.lineWidth = 5;
    ctx.strokeRect(g.penX, g.penY0, GW - g.penX, g.penY1 - g.penY0);
    // fence posts on the top/bottom rails
    ctx.lineWidth = 3;
    for (let x = g.penX; x <= GW - 20; x += 26) { ctx.beginPath(); ctx.moveTo(x, g.penY0); ctx.lineTo(x, g.penY0 + 16); ctx.moveTo(x, g.penY1 - 16); ctx.lineTo(x, g.penY1); ctx.stroke(); }
    // trough with food
    const tx = (g.penX + GW - 20) / 2;
    Draw.emoji(ctx, '🥩', tx - 26, g.penY0 + 40, 30);
    Draw.emoji(ctx, '🍌', tx + 26, g.penY0 + 40, 30);
    Draw.bigText(ctx, '🍽️ FEED PEN', tx, g.penY1 - 22, 18, '#5a3410');
    Draw.bigText(ctx, '🦁 HERD \'EM IN', GW / 2 - 60, 36, 26, '#3c6b2c');

    // animals
    g.animals.forEach(a => {
      const bob = Math.sin(t * 6 + a.bob) * 3;
      Draw.emoji(ctx, a.emoji, a.x, a.y + bob, a.size);
    });

    // keeper + shoo ring
    const kk = g.keeper;
    ctx.strokeStyle = 'rgba(43,43,51,.35)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.arc(kk.x, kk.y, 128, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    Draw.emoji(ctx, '🧹', kk.x, kk.y, 40);

    if (g.pop) { Draw.emoji(ctx, g.pop.food, g.pop.x, g.pop.y, 26); Draw.bigText(ctx, 'FED!', g.pop.x, g.pop.y - 22, 18, '#2f7d3f'); }
    Draw.bigText(ctx, `Fed: ${g.penned}`, GW / 2 - 60, GH - 14, 20, '#2f5a26');
  },
});
