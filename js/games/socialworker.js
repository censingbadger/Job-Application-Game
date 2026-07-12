/* ============================================================
   SOCIAL WORKER 🤝 — HELP PEOPLE (kind, steady, low-risk).
   People needing a hand pop up around the community — TAP each
   one to help before they slip away. The pay is modest and the
   danger low, but the burnout is real: dodge the Burnout!
   ============================================================ */

GAMES.socialworker = defineShift({
  hint: 'TAP the <b>people</b> 🙋 who need help before they leave — every one you reach earns their thanks! Watch for <b>Burnout!</b>',
  duration: r => 46 + r * 6,

  init(g) {
    g.folks = [];
    g.spawnEvery = 1.0 / g.diff;
    g.spawnT = 0.3;
    g.life = Math.max(1.3, 2.5 - g.rank * 0.22);
    g.unit = Math.max(2, Math.floor(State.salary() / 7));
    g.helped = 0;
    g.pop = null;
  },

  pointer(g, x, y) {
    for (let i = g.folks.length - 1; i >= 0; i--) {
      const p = g.folks[i];
      if (Math.hypot(p.x - x, p.y - y) <= p.r + 10) {
        g.earn(g.unit); g.helped++;
        g.pop = { x: p.x, y: p.y, t: 0 };
        g.folks.splice(i, 1); Sound.ding(); return;
      }
    }
  },

  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.5) g.pop = null; }
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.7 + Math.random() * 0.6);
      const kinds = ['🙋', '🧑', '👵', '🧒', '🙍'];
      g.folks.push({ x: 70 + Math.random() * (GW - 140), y: 140 + Math.random() * (GH - 230), r: 26, life: g.life, max: g.life, born: 0, who: kinds[Math.floor(Math.random() * kinds.length)] });
    }
    for (let i = g.folks.length - 1; i >= 0; i--) {
      const p = g.folks[i]; p.born += dt; p.life -= dt;
      if (p.life <= 0) { g.folks.splice(i, 1); g.flash('#d9534f'); Sound.thud(); }
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#fce8d6'; ctx.fillRect(0, 0, GW, GH);          // warm community centre
    ctx.fillStyle = '#e7b98f'; ctx.fillRect(0, GH - 70, GW, 70);    // floor
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GH - 70); ctx.lineTo(GW, GH - 70); ctx.stroke();
    Draw.bigText(ctx, '🤝 LEND A HAND', GW / 2, 40, 28, '#2f8a7a');

    g.folks.forEach(p => {
      const pop = Math.min(1, p.born * 6), r = p.r * pop, warn = p.life < p.max * 0.35;
      Draw.emoji(ctx, p.who, p.x, p.y, r * 2);
      if (warn) Draw.emoji(ctx, '💤', p.x + r, p.y - r, 20);
    });

    if (g.pop) Draw.bigText(ctx, 'HELPED! ❤️', g.pop.x, g.pop.y - 28, 20, '#2f8a7a');
    Draw.bigText(ctx, `Helped: ${g.helped}`, GW / 2, GH - 14, 22, '#2f8a7a');
  },
});
