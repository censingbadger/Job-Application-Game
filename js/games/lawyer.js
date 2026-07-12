/* ============================================================
   LAWYER ⚖️ — WIN THE CASE (sharp, well-paid, low-risk).
   Evidence flashes up on the stand — TAP each piece to present it
   before the moment passes. GOLDEN exhibits 🏅 are worth DOUBLE.
   Big money, little danger — but don't get Held in contempt!
   ============================================================ */

GAMES.lawyer = defineShift({
  hint: 'TAP the <b>evidence</b> 📄 as it comes up to win the case — <b>golden</b> exhibits 🏅 are worth <b>DOUBLE</b>! Don\'t get <b>Held in contempt!</b>',
  duration: r => 46 + r * 6,

  init(g) {
    g.items = [];
    g.spawnEvery = 1.15 / g.diff;
    g.spawnT = 0.4;
    g.life = Math.max(1.2, 2.3 - g.rank * 0.24);
    g.unit = Math.max(2, Math.floor(State.salary() / 10));
    g.won = 0;
    g.pop = null;
  },

  pointer(g, x, y) {
    for (let i = g.items.length - 1; i >= 0; i--) {
      const it = g.items[i];
      if (Math.hypot(it.x - x, it.y - y) <= it.r + 8) {
        g.earn(g.unit * (it.gold ? 2 : 1)); g.won++;
        g.pop = { x: it.x, y: it.y, gold: it.gold, t: 0 };
        g.items.splice(i, 1); Sound.coin(); return;
      }
    }
  },

  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.5) g.pop = null; }
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.7 + Math.random() * 0.6);
      g.items.push({ x: 80 + Math.random() * (GW - 160), y: 140 + Math.random() * (GH - 230), r: 26, life: g.life, max: g.life, born: 0, gold: Math.random() < 0.22 });
    }
    for (let i = g.items.length - 1; i >= 0; i--) {
      const it = g.items[i]; it.born += dt; it.life -= dt;
      if (it.life <= 0) { g.items.splice(i, 1); g.flash('#d9534f'); Sound.thud(); }
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#e9e0cf'; ctx.fillRect(0, 0, GW, GH);          // courtroom
    ctx.fillStyle = '#7a5230'; ctx.fillRect(0, GH - 80, GW, 80);    // wood panelling
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GH - 80); ctx.lineTo(GW, GH - 80); ctx.stroke();
    ctx.strokeStyle = 'rgba(122,82,48,.25)'; ctx.lineWidth = 2;
    for (let x = 60; x < GW; x += 80) { ctx.beginPath(); ctx.moveTo(x, 84); ctx.lineTo(x, GH - 80); ctx.stroke(); }
    Draw.bigText(ctx, '⚖️ ORDER! ORDER!', GW / 2, 40, 28, '#3a2c66');

    g.items.forEach(it => {
      const pop = Math.min(1, it.born * 6), r = it.r * pop, warn = it.life < it.max * 0.35;
      Draw.emoji(ctx, it.gold ? '🏅' : '📄', it.x, it.y, r * 2);
      ctx.strokeStyle = warn ? '#d9534f' : (it.gold ? '#c98a00' : 'rgba(60,60,80,.5)'); ctx.lineWidth = it.gold ? 3 : 2;
      ctx.beginPath(); ctx.arc(it.x, it.y, r + 4, 0, Math.PI * 2); ctx.stroke();
      if (warn) Draw.emoji(ctx, '⏰', it.x, it.y - r - 16, 22);
    });

    if (g.pop) Draw.bigText(ctx, g.pop.gold ? 'GOLDEN! ×2' : 'OBJECTION!', g.pop.x, g.pop.y - 28, g.pop.gold ? 24 : 20, g.pop.gold ? '#c98a00' : '#3a2c66');
    Draw.bigText(ctx, `Points: ${g.won}`, GW / 2, GH - 18, 22, '#3a2c66');
  },
});
