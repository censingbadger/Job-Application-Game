/* ============================================================
   NOMAD 🐪 — DODGE & SURVIVE (desert runner).
   Tap (or space / ↑) to JUMP over cacti and grab floating
   water. Keep crossing the desert — mind the sandstorm!
   ============================================================ */

function nomadJump(g) {
  if (g.onGround) { g.vy = -760; g.onGround = false; Sound.ding(); }
}

GAMES.nomad = defineShift({
  hint: 'Tap (or <b>space</b> / ↑) to <b>jump</b> over cacti 🌵 and grab floating water 💧. Keep crossing the desert!',
  duration: r => 44 + r * 6,

  init(g) {
    g.ground = GH - 120;
    g.px = 170; g.py = g.ground; g.vy = 0; g.onGround = true;
    g.things = [];
    g.spawnEvery = 1.05 / g.diff;
    g.spawnT = 0.7;
    g.speed = 280 + g.rank * 70;
    g.unit = Math.max(2, Math.floor(State.salary() / 6));
    g.got = 0; g.stun = 0; g.dist = 0;
  },

  pointer(g) { nomadJump(g); },
  key(g, e) { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); nomadJump(g); } },

  update(g, dt) {
    g.dist += dt;
    g.vy += 2000 * dt; g.py += g.vy * dt;
    if (g.py >= g.ground) { g.py = g.ground; g.vy = 0; g.onGround = true; }
    if (g.stun > 0) g.stun -= dt;

    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.6 + Math.random() * 0.7);
      const water = Math.random() < 0.42;
      g.things.push(water
        ? { type: 'water', emoji: '💧', x: GW + 40, y: g.ground - 70 - Math.random() * 80, r: 22 }
        : { type: 'cactus', emoji: '🌵', x: GW + 40, y: g.ground, r: 26 });
    }
    for (let i = g.things.length - 1; i >= 0; i--) {
      const th = g.things[i];
      th.x -= g.speed * dt;
      if (Math.abs(th.x - g.px) < 42 && Math.abs(th.y - g.py) < 46) {
        if (th.type === 'water') { g.earn(g.unit); g.got++; Sound.coin(); g.things.splice(i, 1); continue; }
        else if (g.stun <= 0) { g.stun = 0.6; g.flash('#d9534f'); Sound.thud(); UI.toast('Ouch! A cactus!', '🌵'); }
      }
      if (th.x < -50) g.things.splice(i, 1);
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    // desert sky
    const sky = ctx.createLinearGradient(0, 0, 0, GH);
    sky.addColorStop(0, '#f8d9a0'); sky.addColorStop(1, '#f6ead0');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#f6b45e'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(140, 90, 40, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // dunes
    ctx.fillStyle = '#e9c079';
    ctx.beginPath(); ctx.moveTo(0, g.ground);
    for (let x = 0; x <= GW; x += 60) ctx.lineTo(x, g.ground - 20 - Math.sin((x + g.dist * 40) / 120) * 16);
    ctx.lineTo(GW, GH); ctx.lineTo(0, GH); ctx.closePath(); ctx.fill();
    // ground line
    ctx.fillStyle = '#d9a95a'; ctx.fillRect(0, g.ground + 20, GW, GH - g.ground - 20);
    ctx.strokeStyle = '#2b2b33'; ctx.beginPath(); ctx.moveTo(0, g.ground + 20); ctx.lineTo(GW, g.ground + 20); ctx.stroke();
    Draw.bigText(ctx, '🐪 DESERT CROSSING', GW / 2, 40, 28, '#9a6a1f');

    // obstacles & water
    g.things.forEach(th => Draw.emoji(ctx, th.emoji, th.x, th.y, th.r * 2));

    // the nomad on a camel (flipped to face right, the way it's travelling)
    if (g.stun > 0) ctx.globalAlpha = 0.5 + Math.sin(t * 40) * 0.3;
    const bounce = g.onGround ? Math.sin(t * 12) * 3 : 0;
    ctx.save(); ctx.translate(g.px, g.py + bounce); ctx.scale(-1, 1); Draw.emoji(ctx, '🐪', 0, 0, 60); ctx.restore();
    ctx.globalAlpha = 1;

    Draw.bigText(ctx, `Water jugs: ${g.got}`, GW / 2, GH - 14, 22, '#9a6a1f');
  },
});
