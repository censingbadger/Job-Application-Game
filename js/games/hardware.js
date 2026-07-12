/* ============================================================
   HARDWARE STORE OWNER 🔨 — HAMMER IT OUT (steady hands).
   Nails pop up across the workbench — TAP each one to hammer it
   home for cash before it works loose. Watch for the Rusty nail!
   And on payday you can FRANCHISE: open new stores that boost
   your earnings for good — build an empire and get rich.
   ============================================================ */

GAMES.hardware = defineShift({
  hint: 'TAP the <b>nails</b> 🔩 to hammer them home before they pop loose! Watch for the <b>Rusty nail!</b> On payday you can <b>franchise</b> to earn even more.',
  duration: r => 46 + r * 6,

  init(g) {
    g.nails = [];
    g.spawnEvery = 0.9 / g.diff;
    g.spawnT = 0.3;
    g.life = Math.max(1.4, 2.6 - g.rank * 0.25);
    const fr = State.data.franchises || 0;
    g.unit = Math.max(2, Math.floor(State.salary() / 9 * (1 + fr * 0.3)));   // each franchise: +30% earnings
    g.built = 0;
    g.pop = null;
  },

  pointer(g, x, y) {
    for (let i = g.nails.length - 1; i >= 0; i--) {
      const n = g.nails[i];
      if (Math.hypot(n.x - x, n.y - y) <= n.r + 8) {
        g.earn(g.unit);
        g.built++;
        g.pop = { x: n.x, y: n.y, t: 0 };
        g.nails.splice(i, 1);
        Sound.ding();
        return;
      }
    }
  },

  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.4) g.pop = null; }
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.7 + Math.random() * 0.6);
      g.nails.push({ x: 70 + Math.random() * (GW - 140), y: 140 + Math.random() * (GH - 230), r: 20, life: g.life, born: 0 });
    }
    for (let i = g.nails.length - 1; i >= 0; i--) {
      const n = g.nails[i];
      n.born += dt; n.life -= dt;
      if (n.life <= 0) { g.nails.splice(i, 1); g.flash('#d9534f'); Sound.thud(); }
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    // workshop wall + bench
    ctx.fillStyle = '#e7d8bf'; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#a9743f'; ctx.fillRect(0, GH - 90, GW, 90);
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, GH - 90); ctx.lineTo(GW, GH - 90); ctx.stroke();
    // pegboard dots
    ctx.fillStyle = 'rgba(43,43,51,.12)';
    for (let x = 40; x < GW - 20; x += 44) for (let y = 96; y < GH - 110; y += 44) { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
    Draw.bigText(ctx, '🔨 HAMMER TIME', GW / 2, 40, 28, '#7a4a1c');
    const fr = State.data.franchises || 0;
    if (fr > 0) Draw.bigText(ctx, `🏪 ×${fr} franchises · +${fr * 30}% pay`, GW / 2, 70, 18, '#2f7d3f');

    // nails to hammer
    g.nails.forEach(n => {
      const pop = Math.min(1, n.born * 6), warn = n.life < 0.7;
      ctx.save(); ctx.translate(n.x, n.y); ctx.scale(pop, pop);
      Draw.emoji(ctx, '🔩', 0, 0, n.r * 2);
      ctx.restore();
      if (warn) Draw.emoji(ctx, '⚠️', n.x, n.y - n.r - 14, 20);
    });

    if (g.pop) Draw.bigText(ctx, 'BANG!', g.pop.x, g.pop.y - 26, 20, '#7a4a1c');
    Draw.bigText(ctx, `Built: ${g.built}`, GW / 2, GH - 16, 22, '#7a4a1c');
  },

  // FRANCHISE — invest at payday to permanently boost store earnings.
  // Cost climbs each time; the more you own, the more every shift pays.
  payday(g, content) {
    const franchiseCost = n => Math.floor(2e6 * Math.pow(2.5, n));
    const card = el('div', 'lottery-card');
    const render = () => {
      const owned = State.data.franchises || 0;
      card.innerHTML = `
        <div class="lottery-head">🏪 FRANCHISE EMPIRE</div>
        <p>You own <b>${owned}</b> franchise${owned === 1 ? '' : 's'} — each adds <b>+30%</b> to your store
           earnings. Open more to build an empire!</p>
        <button class="btn btn-money franchise-buy">Open franchise #${owned + 1} · ${fmtMoney(franchiseCost(owned))}</button>
        <div class="franchise-msg"></div>`;
      card.querySelector('.franchise-buy').addEventListener('click', () => {
        const have = State.data.franchises || 0;
        const cost = franchiseCost(have);
        if (!State.spend(cost)) { card.querySelector('.franchise-msg').textContent = `You need ${fmtMoney(cost)} to open it!`; Sound.danger(); return; }
        State.data.franchises = have + 1;
        State.save();
        UI.moneyPop(-cost); UI.refreshWealth(); Sound.jackpot(); UI.confetti(24);
        render();
        card.querySelector('.franchise-msg').textContent = `🎉 Franchise #${State.data.franchises} opened! Every shift now pays more.`;
      });
    };
    render();
    const actions = content.querySelector('.summary-actions');
    if (actions) content.insertBefore(card, actions); else content.appendChild(card);
  },
});
