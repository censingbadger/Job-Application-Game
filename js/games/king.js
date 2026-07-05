/* ============================================================
   KING 👑 — AIM & SHOOT (defend the castle).
   Invaders charge your castle from the left. Tap to blast them
   with the cannon before they reach the wall. A coup can still
   topple you!
   ============================================================ */

const KING_INVADERS = [
  { emoji: '🗡️', worth: 1.0, sp: 1.0 },
  { emoji: '🏹', worth: 1.3, sp: 1.25 },
  { emoji: '🐉', worth: 2.4, sp: 0.8 },
  { emoji: '🛡️', worth: 1.6, sp: 0.9 },
];

GAMES.king = defineShift({
  hint: 'Defend your castle 🏰! Tap the invaders to blast them before they reach the wall. Beware the coup!',
  duration: r => 46 + r * 6,

  init(g) {
    g.inv = [];
    g.spawnEvery = 0.8 / g.diff;
    g.spawnT = 0.4;
    g.speed = 66 + g.rank * 20;
    g.unit = Math.max(2, Math.floor(State.salary() / 14));
    g.blasted = 0; g.wallX = GW - 96; g.hitFlash = 0; g.boom = null;
  },

  pointer(g, x, y) {
    for (let i = g.inv.length - 1; i >= 0; i--) {
      const v = g.inv[i];
      if (Math.hypot(v.x - x, v.y - y) <= 36) {
        g.earn(g.unit * v.worth); g.blasted++; g.boom = { x: v.x, y: v.y, t: 0 };
        g.inv.splice(i, 1); Sound.zap(); return;
      }
    }
  },

  update(g, dt) {
    if (g.hitFlash > 0) g.hitFlash -= dt;
    if (g.boom) { g.boom.t += dt; if (g.boom.t > 0.3) g.boom = null; }
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.6 + Math.random() * 0.7);
      const k = KING_INVADERS[Math.random() * KING_INVADERS.length | 0];
      g.inv.push({ emoji: k.emoji, worth: k.worth, x: -30, y: 120 + Math.random() * (GH - 210), vx: g.speed * k.sp * (0.8 + Math.random() * 0.5) });
    }
    for (let i = g.inv.length - 1; i >= 0; i--) {
      const v = g.inv[i]; v.x += v.vx * dt;
      if (v.x >= g.wallX) { g.hitFlash = 0.3; g.flash('#d9534f'); Sound.thud(); g.inv.splice(i, 1); }
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    const sky = ctx.createLinearGradient(0, 0, 0, GH);
    sky.addColorStop(0, '#b9a0d4'); sky.addColorStop(1, '#e7dcc4');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#7fa35a'; ctx.fillRect(0, GH - 70, GW, 70);
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GH - 70); ctx.lineTo(GW, GH - 70); ctx.stroke();
    Draw.bigText(ctx, '👑 DEFEND THE CASTLE', GW / 2, 40, 28, '#5a3d8a');

    // castle on the right
    const wx = g.wallX + (g.hitFlash > 0 ? Math.sin(t * 80) * 5 : 0);
    ctx.fillStyle = g.hitFlash > 0 ? '#d9a0a0' : '#cbb89a'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 4;
    ctx.fillRect(wx, 130, GW - wx, GH - 200); ctx.strokeRect(wx, 130, GW - wx, GH - 200);
    for (let y = 150; y < GH - 90; y += 40) { ctx.strokeRect(wx, y, GW - wx, 40); }
    // battlements
    for (let x = wx; x < GW; x += 30) { ctx.fillRect(x, 112, 18, 20); ctx.strokeRect(x, 112, 18, 20); }
    Draw.emoji(ctx, '🏰', (wx + GW) / 2, 90, 46);

    // invaders
    g.inv.forEach(v => Draw.emoji(ctx, v.emoji, v.x, v.y, 52));
    // cannon blast
    if (g.boom) { const p = g.boom.t / 0.3; Draw.emoji(ctx, '💥', g.boom.x, g.boom.y, 40 + p * 40); }

    Draw.bigText(ctx, `Invaders blasted: ${g.blasted}`, GW / 2, GH - 22, 22, '#5a3d8a');
  },
});
