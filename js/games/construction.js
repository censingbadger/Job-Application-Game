/* ============================================================
   CONSTRUCTION WORKER 👷 — RIVET THE BEAMS (steady, dangerous).
   Hot rivets glow along the steel frame — TAP each one to bolt it
   home before it cools. Good pay, but watch for the Falling beam!
   ============================================================ */

GAMES.construction = defineShift({
  hint: 'TAP the glowing <b>rivets</b> 🔩 to bolt the beams before they cool! Watch for the <b>Falling beam!</b>',
  duration: r => 46 + r * 6,

  init(g) {
    g.rivets = [];
    g.spawnEvery = 0.95 / g.diff;
    g.spawnT = 0.3;
    g.life = Math.max(1.3, 2.4 - g.rank * 0.22);
    g.unit = Math.max(2, Math.floor(State.salary() / 9));
    g.done = 0;
    g.pop = null;
  },

  pointer(g, x, y) {
    for (let i = g.rivets.length - 1; i >= 0; i--) {
      const n = g.rivets[i];
      if (Math.hypot(n.x - x, n.y - y) <= n.r + 10) {
        g.earn(g.unit); g.done++;
        g.pop = { x: n.x, y: n.y, t: 0 };
        g.rivets.splice(i, 1); Sound.ding(); return;
      }
    }
  },

  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.4) g.pop = null; }
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.7 + Math.random() * 0.6);
      g.rivets.push({ x: 70 + Math.random() * (GW - 140), y: 130 + Math.random() * (GH - 210), r: 18, life: g.life, born: 0 });
    }
    for (let i = g.rivets.length - 1; i >= 0; i--) {
      const n = g.rivets[i]; n.born += dt; n.life -= dt;
      if (n.life <= 0) { g.rivets.splice(i, 1); g.flash('#d9534f'); Sound.thud(); }
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#8fb8d6'; ctx.fillRect(0, 0, GW, GH);         // sky
    ctx.strokeStyle = '#c25a2a'; ctx.lineWidth = 16;               // steel frame
    for (let x = 130; x < GW; x += 180) { ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, GH); ctx.stroke(); }
    for (let y = 150; y < GH - 20; y += 120) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(GW - 40, y); ctx.stroke(); }
    Draw.bigText(ctx, '👷 BUILD IT UP', GW / 2, 40, 28, '#7a3d0c');

    g.rivets.forEach(n => {
      const pop = Math.min(1, n.born * 6), warn = n.life < 0.7;
      ctx.save(); ctx.translate(n.x, n.y); ctx.scale(pop, pop);
      ctx.fillStyle = warn ? '#c9a24a' : '#ffcf5a'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      if (warn) Draw.emoji(ctx, '⚠️', n.x, n.y - 24, 20);
    });

    if (g.pop) Draw.bigText(ctx, 'BOLTED!', g.pop.x, g.pop.y - 24, 20, '#7a3d0c');
    Draw.bigText(ctx, `Rivets: ${g.done}`, GW / 2, GH - 16, 22, '#7a3d0c');
  },
});
