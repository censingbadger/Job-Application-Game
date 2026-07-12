/* ============================================================
   ARCHAEOLOGIST 🏺 — DIG IT UP (brush out buried treasure).
   Something priceless is buried under the sand. SWIPE your brush
   (finger/mouse) back and forth to sweep the dirt away. Once the
   relic is uncovered, TAP it to lift it out — pottery, coins,
   gems, even a golden crown. Rarer relics pay far more. Work the
   whole pit before the day ends — and mind the Tomb collapse!
   ============================================================ */

const ARCH_FINDS = [
  { emoji: '🏺', worth: 1,   weight: 26, name: 'a clay pot' },
  { emoji: '⚱️', worth: 1.4, weight: 20, name: 'an old urn' },
  { emoji: '🪙', worth: 1.8, weight: 18, name: 'a gold coin' },
  { emoji: '🦴', worth: 1.6, weight: 14, name: 'a fossil' },
  { emoji: '🗿', worth: 3,   weight: 10, name: 'a stone idol' },
  { emoji: '💍', worth: 3.6, weight: 7,  name: 'a jewelled ring' },
  { emoji: '💎', worth: 5,   weight: 4,  name: 'a raw gem' },
  { emoji: '👑', worth: 9,   weight: 2,  name: 'a lost crown' },
];
function ARCH_pick() {
  const total = ARCH_FINDS.reduce((s, f) => s + f.weight, 0);
  let roll = Math.random() * total;
  for (const f of ARCH_FINDS) { if ((roll -= f.weight) <= 0) return f; }
  return ARCH_FINDS[0];
}

GAMES.archaeologist = defineShift({
  hint: 'SWIPE your <b>brush</b> over the sand to sweep it away. When the buried <b>relic</b> is uncovered, TAP it to lift it out! Rarer relics (💎, 👑) pay far more. Beware the <b>Tomb collapse!</b>',
  duration: r => 46 + r * 6,

  init(g) {
    g.unit = Math.max(2, Math.floor(State.salary() / 16));
    g.gx0 = 36; g.gy0 = 112; g.cols = 14; g.rows = 9;
    g.cw = (GW - 72) / g.cols; g.ch = (GH - 150) / g.rows;
    g.brushStr = Math.max(0.32, 0.62 - g.rank * 0.05);   // deeper sand higher up
    g.finds = 0;
    g.brushPos = { x: GW / 2, y: GH / 2 };
    g.pop = null;
    this._bury(g);
  },

  _bury(g) {
    g.sand = [];
    for (let r = 0; r < g.rows; r++) g.sand.push(new Array(g.cols).fill(1));
    const find = ARCH_pick();
    const c0 = 1 + Math.floor(Math.random() * (g.cols - 4));
    const r0 = 1 + Math.floor(Math.random() * (g.rows - 4));
    g.art = { c0, r0, c1: c0 + 2, r1: r0 + 2, cx: g.gx0 + (c0 + 1.5) * g.cw, cy: g.gy0 + (r0 + 1.5) * g.ch, emoji: find.emoji, worth: find.worth, name: find.name, uncovered: false };
  },

  _brush(g, x, y) {
    g.brushPos = { x, y };
    const BR = 54;
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
      if (g.sand[r][c] <= 0) continue;
      const ccx = g.gx0 + (c + 0.5) * g.cw, ccy = g.gy0 + (r + 0.5) * g.ch;
      if (Math.hypot(ccx - x, ccy - y) < BR) g.sand[r][c] = Math.max(0, g.sand[r][c] - g.brushStr);
    }
  },

  _reveal(g) {
    let s = 0, n = 0;
    for (let r = g.art.r0; r <= g.art.r1; r++) for (let c = g.art.c0; c <= g.art.c1; c++) { s += 1 - g.sand[r][c]; n++; }
    const rev = s / n;
    g.art.uncovered = rev >= 0.72;
    return rev;
  },

  move(g, x, y) { this._brush(g, x, y); },

  pointer(g, x, y) {
    if (g.art.uncovered && Math.hypot(x - g.art.cx, y - g.art.cy) < 66) {   // lift it out!
      const worth = g.art.worth;
      g.earn(g.unit * worth); g.finds++;
      g.pop = { x: g.art.cx, y: g.art.cy - 30, emoji: g.art.emoji, big: worth >= 3, t: 0 };
      if (worth >= 3) { Sound.jackpot(); UI.confetti(14); g.flash('#c9a100'); } else Sound.coin();
      this._bury(g);
    } else {
      this._brush(g, x, y);
    }
  },

  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.6) g.pop = null; }
    this._reveal(g);
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#c8a15a'; ctx.fillRect(0, 0, GW, GH);                 // desert
    Draw.bigText(ctx, '🏺 EXCAVATE THE DIG', GW / 2, 36, 26, '#6a4212');

    // the pit floor (revealed dirt under the sand)
    ctx.fillStyle = '#5a4326'; ctx.fillRect(g.gx0, g.gy0, GW - 72, GH - 150);
    ctx.strokeStyle = '#3a2c18'; ctx.lineWidth = 4; ctx.strokeRect(g.gx0, g.gy0, GW - 72, GH - 150);
    // dig-site pegs + rope round the pit
    ctx.fillStyle = '#e8dcc0';
    [[g.gx0, g.gy0], [GW - 36, g.gy0], [g.gx0, GH - 38], [GW - 36, GH - 38]].forEach(([px, py]) => { ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill(); });

    // the relic, emerging as the sand is cleared (drawn first, sand hides it)
    const rev = this._reveal(g);
    const asize = Math.min(g.cw, g.ch) * 2.6;
    if (g.art.uncovered) {                              // glow when ready to lift
      ctx.fillStyle = 'rgba(232,201,64,' + (0.25 + Math.sin(t * 6) * 0.12) + ')';
      ctx.beginPath(); ctx.arc(g.art.cx, g.art.cy, asize * 0.72, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = Math.min(1, 0.15 + rev * 1.1);
    Draw.emoji(ctx, g.art.emoji, g.art.cx, g.art.cy, asize);
    ctx.globalAlpha = 1;

    // the sand on top — fades cell by cell as you brush
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
      const s = g.sand[r][c];
      if (s <= 0.03) continue;
      const x = g.gx0 + c * g.cw, y = g.gy0 + r * g.ch;
      ctx.globalAlpha = 0.35 + 0.62 * s;
      ctx.fillStyle = '#ddc389'; ctx.fillRect(x + 0.5, y + 0.5, g.cw - 1, g.ch - 1);
      if (s > 0.55) { ctx.globalAlpha = 0.5; ctx.fillStyle = '#c2a86e'; ctx.fillRect(x + g.cw * 0.3, y + g.ch * 0.3, 4, 4); ctx.fillRect(x + g.cw * 0.6, y + g.ch * 0.55, 3, 3); }
    }
    ctx.globalAlpha = 1;

    if (g.art.uncovered) Draw.bigText(ctx, '✨ TAP TO LIFT IT OUT! ✨', g.art.cx, g.art.cy + asize * 0.6, 15, '#fff3c0');

    // the brush
    Draw.emoji(ctx, '🖌️', g.brushPos.x, g.brushPos.y, 40);

    if (g.pop) { Draw.emoji(ctx, g.pop.emoji, g.pop.x, g.pop.y, g.pop.big ? 44 : 34); if (g.pop.big) Draw.bigText(ctx, 'TREASURE!', g.pop.x, g.pop.y - 34, 20, '#c9a100'); }
    Draw.bigText(ctx, `Relics: ${g.finds}`, GW / 2, GH - 16, 20, '#6a4212');
  },
});
