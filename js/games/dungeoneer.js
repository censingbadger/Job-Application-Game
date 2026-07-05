/* ============================================================
   DUNGEONEER 🗝️ — DODGE & SURVIVE.
   Move up and down to grab treasure and dodge fireballs and
   bats flying in from the dungeon depths. Beware the dragon!
   ============================================================ */

const DUNGEON_LOOT = ['💎', '👑', '💰', '🗝️'];
const DUNGEON_TRAPS = ['🔥', '🦇', '🗿', '⚔️'];

GAMES.dungeoneer = defineShift({
  hint: 'Move up/down (drag, or ↑ ↓) to grab treasure 💎 and dodge the fireballs 🔥 and bats 🦇 flying at you!',
  duration: r => 46 + r * 6,

  init(g) {
    g.py = GH / 2; g.targetY = GH / 2;
    g.things = [];
    g.spawnEvery = 0.6 / g.diff;
    g.spawnT = 0.4;
    g.speed = 240 + g.rank * 70;
    g.unit = Math.max(2, Math.floor(State.salary() / 8));
    g.gold = 0; g.stun = 0;
  },

  move(g, x, y) { g.targetY = Math.max(80, Math.min(GH - 60, y)); },
  key(g, e) {
    if (e.code === 'ArrowUp') g.targetY = Math.max(80, g.targetY - 54);
    if (e.code === 'ArrowDown') g.targetY = Math.min(GH - 60, g.targetY + 54);
  },

  update(g, dt) {
    g.py += (g.targetY - g.py) * Math.min(1, dt * 12);
    if (g.stun > 0) g.stun -= dt;
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.6 + Math.random() * 0.7);
      const loot = Math.random() < 0.4;
      const list = loot ? DUNGEON_LOOT : DUNGEON_TRAPS;
      g.things.push({ emoji: list[Math.random() * list.length | 0], loot, x: GW + 30, y: 80 + Math.random() * (GH - 150), vx: g.speed * (0.85 + Math.random() * 0.4) });
    }
    const px = 150;
    for (let i = g.things.length - 1; i >= 0; i--) {
      const o = g.things[i]; o.x -= o.vx * dt;
      if (Math.abs(o.x - px) < 38 && Math.abs(o.y - g.py) < 42) {
        if (o.loot) { g.earn(g.unit); g.gold++; Sound.coin(); g.things.splice(i, 1); continue; }
        else if (g.stun <= 0) { g.stun = 0.5; g.flash('#d9534f'); Sound.thud(); }
      }
      if (o.x < -40) g.things.splice(i, 1);
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#231d2b'; ctx.fillRect(0, 0, GW, GH);
    // brick walls top/bottom
    ctx.fillStyle = '#33283a';
    ctx.fillRect(0, 0, GW, 70); ctx.fillRect(0, GH - 40, GW, 40);
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 2;
    for (let x = 0; x < GW; x += 60) { ctx.strokeRect(x, 10, 58, 26); ctx.strokeRect(x + 30, 40, 58, 26); }
    // torches
    ['🔦'].forEach(() => {});
    Draw.bigText(ctx, '🗝️ THE DUNGEON', GW / 2, 40, 26, '#e8b830');

    g.things.forEach(o => Draw.emoji(ctx, o.emoji, o.x, o.y, 44));

    // the dungeoneer
    const px = 150;
    if (g.stun > 0) ctx.globalAlpha = 0.4 + Math.sin(t * 40) * 0.3;
    Draw.emoji(ctx, '🧝', px, g.py, 54);
    ctx.globalAlpha = 1;

    Draw.bigText(ctx, `Treasure: ${g.gold}`, GW / 2, GH - 14, 22, '#e8b830');
  },
});
