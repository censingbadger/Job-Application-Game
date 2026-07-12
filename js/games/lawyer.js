/* ============================================================
   LAWYER ⚖️ — THROW THE BOOK (block their claims).
   Ten people race down ten lanes toward the prize they're
   claiming on the right — money, gold, a house, happiness. DRAG
   your rule book into a lane to block the runner before they cash
   in: blocked, they slump off sad to the start and YOU pocket the
   prize. Let one reach the end and it's theirs — you get nothing.
   Some sprint! Big money, low danger — mind Held in contempt!
   ============================================================ */

const LAW_PEOPLE = ['🧑', '👩', '👨', '🧕', '👴', '👵', '🧑‍🦱', '👱', '🧑‍🦰', '🧔'];
const LAW_GOALS = [
  { emoji: '💰', worth: 1.2 }, { emoji: '🪙', worth: 1.0 }, { emoji: '💎', worth: 1.7 },
  { emoji: '🏆', worth: 1.4 }, { emoji: '😊', worth: 0.8 }, { emoji: '❤️', worth: 0.9 },
  { emoji: '🏠', worth: 1.5 }, { emoji: '🚗', worth: 1.3 }, { emoji: '👑', worth: 2.0 }, { emoji: '🎓', worth: 1.1 },
];

function LAW_speed(g) {
  const base = 80 + g.rank * 18;
  let s = base * (0.85 + Math.random() * 1.25);
  if (Math.random() < 0.16) s *= 1.6;                  // a sprinter!
  return s;
}
// a shuffled copy of 0..n-1 (so lanes differ each shift)
function LAW_order(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

GAMES.lawyer = defineShift({
  hint: 'DRAG your <b>rule book</b> 📕 into a lane to <b>block</b> the runner before they reach their prize on the right — block them and you pocket the reward! Let one through and you get nothing. Watch for <b>Held in contempt!</b>',
  duration: r => 46 + r * 6,

  init(g) {
    g.unit = Math.max(2, Math.floor(State.salary() / 15));
    g.top = 66; g.bottom = 510; g.laneH = (g.bottom - g.top) / 10;
    g.startX = 66; g.goalX = GW - 60; g.aR = 15;
    const po = LAW_order(10), go = LAW_order(10);
    g.lanes = [];
    for (let i = 0; i < 10; i++) {
      g.lanes.push({
        y: g.top + (i + 0.5) * g.laneH,
        person: LAW_PEOPLE[po[i]], goal: LAW_GOALS[go[i]],
        x: g.startX + Math.random() * 160, speed: LAW_speed(g), sad: 0, cheer: 0, bob: Math.random() * 6,
      });
    }
    g.book = { x: GW * 0.5, y: GH * 0.5, w: 46, h: 52 };
    g.blocked = 0;
    g.pop = null;
  },

  move(g, x, y) {
    g.book.x = Math.max(g.startX + 40, Math.min(g.goalX - 6, x));
    g.book.y = Math.max(g.top + 10, Math.min(g.bottom - 10, y));
  },
  pointer(g, x, y) { this.move(g, x, y); },

  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.55) g.pop = null; }
    const b = g.book;
    g.lanes.forEach(a => {
      if (a.cheer > 0) a.cheer -= dt;
      if (a.sad > 0) { a.sad -= dt; return; }           // slumped at the start, out for a beat
      a.x += a.speed * dt;
      // blocked by the rule book? (book in this lane, ahead of the runner)
      if (Math.abs(b.y - a.y) < b.h / 2 + 4 && a.x + g.aR >= b.x - b.w / 2 && a.x < b.x) {
        g.earn(g.unit * a.goal.worth); g.blocked++;
        g.pop = { x: a.x + 16, y: a.y, emoji: a.goal.emoji, big: a.goal.worth >= 1.6, t: 0 };
        if (a.goal.worth >= 1.6) { Sound.jackpot(); UI.confetti(8); } else Sound.coin();
        a.x = g.startX; a.speed = LAW_speed(g); a.sad = 0.6;
        return;
      }
      // reached their prize? — they cash in, you get nothing
      if (a.x + g.aR >= g.goalX) {
        a.x = g.startX; a.speed = LAW_speed(g); a.cheer = 0.5;
      }
    });
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#e7ddc7'; ctx.fillRect(0, 0, GW, GH);
    Draw.bigText(ctx, '⚖️ THROW THE BOOK', GW / 2, 40, 24, '#3a2c66');

    // lanes
    g.lanes.forEach((a, i) => {
      const y0 = g.top + i * g.laneH;
      ctx.fillStyle = i % 2 ? '#efe7d4' : '#e2d7bd';
      ctx.fillRect(0, y0, GW, g.laneH);
      ctx.strokeStyle = 'rgba(58,44,102,.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(g.startX, a.y); ctx.lineTo(g.goalX, a.y); ctx.stroke();
    });
    // start gate + finish line
    ctx.fillStyle = '#8a6a3f'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.fillRect(g.startX - 22, g.top, 12, g.bottom - g.top); ctx.strokeRect(g.startX - 22, g.top, 12, g.bottom - g.top);
    ctx.fillStyle = 'rgba(58,44,102,.10)'; ctx.fillRect(g.goalX + 2, g.top, GW - g.goalX - 2, g.bottom - g.top);
    ctx.strokeStyle = '#3a2c66'; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(g.goalX, g.top); ctx.lineTo(g.goalX, g.bottom); ctx.stroke(); ctx.setLineDash([]);

    // prizes (right) + runners — each on a solid backing so they read clearly
    const sz = Math.min(30, g.laneH - 8);
    g.lanes.forEach(a => {
      // the prize on a little pedestal
      ctx.fillStyle = '#f6efdc'; ctx.strokeStyle = '#b09a6a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(g.goalX + 28, a.y, sz * 0.64, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b2b33'; Draw.emoji(ctx, a.goal.emoji, g.goalX + 28, a.y, sz);
      // the runner on a coloured token
      const bob = a.sad > 0 ? 0 : Math.sin(t * 7 + a.bob) * 2;
      ctx.fillStyle = a.sad > 0 ? '#b9bccb' : '#d3ddf2'; ctx.strokeStyle = '#3a2c66'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(a.x, a.y + bob, sz * 0.62, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b2b33'; Draw.emoji(ctx, a.sad > 0 ? '😢' : a.person, a.x, a.y + bob, sz);
      if (a.cheer > 0) Draw.emoji(ctx, '🎉', a.x + 16, a.y - 14, 20);
    });

    // the rule book (the blocker)
    const b = g.book;
    ctx.fillStyle = '#b23b2e'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h); ctx.strokeRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
    ctx.fillStyle = '#efe2c0'; ctx.fillRect(b.x - b.w / 2 + 5, b.y - b.h / 2 + 5, b.w - 10, b.h - 10);
    Draw.emoji(ctx, '📕', b.x, b.y, 30);

    if (g.pop) { ctx.fillStyle = '#2b2b33'; Draw.emoji(ctx, g.pop.emoji, g.pop.x, g.pop.y - 4, g.pop.big ? 30 : 24); Draw.bigText(ctx, 'BLOCKED!', g.pop.x, g.pop.y - 26, g.pop.big ? 18 : 15, '#2f7d3f'); }
    Draw.bigText(ctx, `Blocked: ${g.blocked}`, GW / 2, GH - 10, 18, '#3a2c66');
  },
});
