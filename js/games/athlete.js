/* ============================================================
   ATHLETE 🏀⚾🏒🏈 — SCORE POINTS (big money, short career).
   Pick your sport, then tap the open plays before the clock runs
   out — hit the dead-centre sweet spot for DOUBLE. Dodge the
   Blown knee!: the pay is enormous, but nobody plays forever.
   ============================================================ */

const ATHLETE_SPORTS = [
  { id: 'basketball', name: 'Basketball', emoji: '🏀', title: 'GAME TIME', score: 'SCORE!', bonus: 'SWISH! ×2',     unit: 'Points', field: '#d69a54', line: 'rgba(255,255,255,.55)', accent: '#7a3d0c' },
  { id: 'baseball',   name: 'Baseball',   emoji: '⚾', title: 'PLAY BALL', score: 'HIT!',   bonus: 'HOME RUN! ×2',  unit: 'Runs',   field: '#7fb56a', line: 'rgba(255,255,255,.6)',  accent: '#3c6b2c' },
  { id: 'hockey',     name: 'Hockey',     emoji: '🏒', title: 'FACE-OFF',  score: 'GOAL!',  bonus: 'TOP SHELF! ×2', unit: 'Goals',  field: '#dbeef7', line: 'rgba(40,80,110,.5)',   accent: '#1e5f8f' },
  { id: 'football',   name: 'Football',   emoji: '🏈', title: 'KICKOFF',   score: 'CATCH!', bonus: 'TOUCHDOWN! ×2', unit: 'Points', field: '#5a9a4e', line: 'rgba(255,255,255,.6)',  accent: '#2f5a26' },
];
function athleteSport() { return ATHLETE_SPORTS.find(s => s.id === State.data.sport) || ATHLETE_SPORTS[0]; }

// Sport-specific goal drawn at the top-centre of the field.
function athleteEmblem(ctx, sp) {
  const cx = GW / 2;
  ctx.lineWidth = 4;
  if (sp.id === 'basketball') {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.fillRect(cx - 60, 74, 120, 40); ctx.strokeRect(cx - 60, 74, 120, 40);
    ctx.strokeStyle = '#e8760c'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(cx, 122, 22, 0, Math.PI * 2); ctx.stroke();
  } else if (sp.id === 'baseball') {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 26, 88); ctx.lineTo(cx + 26, 88); ctx.lineTo(cx + 26, 106); ctx.lineTo(cx, 122); ctx.lineTo(cx - 26, 106);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (sp.id === 'hockey') {
    ctx.strokeStyle = '#d9534f'; ctx.strokeRect(cx - 50, 84, 100, 40);
    ctx.strokeStyle = 'rgba(43,43,51,.4)'; ctx.lineWidth = 1;
    for (let x = cx - 44; x < cx + 50; x += 10) { ctx.beginPath(); ctx.moveTo(x, 86); ctx.lineTo(x, 122); ctx.stroke(); }
    for (let y = 88; y < 124; y += 10) { ctx.beginPath(); ctx.moveTo(cx - 48, y); ctx.lineTo(cx + 48, y); ctx.stroke(); }
  } else { // football goalposts
    ctx.strokeStyle = '#f4d03f'; ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx - 40, 122); ctx.lineTo(cx - 40, 90); ctx.moveTo(cx + 40, 122); ctx.lineTo(cx + 40, 90);
    ctx.moveTo(cx - 50, 90); ctx.lineTo(cx + 50, 90); ctx.moveTo(cx, 90); ctx.lineTo(cx, 76); ctx.stroke();
  }
}

GAMES.athlete = defineShift({
  hint: 'TAP the plays as they pop up to score before the clock runs out — hit the dead-centre <b>sweet spot</b> for <b>DOUBLE</b>! Dodge the <b>Blown knee!</b>',
  duration: r => 44 + r * 5,

  // CHOOSER — pick which sport to suit up for this shift.
  pregame(root, onReady) {
    const cur = State.data.sport || 'basketball';
    root.innerHTML = `
      <div class="sport-picker">
        <h2 data-spiky>PICK YOUR SPORT</h2>
        <p class="hint">Which game are you playing today?</p>
        <div class="sport-grid">
          ${ATHLETE_SPORTS.map(s => `
            <button class="sport-btn${s.id === cur ? ' current' : ''}" data-sport="${s.id}">
              <span class="sport-emoji">${s.emoji}</span><b>${esc(s.name)}</b>
            </button>`).join('')}
        </div>
      </div>`;
    UI.spikyAll(root);
    root.querySelectorAll('.sport-btn').forEach(b => b.addEventListener('click', () => {
      State.data.sport = b.dataset.sport; State.save();
      onReady();
    }));
  },

  init(g) {
    g.sport = athleteSport();
    g.shots = [];
    g.spawnEvery = 1.2 / g.diff;
    g.spawnT = 0.4;
    g.life = Math.max(1.1, 2.2 - g.rank * 0.25);
    g.unit = Math.max(2, Math.floor(State.salary() / 10));
    g.scored = 0;
    g.pop = null;
  },

  pointer(g, x, y) {
    for (let i = g.shots.length - 1; i >= 0; i--) {
      const s = g.shots[i]; const d = Math.hypot(s.x - x, s.y - y);
      if (d <= s.r) {
        const sweet = d <= s.r * 0.34;
        g.earn(g.unit * (sweet ? 2 : 1));
        g.scored++;
        g.pop = { x: s.x, y: s.y, sweet, t: 0 };
        g.shots.splice(i, 1); Sound.coin(); return;
      }
    }
  },

  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.5) g.pop = null; }
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.7 + Math.random() * 0.6);
      const r = 26 + Math.random() * 14;
      g.shots.push({ x: 90 + Math.random() * (GW - 180), y: 150 + Math.random() * (GH - 250), r, life: g.life, max: g.life, born: 0 });
    }
    for (let i = g.shots.length - 1; i >= 0; i--) {
      const s = g.shots[i]; s.born += dt; s.life -= dt;
      if (s.life <= 0) { g.shots.splice(i, 1); g.flash('#d9534f'); Sound.thud(); }   // turnover!
    }
  },

  draw(g, t) {
    const ctx = g.ctx, sp = g.sport;
    ctx.fillStyle = sp.field; ctx.fillRect(0, 0, GW, GH);
    ctx.strokeStyle = sp.line; ctx.lineWidth = 4;
    ctx.strokeRect(24, 80, GW - 48, GH - 104);
    ctx.beginPath(); ctx.arc(GW / 2, GH - 24, 90, Math.PI, 0); ctx.stroke();
    athleteEmblem(ctx, sp);
    Draw.bigText(ctx, `${sp.emoji} ${sp.title}`, GW / 2, 40, 28, sp.accent);

    g.shots.forEach(s => {
      const pop = Math.min(1, s.born * 6), r = s.r * pop, warn = s.life < s.max * 0.35;
      Draw.emoji(ctx, sp.emoji, s.x, s.y, r * 2);
      ctx.strokeStyle = warn ? '#d9534f' : 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, r + 4, 0, Math.PI * 2); ctx.stroke();
      if (warn) Draw.emoji(ctx, '⏰', s.x, s.y - r - 16, 22);
    });

    if (g.pop) Draw.bigText(ctx, g.pop.sweet ? sp.bonus : sp.score, g.pop.x, g.pop.y - 28, g.pop.sweet ? 24 : 20, g.pop.sweet ? '#2f7d3f' : sp.accent);
    Draw.bigText(ctx, `${sp.unit}: ${g.scored}`, GW / 2, GH - 18, 22, sp.accent);
  },
});
