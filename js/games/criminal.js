/* ============================================================
   CRIMINAL 🕶️ — AIM & GRAB (a heist!).
   Grab the loot when the eye is GREEN. When it flashes RED,
   FREEZE — tap during red and the alarm catches you!
   ============================================================ */

const CRIMINAL_LOOT = [
  { emoji: '💰', worth: 1.0 },
  { emoji: '💎', worth: 1.6 },
  { emoji: '💍', worth: 2.0 },
  { emoji: '👑', worth: 3.0 },
  { emoji: '🏆', worth: 2.4 },
];

GAMES.criminal = defineShift({
  hint: 'Grab loot when the eye is <b style="color:#3fa555">GREEN</b>. When it goes <b style="color:#d9534f">RED</b>, <b>FREEZE</b> — tapping then sets off the alarm! 🚨',
  duration: r => 46 + r * 6,

  init(g) {
    g.loot = [];
    g.spawnEvery = 0.8 / g.diff;
    g.spawnT = 0.3;
    g.life = Math.max(0.9, 1.9 - g.rank * 0.28);
    g.unit = Math.max(2, Math.floor(State.salary() / 12));
    g.grabbed = 0;
    g.alarm = false;
    g.alarmT = 1.8 + Math.random();
    g.stun = 0;
  },

  pointer(g, x, y) {
    if (g.alarm) { g.stun = 0.7; g.flash('#d9534f'); Sound.thud(); UI.toast('The alarm! Caught red-handed!', '🚨'); return; }
    for (let i = g.loot.length - 1; i >= 0; i--) {
      const L = g.loot[i];
      if (Math.hypot(L.x - x, L.y - y) <= L.r) {
        g.earn(g.unit * L.worth); g.grabbed++; g.loot.splice(i, 1); Sound.coin(); return;
      }
    }
  },

  update(g, dt) {
    if (g.stun > 0) g.stun -= dt;
    g.alarmT -= dt;
    if (g.alarmT <= 0) {
      g.alarm = !g.alarm;
      g.alarmT = g.alarm ? (0.7 + Math.random() * 0.6) : (1.1 + Math.random() * 1.4 / g.diff);
      if (g.alarm) Sound.zap();
    }
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.6 + Math.random() * 0.7);
      const k = CRIMINAL_LOOT[Math.random() * CRIMINAL_LOOT.length | 0];
      g.loot.push({ emoji: k.emoji, worth: k.worth, x: 90 + Math.random() * (GW - 180), y: 150 + Math.random() * (GH - 290), r: 36, born: 0, life: g.life });
    }
    for (let i = g.loot.length - 1; i >= 0; i--) {
      const L = g.loot[i]; L.born += dt; L.life -= dt;
      if (L.life <= 0) g.loot.splice(i, 1);
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    // vault room
    ctx.fillStyle = g.alarm ? '#3a2630' : '#26303a'; ctx.fillRect(0, 0, GW, GH);
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 2;
    for (let x = 0; x < GW; x += 54) { ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, GH); ctx.stroke(); }
    for (let y = 90; y < GH; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GW, y); ctx.stroke(); }
    Draw.bigText(ctx, '🕶️ THE HEIST', GW / 2, 40, 28, '#e8b830');

    // the alarm eye
    const ex = GW / 2, ey = 96;
    ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(ex, ey, 58, 30, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = g.alarm ? '#d9534f' : '#3fa555';
    ctx.beginPath(); ctx.arc(ex, ey, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (g.alarm && Math.sin(t * 20) > 0) { ctx.fillStyle = 'rgba(217,83,79,.25)'; ctx.fillRect(0, 0, GW, GH); }
    Draw.bigText(ctx, g.alarm ? 'RED — FREEZE!' : 'GREEN — GRAB!', GW / 2, 150, 26, g.alarm ? '#d9534f' : '#3fa555');

    // loot (pulsing)
    g.loot.forEach(L => {
      const pop = Math.min(1, L.born * 6);
      const warn = L.life < 0.4;
      Draw.emoji(ctx, L.emoji, L.x, L.y, L.r * 2 * pop * (warn && Math.sin(t * 20) > 0 ? 0.85 : 1));
    });

    // robber cursor hint
    if (g.stun > 0) { ctx.fillStyle = 'rgba(217,83,79,.2)'; ctx.fillRect(0, 0, GW, GH); }

    Draw.bigText(ctx, `Loot grabbed: ${g.grabbed}`, GW / 2, GH - 20, 22, '#e8b830');
  },
});
