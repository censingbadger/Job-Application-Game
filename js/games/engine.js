/* ============================================================
   MINI-GAME ENGINE — the shared harness every job game uses.

   It handles the boring-but-important parts so each game only
   has to describe its own fun:
     - the HUD (job, power, fatality, money earned today)
     - the shift timer
     - DANGER events (the job's fatality rate becomes a dodge —
       miss it and you're knocked out, just like Asher designed)
     - the PAYDAY / KNOCKED-OUT summary at the end of the day
     - difficulty that grows as you climb the ranks

   A single job game is written with defineShift({ ...hooks }).
   Games register themselves into GAMES by job id, e.g.
     GAMES.chef = defineShift({ ... }).
   ============================================================ */

// Tiny sound effects (no files needed — we sing the notes ourselves)
const Sound = {
  ctx: null,
  play(notes) {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      let t = this.ctx.currentTime;
      notes.forEach(([freq, dur]) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + dur);
        t += dur * 0.9;
      });
    } catch (e) { /* sound is a bonus, never a problem */ }
  },
  catchFish() { this.play([[520, 0.09], [660, 0.09], [880, 0.16]]); },
  jackpot()   { this.play([[520, 0.1], [660, 0.1], [880, 0.1], [1100, 0.22], [1320, 0.3]]); },
  danger()    { this.play([[220, 0.12], [180, 0.16]]); },
  splash()    { this.play([[300, 0.08], [200, 0.12]]); },
  ding()      { this.play([[780, 0.12]]); },
  coin()      { this.play([[660, 0.06], [880, 0.10]]); },
  zap()       { this.play([[900, 0.05], [1200, 0.06]]); },
  thud()      { this.play([[150, 0.12]]); },
};

// job id -> game engine. Each game file adds itself here.
const GAMES = {};

// The whole canvas is drawn at this size, then scaled to fit.
const GW = 900, GH = 540;

// ------------------------------------------------------------
// defineShift(spec) — build one job's playable day.
// spec hooks (all optional except init/update/draw for a real game):
//   hint            HTML string shown in the "HOW TO PLAY" card
//   duration(rank)  seconds the day lasts (default from CONFIG)
//   init(g)         set up game state (g is the engine instance)
//   update(g, dt)   advance the game a frame (dt = seconds)
//   draw(g, t)      draw the scene (t = seconds, always increasing)
//   pointer(g,x,y)  a tap/click at canvas coords x,y
//   move(g,x,y)     the pointer moved to canvas coords x,y (for sliding)
//   key(g, e)       a key was pressed
// Handy things on g: g.ctx, g.rank (0..3), g.diff (grows with rank),
//   g.earn(n) to bank money with a little pop, g.flash(color).
// ------------------------------------------------------------
function defineShift(spec) {
  return {
    spec,
    running: false,

    // opts.trial = { seconds, goal, onResult } runs a short SKILL TRIAL
    // (for a job application): no danger, no real pay — just hit the goal.
    start(root, opts = {}) {
      this.root = root;
      this.running = true;
      this.trial = opts.trial || null;
      this.job = State.job();
      this.rank = State.data.path.rank;
      this.diff = 1 + this.rank * 0.4;                 // 1.0, 1.4, 1.8, 2.2 — harder as you rank up
      this.duration = this.trial ? this.trial.seconds : (spec.duration ? spec.duration(this.rank) : CONFIG.workShiftSeconds);
      this.timeLeft = this.duration;
      this.earned = 0;
      this.flashT = 0;
      this.flashColor = null;
      this.dangerActive = null;
      this.maxHp = CONFIG.workHP;
      this.hp = this.maxHp;                             // full health each new day

      // No danger during a trial (it's an audition). Otherwise: more
      // fatality = more danger moments (each missed dodge costs a heart).
      if (this.trial) {
        this.dangersLeft = 0;
      } else {
        const expected = this.job.fatality / 20;
        this.dangersLeft = Math.floor(expected) + (Math.random() < (expected % 1) ? 1 : 0);
      }
      this.nextDangerAt = 0.18 + Math.random() * 0.4;  // as a fraction of the day (0..1)

      this._renderShell();
      this.canvas = root.querySelector('#g-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.frame = root.querySelector('#g-frame');

      // input — translate screen taps into canvas coordinates
      const toCanvas = e => {
        const r = this.canvas.getBoundingClientRect();
        return [(e.clientX - r.left) * (GW / r.width), (e.clientY - r.top) * (GH / r.height)];
      };
      this._down = e => {
        if (!this.running || this.dangerActive) return;
        e.preventDefault();
        const [x, y] = toCanvas(e);
        if (spec.pointer) spec.pointer(this, x, y);
      };
      this._move = e => {
        if (!this.running || this.dangerActive || !spec.move) return;
        const [x, y] = toCanvas(e);
        spec.move(this, x, y);
      };
      this._key = e => {
        if (!this.running || this.dangerActive || !spec.key) return;
        spec.key(this, e);
      };
      this.canvas.addEventListener('pointerdown', this._down);
      this.canvas.addEventListener('pointermove', this._move);
      window.addEventListener('keydown', this._key);

      if (spec.init) spec.init(this);
      if (!this.trial) { this._renderGear(); this._renderHP(); }
      this.lastTime = performance.now();
      requestAnimationFrame(t => this._loop(t));
    },

    stop() {
      this.running = false;
      window.removeEventListener('keydown', this._key);
    },

    // Earn money mid-game (a trial doesn't bank real money — it only
    // counts toward the goal), with a floating "+$" and a running total.
    earn(n) {
      // Better equipment earns more (but not during a no-pay skill trial).
      n = Math.floor(n * (this.trial ? 1 : State.gearMult(State.data.path.jobId)));
      if (n <= 0) return;
      this.earned += n;
      if (!this.trial) { State.addWealth(n); State.addCareerEarnings(n); this._maybeRefreshGear(); }
      UI.moneyPop(n);
      const t = this.root.querySelector('#g-earned');
      if (t) t.textContent = this.trial ? `${fmtMoney(this.earned)} / ${fmtMoney(this.trial.goal)}` : fmtMoney(this.earned);
      if (this.trial) {
        const fill = this.root.querySelector('#g-goal-fill');
        if (fill) fill.style.width = Math.min(100, this.earned / this.trial.goal * 100) + '%';
      }
    },

    // ---- gear: better equipment earns you more ----------------
    _renderGear() {
      const box = this.root && this.root.querySelector('#g-gear');
      if (!box) return;
      const jobId = State.data.path.jobId;
      const cur = State.gear(jobId);
      if (!cur) { box.hidden = true; return; }
      const next = State.nextGear(jobId);
      const can = next ? State.data.wealth >= next.cost : false;
      this._gearAffordable = can;
      const mult = String(cur.mult).replace(/\.0$/, '');
      box.innerHTML = `
        <h3>YOUR GEAR</h3>
        <div class="gear-now"><span class="gear-emoji">${cur.emoji}</span> <b>${esc(cur.name)}</b></div>
        <div class="hud-line">Earnings <b>×${mult}</b></div>
        ${next
          ? `<button class="btn btn-money gear-buy" ${can ? '' : 'disabled'}>Upgrade → ${next.emoji} ${esc(next.name)} · ${fmtMoney(next.cost)}</button>
             ${can ? '' : '<p class="hint rod-hint">Earn more to afford it!</p>'}`
          : '<div class="rod-max">✦ Best gear there is! ✦</div>'}`;
      const btn = box.querySelector('.gear-buy');
      if (btn) btn.addEventListener('click', () => {
        if (!State.buyGear(jobId)) return;
        Sound.jackpot(); UI.confetti(14);
        UI.moneyPop(-next.cost); UI.refreshWealth();
        UI.toast(`Upgraded to the ${next.name}!`, next.emoji);
        this._renderGear();
      });
    },

    // Re-render only when you cross the "can afford the next tier" line,
    // so the button doesn't get rebuilt (and un-clickable) every earn.
    _maybeRefreshGear() {
      const next = State.nextGear(State.data.path.jobId);
      const can = next ? State.data.wealth >= next.cost : false;
      if (can !== this._gearAffordable) this._renderGear();
    },

    flash(color) { this.flashColor = color; this.flashT = 0.25; },

    _renderShell() {
      const job = this.job;
      const trial = this.trial;
      const topCard = trial
        ? `<h3>🧪 SKILL TRIAL</h3>
           <div class="hud-job">${esc(job.name)}</div>
           <div class="hud-line">Power: <b>${State.power()}%</b></div>
           <div class="hud-line">GOAL: earn <b>${fmtMoney(trial.goal)}</b></div>
           <div class="hud-line">So far: <b id="g-earned">$0</b></div>
           <div class="shift-bar small"><div class="shift-fill" id="g-goal-fill" style="width:0%"></div></div>`
        : `<h3>CURRENT JOB</h3>
           <div class="hud-job">${esc(State.rankName())}</div>
           <div class="hud-line">Power: <b>${State.power()}%</b></div>
           <div class="hud-line">Fatality rate: <b class="${job.fatality >= 40 ? 'danger-text' : ''}">${job.fatality}%</b></div>
           <div class="hud-line hp-line">Health: <span class="hearts" id="g-hp"></span></div>
           <div class="hud-line">Earned today: <b id="g-earned">$0</b></div>`;
      this.root.innerHTML = `
        <div class="work-layout">
          <aside class="fishing-side">
            <div class="card hud-card">${topCard}</div>
            ${trial ? '' : '<div class="card hud-card gear-card" id="g-gear"></div>'}
            <div class="card hud-card">
              <h3>HOW TO PLAY</h3>
              <p class="hud-line">${spec.hint || 'Do your job before the day ends!'}</p>
            </div>
          </aside>
          <div class="fishing-main">
            <div class="shift-bar"><div class="shift-fill" id="g-timer"></div><span id="g-clock"></span></div>
            <div class="canvas-frame card" id="g-frame">
              <canvas id="g-canvas" width="${GW}" height="${GH}"></canvas>
            </div>
            <p class="hint">${trial ? 'Hit the goal before time runs out to <b>pass the trial</b>!' : `Watch out for: <b>${esc(job.danger)}</b> — tap fast to dodge it!`}</p>
          </div>
        </div>`;
    },

    _loop(now) {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;

      if (!this.dangerActive) {
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) { this.timeLeft = 0; this._endDay(); return; }
        const progress = 1 - this.timeLeft / this.duration;
        if (this.dangersLeft > 0 && progress >= this.nextDangerAt && progress < 0.95) this._startDanger();
        if (spec.update) spec.update(this, dt);
      } else {
        this.dangerActive.timeLeft -= dt;
        const fill = this.frame.querySelector('.danger-timer-fill');
        if (fill) fill.style.width = Math.max(0, this.dangerActive.timeLeft / this.dangerActive.total * 100) + '%';
        if (this.dangerActive.timeLeft <= 0) { if (this._hurt()) return; }   // lost a heart (or died)
      }

      if (this.flashT > 0) this.flashT -= dt;
      if (spec.draw) spec.draw(this, now / 1000);
      if (this.flashT > 0 && this.flashColor) {
        this.ctx.save();
        this.ctx.globalAlpha = Math.min(0.5, this.flashT * 2);
        this.ctx.fillStyle = this.flashColor;
        this.ctx.fillRect(0, 0, GW, GH);
        this.ctx.restore();
      }

      const timer = this.root.querySelector('#g-timer');
      if (timer) timer.style.width = (this.timeLeft / this.duration * 100) + '%';
      const clock = this.root.querySelector('#g-clock');
      if (clock) clock.textContent = (this.trial ? 'TRIAL' : `Day ${State.data.day}`) + ` · ${Math.ceil(this.timeLeft)}s`;

      requestAnimationFrame(t => this._loop(t));
    },

    // ---- DANGER: the fatality rate, live ----------------------
    _startDanger() {
      this.dangersLeft -= 1;
      const done = 1 - this.timeLeft / this.duration;
      this.nextDangerAt = Math.min(0.95, done + 0.25 + Math.random() * 0.3);
      const total = Math.max(0.6, 1.5 - this.rank * 0.22);   // shorter window at higher ranks
      this.dangerActive = { timeLeft: total, total };
      Sound.danger();
      const overlay = el('div', 'danger-overlay');
      overlay.innerHTML = `
        <div class="danger-word">⚠️ ${esc(this.job.danger)}</div>
        <button class="btn btn-danger danger-tap">TAP TO DODGE!</button>
        <div class="danger-timer"><div class="danger-timer-fill"></div></div>`;
      this.frame.appendChild(overlay);
      const dodge = () => { this.dangerActive = null; overlay.remove(); Sound.ding(); UI.toast('Phew! Dodged it.', '😅'); };
      overlay.querySelector('.danger-tap').addEventListener('pointerdown', e => { e.preventDefault(); dodge(); });
    },

    // Paint the health hearts (❤️ left, 🖤 lost).
    _renderHP() {
      const box = this.root && this.root.querySelector('#g-hp');
      if (!box) return;
      let s = '';
      for (let i = 0; i < this.maxHp; i++) s += i < this.hp ? '❤️' : '🖤';
      box.textContent = s;
    },

    // A missed dodge costs one heart. Returns true only if it was fatal
    // (then _die has taken over and the loop must stop).
    _hurt() {
      const overlay = this.frame.querySelector('.danger-overlay');
      if (overlay) overlay.remove();
      this.dangerActive = null;
      this.hp -= 1;
      this._renderHP();
      this.flash('#d9534f');
      Sound.thud();
      if (this.hp <= 0) { this._die(); return true; }
      UI.toast(`Ouch! ${esc(this.job.danger)} You lost a heart!`, '💔');
      return false;
    },

    // Out of hearts — you die, lose EVERYTHING, and wash up as a fisherman.
    _die() {
      this.running = false;
      Sound.thud();
      const lost = State.data.wealth;
      const oldJob = State.rankName();
      const danger = this.job.danger;
      State.data.wealth = 0;                     // no money — start from scratch
      State.data.stats.knockouts += 1;
      State.switchJob('fisherman');
      State.save();
      State.nextDay();
      UI.refreshWealth();

      const content = el('div', 'day-summary');
      content.innerHTML = `
        <h2 data-spiky>💀 YOU DIED!</h2>
        <p><b>${esc(danger)}</b> got you — you ran out of hearts.</p>
        <ul class="collection">
          <li>💸 Lost all your money <b>−${fmtMoney(lost)}</b></li>
          <li>😢 Lost your job as <b>${esc(oldJob)}</b></li>
        </ul>
        <p>You wake up broke, back on the fishing boat. Grind it back!</p>
        <div class="summary-actions">
          <a class="btn btn-go" href="levels.html" data-nav="levels">🎣 Go fishing</a>
          <a class="btn" href="applications.html" data-nav="applications">📋 Find a new job</a>
        </div>`;
      const modal = UI.openModal(content, { locked: true });
      UI.spikyAll(content);
      content.querySelectorAll('a[data-nav]').forEach(a => a.addEventListener('click', () => modal.close()));
    },

    _endDay() {
      this.running = false;
      // A trial ends by reporting pass/fail to the application — no
      // payday, no new day, no real money changed hands.
      if (this.trial) {
        const t = this.trial; this.trial = null;
        t.onResult(this.earned >= t.goal, this.earned);
        return;
      }
      const total = this.earned;
      const promo = State.data.pendingPromotion;
      State.data.pendingPromotion = null;
      State.nextDay();
      if (total > 0) Sound.catchFish();

      const content = el('div', 'day-summary');
      content.innerHTML = `
        <h2 data-spiky>${total > 0 ? 'PAYDAY!' : 'DAY OVER'}</h2>
        ${promo ? `<div class="promo-banner">🎉 PROMOTED! You are now <b>${esc(promo)}</b>!</div>` : ''}
        <div class="summary-salary">Earned today: <b>${fmtMoney(total)}</b></div>
        ${total > 0 ? '' : '<p>Rough day — nothing earned. Try again!</p>'}
        <div class="summary-actions">
          <button class="btn btn-go" id="g-again">▶ Work again</button>
          <a class="btn" href="applications.html" data-nav="applications">📋 Applications</a>
          <a class="btn" href="index.html" data-nav="home">🏠 Home</a>
        </div>`;
      const modal = UI.openModal(content, { locked: true });
      UI.spikyAll(content);
      if (promo) { UI.confetti(30); Sound.jackpot(); }
      content.querySelector('#g-again').addEventListener('click', () => { modal.close(); this.start(this.root); });
      content.querySelectorAll('a[data-nav]').forEach(a => a.addEventListener('click', () => modal.close()));
    },
  };
}

// ------------------------------------------------------------
// Shared drawing helpers so every game keeps the pencil look.
// ------------------------------------------------------------
const Draw = {
  // A wobbly hand-drawn rectangle.
  panel(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = '#2b2b33';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();
  },
  emoji(ctx, ch, x, y, size) {
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, x, y);
  },
  bigText(ctx, text, x, y, size, color) {
    ctx.font = `bold ${size}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#fff';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  },
};
