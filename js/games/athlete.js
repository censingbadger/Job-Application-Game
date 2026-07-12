/* ============================================================
   ATHLETE 🏀 — SCORE POINTS (fast hands, big money, short career).
   Open shots pop up around the court — TAP to sink them for huge
   money. Nail the swish (dead centre) for DOUBLE. Miss the shot
   clock and it's a turnover — and dodge the Blown knee!, because
   one bad landing can end a career. The pay is enormous, but
   nobody plays forever.
   ============================================================ */

GAMES.athlete = defineShift({
  hint: 'TAP the <b>open shots</b> 🏀 to score before the shot clock runs out — hit the <b>swish</b> centre for <b>DOUBLE</b>! Dodge the <b>Blown knee!</b>',
  duration: r => 44 + r * 5,

  init(g) {
    g.shots = [];
    g.spawnEvery = 1.2 / g.diff;
    g.spawnT = 0.4;
    g.life = Math.max(1.1, 2.2 - g.rank * 0.25);      // shot clock per open look
    g.unit = Math.max(2, Math.floor(State.salary() / 10));
    g.scored = 0;
    g.pop = null;
  },

  pointer(g, x, y) {
    for (let i = g.shots.length - 1; i >= 0; i--) {
      const s = g.shots[i];
      const d = Math.hypot(s.x - x, s.y - y);
      if (d <= s.r) {
        const swish = d <= s.r * 0.34;
        g.earn(g.unit * (swish ? 2 : 1));
        g.scored++;
        g.pop = { x: s.x, y: s.y, swish, t: 0 };
        g.shots.splice(i, 1);
        Sound.coin();
        return;
      }
    }
  },

  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.5) g.pop = null; }
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.7 + Math.random() * 0.6);
      const r = 26 + Math.random() * 14;
      g.shots.push({ x: 90 + Math.random() * (GW - 180), y: 150 + Math.random() * (GH - 250), r, life: g.life, max: g.life, born: 0 });
    }
    for (let i = g.shots.length - 1; i >= 0; i--) {
      const s = g.shots[i];
      s.born += dt; s.life -= dt;
      if (s.life <= 0) { g.shots.splice(i, 1); g.flash('#d9534f'); Sound.thud(); }   // turnover!
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    // hardwood court
    ctx.fillStyle = '#d69a54'; ctx.fillRect(0, 0, GW, GH);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 4;
    ctx.strokeRect(24, 80, GW - 48, GH - 104);
    ctx.beginPath(); ctx.arc(GW / 2, GH - 24, 90, Math.PI, 0); ctx.stroke();
    // backboard + hoop, top centre
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.fillRect(GW / 2 - 60, 74, 120, 40); ctx.strokeRect(GW / 2 - 60, 74, 120, 40);
    ctx.strokeStyle = '#e8760c'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(GW / 2, 122, 22, 0, Math.PI * 2); ctx.stroke();
    Draw.bigText(ctx, '🏀 GAME TIME', GW / 2, 40, 28, '#7a3d0c');

    // open shots
    g.shots.forEach(s => {
      const pop = Math.min(1, s.born * 6), r = s.r * pop, warn = s.life < s.max * 0.35;
      Draw.emoji(ctx, '🏀', s.x, s.y, r * 2);
      ctx.strokeStyle = warn ? '#d9534f' : 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, r + 4, 0, Math.PI * 2); ctx.stroke();
      if (warn) Draw.emoji(ctx, '⏰', s.x, s.y - r - 16, 22);
    });

    if (g.pop) Draw.bigText(ctx, g.pop.swish ? 'SWISH! ×2' : 'SCORE!', g.pop.x, g.pop.y - 28, g.pop.swish ? 26 : 20, g.pop.swish ? '#2f7d3f' : '#7a3d0c');

    Draw.bigText(ctx, `Points: ${g.scored}`, GW / 2, GH - 18, 22, '#7a3d0c');
  },
});
