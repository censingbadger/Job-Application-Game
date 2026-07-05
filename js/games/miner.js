/* ============================================================
   MINER ⛏️ — CATCH FALLING STUFF.
   Slide your cart to catch gems and ore. Dodge the falling
   rocks — and when the "Cave-in!" hits, tap fast to dodge.
   ============================================================ */

const MINER_GEMS = [
  { emoji: '🪨', worth: 0,    rock: true, r: 26 },
  { emoji: '🟤', worth: 0.4,  r: 20 },   // ore
  { emoji: '💎', worth: 1,    r: 22 },   // diamond
  { emoji: '💚', worth: 1.6,  r: 22 },   // emerald
  { emoji: '💛', worth: 2.4,  r: 22 },   // gold gem
];

GAMES.miner = defineShift({
  hint: 'Slide the <b>cart</b> (move your finger/mouse, or ← →) to catch gems. Dodge the falling <b>rocks</b>! 🪨',
  duration: r => 46 + r * 6,

  init(g) {
    g.cart = { x: GW / 2, target: GW / 2, w: 150 };
    g.items = [];
    g.spawnEvery = 0.85 / g.diff;      // faster spawns as you rank up
    g.spawnT = 0;
    g.fall = 150 + g.rank * 45;        // faster falls as you rank up
    g.unit = Math.max(2, Math.floor(State.salary() / 16));
    g.gems = 0;
    g.stun = 0;
  },

  move(g, x) { g.cart.target = Math.max(g.cart.w / 2, Math.min(GW - g.cart.w / 2, x)); },
  key(g, e) {
    if (e.code === 'ArrowLeft') g.cart.target = Math.max(g.cart.w / 2, g.cart.target - 60);
    if (e.code === 'ArrowRight') g.cart.target = Math.min(GW - g.cart.w / 2, g.cart.target + 60);
  },

  update(g, dt) {
    // cart eases toward where you point
    g.cart.x += (g.cart.target - g.cart.x) * Math.min(1, dt * 14);
    if (g.stun > 0) g.stun -= dt;

    // spawn
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.7 + Math.random() * 0.6);
      // more rocks at higher fatality/rank
      const rockChance = 0.28 + g.rank * 0.05;
      const kind = Math.random() < rockChance
        ? MINER_GEMS[0]
        : MINER_GEMS[1 + Math.floor(Math.random() * (MINER_GEMS.length - 1))];
      g.items.push({ ...kind, x: 40 + Math.random() * (GW - 80), y: -30, vy: g.fall * (0.85 + Math.random() * 0.5), spin: 0 });
    }

    const catchY = GH - 96;
    for (let i = g.items.length - 1; i >= 0; i--) {
      const it = g.items[i];
      it.y += it.vy * dt;
      it.spin += dt * 3;
      // caught?
      if (it.y >= catchY && it.y <= catchY + 46 && Math.abs(it.x - g.cart.x) < g.cart.w / 2) {
        if (it.rock) { g.stun = 0.5; g.flash('#d9534f'); Sound.thud(); UI.toast('Ouch! A rock!', '🪨'); }
        else { g.earn(g.unit * it.worth); g.gems++; Sound.coin(); }
        g.items.splice(i, 1);
        continue;
      }
      if (it.y > GH + 40) g.items.splice(i, 1);
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    // cave
    ctx.fillStyle = '#3a2f28'; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#4a3d33';
    for (let i = 0; i < 8; i++) { const x = (i * 137 + 40) % GW; Draw.emoji(ctx, '⬤', x, 40 + (i % 3) * 30, 26); }
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GW, 60); ctx.globalAlpha = 1;
    Draw.bigText(ctx, '⛏️ THE MINE', GW / 2, 40, 30, '#e8b830');

    // falling items
    g.items.forEach(it => {
      ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(Math.sin(it.spin) * 0.3);
      Draw.emoji(ctx, it.emoji, 0, 0, it.r * 2);
      ctx.restore();
    });

    // the cart
    const cx = g.cart.x, cy = GH - 70, w = g.cart.w;
    if (g.stun > 0) ctx.globalAlpha = 0.5 + Math.sin(t * 40) * 0.3;
    ctx.fillStyle = '#8a5a3a'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy);
    ctx.lineTo(cx + w / 2, cy);
    ctx.lineTo(cx + w / 2 - 18, cy + 46);
    ctx.lineTo(cx - w / 2 + 18, cy + 46);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // slats
    for (let i = 1; i < 4; i++) { const x = cx - w / 2 + (w / 4) * i; ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x, cy + 46); ctx.stroke(); }
    // wheels
    ctx.fillStyle = '#2b2b33';
    ctx.beginPath(); ctx.arc(cx - w / 3, cy + 50, 12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + w / 3, cy + 50, 12, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    Draw.bigText(ctx, `Gems: ${g.gems}`, GW / 2, GH - 18, 22, '#e8b830');
  },
});
