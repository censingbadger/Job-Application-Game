/* ============================================================
   JOB APPLICATOR 📋 — TIMING & SORT (the meta job!).
   Applications slide in. Stamp ACCEPT for a happy applicant,
   DECLINE for a grumpy one — before the timer runs out.
   ============================================================ */

const JAP_GOOD = ['😊', '😄', '🤩', '😎', '🥳'];
const JAP_BAD = ['😠', '😡', '🥴', '😰', '😈'];
const JAP_JOBS = ['Prisoner', 'Peasant', 'Chef', 'Miner', 'Soldier', 'Gamer', 'Nomad', 'Beekeeper', 'Criminal'];

function japNew(g) {
  g.good = Math.random() < 0.5;
  g.face = (g.good ? JAP_GOOD : JAP_BAD)[Math.random() * 5 | 0];
  g.applicant = JAP_JOBS[Math.random() * JAP_JOBS.length | 0];
  g.qLeft = g.qTime;
  g.slide = 0;
}

function japStamp(g, accepted) {
  if (accepted === g.good) { g.earn(g.unit); g.right++; g.flash('#cdeccf'); g.lastStamp = accepted ? 'HIRED!' : 'REJECTED!'; Sound.coin(); }
  else { g.wrong++; g.flash('#d9534f'); g.lastStamp = 'WRONG!'; Sound.thud(); }
  g.stampT = 0.4;
  japNew(g);
}

GAMES.jobapplicator = defineShift({
  hint: 'Stamp each application! Tap <b>ACCEPT</b> for a happy applicant 😊 and <b>DECLINE</b> for a grumpy one 😠 — beat the timer!',
  duration: r => 46 + r * 6,

  init(g) {
    g.unit = Math.max(2, Math.floor(State.salary() / 6));
    g.right = 0; g.wrong = 0;
    g.qTime = Math.max(1.6, 3.2 - g.rank * 0.42);
    g.stampT = 0; g.lastStamp = '';
    g.btns = { accept: { x: GW / 2 - 290, y: GH - 116, w: 260, h: 80 }, decline: { x: GW / 2 + 30, y: GH - 116, w: 260, h: 80 } };
    japNew(g);
  },

  pointer(g, x, y) {
    const b = g.btns;
    if (x >= b.accept.x && x <= b.accept.x + b.accept.w && y >= b.accept.y && y <= b.accept.y + b.accept.h) japStamp(g, true);
    else if (x >= b.decline.x && x <= b.decline.x + b.decline.w && y >= b.decline.y && y <= b.decline.y + b.decline.h) japStamp(g, false);
  },

  update(g, dt) {
    if (g.slide < 1) g.slide = Math.min(1, g.slide + dt * 5);
    if (g.stampT > 0) g.stampT -= dt;
    g.qLeft -= dt;
    if (g.qLeft <= 0) { g.wrong++; g.flash('#d9534f'); Sound.thud(); japNew(g); }
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#e7e0d0'; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#d8cfb8'; ctx.fillRect(0, GH - 140, GW, 140);
    Draw.bigText(ctx, '📋 THE HIRING DESK', GW / 2, 40, 28, '#7a6a3a');

    // the application card
    const cardW = 420, cardH = 240, cx = (GW - cardW) / 2, cy = 80 + (1 - g.slide) * -30;
    ctx.globalAlpha = g.slide;
    Draw.panel(ctx, cx, cy, cardW, cardH, '#fffdf6');
    Draw.emoji(ctx, g.face, cx + 90, cy + 100, 90);
    ctx.fillStyle = '#2b2b33'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 30px "Trebuchet MS", sans-serif'; ctx.fillText('APPLICATION', cx + 170, cy + 60);
    ctx.font = '24px "Trebuchet MS", sans-serif'; ctx.fillText('Job: ' + g.applicant, cx + 170, cy + 110);
    ctx.fillText('Mood: ' + (g.good ? 'great!' : 'awful...'), cx + 170, cy + 150);
    ctx.globalAlpha = 1;

    // timer
    const tw = cardW, tx = cx;
    ctx.fillStyle = g.qLeft < g.qTime * 0.3 ? '#d9534f' : '#e8b830';
    ctx.fillRect(tx, cy + cardH + 10, tw * Math.max(0, g.qLeft / g.qTime), 12);
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2; ctx.strokeRect(tx, cy + cardH + 10, tw, 12);

    // buttons
    const b = g.btns;
    Draw.panel(ctx, b.accept.x, b.accept.y, b.accept.w, b.accept.h, '#cdeccf');
    Draw.panel(ctx, b.decline.x, b.decline.y, b.decline.w, b.decline.h, '#f6cccb');
    ctx.fillStyle = '#2b2b33'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
    ctx.fillText('✓ ACCEPT', b.accept.x + b.accept.w / 2, b.accept.y + b.accept.h / 2);
    ctx.fillText('✗ DECLINE', b.decline.x + b.decline.w / 2, b.decline.y + b.decline.h / 2);

    if (g.stampT > 0) Draw.bigText(ctx, g.lastStamp, GW / 2, cy + cardH / 2, 40, g.lastStamp === 'WRONG!' ? '#d9534f' : '#2f7d3f');

    ctx.textAlign = 'center';
    Draw.bigText(ctx, `Hired right: ${g.right}   Wrong: ${g.wrong}`, GW / 2, 300, 20, '#7a6a3a');
  },
});
