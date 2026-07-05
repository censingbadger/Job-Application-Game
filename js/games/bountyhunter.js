/* ============================================================
   BOUNTY HUNTER 🤠 — AIM & SHOOT (chase the outlaw).
   One fast outlaw zig-zags around. Tap to tag it — it speeds
   up and shrinks each time. Careful when it fights back!
   ============================================================ */

function bhRespawn(g) {
  const speed = 190 + g.tags * 16 + g.rank * 34;
  const a = Math.random() * Math.PI * 2;
  g.t.x = 90 + Math.random() * (GW - 180);
  g.t.y = 110 + Math.random() * (GH - 210);
  g.t.vx = Math.cos(a) * speed;
  g.t.vy = Math.sin(a) * speed;
  g.t.r = Math.max(24, 40 - g.tags * 0.6);
}

GAMES.bountyhunter = defineShift({
  hint: 'Tag the runaway outlaw 🏃 — tap it before it gets away! It speeds up every time. Watch out when it fights back!',
  duration: r => 46 + r * 6,

  init(g) {
    g.unit = Math.max(2, Math.floor(State.salary() / 10));
    g.tags = 0; g.aim = { x: GW / 2, y: GH / 2 }; g.pop = null;
    g.t = { x: GW / 2, y: GH / 2, r: 40, vx: 0, vy: 0 };
    bhRespawn(g);
  },

  move(g, x, y) { g.aim.x = x; g.aim.y = y; },

  pointer(g, x, y) {
    g.aim.x = x; g.aim.y = y; Sound.zap();
    if (Math.hypot(g.t.x - x, g.t.y - y) <= g.t.r) {
      g.earn(g.unit); g.tags++; g.pop = { x: g.t.x, y: g.t.y, t: 0 }; Sound.coin(); bhRespawn(g);
    }
  },

  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.4) g.pop = null; }
    const t = g.t; t.x += t.vx * dt; t.y += t.vy * dt;
    if (t.x < 50 || t.x > GW - 50) { t.vx *= -1; t.x = Math.max(50, Math.min(GW - 50, t.x)); }
    if (t.y < 100 || t.y > GH - 70) { t.vy *= -1; t.y = Math.max(100, Math.min(GH - 70, t.y)); }
    if (Math.random() < 0.02) {   // sudden jink
      const sp = Math.hypot(t.vx, t.vy) || 1, a = Math.random() * Math.PI * 2;
      t.vx = Math.cos(a) * sp; t.vy = Math.sin(a) * sp;
    }
  },

  draw(g, tm) {
    const ctx = g.ctx;
    ctx.fillStyle = '#e3c48f'; ctx.fillRect(0, 0, GW, GH);
    // wanted-poster desert town vibe
    ctx.fillStyle = '#c9a367'; ctx.fillRect(0, GH - 80, GW, 80);
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GH - 80); ctx.lineTo(GW, GH - 80); ctx.stroke();
    Draw.bigText(ctx, '🤠 WANTED!', GW / 2, 40, 28, '#7a4a1f');

    // the outlaw
    const t = g.t;
    ctx.fillStyle = 'rgba(217,83,79,.18)'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r + 6, 0, Math.PI * 2); ctx.fill();
    Draw.emoji(ctx, '🏃', t.x, t.y, t.r * 1.7);

    if (g.pop) Draw.bigText(ctx, 'GOTCHA!', g.pop.x, g.pop.y - 30, 24, '#2f7d3f');

    // crosshair / lasso
    const a = g.aim;
    ctx.strokeStyle = '#7a4a1f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(a.x, a.y, 18, 0, Math.PI * 2); ctx.stroke();

    Draw.bigText(ctx, `Outlaws tagged: ${g.tags}`, GW / 2, GH - 22, 22, '#7a4a1f');
  },
});
