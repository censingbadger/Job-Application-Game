/* ============================================================
   LAWYER ⚖️ — COOL DOWN THE CLIENTS (juggle tempers).
   Angry clients fill the office, each one steaming hotter. TAP a
   client to calm them down; cool one all the way and they leave
   happy (and pay!). Let a temper boil over and they storm out.
   Big money, low danger — just don't get Held in contempt!
   ============================================================ */

GAMES.lawyer = defineShift({
  hint: 'TAP an <b>angry client</b> 😡 to cool them down — calm one fully and they pay up and leave 😌. Don\'t let a temper <b>boil over</b>! Beware <b>Held in contempt!</b>',
  duration: r => 46 + r * 6,

  init(g) {
    // desks: two rows of three
    g.slots = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      g.slots.push({ x: 190 + c * 260, y: 200 + r * 170, client: null });
    }
    g.spawnEvery = 1.2 / g.diff;
    g.spawnT = 0.2;
    g.rise = 0.12 + g.rank * 0.02;
    g.unit = Math.max(2, Math.floor(State.salary() / 12));
    g.resolved = 0;
    g.pop = null;
  },

  pointer(g, x, y) {
    let hit = null, best = 999;
    g.slots.forEach(s => {
      if (!s.client) return;
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < 66 && d < best) { best = d; hit = s; }
    });
    if (!hit) return;
    hit.client.anger -= 0.6;
    if (hit.client.anger <= 0) {                       // fully calmed — they pay & leave
      g.earn(g.unit); g.resolved++;
      g.pop = { x: hit.x, y: hit.y - 60, ok: true, t: 0 };
      hit.client = null; Sound.coin();
    } else {
      hit.client.shake = 0.25; Sound.ding();
    }
  },

  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.5) g.pop = null; }
    // new clients arrive into empty desks
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      const free = g.slots.filter(s => !s.client);
      if (free.length) {
        free[Math.floor(Math.random() * free.length)].client = { anger: 0.32 + Math.random() * 0.2, shake: 0 };
        g.spawnT = g.spawnEvery * (0.7 + Math.random() * 0.6);
      } else { g.spawnT = 0.4; }
    }
    g.slots.forEach(s => {
      if (!s.client) return;
      s.client.anger += g.rise * dt;
      if (s.client.shake > 0) s.client.shake -= dt;
      if (s.client.anger >= 1) {                        // boiled over — storms out
        s.client = null; g.flash('#d9534f'); Sound.thud();
        g.pop = { x: s.x, y: s.y - 60, ok: false, t: 0 };
      }
    });
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#e7ddc7'; ctx.fillRect(0, 0, GW, GH);
    // bookshelves along the back wall (a nod to the law library)
    for (let s = 0; s < 2; s++) {
      const sy = 92 + s * 0;
      ctx.fillStyle = '#7a5230'; ctx.fillRect(0, 84, GW, 34); ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2; ctx.strokeRect(0, 84, GW, 34);
      const cols = ['#c0392b', '#2f7d3f', '#1e7fbf', '#c98a00', '#8d5bd4'];
      for (let b = 0; b < 46; b++) { ctx.fillStyle = cols[b % cols.length]; ctx.fillRect(6 + b * 19.4, 88, 15, 26); ctx.strokeRect(6 + b * 19.4, 88, 15, 26); }
    }
    Draw.bigText(ctx, '⚖️ ORDER IN THE OFFICE', GW / 2, 52, 24, '#3a2c66');

    g.slots.forEach(s => {
      // desk
      ctx.fillStyle = '#a9743f'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
      ctx.fillRect(s.x - 60, s.y + 26, 120, 22); ctx.strokeRect(s.x - 60, s.y + 26, 120, 22);
      if (!s.client) return;
      const a = Math.min(1, s.client.anger);
      const face = a > 0.75 ? '😡' : a > 0.5 ? '😠' : a > 0.25 ? '😟' : '🙂';
      const sh = s.client.shake > 0 ? Math.sin(t * 50) * 3 : 0;
      Draw.emoji(ctx, face, s.x + sh, s.y, 62);
      // temper bar
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2;
      ctx.fillRect(s.x - 46, s.y - 54, 92, 12); ctx.strokeRect(s.x - 46, s.y - 54, 92, 12);
      ctx.fillStyle = a > 0.7 ? '#d9534f' : a > 0.4 ? '#e8a33d' : '#3fa555';
      ctx.fillRect(s.x - 44, s.y - 52, 88 * a, 8);
    });

    if (g.pop) Draw.bigText(ctx, g.pop.ok ? 'CASE WON! 💼' : 'STORMED OUT!', g.pop.x, g.pop.y, 20, g.pop.ok ? '#2f7d3f' : '#d9534f');
    Draw.bigText(ctx, `Clients won: ${g.resolved}`, GW / 2, GH - 16, 22, '#3a2c66');
  },
});
