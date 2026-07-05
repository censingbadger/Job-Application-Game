/* ============================================================
   FISHING — the Lowly Fisherman's day at sea.
   Cast → wait for the "!" → REEL! Watch out for the shark.
   Salary: depends on fish caught.
   ============================================================ */

// (The Sound kit now lives in engine.js so every game shares it.)

const Fishing = {
  running: false,

  start(root) {
    this.root = root;
    this.running = true;
    this.collection = [];        // today's catches
    this.timeLeft = CONFIG.fishingShiftSeconds;
    this.phase = 'idle';         // idle → casting → waiting → bite → (catch/escape) → idle
    this.phaseT = 0;
    this.bobber = { x: 0, y: 0 };
    this.shark = null;
    this.jump = null;            // the caught-fish jump animation
    this.lastTime = performance.now();

    root.innerHTML = `
      <div class="fishing-layout">
        <aside class="fishing-side">
          <div class="card hud-card">
            <h3>CURRENT JOB</h3>
            <div class="hud-job">${State.rankName()}</div>
            <div class="hud-line">Salary: <b>depends on fish caught</b></div>
            <div class="hud-line">Power: <b>${State.power()}%</b></div>
            <div class="hud-line">Luck: <b>+${State.luck()}%</b></div>
          </div>
          <div class="card hud-card rod-card">
            <h3>YOUR ROD</h3>
            <div class="rod-now" id="lv-rod"></div>
            <div id="lv-rod-up"></div>
          </div>
          <div class="card hud-card">
            <h3>COLLECTION</h3>
            <ul class="collection" id="lv-collection"><li class="empty">Nothing yet... cast away!</li></ul>
            <div class="collection-total">Today: <b id="lv-total">$0</b></div>
          </div>
        </aside>
        <div class="fishing-main">
          <div class="shift-bar"><div class="shift-fill" id="lv-timer"></div><span id="lv-clock"></span></div>
          <div class="canvas-frame card">
            <canvas id="lv-canvas" width="900" height="540"></canvas>
            <div class="catch-banner" id="lv-banner" hidden></div>
          </div>
          <button class="btn btn-go action-btn" id="lv-action">CAST!</button>
          <p class="hint">Tap the water (or press space). Wait for the <b>!</b> ... then reel FAST before the shark gets it!</p>
        </div>
      </div>`;

    this.canvas = root.querySelector('#lv-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.banner = root.querySelector('#lv-banner');
    this.actionBtn = root.querySelector('#lv-action');

    this.onAction = this.onAction.bind(this);
    this.onKey = e => { if (e.code === 'Space') { e.preventDefault(); this.onAction(); } };
    this.canvas.addEventListener('pointerdown', this.onAction);
    this.actionBtn.addEventListener('click', this.onAction);
    window.addEventListener('keydown', this.onKey);

    this.renderRod();
    requestAnimationFrame(t => this.loop(t));
  },

  stop() {
    this.running = false;
    window.removeEventListener('keydown', this.onKey);
  },

  // ---- player input ------------------------------------------
  onAction() {
    if (!this.running || this.timeLeft <= 0) return;
    if (this.phase === 'idle') {
      this.phase = 'casting';
      this.phaseT = 0;
      this.castFrom = { x: 480, y: 275 };
      this.castTo = { x: 120 + Math.random() * 300, y: 380 + Math.random() * 120 };
      Sound.splash();
    } else if (this.phase === 'waiting') {
      this.phase = 'idle';
      this.setAction('CAST!');
      UI.toast('Too soon! The fish swam off.', '💨');
    } else if (this.phase === 'bite') {
      this.resolveCatch();
    }
  },

  setAction(label, cls) {
    this.actionBtn.textContent = label;
    this.actionBtn.className = 'btn action-btn ' + (cls || 'btn-go');
  },

  // ---- fish luck math -----------------------------------------
  // Pick a rarity tier (luck helps the rarer ones), then a fish in it.
  pickFish() {
    const boost = 1 + State.luck() / 100;
    const entries = Object.entries(FISH_RARITY).map(([id, r]) =>
      [id, id === 'common' ? r.weight : r.weight * boost]);
    const tier = weightedPick(entries);
    const pool = FISH.filter(f => f.rarity === tier);
    return pool[Math.floor(Math.random() * pool.length)] || FISH[0];
  },

  resolveCatch() {
    const fish = this.pickFish();
    // The bigger the fish, the harder it pulls. If it's worth more than
    // your rod can handle, the line might SNAP and the fish gets away.
    const rod = State.rod();
    const breakChance = fish.value <= rod.strength ? 0 : Math.min(0.85, 1 - rod.strength / fish.value);
    if (breakChance > 0 && Math.random() < breakChance) { this.lineBreak(fish); return; }

    const value = Math.floor(fish.value * (1 + State.power() / 100));
    this.collection.push({ fish, value });
    State.addWealth(value);
    State.addCareerEarnings(value);
    State.data.stats.fishCaught += 1;
    if (value > State.data.stats.biggestCatch) State.data.stats.biggestCatch = value;
    State.save();

    this.phase = 'catch';
    this.phaseT = 0;
    this.shark = null;
    this.jump = { x: this.bobber.x, y: this.bobber.y, fish };
    this.setAction('nice!', 'btn-wait');

    const rar = FISH_RARITY[fish.rarity] || FISH_RARITY.common;
    const bigTiers = ['epic', 'legendary', 'divine', 'transcendent'];
    const big = bigTiers.includes(fish.rarity);
    this.banner.hidden = false;
    this.banner.className = 'catch-banner' + (bigTiers.includes(fish.rarity) || fish.rarity === 'epic' ? ' ' + fish.rarity : '');
    this.banner.innerHTML = `
      <div class="catch-word" data-spiky>CATCH!</div>
      <div class="catch-fish">${big ? '🌟 ' : ''}${esc(fish.name)}${big ? ' 🌟' : ''}</div>
      ${fish.rarity !== 'common' ? `<div class="fish-rarity" style="--chip:${rar.color}">${rar.label}</div>` : ''}
      <div class="catch-value">Value: ${fmtMoney(value)}</div>`;
    UI.spikyAll(this.banner);

    const parties = { epic: 24, legendary: 55, divine: 80, transcendent: 130 };
    if (parties[fish.rarity]) { Sound.jackpot(); UI.confetti(parties[fish.rarity]); }
    else Sound.catchFish();
    if (fish.rarity === 'transcendent') UI.toast(`THE ${fish.name.toUpperCase()}!! The rarest catch of all!`, '🖤💎');
    else if (fish.rarity === 'divine') UI.toast(`A DIVINE catch — the ${fish.name}!`, '✨');
    UI.moneyPop(value);
    this.renderCollection();
    this.renderRod();            // you may now afford the next rod
    const showMs = fish.rarity === 'transcendent' ? 2900 : (big ? 2100 : 1700);
    setTimeout(() => { if (this.running) this.banner.hidden = true; }, showMs);
  },

  // The line snapped — a fish too big for your rod got away.
  lineBreak(fish) {
    this.phase = 'escaped';   // recover back to idle like a miss
    this.phaseT = 0;
    this.shark = null;
    this.jump = null;
    Sound.danger();
    this.setAction('SNAP!', 'btn-danger');
    this.banner.hidden = false;
    this.banner.className = 'catch-banner stolen';
    this.banner.innerHTML = `
      <div class="catch-word">💥 SNAP!</div>
      <div class="catch-fish">A ${esc(fish.name)} broke your line!</div>
      <div class="catch-value">Upgrade your rod to land bigger fish.</div>`;
    UI.toast('Your line snapped! You need a stronger rod.', '💥');
    setTimeout(() => { if (this.running) this.banner.hidden = true; }, 1600);
  },

  // The ROD card: what you're using + the next upgrade to buy.
  renderRod() {
    const rod = State.rod();
    const now = this.root.querySelector('#lv-rod');
    if (now) now.innerHTML = `
      <div class="rod-name"><span class="rod-emoji">${rod.emoji}</span> <b>${esc(rod.name)}</b></div>
      <div class="hud-line">Safely lands fish up to <b>${rod.strength === Infinity ? 'ANY size' : fmtMoney(rod.strength)}</b></div>`;
    const up = this.root.querySelector('#lv-rod-up');
    if (!up) return;
    const next = State.nextRod();
    if (!next) { up.innerHTML = '<div class="rod-max">✦ Best rod there is! ✦</div>'; return; }
    const canAfford = State.data.wealth >= next.cost;
    up.innerHTML = `<button class="btn btn-money rod-buy" ${canAfford ? '' : 'disabled'}>Upgrade → ${next.emoji} ${esc(next.name)} · ${fmtMoney(next.cost)}</button>
      ${canAfford ? '' : '<p class="hint rod-hint">Catch more fish to afford it!</p>'}`;
    const btn = up.querySelector('.rod-buy');
    if (btn) btn.addEventListener('click', () => {
      if (!State.buyRod()) return;
      Sound.jackpot(); UI.confetti(16);
      UI.moneyPop(-next.cost); UI.refreshWealth();
      UI.toast(`Upgraded to the ${next.name}!`, next.emoji);
      this.renderRod();
    });
  },

  renderCollection() {
    const list = this.root.querySelector('#lv-collection');
    list.innerHTML = this.collection.map(c =>
      `<li>${c.fish.emoji} ${esc(c.fish.name)} <b>${fmtMoney(c.value)}</b></li>`).join('');
    const total = this.collection.reduce((s, c) => s + c.value, 0);
    this.root.querySelector('#lv-total').textContent = fmtMoney(total);
  },

  // ---- the game loop ------------------------------------------
  loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.phaseT += dt;

    if (this.timeLeft > 0) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) { this.timeLeft = 0; this.endDay(); }
    }

    this.update(dt);
    this.draw(now / 1000);

    const pct = (this.timeLeft / CONFIG.fishingShiftSeconds) * 100;
    const timer = this.root.querySelector('#lv-timer');
    if (timer) timer.style.width = pct + '%';
    const clock = this.root.querySelector('#lv-clock');
    if (clock) clock.textContent = `Day ${State.data.day} · ${Math.ceil(this.timeLeft)}s`;

    requestAnimationFrame(t => this.loop(t));
  },

  update(dt) {
    if (this.phase === 'casting') {
      if (this.phaseT >= 0.5) {
        this.bobber = { ...this.castTo };
        this.phase = 'waiting';
        this.phaseT = 0;
        // stronger fishermen get bites sooner
        this.waitFor = (1.2 + Math.random() * 2.8) / (1 + State.power() / 150);
        this.setAction('wait for it...', 'btn-wait');
      }
    } else if (this.phase === 'waiting') {
      if (this.phaseT >= this.waitFor) {
        this.phase = 'bite';
        this.phaseT = 0;
        this.biteWindow = 0.9 + Math.min(0.5, State.luck() / 1000);
        this.setAction('REEL!!!', 'btn-danger');
        Sound.ding();
        // the shark smells a catch...
        if (Math.random() < 0.35) {
          const arrive = (0.7 + Math.random() * 0.5) * (1 + State.power() / 200);
          this.shark = { x: -40, y: Math.min(500, this.bobber.y + 10), speed: (this.bobber.x + 40) / arrive };
          Sound.danger();
        }
      }
    } else if (this.phase === 'bite') {
      if (this.shark) {
        this.shark.x += this.shark.speed * dt;
        if (this.shark.x >= this.bobber.x - 6) {
          this.phase = 'stolen';
          this.phaseT = 0;
          Sound.danger();
          this.banner.hidden = false;
          this.banner.className = 'catch-banner stolen';
          this.banner.innerHTML = `<div class="catch-word">🦈 CHOMP!</div><div class="catch-fish">The shark ate your fish!</div>`;
          setTimeout(() => { if (this.running) this.banner.hidden = true; }, 1400);
        }
      }
      if (this.phase === 'bite' && this.phaseT >= this.biteWindow) {
        this.phase = 'escaped';
        this.phaseT = 0;
        UI.toast('Too slow! It got away...', '🫧');
      }
    } else if (this.phase === 'catch' || this.phase === 'stolen' || this.phase === 'escaped') {
      if (this.jump) this.jump.t = this.phaseT;
      const wait = this.phase === 'catch' ? 1.5 : 0.9;
      if (this.phaseT >= wait) {
        this.phase = 'idle';
        this.jump = null;
        this.shark = null;
        this.setAction('CAST!');
      }
    }
  },

  // ---- drawing the sea, the boat, and the day ------------------
  draw(t) {
    const ctx = this.ctx;
    const W = 900, H = 540, SEA = 330;

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, SEA);
    sky.addColorStop(0, '#cde9f6');
    sky.addColorStop(1, '#eef7fb');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, SEA);

    // sun
    ctx.fillStyle = '#f7d774';
    ctx.beginPath(); ctx.arc(80, 70, 34, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3; ctx.stroke();

    // mountains (like Asher's horizon)
    ctx.fillStyle = '#b9c4c9';
    ctx.beginPath(); ctx.moveTo(0, SEA); ctx.lineTo(140, 210); ctx.lineTo(300, SEA); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(200, SEA); ctx.lineTo(390, 180); ctx.lineTo(600, SEA); ctx.closePath(); ctx.fill(); ctx.stroke();

    // sea
    const sea = ctx.createLinearGradient(0, SEA, 0, H);
    sea.addColorStop(0, '#7fb8dc');
    sea.addColorStop(1, '#4a90c2');
    ctx.fillStyle = sea;
    ctx.fillRect(0, SEA, W, H - SEA);

    // waves
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 2.5;
    for (let row = 0; row < 4; row++) {
      const y = SEA + 40 + row * 48;
      for (let x = ((t * 22 + row * 40) % 90) - 90; x < W; x += 90) {
        ctx.beginPath(); ctx.arc(x, y, 13, Math.PI * 0.15, Math.PI * 0.85, true); ctx.stroke();
      }
    }

    this.drawBoat(ctx, t);

    // fishing line + bobber
    if (this.phase === 'casting') {
      const p = Math.min(1, this.phaseT / 0.5);
      const x = this.castFrom.x + (this.castTo.x - this.castFrom.x) * p;
      const y = this.castFrom.y + (this.castTo.y - this.castFrom.y) * p - Math.sin(p * Math.PI) * 120;
      this.drawLine(ctx, x, y);
      this.drawBobber(ctx, x, y);
    } else if (this.phase === 'waiting' || this.phase === 'bite') {
      const dip = this.phase === 'bite' ? 6 + Math.sin(t * 30) * 3 : Math.sin(t * 3) * 3;
      this.drawLine(ctx, this.bobber.x, this.bobber.y + dip);
      this.drawBobber(ctx, this.bobber.x, this.bobber.y + dip);
      if (this.phase === 'bite') {
        ctx.font = 'bold 54px "Trebuchet MS", sans-serif';
        ctx.fillStyle = '#d9534f';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 6;
        ctx.strokeText('!', this.bobber.x - 8, this.bobber.y - 34);
        ctx.fillText('!', this.bobber.x - 8, this.bobber.y - 34);
      }
    }

    // the caught fish jumps for joy
    if (this.jump) {
      const p = Math.min(1, (this.jump.t || 0) / 0.9);
      const y = this.jump.y - Math.sin(p * Math.PI) * 170;
      // a colored halo for rarer catches
      const rar = FISH_RARITY[this.jump.fish.rarity];
      if (rar && this.jump.fish.rarity !== 'common') {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = rar.color;
        ctx.beginPath(); ctx.arc(this.jump.x, y, this.jump.fish.size * 1.15, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.font = `${this.jump.fish.size * 1.6}px serif`;
      ctx.save();
      ctx.translate(this.jump.x, y);
      ctx.rotate(Math.sin(p * Math.PI * 2) * 0.4);
      ctx.textAlign = 'center';
      ctx.fillText(this.jump.fish.emoji, 0, 0);
      ctx.restore();
      // splash
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (0.15 + 0.175 * i);
        const r1 = 12 + p * 26;
        ctx.beginPath();
        ctx.moveTo(this.jump.x + Math.cos(a) * r1, this.jump.y - Math.sin(a) * r1 * 0.6);
        ctx.lineTo(this.jump.x + Math.cos(a) * (r1 + 10), this.jump.y - Math.sin(a) * (r1 + 10) * 0.6);
        ctx.stroke();
      }
    }

    // the shark!
    if (this.shark) {
      ctx.fillStyle = '#5b6770';
      ctx.beginPath();
      ctx.moveTo(this.shark.x - 26, this.shark.y);
      ctx.quadraticCurveTo(this.shark.x, this.shark.y - 42, this.shark.x + 10, this.shark.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3; ctx.stroke();
      // wake
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.beginPath(); ctx.moveTo(this.shark.x - 30, this.shark.y + 3); ctx.lineTo(this.shark.x - 58, this.shark.y + 3); ctx.stroke();
      // warning
      ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
      ctx.fillStyle = '#d9534f';
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 5;
      ctx.strokeText('⚠', this.shark.x - 12, this.shark.y - 48);
      ctx.fillText('⚠', this.shark.x - 12, this.shark.y - 48);
    }
  },

  drawBoat(ctx, t) {
    const bob = Math.sin(t * 1.4) * 4;
    ctx.save();
    ctx.translate(0, bob);
    // hull
    ctx.fillStyle = '#c98a5b';
    ctx.beginPath();
    ctx.moveTo(545, 360);
    ctx.lineTo(880, 360);
    ctx.quadraticCurveTo(872, 432, 800, 438);
    ctx.lineTo(620, 438);
    ctx.quadraticCurveTo(556, 428, 545, 360);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3.5; ctx.stroke();
    // deck rail (like the plank lines in the drawing)
    ctx.beginPath(); ctx.moveTo(545, 378); ctx.lineTo(880, 378); ctx.stroke();
    for (let x = 570; x < 880; x += 28) { ctx.beginPath(); ctx.moveTo(x, 360); ctx.lineTo(x, 378); ctx.stroke(); }
    // portholes
    ctx.fillStyle = '#eef7fb';
    [640, 712, 784].forEach(x => {
      ctx.beginPath(); ctx.arc(x, 408, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    // cabin
    ctx.fillStyle = '#e8dcc8';
    ctx.fillRect(730, 286, 118, 74);
    ctx.strokeRect(730, 286, 118, 74);
    ctx.fillStyle = '#cde9f6';
    ctx.fillRect(752, 302, 52, 34);
    ctx.strokeRect(752, 302, 52, 34);
    // the fisherman (stick figure with a hat, just like the sketch)
    ctx.strokeStyle = '#2b2b33';
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(600, 302, 11, 0, Math.PI * 2); ctx.stroke();       // head
    ctx.beginPath(); ctx.moveTo(586, 296); ctx.lineTo(614, 296); ctx.stroke();  // hat brim
    ctx.beginPath(); ctx.moveTo(591, 296); ctx.quadraticCurveTo(600, 280, 609, 296); ctx.stroke(); // hat top
    ctx.beginPath(); ctx.moveTo(600, 313); ctx.lineTo(600, 344); ctx.stroke();  // body
    ctx.beginPath(); ctx.moveTo(600, 344); ctx.lineTo(590, 360); ctx.moveTo(600, 344); ctx.lineTo(610, 360); ctx.stroke(); // legs
    ctx.beginPath(); ctx.moveTo(600, 322); ctx.lineTo(576, 312); ctx.stroke();  // arm to rod
    // rod
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(576, 314); ctx.lineTo(480, 275); ctx.stroke();
    ctx.restore();
  },

  drawLine(ctx, x, y) {
    ctx.strokeStyle = '#2b2b33';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(480, 275 + Math.sin(performance.now() / 700) * 4);
    ctx.quadraticCurveTo((480 + x) / 2, Math.min(y, 275) - 30, x, y);
    ctx.stroke();
  },

  drawBobber(ctx, x, y) {
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#d9534f'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 9, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.stroke();
  },

  // ---- end of the day ------------------------------------------
  endDay() {
    this.phase = 'done';
    this.setAction('DAY OVER', 'btn-wait');
    this.actionBtn.disabled = true;
    const total = this.collection.reduce((s, c) => s + c.value, 0);
    const promo = State.data.pendingPromotion;
    State.data.pendingPromotion = null;
    State.nextDay();

    const rows = this.collection.length
      ? this.collection.map(c => `<li>${c.fish.emoji} ${esc(c.fish.name)} <b>${fmtMoney(c.value)}</b></li>`).join('')
      : '<li class="empty">No fish today. The sea is a mystery.</li>';

    const content = el('div', 'day-summary');
    content.innerHTML = `
      <h2 data-spiky>DAY ${State.data.day - 1} DONE!</h2>
      ${promo ? `<div class="promo-banner">🎉 PROMOTED! You are now <b>${esc(promo)}</b>!</div>` : ''}
      <ul class="collection">${rows}</ul>
      <div class="summary-salary">Salary today: <b>${fmtMoney(total)}</b></div>
      <div class="summary-actions">
        <button class="btn btn-go" id="sum-again">🎣 Fish again</button>
        <a class="btn" href="applications.html" data-nav="applications">📋 Applications</a>
        <a class="btn" href="index.html" data-nav="home">🏠 Home</a>
      </div>`;
    const modal = UI.openModal(content, { locked: true });
    UI.spikyAll(content);
    if (promo) { UI.confetti(30); Sound.jackpot(); }
    content.querySelector('#sum-again').addEventListener('click', () => {
      modal.close();
      this.stop();
      Fishing.start(this.root);
    });
    content.querySelectorAll('a[data-nav]').forEach(a => a.addEventListener('click', () => modal.close()));
  },
};

GAMES.fisherman = Fishing;
