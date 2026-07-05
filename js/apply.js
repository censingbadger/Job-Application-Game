/* ============================================================
   THE JOB APPLICATION — your avatar applies for a job.
   Fill out the paperwork, then (for better jobs) pass a SKILL
   TRIAL and a LUCK DRAW to actually get hired. Harder the more
   the job pays. Rejected? Re-apply for a (large) fee.

   Apply.start(jobId, onDone) runs the whole flow.
   onDone(hired, consumed) — remove the offer when `consumed`.
   ============================================================ */

// shuffle a copy of `arr` and take the first `n`
function shuffleTake(arr, n) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}

// A two-slice luck wheel: a green HIRE wedge (greenPct of the circle)
// and a red DENIED wedge. A spin lands the pointer randomly, so the
// chance of hire is exactly greenPct%.
const LuckWheel = {
  draw(canvas, greenPct, rotation) {
    const ctx = canvas.getContext('2d');
    const r = canvas.width / 2;
    const arc = Math.PI * 2 * (greenPct / 100);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(rotation);
    ctx.lineWidth = 3; ctx.strokeStyle = '#2b2b33';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r - 6, -arc / 2, arc / 2); ctx.closePath();
    ctx.fillStyle = '#3fa555'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r - 6, arc / 2, Math.PI * 2 - arc / 2); ctx.closePath();
    ctx.fillStyle = '#d9534f'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 22px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (greenPct > 12) ctx.fillText('HIRE', r * 0.55, 0);
    ctx.save(); ctx.rotate(Math.PI); ctx.fillText('DENIED', r * 0.5, 0); ctx.restore();
    ctx.restore();
    ctx.beginPath(); ctx.arc(r, r, r - 5, 0, Math.PI * 2); ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 6; ctx.stroke();
  },
  spin(canvas, greenPct, onDone) {
    const arc = Math.PI * 2 * (greenPct / 100);
    const target = Math.random() * Math.PI * 2;
    const extra = REDUCED_MOTION ? 0 : (4 + Math.floor(Math.random() * 3)) * Math.PI * 2;
    const finalRot = target + extra;
    const dur = REDUCED_MOTION ? 500 : 3200;
    const t0 = performance.now();
    const tick = now => {
      const t = Math.min(1, (now - t0) / dur);
      const rot = finalRot * (1 - Math.pow(1 - t, 3));
      this.draw(canvas, greenPct, rot);
      if (t < 1) { requestAnimationFrame(tick); return; }
      const pointer = -Math.PI / 2;                              // the ▼ at the top
      const d = Math.atan2(Math.sin(pointer - rot), Math.cos(pointer - rot));
      onDone(Math.abs(d) <= arc / 2);
    };
    requestAnimationFrame(tick);
  },
};

const Apply = {
  start(jobId, onDone) {
    this.jobId = jobId;
    this.job = JOBS[jobId];
    this.cfg = APPLICATION[this.job.rarity] || APPLICATION.common;
    this.onDone = onDone || function () {};
    this.origPath = State.data.path;
    this.attempted = false;
    this._paperwork();
  },

  _finish(hired) {
    if (!hired) State.data.path = this.origPath;   // undo any "pretend" job
    this.onDone(hired, this.attempted || hired);
  },

  _gauntlet() {
    const steps = ['📝 Paperwork'];
    if (this.cfg.trial) steps.push('🧪 Skill trial');
    if (this.cfg.luck) steps.push('🍀 Luck draw');
    return steps.join('  →  ');
  },

  // ---- step 1: the paperwork ----------------------------------
  _paperwork() {
    const job = this.job;
    const rar = RARITY[job.rarity];
    const box = el('div', 'apply');
    box.innerHTML = `
      <div class="apply-head">
        <span class="apply-avatar">${State.avatar()}</span>
        <div class="apply-title">
          <h2 data-spiky>APPLICATION</h2>
          <div class="apply-job">${esc(job.name)} <span class="rarity-chip" style="--chip:${rar.color}">${rar.label}</span></div>
        </div>
      </div>
      <div class="apply-form card">
        <div class="apply-row">Applicant: <b>${esc(State.data.name)}</b></div>
        <div class="apply-row">Salary: <b>${job.special === 'fishing' ? 'depends on fish' : fmtMoney(job.salary) + ' / day'}</b></div>
        <div class="apply-row">Fatality rate: <b class="${job.fatality >= 40 ? 'danger-text' : ''}">${job.fatality}%</b></div>
        <div class="apply-q">Why should we hire you?</div>
        <div class="apply-reasons"></div>
      </div>
      <div class="apply-gauntlet">To get hired: ${this._gauntlet()}</div>
      <div class="summary-actions">
        <button class="btn btn-go apply-submit" disabled>✍️ Stamp &amp; submit</button>
        <button class="btn apply-cancel">Never mind</button>
      </div>`;
    const modal = UI.openModal(box, { locked: true });
    UI.spikyAll(box);

    const reasons = ['I was born for this.', 'I really need the money.', 'My mum said I should.', 'For the glory!', 'No idea, honestly.', 'I am the best there is.'];
    const rwrap = box.querySelector('.apply-reasons');
    shuffleTake(reasons, 3).forEach(r => {
      const b = el('button', 'btn apply-reason', esc(r));
      b.addEventListener('click', () => {
        rwrap.querySelectorAll('.apply-reason').forEach(x => x.classList.remove('picked'));
        b.classList.add('picked');
        box.querySelector('.apply-submit').disabled = false;
      });
      rwrap.appendChild(b);
    });

    box.querySelector('.apply-submit').addEventListener('click', () => {
      this.attempted = true;
      Sound.ding();
      modal.close();
      if (this.cfg.trial) this._trial();
      else this._luckOrHire();
    });
    box.querySelector('.apply-cancel').addEventListener('click', () => { modal.close(); this._finish(false); });
  },

  // ---- step 2: the skill trial --------------------------------
  _trial() {
    const job = this.job, cfg = this.cfg;
    const engine = GAMES[this.jobId];
    if (!engine) { this._luckOrHire(); return; }
    const goal = Math.max(50, Math.floor(job.salary * cfg.goalMult));

    const intro = el('div', 'apply');
    intro.innerHTML = `
      <h2 data-spiky>🧪 SKILL TRIAL</h2>
      <p>Prove you can do the job! Earn <b>${fmtMoney(goal)}</b> in <b>${cfg.seconds} seconds</b> of <b>${esc(job.name)}</b> work.</p>
      <p class="hint">(It's just a test — no real pay, no danger.)</p>
      <div class="summary-actions"><button class="btn btn-go" id="trial-go">Start the trial</button></div>`;
    const introModal = UI.openModal(intro, { locked: true });
    UI.spikyAll(intro);
    intro.querySelector('#trial-go').addEventListener('click', () => {
      introModal.close();
      // pretend to BE this job so the game's stats are calibrated to it
      State.data.path = { jobId: this.jobId, rank: 0, career: 0 };
      const overlay = el('div', 'overlay trial-overlay');
      const stage = el('div', 'trial-stage');
      overlay.appendChild(stage);
      document.body.appendChild(overlay);
      engine.start(stage, {
        trial: {
          seconds: cfg.seconds, goal,
          onResult: (passed, earned) => {
            engine.stop();
            overlay.remove();
            State.data.path = this.origPath;      // stop pretending
            if (passed) { Sound.jackpot(); this._luckOrHire(); }
            else this._verdict(false, 'skill', earned, goal);
          },
        },
      });
    });
  },

  _luckOrHire() {
    if (this.cfg.luck) this._luck();
    else this._hire();
  },

  // ---- step 3: the luck draw ----------------------------------
  _luck() {
    const cfg = this.cfg;
    const greenPct = Math.max(5, Math.min(92, cfg.luckBase + State.luck() * 0.5));
    const box = el('div', 'apply');
    box.innerHTML = `
      <h2 data-spiky>🍀 THE LUCK DRAW</h2>
      <p>Your luck <b>+${State.luck()}%</b> gives a <b>${Math.round(greenPct)}%</b> chance of hire. Spin!</p>
      <div class="luck-stage">
        <canvas width="340" height="340"></canvas>
        <div class="wheel-pointer">▼</div>
      </div>
      <div class="summary-actions"><button class="btn btn-go" id="luck-spin">SPIN</button></div>`;
    const modal = UI.openModal(box, { locked: true });
    UI.spikyAll(box);
    const canvas = box.querySelector('canvas');
    LuckWheel.draw(canvas, greenPct, 0);
    const btn = box.querySelector('#luck-spin');
    btn.addEventListener('click', () => {
      btn.disabled = true; btn.textContent = '...';
      LuckWheel.spin(canvas, greenPct, hired => {
        setTimeout(() => { modal.close(); hired ? this._hire() : this._verdict(false, 'luck'); }, 650);
      });
    });
  },

  _hire() {
    State.switchJob(this.jobId);
    this._verdict(true);
  },

  // ---- the verdict --------------------------------------------
  _verdict(hired, reason, earned, goal) {
    const box = el('div', 'apply day-summary');
    if (hired) {
      box.innerHTML = `
        <div class="stamp stamp-approved">APPROVED</div>
        <h2 data-spiky>YOU'RE HIRED!</h2>
        <div class="card job-card">${UI.jobCardHTML(this.jobId)}</div>
        <p>You start as <b>${esc(State.rankName())}</b>.</p>
        <div class="summary-actions">
          <a class="btn btn-go" href="levels.html" data-nav="levels">▶ Start working</a>
          <button class="btn" id="apply-done">Keep browsing</button>
        </div>`;
    } else {
      const msg = reason === 'skill'
        ? `You earned <b>${fmtMoney(earned)}</b> but needed <b>${fmtMoney(goal)}</b>. Not quite good enough... yet.`
        : reason === 'luck' ? `The luck draw landed on <b>DENIED</b>. So close!`
          : 'Application denied.';
      const canAfford = State.data.wealth >= this.cfg.fee;
      box.innerHTML = `
        <div class="stamp stamp-denied">DENIED</div>
        <h2 data-spiky>NOT HIRED</h2>
        <p>${msg}</p>
        <div class="summary-actions">
          <button class="btn btn-money" id="apply-retry" ${canAfford ? '' : 'disabled'}>Apply again · ${fmtMoney(this.cfg.fee)}</button>
          <button class="btn" id="apply-give">Give up</button>
        </div>
        ${canAfford ? '' : '<p class="hint">You can’t afford the re-application fee right now.</p>'}`;
    }
    const modal = UI.openModal(box, { locked: true });
    UI.spikyAll(box);
    if (hired) { UI.confetti(30); Sound.jackpot(); } else Sound.thud();

    const done = box.querySelector('#apply-done');
    if (done) done.addEventListener('click', () => { modal.close(); this._finish(true); });
    box.querySelectorAll('a[data-nav]').forEach(a => a.addEventListener('click', () => { modal.close(); this._finish(true); }));
    const retry = box.querySelector('#apply-retry');
    if (retry) retry.addEventListener('click', () => {
      if (!State.spend(this.cfg.fee)) return;
      UI.moneyPop(-this.cfg.fee); UI.refreshWealth();
      modal.close();
      this._paperwork();
    });
    const give = box.querySelector('#apply-give');
    if (give) give.addEventListener('click', () => { modal.close(); this._finish(false); });
  },
};
