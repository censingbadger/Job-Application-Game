/* ============================================================
   DETECTIVE 🕵️ — CATCH THE CULPRIT (crack the line-up).
   A WANTED mugshot pins the criminal. Study the line-up and TAP
   the suspect whose face matches EXACTLY — same hat, same shades,
   same shirt. Nail it fast for a bonus; accuse the wrong one and
   they lawyer up. Solve cases before the trail goes cold — and
   watch for the Armed suspect!
   ============================================================ */

const DET_HATS    = ['none', '🎩', '🧢', '👒', '⛑️', '🎓'];
const DET_GLASSES = ['none', '👓', '🕶️'];
const DET_SHIRT   = ['#d9534f', '#2f7d3f', '#1e7fbf', '#c98a00', '#8d5bd4', '#3aa0a0'];
const DET_KEYS    = ['hat', 'glasses', 'shirt'];
const DET_POOL    = { hat: DET_HATS, glasses: DET_GLASSES, shirt: DET_SHIRT };

function DET_rand(a) { return a[Math.floor(Math.random() * a.length)]; }
function DET_face()  { return { hat: DET_rand(DET_HATS), glasses: DET_rand(DET_GLASSES), shirt: DET_rand(DET_SHIRT) }; }
function DET_same(a, b) { return a.hat === b.hat && a.glasses === b.glasses && a.shirt === b.shirt; }

// Draw one mugshot: skin head + eyes/shades, a shirt, and a hat.
function DET_mug(ctx, cx, cy, r, f) {
  // shirt / shoulders
  ctx.fillStyle = f.shirt; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.98, cy + r * 1.28);
  ctx.quadraticCurveTo(cx - r * 0.95, cy + r * 0.42, cx, cy + r * 0.46);
  ctx.quadraticCurveTo(cx + r * 0.95, cy + r * 0.42, cx + r * 0.98, cy + r * 1.28);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // head
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.66, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // eyes or shades
  if (f.glasses === 'none') {
    ctx.fillStyle = '#2b2b33';
    ctx.beginPath(); ctx.arc(cx - r * 0.22, cy - r * 0.06, r * 0.075, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.22, cy - r * 0.06, r * 0.075, 0, Math.PI * 2); ctx.fill();
  } else {
    Draw.emoji(ctx, f.glasses, cx, cy - r * 0.04, r * 0.62);
  }
  // mouth
  ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy + r * 0.22, r * 0.2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // hat
  if (f.hat !== 'none') Draw.emoji(ctx, f.hat, cx, cy - r * 0.72, r * 0.95);
}

GAMES.detective = defineShift({
  hint: 'Study the <b>WANTED</b> mugshot, then TAP the suspect in the line-up who matches it <b>exactly</b> — same hat, shades and shirt. Be quick for a <b>bonus</b>! Beware the <b>Armed suspect!</b>',
  duration: r => 46 + r * 6,

  init(g) {
    g.unit = Math.max(2, Math.floor(State.salary() / 5));
    g.cols = 3; g.rows = 2;
    g.slots = [];
    const colX = [GW * 0.26, GW * 0.5, GW * 0.74];
    const rowY = [300, 438];
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) g.slots.push({ x: colX[c], y: rowY[r] });
    g.mugR = 54;
    g.solved = 0;
    g.caseLimit = Math.max(3.6, 6.6 - g.rank * 0.5);
    g.lens = { x: GW / 2, y: 240 };
    g.pop = null;
    this.newCase(g);
  },

  newCase(g) {
    const n = g.slots.length;
    const culprit = DET_face();
    const slot = Math.floor(Math.random() * n);
    const faces = [];
    for (let i = 0; i < n; i++) {
      if (i === slot) { faces.push(Object.assign({}, culprit)); continue; }
      const nmut = g.rank >= 3 ? 1 : (1 + (Math.random() < 0.4 ? 1 : 0));   // subtler decoys higher up
      let f;
      do {
        f = Object.assign({}, culprit);
        for (let k = 0; k < nmut; k++) { const key = DET_rand(DET_KEYS); f[key] = DET_rand(DET_POOL[key]); }
      } while (DET_same(f, culprit));
      faces.push(f);
    }
    g.culprit = culprit; g.faces = faces; g.slot = slot; g.caseT = g.caseLimit;
  },

  pointer(g, x, y) {
    this.move(g, x, y);
    let hit = -1, best = 999;
    g.slots.forEach((s, i) => { const d = Math.hypot(s.x - x, s.y - y); if (d < 74 && d < best) { best = d; hit = i; } });
    if (hit < 0) return;
    if (hit === g.slot) {                              // got 'em!
      const fast = g.caseT > g.caseLimit * 0.5;
      g.earn(g.unit * (fast ? 2 : 1)); g.solved++;
      g.pop = { x: g.slots[hit].x, y: g.slots[hit].y - 84, txt: fast ? 'CASE CLOSED! ×2' : 'CASE CLOSED!', good: true, big: fast, t: 0 };
      if (fast) { Sound.jackpot(); g.flash('#2f7d3f'); UI.confetti(10); } else Sound.coin();
      this.newCase(g);
    } else {                                           // wrong suspect — costs time
      g.caseT = Math.max(0.4, g.caseT - 1.4);
      g.flash('#d9534f'); Sound.thud();
      g.pop = { x: g.slots[hit].x, y: g.slots[hit].y - 84, txt: 'WRONG ONE!', good: false, t: 0 };
    }
  },

  move(g, x, y) { g.lens = { x, y }; },

  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.55) g.pop = null; }
    g.caseT -= dt;
    if (g.caseT <= 0) {                                // trail went cold
      g.pop = { x: GW / 2, y: 150, txt: 'GOT AWAY!', good: false, t: 0 };
      Sound.thud();
      this.newCase(g);
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#2f2a3d'; ctx.fillRect(0, 0, GW, GH);                 // precinct wall
    // line-up height chart behind the suspects
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
    for (let yy = 250; yy < GH - 30; yy += 26) { ctx.beginPath(); ctx.moveTo(30, yy); ctx.lineTo(GW - 30, yy); ctx.stroke(); }
    Draw.bigText(ctx, '🕵️ CRACK THE CASE', GW / 2, 34, 26, '#ffd36b');

    // WANTED poster (the culprit to find)
    const px = GW / 2, py = 138, pw = 250, ph = 148;
    ctx.fillStyle = '#efe2c0'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 4;
    ctx.fillRect(px - pw / 2, py - ph / 2, pw, ph); ctx.strokeRect(px - pw / 2, py - ph / 2, pw, ph);
    ctx.fillStyle = '#b23b2e'; ctx.fillRect(px - pw / 2, py - ph / 2, pw, 30);
    Draw.bigText(ctx, '★ WANTED ★', px, py - ph / 2 + 15, 18, '#fff');
    DET_mug(ctx, px - 44, py + 20, 40, g.culprit);
    // case timer bar
    const frac = Math.max(0, g.caseT / g.caseLimit);
    ctx.fillStyle = '#fff'; ctx.fillRect(px + 12, py - 6, 96, 14); ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2; ctx.strokeRect(px + 12, py - 6, 96, 14);
    ctx.fillStyle = frac < 0.3 ? '#d9534f' : '#3fa555'; ctx.fillRect(px + 14, py - 4, 92 * frac, 10);
    Draw.bigText(ctx, 'MATCH THE FACE!', px + 60, py + 34, 12, '#7a2f26');

    // the line-up
    g.slots.forEach((s, i) => {
      const sway = Math.sin(t * 1.6 + i) * 2;
      // spotlight pad
      ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.ellipse(s.x, s.y + g.mugR * 1.3, g.mugR * 1.1, 16, 0, 0, Math.PI * 2); ctx.fill();
      DET_mug(ctx, s.x + sway, s.y, g.mugR, g.faces[i]);
      // placard number
      ctx.fillStyle = '#1a1622'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.fillRect(s.x - 22, s.y + g.mugR * 1.42, 44, 20); ctx.strokeRect(s.x - 22, s.y + g.mugR * 1.42, 44, 20);
      Draw.bigText(ctx, '#' + (i + 1), s.x, s.y + g.mugR * 1.42 + 10, 12, '#ffd36b');
    });

    // magnifying-glass cursor
    Draw.emoji(ctx, '🔍', g.lens.x + 14, g.lens.y - 14, 34);

    if (g.pop) Draw.bigText(ctx, g.pop.txt, g.pop.x, g.pop.y, g.pop.big ? 24 : 20, g.pop.good ? '#3fa555' : '#ff6b6b');
    Draw.bigText(ctx, `Cases solved: ${g.solved}`, GW / 2, GH - 14, 20, '#ffd36b');
  },
});
