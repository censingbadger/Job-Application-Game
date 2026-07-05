/* ============================================================
   PATHS — your journey up the career ladder, one mystery
   rank at a time. Or pay 45M and spin the wheel for a whole
   new life.
   ============================================================ */

PAGES.paths = {
  init(root) {
    this.root = root;
    UI.spikyAll(root);
    this.render();

    const changeBtn = root.querySelector('#pt-change');
    if (!changeBtn.dataset.wired) {
      changeBtn.dataset.wired = '1';
      changeBtn.addEventListener('click', () => this.tryChangePath());
    }

    // celebrate a promotion earned while you were away
    if (State.data.pendingPromotion) {
      UI.toast(`PROMOTED! You are now ${State.data.pendingPromotion}!`, '🎉');
      UI.confetti(24);
      State.data.pendingPromotion = null;
      State.save();
    }
  },

  render() {
    const root = this.root;
    const job = State.job();
    const path = State.data.path;
    const pathLabel = job.path || job.name;

    root.querySelector('#pt-name').textContent = pathLabel;
    root.querySelector('#pt-emoji').textContent = job.emoji;
    root.querySelector('#pt-watermark').textContent = pathLabel.toUpperCase();

    // promotion progress
    const progressText = root.querySelector('#pt-progress-text');
    const bar = root.querySelector('#pt-progress');
    if (path.rank >= RANK_UP_AT.length - 1) {
      progressText.innerHTML = `<b>MAX RANK!</b> You are ${esc(State.rankName())}. Legends fish on.`;
      bar.style.width = '100%';
    } else {
      const need = RANK_UP_AT[path.rank + 1];
      progressText.innerHTML = `Career earnings: <b>${fmtMoney(path.career)}</b><br>Next promotion at <b>${fmtMoney(need)}</b>`;
      bar.style.width = Math.min(100, (path.career / need) * 100) + '%';
    }

    // the trail: one hexagon stop per rank, zig-zagging bottom to top
    const N = RANK_UP_AT.length;
    const positions = [];
    for (let i = 0; i < N; i++) {
      const x = i % 2 === 0 ? 34 : 64;               // zig-zag left / right
      const y = 91 - (i / (N - 1)) * 83;             // bottom (91%) up to top (8%)
      positions.push([x, y]);
    }
    // draw the dotted connecting line through the nodes
    const line = root.querySelector('#pt-line');
    if (line) line.setAttribute('d', positions.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' '));

    const nodesBox = root.querySelector('#pt-nodes');
    nodesBox.innerHTML = '';
    positions.forEach(([x, y], i) => {
      const node = el('div', 'trail-node');
      node.style.left = x + '%';
      node.style.top = y + '%';
      const state = i < path.rank ? 'done' : i === path.rank ? 'current' : 'locked';
      node.classList.add(state);
      if (i === N - 1) node.classList.add('boss');
      const face = state === 'locked' ? (i === N - 1 ? '☁️' : '❓') : (state === 'done' ? '✓' : job.emoji);
      const label = state === 'locked' ? (i === N - 1 ? '????' : '???') : State.rankName(i);
      node.innerHTML = `<span class="hex hex-node"><span>${face}</span></span><b class="node-label">${esc(label)}</b>`;
      nodesBox.appendChild(node);
    });

    const cost = root.querySelector('#pt-change');
    cost.innerHTML = `change · ${fmtMoney(CONFIG.pathChangeCost)} 💰`;
  },

  tryChangePath() {
    if (State.data.wealth < CONFIG.pathChangeCost) {
      UI.toast(`You need ${fmtMoney(CONFIG.pathChangeCost)} to change your path!`, '🚫');
      const btn = this.root.querySelector('#pt-change');
      btn.classList.add('shake');
      setTimeout(() => btn.classList.remove('shake'), 500);
      return;
    }
    State.spend(CONFIG.pathChangeCost);
    UI.refreshWealth();

    const jobIds = Object.keys(JOBS).filter(id => !JOBS[id].shopOnly);
    UI.spinWheel({
      title: 'WHAT JOB WILL YOU GET?',
      segments: UI.jobWheelSegments(jobIds),
      onDone: seg => {
        State.switchJob(seg.value);
        UI.confetti(30);
        Sound.jackpot();
        const content = el('div', 'day-summary');
        content.innerHTML = `
          <h2 data-spiky>YOUR NEW PATH!</h2>
          <div class="card job-card">${UI.jobCardHTML(seg.value)}</div>
          <p>You start at the bottom: <b>${esc(State.rankName())}</b>. Climb!</p>
          <div class="summary-actions">
            <a class="btn btn-go" href="levels.html" data-nav="levels">▶ Get to work</a>
            <button class="btn" id="pt-stay">Look around first</button>
          </div>`;
        const modal = UI.openModal(content, { locked: true });
        UI.spikyAll(content);
        content.querySelector('#pt-stay').addEventListener('click', () => { modal.close(); this.render(); });
        content.querySelectorAll('a[data-nav]').forEach(a => a.addEventListener('click', () => modal.close()));
        this.render();
      },
    });
  },
};
