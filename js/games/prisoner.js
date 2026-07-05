/* ============================================================
   PRISONER ⛓️ — DODGE & SURVIVE.
   Run for the fence! Tap the top/bottom of the screen (or ↑ ↓)
   to switch lanes. Grab money bags, dodge guards & searchlights.
   Danger: Jailbreak! (tap fast or you're caught for good)
   ============================================================ */

GAMES.prisoner = defineShift({
  hint: 'Tap the <b>top</b> or <b>bottom</b> of the screen (or ↑ ↓) to switch lanes. Grab 💰, dodge the 👮 guards and 🔦 lights!',
  duration: r => 44 + r * 6,

  init(g) {
    g.lanes = [180, 300, 420];
    g.lane = 1;
    g.py = g.lanes[1];
    g.things = [];
    g.spawnEvery = 0.7 / g.diff;
    g.spawnT = 0.5;
    g.speed = 260 + g.rank * 70;
    g.unit = Math.max(2, Math.floor(State.salary() / 7));
    g.grabbed = 0;
    g.stun = 0;
    g.run = 0;
  },

  key(g, e) {
    if (e.code === 'ArrowUp') g.lane = Math.max(0, g.lane - 1);
    if (e.code === 'ArrowDown') g.lane = Math.min(2, g.lane + 1);
  },
  pointer(g, x, y) {
    if (y < GH / 2) g.lane = Math.max(0, g.lane - 1);
    else g.lane = Math.min(2, g.lane + 1);
  },

  update(g, dt) {
    g.run += dt;
    g.py += (g.lanes[g.lane] - g.py) * Math.min(1, dt * 16);
    if (g.stun > 0) g.stun -= dt;

    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.6 + Math.random() * 0.7);
      const lane = Math.floor(Math.random() * 3);
      const roll = Math.random();
      const type = roll < 0.5 ? 'money' : (roll < 0.8 ? 'guard' : 'light');
      g.things.push({ x: GW + 40, lane, y: g.lanes[lane], type });
    }

    const px = 150;
    for (let i = g.things.length - 1; i >= 0; i--) {
      const th = g.things[i];
      th.x -= g.speed * dt;
      const hit = Math.abs(th.x - px) < 42 && th.lane === g.lane && g.stun <= 0;
      if (hit) {
        if (th.type === 'money') { g.earn(g.unit); g.grabbed++; Sound.coin(); }
        else { g.stun = 0.7; g.flash('#d9534f'); Sound.thud(); UI.toast(th.type === 'guard' ? 'A guard grabbed you!' : 'Spotted!', '🚨'); }
        g.things.splice(i, 1);
        continue;
      }
      if (th.x < -50) g.things.splice(i, 1);
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    // prison yard at night
    ctx.fillStyle = '#2b2f38'; ctx.fillRect(0, 0, GW, GH);
    // lanes
    g.lanes.forEach((ly, i) => {
      ctx.fillStyle = i % 2 ? '#343a45' : '#3b414d';
      ctx.fillRect(0, ly - 60, GW, 120);
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 2;
      const off = (g.run * g.speed) % 80;
      for (let x = -off; x < GW; x += 80) { ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + 40, ly); ctx.stroke(); }
    });
    // fence (goal) on the right
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3;
    for (let x = GW - 60; x < GW; x += 14) { ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, GH - 30); ctx.stroke(); }
    Draw.bigText(ctx, '⛓️ THE BIG ESCAPE', GW / 2, 40, 28, '#e8b830');

    // obstacles & loot
    g.things.forEach(th => {
      const e = th.type === 'money' ? '💰' : (th.type === 'guard' ? '👮' : '🔦');
      Draw.emoji(ctx, e, th.x, th.y, 46);
    });

    // the prisoner
    const px = 150;
    if (g.stun > 0) ctx.globalAlpha = 0.4 + Math.sin(t * 40) * 0.3;
    Draw.emoji(ctx, '🏃', px, g.py, 56);
    ctx.globalAlpha = 1;

    Draw.bigText(ctx, `Money bags: ${g.grabbed}`, GW / 2, GH - 18, 22, '#e8b830');
  },
});
