/* ============================================================
   HARDWARE STORE OWNER 🔨 — SORT THE STOCK (categorise + ring up).
   Items come off the conveyor — TAP the right BIN for each one
   (Tools · Fasteners · Paint) to ring up the sale before the
   timer runs out. Sort fast, keep the register singing! And on
   payday you can FRANCHISE to earn even more. Watch the Rusty nail!
   ============================================================ */

const HW_KINDS = {
  tool:     { name: 'Tools',     emoji: '🔨', items: ['🔨', '🪛', '🪚', '🔧', '🪓'] },
  fastener: { name: 'Fasteners', emoji: '🔩', items: ['🔩', '🪝', '⛓️', '📌'] },
  paint:    { name: 'Paint',     emoji: '🪣', items: ['🪣', '🎨', '🖌️', '🧴'] },
};
const HW_CATS = Object.keys(HW_KINDS);

GAMES.hardware = defineShift({
  hint: 'TAP the right <b>bin</b> for each item — 🔨 Tools, 🔩 Fasteners, 🪣 Paint — to ring it up before the timer runs out! On payday you can <b>franchise</b>. Dodge the <b>Rusty nail!</b>',
  duration: r => 46 + r * 6,

  init(g) {
    const fr = State.data.franchises || 0;
    g.unit = Math.max(2, Math.floor(State.salary() / 9 * (1 + fr * 0.3)));   // each franchise +30%
    g.bins = HW_CATS.map((cat, i) => ({ cat, x: 60 + i * ((GW - 120) / 3), w: (GW - 120) / 3 - 16 }));
    g.binY = GH - 130; g.binH = 108;
    g.sorted = 0;
    g.register = 0;                                    // running "till" total
    g.limit = Math.max(1.3, 2.4 - g.rank * 0.22);      // seconds to sort each item
    g.pop = null;
    this.next(g);
  },

  next(g) {
    const cat = HW_CATS[Math.floor(Math.random() * HW_CATS.length)];
    const items = HW_KINDS[cat].items;
    g.item = { cat, emoji: items[Math.floor(Math.random() * items.length)], t: 0 };
  },

  pointer(g, x, y) {
    if (!g.item) return;
    if (y < g.binY) return;                            // only bin taps count
    const bin = g.bins.find(b => x >= b.x && x <= b.x + b.w);
    if (!bin) return;
    if (bin.cat === g.item.cat) {
      g.earn(g.unit); g.sorted++; g.register += g.unit;
      g.pop = { x: bin.x + bin.w / 2, y: g.binY - 10, ok: true, t: 0 };
      Sound.coin();
    } else {
      g.flash('#d9534f'); Sound.thud();
      g.pop = { x: bin.x + bin.w / 2, y: g.binY - 10, ok: false, t: 0 };
    }
    this.next(g);
  },

  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.45) g.pop = null; }
    if (g.item) {
      g.item.t += dt;
      if (g.item.t >= g.limit) { g.flash('#d9534f'); Sound.thud(); this.next(g); }   // too slow — item scrapped
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#efe2c8'; ctx.fillRect(0, 0, GW, GH);            // store wall
    // pegboard
    ctx.fillStyle = 'rgba(43,43,51,.10)';
    for (let x = 40; x < GW - 20; x += 42) for (let y = 96; y < g.binY - 40; y += 42) { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
    Draw.bigText(ctx, '🔨 SORT THE STOCK', GW / 2, 40, 26, '#7a4a1c');
    // register readout
    Draw.bigText(ctx, `🧾 Till: ${fmtMoney(g.register)}`, GW / 2, 74, 18, '#2f7d3f');

    // conveyor + the current item
    const cx = GW / 2, cy = 250;
    ctx.fillStyle = '#8a8a94'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.fillRect(cx - 120, cy + 44, 240, 22); ctx.strokeRect(cx - 120, cy + 44, 240, 22);
    for (let i = 0; i < 6; i++) { const lx = cx - 116 + i * 40 + (t * 40 % 40); ctx.strokeStyle = 'rgba(43,43,51,.3)'; ctx.beginPath(); ctx.moveTo(lx, cy + 46); ctx.lineTo(lx, cy + 64); ctx.stroke(); }
    if (g.item) {
      Draw.emoji(ctx, g.item.emoji, cx, cy, 76);
      // countdown ring
      const frac = 1 - g.item.t / g.limit;
      ctx.strokeStyle = frac < 0.35 ? '#d9534f' : '#2f7d3f'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, cy, 52, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    }

    // the three bins
    g.bins.forEach(b => {
      const k = HW_KINDS[b.cat];
      ctx.fillStyle = '#c98a5b'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
      ctx.fillRect(b.x, g.binY, b.w, g.binH); ctx.strokeRect(b.x, g.binY, b.w, g.binH);
      ctx.fillStyle = 'rgba(43,43,51,.12)'; ctx.fillRect(b.x, g.binY, b.w, 30);
      Draw.emoji(ctx, k.emoji, b.x + b.w / 2, g.binY + 52, 40);
      Draw.bigText(ctx, k.name, b.x + b.w / 2, g.binY + 90, 16, '#5a3410');
    });

    if (g.pop) Draw.bigText(ctx, g.pop.ok ? 'SOLD!' : 'WRONG BIN!', g.pop.x, g.pop.y, 20, g.pop.ok ? '#2f7d3f' : '#d9534f');
    Draw.bigText(ctx, `Sorted: ${g.sorted}`, GW / 2, GH - 12, 20, '#7a4a1c');
  },

  // FRANCHISE — invest at payday to permanently boost store earnings.
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
