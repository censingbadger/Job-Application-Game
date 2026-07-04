/* ============================================================
   WORK SHIFT — a day at any job that isn't fishing.
   The bar fills while you work. Mash WORK! to go faster.
   When danger jumps out (that's the fatality rate!), TAP fast
   or you're knocked out: hospital bill, no pay, and you're
   fired back to the fishing boat.
   ============================================================ */

const WorkShift = {
  running: false,

  start(root) {
    this.root = root;
    this.running = true;
    this.progress = 0;                       // 0 → 100
    this.speed = 100 / CONFIG.workShiftSeconds;
    this.dangerActive = null;
    this.survived = true;
    this.lastTime = performance.now();

    const job = State.job();
    this.salary = Math.floor(State.salary() * (1 + State.power() / 100));

    // How many dangers today? More fatality = more danger.
    const expected = job.fatality / 35;
    this.dangersLeft = Math.floor(expected) + (Math.random() < expected % 1 ? 1 : 0);
    this.nextDangerAt = this.scheduleDanger();

    root.innerHTML = `
      <div class="work-layout">
        <aside class="fishing-side">
          <div class="card hud-card">
            <h3>CURRENT JOB</h3>
            <div class="hud-job">${State.rankName()}</div>
            <div class="hud-line">Salary: <b>${fmtMoney(this.salary)} / day</b></div>
            <div class="hud-line">Power: <b>${State.power()}%</b></div>
            <div class="hud-line">Fatality rate: <b class="${job.fatality >= 40 ? 'danger-text' : ''}">${job.fatality}%</b></div>
          </div>
          <div class="card hud-card">
            <h3>HOW TO WORK</h3>
            <p class="hud-line">Mash <b>WORK!</b> to finish the day faster. If danger pops up — <b>TAP IT</b> before it gets you!</p>
          </div>
        </aside>
        <div class="fishing-main">
          <div class="shift-bar"><div class="shift-fill" id="ws-fill"></div><span id="ws-clock">Day ${State.data.day}</span></div>
          <div class="card work-scene" id="ws-scene">
            <div class="work-emoji" id="ws-emoji">${job.emoji}</div>
            <div class="work-title">${esc(State.rankName())} at work...</div>
            <div class="work-taps" id="ws-taps"></div>
          </div>
          <button class="btn btn-go action-btn" id="ws-work">WORK!</button>
          <p class="hint">Watch out: <b>${esc(job.danger)}</b> happens around here.</p>
        </div>
      </div>`;

    this.fill = root.querySelector('#ws-fill');
    this.scene = root.querySelector('#ws-scene');
    this.workBtn = root.querySelector('#ws-work');
    this.taps = 0;

    this.workBtn.addEventListener('click', () => {
      if (!this.running || this.dangerActive) return;
      this.progress = Math.min(100, this.progress + 0.6);   // every tap helps
      this.taps += 1;
      this.root.querySelector('#ws-taps').textContent = '💪'.repeat(Math.min(10, Math.ceil(this.taps / 8)));
      const emoji = this.root.querySelector('#ws-emoji');
      emoji.style.transform = `scale(${1 + Math.random() * 0.15}) rotate(${(Math.random() * 8 - 4)}deg)`;
    });

    requestAnimationFrame(t => this.loop(t));
  },

  stop() { this.running = false; },

  scheduleDanger() {
    if (this.dangersLeft <= 0) return Infinity;
    // somewhere in the middle of the remaining day
    return this.progress + 15 + Math.random() * (70 - this.progress > 15 ? 55 : 10);
  },

  loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (!this.dangerActive) {
      this.progress += this.speed * dt;
      if (this.progress >= this.nextDangerAt && this.progress < 96) this.startDanger();
      if (this.progress >= 100) { this.progress = 100; this.endDay(); return; }
    } else {
      this.dangerActive.timeLeft -= dt;
      const ring = this.scene.querySelector('.danger-timer-fill');
      if (ring) ring.style.width = Math.max(0, (this.dangerActive.timeLeft / this.dangerActive.total) * 100) + '%';
      if (this.dangerActive.timeLeft <= 0) { this.knockout(); return; }
    }

    this.fill.style.width = this.progress + '%';
    requestAnimationFrame(t => this.loop(t));
  },

  startDanger() {
    const job = State.job();
    this.dangersLeft -= 1;
    this.nextDangerAt = this.scheduleDanger();
    const total = 1.4;
    this.dangerActive = { timeLeft: total, total };
    Sound.danger();

    const overlay = el('div', 'danger-overlay');
    overlay.innerHTML = `
      <div class="danger-word">⚠️ ${esc(job.danger)}</div>
      <button class="btn btn-danger danger-tap">TAP TO DODGE!</button>
      <div class="danger-timer"><div class="danger-timer-fill"></div></div>`;
    this.scene.appendChild(overlay);
    overlay.querySelector('.danger-tap').addEventListener('click', () => {
      this.dangerActive = null;
      overlay.remove();
      Sound.ding();
      UI.toast('Phew! Dodged it.', '😅');
    });
  },

  knockout() {
    this.running = false;
    this.survived = false;
    Sound.danger();
    const bill = Math.max(5, Math.floor(State.data.wealth * CONFIG.hospitalBillPercent / 100));
    State.addWealth(-bill);
    State.data.stats.knockouts += 1;
    const oldJob = State.rankName();
    const danger = State.job().danger;
    State.switchJob('fisherman');
    State.nextDay();

    const content = el('div', 'day-summary');
    content.innerHTML = `
      <h2 data-spiky>💥 KNOCKED OUT!</h2>
      <p><b>${esc(danger)}</b> got you. The hospital patched you up.</p>
      <ul class="collection">
        <li>🏥 Hospital bill <b>−${fmtMoney(bill)}</b></li>
        <li>📄 No pay today <b>$0</b></li>
        <li>😢 You lost your job as <b>${esc(oldJob)}</b></li>
      </ul>
      <p>Back to the fishing boat with you...</p>
      <div class="summary-actions">
        <a class="btn btn-go" href="levels.html" data-nav="levels" id="ko-fish">🎣 Go fishing</a>
        <a class="btn" href="applications.html" data-nav="applications">📋 Find a new job</a>
      </div>`;
    const modal = UI.openModal(content, { locked: true });
    UI.spikyAll(content);
    content.querySelectorAll('a[data-nav]').forEach(a => a.addEventListener('click', () => modal.close()));
    // in multi-page mode "Go fishing" reloads levels.html, which now shows fishing
    if (!window.SINGLE_FILE) content.querySelector('#ko-fish').addEventListener('click', () => modal.close());
  },

  endDay() {
    this.running = false;
    State.addWealth(this.salary);
    State.addCareerEarnings(this.salary);
    const promo = State.data.pendingPromotion;
    State.data.pendingPromotion = null;
    State.nextDay();
    UI.moneyPop(this.salary);
    Sound.catchFish();

    const content = el('div', 'day-summary');
    content.innerHTML = `
      <h2 data-spiky>PAYDAY!</h2>
      ${promo ? `<div class="promo-banner">🎉 PROMOTED! You are now <b>${esc(promo)}</b>!</div>` : ''}
      <ul class="collection">
        <li>💼 A full day of work <b>+${fmtMoney(this.salary)}</b></li>
        <li>💪 Work taps: <b>${this.taps}</b></li>
      </ul>
      <div class="summary-actions">
        <button class="btn btn-go" id="ws-again">💼 Work again</button>
        <a class="btn" href="applications.html" data-nav="applications">📋 Applications</a>
        <a class="btn" href="index.html" data-nav="home">🏠 Home</a>
      </div>`;
    const modal = UI.openModal(content, { locked: true });
    UI.spikyAll(content);
    if (promo) { UI.confetti(30); Sound.jackpot(); }
    content.querySelector('#ws-again').addEventListener('click', () => {
      modal.close();
      WorkShift.start(this.root);
    });
    content.querySelectorAll('a[data-nav]').forEach(a => a.addEventListener('click', () => modal.close()));
  },
};
