/* ============================================================
   ATHLETE 🏀⚾🏒🏈 — PLAY YOUR SPORT (big money, short career).
   Pick a sport, then actually PLAY it:
     • Basketball — time the sweeping aim and shoot it in the hoop.
     • Hockey     — snipe the puck past the sliding goalie.
     • Football   — thread the kick between the goalposts.
     • Baseball   — time your swing and crush the pitch.
   Nail the sweet spot for DOUBLE. Dodge the Blown knee! — the pay
   is enormous, but nobody plays forever.
   ============================================================ */

const ATHLETE_SPORTS = [
  { id: 'basketball', name: 'Basketball', emoji: '🏀', mode: 'shoot', title: 'GAME TIME', unit: 'Points', field: '#d69a54', line: 'rgba(255,255,255,.55)', accent: '#7a3d0c', goalHalf: 58, sweep: 2.2, score: 'BUCKET!', bonus: 'SWISH! ×2' },
  { id: 'baseball',   name: 'Baseball',   emoji: '⚾', mode: 'bat',   title: 'PLAY BALL', unit: 'Runs',   field: '#7fb56a', line: 'rgba(255,255,255,.6)',  accent: '#3c6b2c', score: 'BASE HIT!', bonus: 'HOME RUN! ×2' },
  { id: 'hockey',     name: 'Hockey',     emoji: '🏒', mode: 'shoot', title: 'FACE-OFF',  unit: 'Goals',  field: '#dbeef7', line: 'rgba(40,80,110,.5)',   accent: '#1e5f8f', goalHalf: 132, goalieHalf: 48, sweep: 2.5, score: 'GOAL!', bonus: 'TOP SHELF! ×2' },
  { id: 'football',   name: 'Football',   emoji: '🏈', mode: 'shoot', title: 'KICKOFF',   unit: 'Points', field: '#5a9a4e', line: 'rgba(255,255,255,.6)',  accent: '#2f5a26', goalHalf: 58, sweep: 3.0, score: "IT'S GOOD!", bonus: 'SPLIT THE POSTS! ×2' },
];
function athleteSport() { return ATHLETE_SPORTS.find(s => s.id === State.data.sport) || ATHLETE_SPORTS[0]; }

GAMES.athlete = defineShift({
  hint: 'Actually play your sport — <b>shoot</b> at the goal (or <b>swing</b> the bat) at the right moment! Hit the <b>sweet spot</b> for <b>DOUBLE</b>. Dodge the <b>Blown knee!</b>',
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
    g.unit = Math.max(2, Math.floor(State.salary() / 50));   // pay per score — modest; a miss/strike earns nothing
    g.scored = 0;
    g.pop = null;
    if (g.sport.mode === 'bat') ATH_initBat(g); else ATH_initShoot(g);
  },
  pointer(g) { if (g.sport.mode === 'bat') ATH_swing(g); else ATH_shoot(g); },
  update(g, dt) {
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.6) g.pop = null; }
    if (g.sport.mode === 'bat') ATH_updateBat(g, dt); else ATH_updateShoot(g, dt);
  },
  draw(g, t) { if (g.sport.mode === 'bat') ATH_drawBat(g, t); else ATH_drawShoot(g, t); },
});

/* ---------- SHOOT: basketball · hockey · football ---------- */
function ATH_initShoot(g) {
  g.goalC = GW / 2; g.goalY = 130; g.goalHalf = g.sport.goalHalf;
  g.aimT = 0; g.aim = GW / 2; g.span = GW / 2 - 120;
  g.ball = null;
  if (g.sport.id === 'hockey') { g.golT = 0; g.goalie = GW / 2; }
}
function ATH_shoot(g) {
  if (g.ball) return;                                  // one shot at a time
  g.ball = { toX: g.aim, t: 0, dur: 0.32, shotX: g.aim };
  Sound.zap();
}
function ATH_resolveShot(g) {
  const sp = g.sport, x = g.ball.shotX, c = g.goalC, half = g.goalHalf;
  let scored = Math.abs(x - c) <= half, bonus = false;
  if (sp.id === 'hockey' && scored) {
    scored = Math.abs(x - g.goalie) > sp.goalieHalf;   // blocked if over the goalie
    if (scored) {
      const edge = Math.min(Math.abs(x - (g.goalie - sp.goalieHalf)), Math.abs(x - (g.goalie + sp.goalieHalf)));
      bonus = edge < 26;                               // squeaked it just past him
    }
  } else if (scored) {
    bonus = Math.abs(x - c) < 20;                      // dead centre
  }
  if (scored) {
    g.earn(g.unit * (bonus ? 2 : 1)); g.scored++;
    g.pop = { x, y: g.goalY + 46, txt: bonus ? sp.bonus : sp.score, good: true, big: bonus, t: 0 };
    Sound.coin(); if (bonus) g.flash('#2f7d3f');
  } else {
    g.pop = { x, y: g.goalY + 46, txt: sp.id === 'hockey' ? 'SAVED!' : 'MISSED!', good: false, t: 0 };
    g.flash('#d9534f'); Sound.thud();
  }
}
function ATH_updateShoot(g, dt) {
  g.aimT += dt;
  g.aim = g.goalC + Math.sin(g.aimT * g.sport.sweep) * g.span;
  if (g.sport.id === 'hockey') {
    g.golT += dt;
    g.goalie = g.goalC + Math.sin(g.golT * 1.7) * (g.goalHalf - g.sport.goalieHalf);
  }
  if (g.ball) { g.ball.t += dt; if (g.ball.t >= g.ball.dur) { ATH_resolveShot(g); g.ball = null; } }
}
function ATH_drawGoal(ctx, g) {
  const sp = g.sport, c = g.goalC, half = g.goalHalf, y = g.goalY;
  if (sp.id === 'basketball') {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.fillRect(c - 74, y - 52, 148, 42); ctx.strokeRect(c - 74, y - 52, 148, 42);
    ctx.strokeStyle = '#e8760c'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(c, y, half, 12, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(c + i * half / 3.2, y + 4); ctx.lineTo(c + i * half / 5, y + 34); ctx.stroke(); }
  } else if (sp.id === 'hockey') {
    ctx.strokeStyle = '#d9534f'; ctx.lineWidth = 4; ctx.strokeRect(c - half, y - 18, half * 2, 46);
    ctx.strokeStyle = 'rgba(40,80,110,.35)'; ctx.lineWidth = 1;
    for (let x = c - half + 10; x < c + half; x += 13) { ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x, y + 26); ctx.stroke(); }
    ctx.fillStyle = '#3a6ea5'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2;
    ctx.fillRect(g.goalie - sp.goalieHalf, y - 16, sp.goalieHalf * 2, 42); ctx.strokeRect(g.goalie - sp.goalieHalf, y - 16, sp.goalieHalf * 2, 42);
    Draw.emoji(ctx, '🥅', g.goalie, y + 4, 30);
  } else { // football goalposts
    ctx.strokeStyle = '#f4d03f'; ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(c - half, y + 34); ctx.lineTo(c - half, y - 26); ctx.moveTo(c + half, y + 34); ctx.lineTo(c + half, y - 26);
    ctx.moveTo(c - half - 10, y - 26); ctx.lineTo(c + half + 10, y - 26); ctx.moveTo(c, y - 26); ctx.lineTo(c, y - 44);
    ctx.stroke();
  }
}
function ATH_drawShoot(g, t) {
  const ctx = g.ctx, sp = g.sport;
  ctx.fillStyle = sp.field; ctx.fillRect(0, 0, GW, GH);
  ctx.strokeStyle = sp.line; ctx.lineWidth = 4; ctx.strokeRect(24, 80, GW - 48, GH - 104);
  ctx.beginPath(); ctx.arc(GW / 2, GH - 24, 90, Math.PI, 0); ctx.stroke();
  ATH_drawGoal(ctx, g);
  Draw.bigText(ctx, `${sp.emoji} ${sp.title}`, GW / 2, 40, 28, sp.accent);

  // sweeping aim arrow
  ctx.fillStyle = sp.accent;
  ctx.beginPath(); ctx.moveTo(g.aim, g.goalY + 40); ctx.lineTo(g.aim - 11, g.goalY + 60); ctx.lineTo(g.aim + 11, g.goalY + 60); ctx.closePath(); ctx.fill();
  ctx.setLineDash([6, 7]); ctx.strokeStyle = 'rgba(43,43,51,.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(GW / 2, GH - 62); ctx.lineTo(g.aim, g.goalY + 40); ctx.stroke(); ctx.setLineDash([]);

  if (g.ball) {
    const f = g.ball.t / g.ball.dur;
    const bx = GW / 2 + (g.ball.toX - GW / 2) * f;
    const by = (GH - 62) + (g.goalY - (GH - 62)) * f - Math.sin(f * Math.PI) * 80;
    Draw.emoji(ctx, sp.emoji, bx, by, 34);
  } else {
    Draw.emoji(ctx, sp.emoji, GW / 2, GH - 58, 40);
  }
  if (g.pop) Draw.bigText(ctx, g.pop.txt, g.pop.x, g.pop.y, g.pop.big ? 24 : 20, g.pop.good ? (g.pop.big ? '#2f7d3f' : sp.accent) : '#d9534f');
  Draw.bigText(ctx, `${sp.unit}: ${g.scored}`, GW / 2, GH - 16, 22, sp.accent);
}

/* ---------- BAT: baseball ---------- */
function ATH_initBat(g) {
  g.pitch = null; g.spawnT = 0.6;
  g.plateY = GH - 128; g.plateH = 46;
  g.swingT = 0; g.hitBall = null;
}
function ATH_newPitch(g) {
  g.pitch = { x: GW / 2 + (Math.random() * 90 - 45), y: 150, speed: 300 + g.rank * 45 + Math.random() * 70 };
}
function ATH_swing(g) {
  g.swingT = 0.18;
  if (!g.pitch) return;
  const dy = Math.abs(g.pitch.y - g.plateY);
  if (dy <= g.plateH / 2) {
    const homer = dy <= 12;
    g.earn(g.unit * (homer ? 2 : 1)); g.scored++;
    g.hitBall = { x: g.pitch.x, y: g.pitch.y, vx: (Math.random() * 2 - 1) * 220, vy: -380 };
    g.pop = { x: GW / 2, y: g.plateY - 46, txt: homer ? g.sport.bonus : g.sport.score, good: true, big: homer, t: 0 };
    Sound.coin(); if (homer) g.flash('#2f7d3f');
    g.pitch = null; g.spawnT = 0.45 + Math.random() * 0.4;
  } else {
    g.pop = { x: GW / 2, y: g.plateY - 46, txt: 'WHIFF!', good: false, t: 0 };
    Sound.thud();
    g.pitch = null; g.spawnT = 0.4 + Math.random() * 0.4;
  }
}
function ATH_updateBat(g, dt) {
  if (g.swingT > 0) g.swingT -= dt;
  if (g.hitBall) {
    g.hitBall.vy += 520 * dt; g.hitBall.x += g.hitBall.vx * dt; g.hitBall.y += g.hitBall.vy * dt;
    if (g.hitBall.y > GH + 60 || g.hitBall.y < -80) g.hitBall = null;
  }
  if (!g.pitch) { g.spawnT -= dt; if (g.spawnT <= 0) ATH_newPitch(g); return; }
  g.pitch.y += g.pitch.speed * dt;
  if (g.pitch.y > GH - 60) {                            // blew past — strike
    g.pop = { x: GW / 2, y: g.plateY - 46, txt: 'STRIKE!', good: false, t: 0 };
    g.flash('#d9534f'); Sound.thud();
    g.pitch = null; g.spawnT = 0.4 + Math.random() * 0.4;
  }
}
function ATH_drawBat(g, t) {
  const ctx = g.ctx, sp = g.sport;
  ctx.fillStyle = sp.field; ctx.fillRect(0, 0, GW, GH);
  ctx.strokeStyle = sp.line; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(GW / 2, GH - 74); ctx.lineTo(GW / 2 + 120, GH - 190); ctx.lineTo(GW / 2, GH - 300); ctx.lineTo(GW / 2 - 120, GH - 190); ctx.closePath(); ctx.stroke();
  Draw.bigText(ctx, `${sp.emoji} ${sp.title}`, GW / 2, 40, 28, sp.accent);
  Draw.emoji(ctx, '🧢', GW / 2, 150, 34);               // the pitcher up top

  // swing zone
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(GW / 2 - 96, g.plateY - g.plateH / 2, 192, g.plateH);
  ctx.strokeStyle = sp.line; ctx.lineWidth = 2; ctx.strokeRect(GW / 2 - 96, g.plateY - g.plateH / 2, 192, g.plateH);
  Draw.bigText(ctx, 'SWING!', GW / 2, g.plateY, 15, sp.accent);

  // batter + swinging bat
  const bx = GW / 2 - 96, by = GH - 92;
  Draw.emoji(ctx, '🧑', bx, by, 44);
  ctx.save(); ctx.translate(bx + 16, by - 8);
  const ang = g.swingT > 0 ? (-1.2 + (0.18 - g.swingT) / 0.18 * 2.0) : -1.2;
  ctx.rotate(ang); ctx.strokeStyle = '#a9743f'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(50, 0); ctx.stroke(); ctx.restore();

  if (g.pitch) Draw.emoji(ctx, '⚾', g.pitch.x, g.pitch.y, 30);
  if (g.hitBall) Draw.emoji(ctx, '⚾', g.hitBall.x, g.hitBall.y, 30);
  if (g.pop) Draw.bigText(ctx, g.pop.txt, g.pop.x, g.pop.y, g.pop.big ? 24 : 20, g.pop.good ? (g.pop.big ? '#2f7d3f' : sp.accent) : '#d9534f');
  Draw.bigText(ctx, `${sp.unit}: ${g.scored}`, GW / 2, GH - 14, 22, sp.accent);
}
