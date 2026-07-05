/* ============================================================
   CHEF 🍳 — PERFECT TIMING.
   Each pan cooks a dish. Tap the pan the instant the bar hits
   the GREEN zone for a perfect plate. Too late = grease fire!
   Danger: Grease fire! (dodge or you're knocked out)
   ============================================================ */

function chefResetPan(g, p) {
  p.cook = -0.15 - Math.random() * 0.2;   // a beat of empty pan before the next dish
  p.dish = g.dishes[Math.floor(Math.random() * g.dishes.length)];
  p.burnt = 0;
  p.pop = 0;
  p.popText = '';
  p.shake = 0;
}

GAMES.chef = defineShift({
  hint: 'Tap a pan the moment its food is <b>perfectly cooked</b> — when the bar reaches the <b>green</b>! Too late and it catches fire. 🔥',
  duration: r => 46 + r * 6,

  init(g) {
    g.dishes = ['🍳', '🥞', '🍔', '🍕', '🥩', '🌭', '🧇', '🥓'];
    const count = 2 + (g.rank >= 1 ? 1 : 0) + (g.rank >= 3 ? 1 : 0);   // 2..4 pans
    g.rate = 0.26 * g.diff;                                            // cook speed (faster as you rank up)
    g.unit = Math.max(2, Math.floor(State.salary() / 9));
    g.perfect = 0;
    g.pans = [];
    const gap = GW / (count + 1);
    for (let i = 0; i < count; i++) {
      g.pans.push({ x: gap * (i + 1), y: 350, cook: Math.random() * 0.3, dish: g.dishes[i % g.dishes.length], burnt: 0, pop: 0, popText: '', shake: 0 });
    }
  },

  update(g, dt) {
    g.pans.forEach(p => {
      if (p.pop > 0) p.pop -= dt;
      if (p.shake > 0) p.shake -= dt;
      if (p.burnt > 0) { p.burnt -= dt; if (p.burnt <= 0) chefResetPan(g, p); return; }
      p.cook += g.rate * dt;
      if (p.cook >= 1.16) { p.burnt = 0.9; Sound.thud(); g.flash('#d9534f'); }
    });
  },

  pointer(g, x, y) {
    let best = null, bd = 95;
    g.pans.forEach(p => { const d = Math.abs(p.x - x); if (d < bd && Math.abs(p.y - y) < 130) { bd = d; best = p; } });
    if (!best || best.burnt > 0) return;
    const c = best.cook;
    if (c >= 0.72 && c <= 0.99) {          // PERFECT
      g.earn(g.unit); g.perfect++;
      best.pop = 0.6; best.popText = 'PERFECT!'; Sound.coin();
      chefResetPan(g, best);
    } else if (c >= 0.48 && c < 0.72) {    // a bit early but okay
      g.earn(Math.floor(g.unit * 0.4));
      best.pop = 0.5; best.popText = 'ok!'; Sound.ding();
      chefResetPan(g, best);
    } else if (c > 0.99) {                 // served it burnt
      best.burnt = 0.9; g.flash('#d9534f'); Sound.thud();
    } else {                               // way too early
      best.shake = 0.3;
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    // kitchen
    ctx.fillStyle = '#f6ead6'; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#e5d3b3'; ctx.fillRect(0, 250, GW, GH - 250);          // counter
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 250); ctx.lineTo(GW, 250); ctx.stroke();
    // wall tiles
    ctx.strokeStyle = 'rgba(43,43,51,.08)';
    ctx.lineWidth = 2;
    for (let x = 0; x < GW; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 250); ctx.stroke(); }
    for (let y = 0; y < 250; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GW, y); ctx.stroke(); }
    Draw.bigText(ctx, "CHEF'S KITCHEN", GW / 2, 46, 34, '#c98a5b');

    g.pans.forEach(p => {
      const shake = p.shake > 0 ? Math.sin(t * 60) * 4 : 0;
      const px = p.x + shake;
      // stove burner
      ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3; ctx.fillStyle = '#3a3a44';
      ctx.beginPath(); ctx.arc(px, p.y + 30, 60, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // skillet
      ctx.fillStyle = p.burnt > 0 ? '#5a3320' : '#2b2b33';
      ctx.beginPath(); ctx.ellipse(px, p.y + 26, 54, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(px + 52, p.y + 26); ctx.lineTo(px + 96, p.y + 20); ctx.lineWidth = 8; ctx.strokeStyle = '#2b2b33'; ctx.stroke();
      // the dish (or fire / empty)
      if (p.burnt > 0) { Draw.emoji(ctx, '🔥', px, p.y + 14, 52); }
      else if (p.cook >= 0) { Draw.emoji(ctx, p.dish, px, p.y + 12, 44 + Math.min(10, p.cook * 10)); }
      // cook bar
      const bw = 108, bx = px - bw / 2, by = p.y - 78;
      Draw.panel(ctx, bx, by, bw, 16, '#fffdf6');
      // green perfect zone
      ctx.fillStyle = '#cdeccf'; ctx.fillRect(bx + bw * 0.72, by, bw * 0.27, 16);
      // fill
      const c = Math.max(0, Math.min(1, p.cook));
      ctx.fillStyle = p.cook > 0.99 ? '#d9534f' : (p.cook >= 0.72 ? '#3fa555' : '#e8b830');
      ctx.fillRect(bx, by, bw * c, 16);
      ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, 16);
      // green zone outline marker
      ctx.strokeStyle = '#2f7d3f'; ctx.lineWidth = 2;
      ctx.strokeRect(bx + bw * 0.72, by, bw * 0.27, 16);
      // perfect pop
      if (p.pop > 0) Draw.bigText(ctx, p.popText, px, p.y - 108, 26, p.popText === 'PERFECT!' ? '#2f7d3f' : '#9a7714');
    });

    // score
    Draw.bigText(ctx, `Perfect plates: ${g.perfect}`, GW / 2, GH - 22, 22, '#2b2b33');
  },
});
