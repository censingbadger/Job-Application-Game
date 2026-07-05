/* ============================================================
   TEACHER 📚 — PERFECT TIMING (pop quiz!).
   Tap the correct answer before the timer runs out. The maths
   gets harder (and the clock faster) as you rank up.
   ============================================================ */

function teacherNewQuestion(g) {
  const r = g.rank, roll = Math.random();
  let a, b, op, ans;
  if (r === 0) {
    if (roll < 0.6) { a = 2 + (Math.random() * 12 | 0); b = 1 + (Math.random() * 10 | 0); op = '+'; ans = a + b; }
    else { a = 6 + (Math.random() * 14 | 0); b = 1 + (Math.random() * a | 0); op = '−'; ans = a - b; }
  } else if (r === 1) {
    if (roll < 0.4) { a = 10 + (Math.random() * 30 | 0); b = 5 + (Math.random() * 25 | 0); op = '+'; ans = a + b; }
    else if (roll < 0.7) { a = 20 + (Math.random() * 30 | 0); b = 1 + (Math.random() * 20 | 0); op = '−'; ans = a - b; }
    else { a = 2 + (Math.random() * 5 | 0); b = 2 + (Math.random() * 6 | 0); op = '×'; ans = a * b; }
  } else {
    if (roll < 0.5) { a = 2 + (Math.random() * 11 | 0); b = 2 + (Math.random() * 11 | 0); op = '×'; ans = a * b; }
    else if (roll < 0.75) { a = 30 + (Math.random() * 70 | 0); b = 10 + (Math.random() * 50 | 0); op = '+'; ans = a + b; }
    else { a = 40 + (Math.random() * 60 | 0); b = 1 + (Math.random() * 39 | 0); op = '−'; ans = a - b; }
  }
  g.q = `${a} ${op} ${b} = ?`;

  const opts = new Set([ans]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 40) {
    let d = ans + ((Math.random() * 9 | 0) - 4);
    if (d < 0) d = ans + 1 + (Math.random() * 5 | 0);
    opts.add(d);
  }
  const arr = [...opts];
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; }

  const bw = 250, bh = 78, gapx = 40, gapy = 26;
  const gx = (GW - bw * 2 - gapx) / 2, gy = 250;
  g.answers = arr.map((val, i) => ({
    val, correct: val === ans,
    x: gx + (i % 2) * (bw + gapx), y: gy + (i / 2 | 0) * (bh + gapy), w: bw, h: bh,
  }));
  g.qLeft = g.qTime;
}

function teacherPick(g, i) {
  const a = g.answers[i];
  if (!a) return;
  if (a.correct) { g.earn(g.unit); g.right++; g.flash('#cdeccf'); Sound.coin(); }
  else { g.wrong++; g.flash('#d9534f'); Sound.thud(); }
  teacherNewQuestion(g);
}

GAMES.teacher = defineShift({
  hint: 'Tap the <b>correct answer</b> before the timer runs out. Ace the pop quiz! 📚',
  duration: r => 46 + r * 6,

  init(g) {
    g.unit = Math.max(2, Math.floor(State.salary() / 6));
    g.right = 0; g.wrong = 0;
    g.qTime = Math.max(2.2, 4.2 - g.rank * 0.55);
    teacherNewQuestion(g);
  },

  pointer(g, x, y) {
    g.answers.forEach((a, i) => { if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) teacherPick(g, i); });
  },

  update(g, dt) {
    g.qLeft -= dt;
    if (g.qLeft <= 0) { g.wrong++; g.flash('#d9534f'); Sound.thud(); teacherNewQuestion(g); }
  },

  draw(g, t) {
    const ctx = g.ctx;
    // chalkboard
    ctx.fillStyle = '#2f4a3a'; ctx.fillRect(0, 0, GW, GH);
    ctx.strokeStyle = '#c98a5b'; ctx.lineWidth = 14; ctx.strokeRect(7, 7, GW - 14, GH - 14);
    Draw.bigText(ctx, '📚 POP QUIZ!', GW / 2, 60, 30, '#f6ead0');

    // question
    ctx.font = 'bold 64px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fffdf6'; ctx.fillText(g.q, GW / 2, 150);

    // timer bar
    const bw = 460, bx = (GW - bw) / 2;
    Draw.panel(ctx, bx, 196, bw, 16, '#1e2f26');
    ctx.fillStyle = g.qLeft < g.qTime * 0.3 ? '#d9534f' : '#e8b830';
    ctx.fillRect(bx, 196, bw * Math.max(0, g.qLeft / g.qTime), 16);
    ctx.strokeStyle = '#fffdf6'; ctx.lineWidth = 2; ctx.strokeRect(bx, 196, bw, 16);

    // answer buttons
    g.answers.forEach(a => {
      ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.rect(a.x, a.y, a.w, a.h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b2b33'; ctx.font = 'bold 40px "Trebuchet MS", sans-serif';
      ctx.fillText(String(a.val), a.x + a.w / 2, a.y + a.h / 2);
    });

    Draw.bigText(ctx, `Correct: ${g.right}   Wrong: ${g.wrong}`, GW / 2, GH - 40, 22, '#f6ead0');
  },
});
