/* ============================================================
   BEEKEEPER 🐝 — CATCH FALLING STUFF (with a sting).
   Catch the dripping honeycombs in your jar. The bees drift
   sideways as they fall — catch one and you get stung!
   ============================================================ */

GAMES.beekeeper = defineShift({
  hint: 'Catch the dripping <b>honeycombs</b> 🍯 in your jar (finger/mouse, or ← →). Dodge the wandering <b>bees</b> 🐝 — they sting!',
  duration: r => 44 + r * 6,

  init(g) {
    g.jar = { x: GW / 2, target: GW / 2, w: 140 };
    g.items = [];
    g.spawnEvery = 0.8 / g.diff;
    g.spawnT = 0;
    g.fall = 120 + g.rank * 38;
    g.unit = Math.max(2, Math.floor(State.salary() / 9));
    g.honey = 0; g.stun = 0;
  },

  move(g, x) { g.jar.target = Math.max(g.jar.w / 2, Math.min(GW - g.jar.w / 2, x)); },
  key(g, e) {
    if (e.code === 'ArrowLeft') g.jar.target = Math.max(g.jar.w / 2, g.jar.target - 60);
    if (e.code === 'ArrowRight') g.jar.target = Math.min(GW - g.jar.w / 2, g.jar.target + 60);
  },

  update(g, dt) {
    g.jar.x += (g.jar.target - g.jar.x) * Math.min(1, dt * 14);
    if (g.stun > 0) g.stun -= dt;
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.7 + Math.random() * 0.6);
      const bee = Math.random() < (0.32 + g.rank * 0.04);
      g.items.push({
        bee, emoji: bee ? '🐝' : '🍯', worth: bee ? 0 : (0.9 + Math.random() * 0.8), r: bee ? 22 : 22,
        x: 40 + Math.random() * (GW - 80), y: -30,
        vy: g.fall * (0.85 + Math.random() * 0.5),
        vx: bee ? (Math.random() < 0.5 ? -1 : 1) * (60 + g.rank * 30) : 0, wob: Math.random() * 6,
      });
    }
    const catchY = GH - 92;
    for (let i = g.items.length - 1; i >= 0; i--) {
      const it = g.items[i];
      it.y += it.vy * dt;
      if (it.bee) { it.x += it.vx * dt; if (it.x < 30 || it.x > GW - 30) it.vx *= -1; }
      if (it.y >= catchY && it.y <= catchY + 46 && Math.abs(it.x - g.jar.x) < g.jar.w / 2) {
        if (it.bee) { g.stun = 0.5; g.flash('#d9534f'); Sound.thud(); UI.toast('Ouch! A bee sting!', '🐝'); }
        else { g.earn(g.unit * it.worth); g.honey++; Sound.coin(); }
        g.items.splice(i, 1); continue;
      }
      if (it.y > GH + 40) g.items.splice(i, 1);
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#f6e7b8'; ctx.fillRect(0, 0, GW, GH);
    // honeycomb wall pattern
    ctx.strokeStyle = 'rgba(200,150,40,.25)'; ctx.lineWidth = 2;
    for (let y = 20; y < GH; y += 46) {
      for (let x = 20; x < GW; x += 52) {
        const ox = (Math.floor(y / 46) % 2) * 26;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k - Math.PI / 6; const px = x + ox + Math.cos(a) * 16, py = y + Math.sin(a) * 16; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.closePath(); ctx.stroke();
      }
    }
    Draw.bigText(ctx, '🐝 THE APIARY', GW / 2, 40, 30, '#a5771a');

    g.items.forEach(it => {
      ctx.save(); ctx.translate(it.x, it.y);
      if (it.bee) ctx.rotate(Math.sin(t * 10 + it.wob) * 0.3);
      Draw.emoji(ctx, it.emoji, 0, 0, it.r * 2); ctx.restore();
    });

    // jar
    const cx = g.jar.x, cy = GH - 88, w = g.jar.w;
    if (g.stun > 0) ctx.globalAlpha = 0.5 + Math.sin(t * 40) * 0.3;
    ctx.fillStyle = 'rgba(255,220,120,.75)'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy); ctx.lineTo(cx + w / 2, cy);
    ctx.lineTo(cx + w / 2 - 10, cy + 52); ctx.lineTo(cx - w / 2 + 10, cy + 52);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // jar rim
    ctx.fillStyle = '#e8b830'; ctx.fillRect(cx - w / 2 - 6, cy - 12, w + 12, 14);
    ctx.strokeRect(cx - w / 2 - 6, cy - 12, w + 12, 14);
    ctx.globalAlpha = 1;

    Draw.bigText(ctx, `Honey: ${g.honey}`, GW / 2, GH - 14, 22, '#8a6410');
  },
});
