/* ============================================================
   PEASANT 🌾 — CATCH FALLING STUFF.
   Move your basket to catch the falling crops. Catch a runaway
   goat by mistake and it knocks your basket over!
   ============================================================ */

const PEASANT_CROPS = [
  { emoji: '🌾', worth: 0.8, r: 20 },
  { emoji: '🥕', worth: 1.0, r: 20 },
  { emoji: '🌽', worth: 1.3, r: 22 },
  { emoji: '🍅', worth: 1.1, r: 20 },
  { emoji: '🥔', worth: 0.9, r: 20 },
  { emoji: '🍎', worth: 1.5, r: 22 },
];

GAMES.peasant = defineShift({
  hint: 'Move your <b>basket</b> (finger/mouse, or ← →) to catch the falling crops. Dodge the runaway <b>goat</b>! 🐐',
  duration: r => 44 + r * 6,

  init(g) {
    g.basket = { x: GW / 2, target: GW / 2, w: 150 };
    g.items = [];
    g.spawnEvery = 0.8 / g.diff;
    g.spawnT = 0;
    g.fall = 135 + g.rank * 40;
    g.unit = Math.max(2, Math.floor(State.salary() / 5));
    g.caught = 0; g.stun = 0;
  },

  move(g, x) { g.basket.target = Math.max(g.basket.w / 2, Math.min(GW - g.basket.w / 2, x)); },
  key(g, e) {
    if (e.code === 'ArrowLeft') g.basket.target = Math.max(g.basket.w / 2, g.basket.target - 60);
    if (e.code === 'ArrowRight') g.basket.target = Math.min(GW - g.basket.w / 2, g.basket.target + 60);
  },

  update(g, dt) {
    g.basket.x += (g.basket.target - g.basket.x) * Math.min(1, dt * 14);
    if (g.stun > 0) g.stun -= dt;
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.7 + Math.random() * 0.6);
      const goat = Math.random() < (0.18 + g.rank * 0.04);
      const kind = goat ? { emoji: '🐐', worth: 0, goat: true, r: 26 } : PEASANT_CROPS[Math.floor(Math.random() * PEASANT_CROPS.length)];
      g.items.push({ ...kind, x: 40 + Math.random() * (GW - 80), y: -30, vy: g.fall * (0.85 + Math.random() * 0.5), spin: 0 });
    }
    const catchY = GH - 96;
    for (let i = g.items.length - 1; i >= 0; i--) {
      const it = g.items[i];
      it.y += it.vy * dt; it.spin += dt * 2;
      if (it.y >= catchY && it.y <= catchY + 48 && Math.abs(it.x - g.basket.x) < g.basket.w / 2) {
        if (it.goat) { g.stun = 0.5; g.flash('#d9534f'); Sound.thud(); UI.toast('The goat knocked your basket!', '🐐'); }
        else { g.earn(g.unit * it.worth); g.caught++; Sound.coin(); }
        g.items.splice(i, 1); continue;
      }
      if (it.y > GH + 40) g.items.splice(i, 1);
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    // sky + sun
    ctx.fillStyle = '#cdeaf6'; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#f7d774'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(GW - 90, 70, 34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // field
    ctx.fillStyle = '#8fca6e'; ctx.fillRect(0, GH - 130, GW, 130);
    ctx.strokeStyle = '#2b2b33'; ctx.beginPath(); ctx.moveTo(0, GH - 130); ctx.lineTo(GW, GH - 130); ctx.stroke();
    ctx.strokeStyle = 'rgba(43,43,51,.15)'; ctx.lineWidth = 2;
    for (let x = 0; x < GW; x += 46) { ctx.beginPath(); ctx.moveTo(x, GH - 120); ctx.lineTo(x + 20, GH); ctx.stroke(); }
    Draw.bigText(ctx, '🌾 HARVEST TIME', GW / 2, 40, 30, '#4a7a2f');

    // falling items
    g.items.forEach(it => {
      ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(Math.sin(it.spin) * 0.3);
      Draw.emoji(ctx, it.emoji, 0, 0, it.r * 2); ctx.restore();
    });

    // basket
    const cx = g.basket.x, cy = GH - 92, w = g.basket.w;
    if (g.stun > 0) ctx.globalAlpha = 0.5 + Math.sin(t * 40) * 0.3;
    ctx.fillStyle = '#c98a5b'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy); ctx.lineTo(cx + w / 2, cy);
    ctx.lineTo(cx + w / 2 - 20, cy + 50); ctx.lineTo(cx - w / 2 + 20, cy + 50);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // woven lines
    for (let i = 1; i < 5; i++) { const x = cx - w / 2 + (w / 5) * i; ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x - 4, cy + 50); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx - w / 2 + 6, cy + 18); ctx.lineTo(cx + w / 2 - 6, cy + 18); ctx.stroke();
    ctx.globalAlpha = 1;

    Draw.bigText(ctx, `Crops: ${g.caught}`, GW / 2, GH - 16, 22, '#3a5a1f');
  },

  // Peasant pay is humble — but a GOOD harvest earns golden LOTTERY
  // tickets. Each is a rare 3% shot at a life-changing $30 BILLION.
  // (That long-shot dream is the whole reason to keep farming!)
  payday(g, content) {
    const caught = g.caught || 0;
    if (caught < 8) return;                          // only when you actually did well
    const tickets = 1 + Math.floor(caught / 20);     // a ticket for a good day, more for a bumper crop
    const card = el('div', 'lottery-card');
    card.innerHTML = `
      <div class="lottery-head">🎟️ GOLDEN HARVEST TICKET${tickets > 1 ? 'S' : ''}!</div>
      <p>Bumper crop! You earned <b>${tickets}</b> lottery ticket${tickets > 1 ? 's' : ''} —
         each a <b>3%</b> shot at <b>${fmtMoney(30e9)}</b>! 🤞</p>
      <button class="btn btn-money lotto-go">🎟️ SCRATCH ${tickets > 1 ? 'THEM' : 'IT'}!</button>
      <div class="lotto-reveal"></div>`;
    const actions = content.querySelector('.summary-actions');
    if (actions) content.insertBefore(card, actions); else content.appendChild(card);

    const go = card.querySelector('.lotto-go');
    const reveal = card.querySelector('.lotto-reveal');
    go.addEventListener('click', () => {
      go.disabled = true;
      let i = 0, won = 0;
      const drawOne = () => {
        if (i >= tickets) {
          const s = State.data.stats;
          s.lotteryTickets = (s.lotteryTickets || 0) + tickets;
          if (won) s.lotteryWins = (s.lotteryWins || 0) + won;
          State.save();
          if (!won) {
            const none = el('div', 'lotto-none');
            none.textContent = 'No jackpot this time — plant more, harvest more, try again! 🌱';
            reveal.appendChild(none);
          }
          return;
        }
        i++;
        const win = Math.random() < 0.03;            // 3% — the promise of great riches
        const row = el('div', 'lotto-ticket' + (win ? ' win' : ''));
        row.innerHTML = win
          ? `🎉 <b>JACKPOT!</b> Ticket ${i} wins <b>${fmtMoney(30e9)}</b>!`
          : `🎫 Ticket ${i}: <span class="lotto-dud">no luck</span>`;
        reveal.appendChild(row);
        if (win) { won++; State.addWealth(30e9); UI.refreshWealth(); Sound.jackpot(); UI.confetti(50); }
        else Sound.ding();
        setTimeout(drawOne, 700);
      };
      drawOne();
    });
  },
});
