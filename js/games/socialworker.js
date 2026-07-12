/* ============================================================
   SOCIAL WORKER 🤝 — GUIDE THEM THROUGH (maze of hazards).
   Drag a person 🧑 from the door on the left, through a gauntlet
   of moving hazards 🚧, to the help centre on the right. Reach it
   and you've helped them (and earned their thanks). Bump a hazard
   and they get knocked back. Modest pay — dodge the Burnout!
   ============================================================ */

GAMES.socialworker = defineShift({
  hint: 'DRAG the <b>person</b> 🧑 (finger/mouse) from the door across to the <b>help centre</b> 🏢 — weave through the moving <b>hazards</b> 🚧! Watch for <b>Burnout!</b>',
  duration: r => 46 + r * 6,

  init(g) {
    g.startX = 54; g.goalX = GW - 60;
    g.person = { x: g.startX, y: GH / 2, tx: g.startX, ty: GH / 2, stun: 0 };
    g.helped = 0;
    g.unit = Math.max(2, Math.floor(State.salary() / 3));
    const HZ = ['🚧', '⚠️', '🔥', '🕳️'];
    g.hazards = [];
    const cols = 5;
    for (let c = 0; c < cols; c++) {
      const x = 180 + c * ((g.goalX - 230) / (cols - 1));
      const n = 1 + (c % 2);                            // 1 or 2 per column, staggered
      for (let k = 0; k < n; k++) {
        g.hazards.push({ x, y: 120 + Math.random() * (GH - 200), r: 26, vy: (110 + g.rank * 22) * (Math.random() < 0.5 ? 1 : -1), emoji: HZ[(c + k) % HZ.length] });
      }
    }
    g.pop = null;
  },

  move(g, x, y) {
    g.person.tx = Math.max(20, Math.min(GW - 20, x));
    g.person.ty = Math.max(96, Math.min(GH - 40, y));
  },
  pointer(g, x, y) { this.move(g, x, y); },

  update(g, dt) {
    const p = g.person;
    if (p.stun > 0) p.stun -= dt;
    else { p.x += (p.tx - p.x) * Math.min(1, dt * 12); p.y += (p.ty - p.y) * Math.min(1, dt * 12); }

    // hazards patrol up/down, bouncing off the top/bottom
    g.hazards.forEach(h => {
      h.y += h.vy * dt;
      if (h.y < 108) { h.y = 108; h.vy = Math.abs(h.vy); }
      if (h.y > GH - 46) { h.y = GH - 46; h.vy = -Math.abs(h.vy); }
      if (p.stun <= 0 && Math.hypot(h.x - p.x, h.y - p.y) < h.r + 20) {   // bumped a hazard
        p.stun = 0.55; p.x = Math.max(g.startX, p.x - 90); p.tx = p.x;
        g.flash('#d9534f'); Sound.thud();
      }
    });

    if (p.x >= g.goalX - 6) {                           // made it across!
      g.earn(g.unit); g.helped++;
      g.pop = { x: g.goalX - 30, y: p.y - 44, t: 0 };
      Sound.coin();
      p.x = g.startX; p.tx = g.startX; p.y = GH / 2; p.ty = GH / 2; p.stun = 0;
    }
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.6) g.pop = null; }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#f2e6d0'; ctx.fillRect(0, 0, GW, GH);
    // path floor
    ctx.fillStyle = '#e3cfa8'; ctx.fillRect(0, 96, GW, GH - 130);
    Draw.bigText(ctx, '🤝 GUIDE THEM THROUGH', GW / 2, 44, 24, '#2f8a7a');

    // start door + goal help-centre
    ctx.fillStyle = '#8a6a3f'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.fillRect(20, GH / 2 - 46, 40, 92); ctx.strokeRect(20, GH / 2 - 46, 40, 92);
    Draw.emoji(ctx, '🚪', 40, GH / 2, 34);
    ctx.fillStyle = '#bfe6dd'; ctx.fillRect(g.goalX - 6, 110, GW - g.goalX + 4, GH - 150); ctx.strokeRect(g.goalX - 6, 110, GW - g.goalX + 4, GH - 150);
    Draw.emoji(ctx, '🏢', g.goalX + 20, GH / 2 - 20, 46);
    Draw.bigText(ctx, 'HELP', g.goalX + 20, GH / 2 + 30, 18, '#2f8a7a');

    // hazards
    g.hazards.forEach(h => Draw.emoji(ctx, h.emoji, h.x, h.y, 46));

    // the person
    const p = g.person;
    if (p.stun > 0) ctx.globalAlpha = 0.5 + Math.sin(t * 40) * 0.3;
    Draw.emoji(ctx, '🧑', p.x, p.y, 46);
    ctx.globalAlpha = 1;
    if (p.stun > 0) Draw.emoji(ctx, '💫', p.x + 16, p.y - 22, 22);

    if (g.pop) Draw.bigText(ctx, 'HELPED! ❤️', g.pop.x, g.pop.y, 20, '#2f8a7a');
    Draw.bigText(ctx, `Helped: ${g.helped}`, GW / 2, GH - 12, 20, '#2f8a7a');
  },
});
