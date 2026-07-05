/* ============================================================
   BODYGUARD 🕴️ — AIM & REACT (protect the VIP).
   Threats fly in toward your VIP. Tap them to block — but
   don't hit the fans and photographers! Beware the ambush.
   ============================================================ */

const BG_THREATS = ['🍅', '🔪', '🥊', '🧨', '🥚'];
const BG_FANS = ['🙋', '🙋‍♂️', '📸', '💐'];

GAMES.bodyguard = defineShift({
  hint: 'Protect the VIP 🤵 on the right! Tap the incoming threats 🍅🔪 to block them — but DON\'T hit the fans 🙋!',
  duration: r => 46 + r * 6,

  init(g) {
    g.things = [];
    g.spawnEvery = 0.8 / g.diff;
    g.spawnT = 0.4;
    g.speed = 150 + g.rank * 46;
    g.unit = Math.max(2, Math.floor(State.salary() / 12));
    g.blocked = 0; g.vipX = GW - 84; g.hitFlash = 0; g.stun = 0;
  },

  pointer(g, x, y) {
    if (g.stun > 0) return;
    for (let i = g.things.length - 1; i >= 0; i--) {
      const o = g.things[i];
      if (Math.hypot(o.x - x, o.y - y) <= 32) {
        if (o.threat) { g.earn(g.unit); g.blocked++; Sound.coin(); }
        else { g.stun = 0.5; g.flash('#d9534f'); Sound.thud(); UI.toast('That was a fan!', '🙋'); }
        g.things.splice(i, 1); return;
      }
    }
  },

  update(g, dt) {
    if (g.hitFlash > 0) g.hitFlash -= dt;
    if (g.stun > 0) g.stun -= dt;
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.6 + Math.random() * 0.7);
      const threat = Math.random() < 0.68;
      const list = threat ? BG_THREATS : BG_FANS;
      g.things.push({ emoji: list[Math.random() * list.length | 0], threat, x: -30, y: 110 + Math.random() * (GH - 210), vx: g.speed * (0.8 + Math.random() * 0.5) });
    }
    for (let i = g.things.length - 1; i >= 0; i--) {
      const o = g.things[i]; o.x += o.vx * dt;
      if (o.x >= g.vipX) { if (o.threat) { g.hitFlash = 0.3; g.flash('#d9534f'); Sound.thud(); } g.things.splice(i, 1); }
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#3a3f4a'; ctx.fillRect(0, 0, GW, GH);
    // red carpet
    ctx.fillStyle = '#9a3b3b'; ctx.fillRect(0, GH - 96, GW, 96);
    ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GH - 96); ctx.lineTo(GW, GH - 96); ctx.stroke();
    Draw.bigText(ctx, '🕴️ THE RED CARPET', GW / 2, 40, 28, '#e8b830');

    // the VIP + bodyguard
    const vx = g.vipX + (g.hitFlash > 0 ? Math.sin(t * 80) * 5 : 0);
    if (g.hitFlash > 0) { ctx.fillStyle = 'rgba(217,83,79,.3)'; ctx.beginPath(); ctx.arc(vx + 30, GH / 2, 70, 0, Math.PI * 2); ctx.fill(); }
    Draw.emoji(ctx, '🤵', vx + 44, GH / 2, 66);
    Draw.emoji(ctx, '🕴️', vx - 6, GH / 2 + 30, 52);

    g.things.forEach(o => Draw.emoji(ctx, o.emoji, o.x, o.y, 46));

    Draw.bigText(ctx, `Threats blocked: ${g.blocked}`, GW / 2, GH - 24, 22, '#e8b830');
  },
});
