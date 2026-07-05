/* ============================================================
   GAMER 🎮 — AIM & REACT (retro arcade).
   Tap the bugs and power-ups that pop up on the screen — but
   DON'T tap the bombs! A lag spike can freeze you.
   ============================================================ */

GAMES.gamer = defineShift({
  hint: 'Tap the bugs 👾 and power-ups 🍄 fast — but <b>never tap the bombs</b> 💣! Rack up your score before the lag spike.',
  duration: r => 46 + r * 6,

  init(g) {
    g.things = [];
    g.spawnEvery = 0.66 / g.diff;
    g.spawnT = 0.3;
    g.life = Math.max(0.8, 1.7 - g.rank * 0.24);
    g.unit = Math.max(2, Math.floor(State.salary() / 14));
    g.score = 0; g.stun = 0;
  },

  pointer(g, x, y) {
    if (g.stun > 0) return;
    for (let i = g.things.length - 1; i >= 0; i--) {
      const o = g.things[i];
      if (Math.hypot(o.x - x, o.y - y) <= o.r) {
        if (o.bomb) { g.stun = 0.6; g.flash('#d9534f'); Sound.thud(); UI.toast('Boom! Never tap bombs!', '💣'); }
        else { g.earn(g.unit * o.worth); g.score++; Sound.coin(); }
        g.things.splice(i, 1); return;
      }
    }
  },

  update(g, dt) {
    if (g.stun > 0) g.stun -= dt;
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.6 + Math.random() * 0.7);
      const roll = Math.random();
      const o = roll < 0.25 ? { e: '💣', bomb: true, worth: 0, r: 30 }
        : roll < 0.45 ? { e: '🍄', worth: 1.8, r: 28 }
          : (roll < 0.7 ? { e: '👾', worth: 1, r: 30 } : { e: '👻', worth: 1.2, r: 30 });
      g.things.push({ emoji: o.e, bomb: o.bomb, worth: o.worth, r: o.r, x: 60 + Math.random() * (GW - 120), y: 100 + Math.random() * (GH - 200), life: g.life, born: 0 });
    }
    for (let i = g.things.length - 1; i >= 0; i--) {
      const o = g.things[i]; o.born += dt; o.life -= dt;
      if (o.life <= 0) g.things.splice(i, 1);
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#0e0e1a'; ctx.fillRect(0, 0, GW, GH);
    // scanlines
    ctx.fillStyle = 'rgba(255,255,255,.03)';
    for (let y = 0; y < GH; y += 4) ctx.fillRect(0, y, GW, 2);
    // pixel border
    ctx.strokeStyle = '#00e6a8'; ctx.lineWidth = 4; ctx.strokeRect(10, 70, GW - 20, GH - 90);
    ctx.font = 'bold 30px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#00e6a8';
    ctx.fillText('🎮 ARCADE MODE', GW / 2, 44);

    g.things.forEach(o => {
      const pop = Math.min(1, o.born * 7);
      Draw.emoji(ctx, o.emoji, o.x, o.y, o.r * 2 * pop);
    });

    if (g.stun > 0) { ctx.fillStyle = 'rgba(217,83,79,.25)'; ctx.fillRect(0, 0, GW, GH); Draw.bigText(ctx, 'LAG!', GW / 2, GH / 2, 60, '#d9534f'); }

    ctx.font = 'bold 24px "Courier New", monospace'; ctx.fillStyle = '#00e6a8'; ctx.textAlign = 'center';
    ctx.fillText(`SCORE ${g.score}`, GW / 2, GH - 22);
  },
});
