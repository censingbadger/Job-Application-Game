/* ============================================================
   HOME — the title screen. JOB APPLICATION: what job will
   YOU get? By Jing & Ash Games.
   ============================================================ */

PAGES.home = {
  init(root) {
    UI.spikyAll(root);
    this.renderBoard(root);
    this.renderFounder(root);
    // refresh the founders' board + specials from the cloud, then redraw
    if (Cloud.on()) Founder.load().then(() => { if (root.querySelector('#founder-board')) this.renderFounder(root); });
    const day = root.querySelector('#home-day');
    if (day) day.textContent = State.data.day;   // HTML already says "Day"
    const wealth = root.querySelector('#home-wealth');
    if (wealth) { wealth.textContent = fmtMoney(State.data.wealth); wealth.classList.toggle('in-debt', State.data.wealth < 0); }
    const badge = root.querySelector('#home-mythical');
    if (badge) badge.hidden = !State.data.mythicalOwned;

    // "Playing as Asher · switch player"
    const who = root.querySelector('#home-player');
    if (who) who.textContent = Profiles.currentName() || 'Player';
    const swap = root.querySelector('#home-switch');
    if (swap && !swap.dataset.wired) {
      swap.dataset.wired = '1';
      swap.addEventListener('click', () => UI.switchPlayer());
    }

    const reset = root.querySelector('#home-reset');
    if (reset && !reset.dataset.wired) {
      reset.dataset.wired = '1';
      reset.addEventListener('click', () => {
        const who = Profiles.currentName() || 'this character';
        // Starting over wipes a character, so a GROWN-UP has to approve it —
        // that stops a kid from wiping their game by accident. (And we snapshot
        // first, so even this is undoable from the admin panel.)
        UI.requireGrownup({
          title: '🔑 GROWN-UP TO START OVER',
          note: `Starting over erases <b>${esc(who)}</b>'s whole game. A grown-up has to type the <b>master password</b> to allow it:`,
          go: 'Continue',
          onOk: () => {
            const content = el('div', 'day-summary');
            content.innerHTML = `
              <h2 data-spiky>START OVER?</h2>
              <p>This erases <b>${esc(who)}</b>'s progress —
                 wealth, path, luck... everything. Other players are not affected.</p>
              <p style="opacity:.75;font-size:.9em">💾 A backup is saved first, so a grown-up can Restore it later from the admin panel.</p>
              <div class="summary-actions">
                <button class="btn btn-danger" id="reset-yes">Yes, wipe it</button>
                <button class="btn" id="reset-no">No! Keep my stuff</button>
              </div>`;
            const modal = UI.openModal(content);
            UI.spikyAll(content);
            content.querySelector('#reset-yes').addEventListener('click', () => {
              State.reset();
              modal.close();
              UI.toast('Fresh start. Good luck out there!', '🌅');
              PAGES.home.init(root);
              UI.refreshWealth();
            });
            content.querySelector('#reset-no').addEventListener('click', () => modal.close());
          },
        });
      });
    }
  },

  // The "Message from the Founders" board + any live "special" banner.
  renderFounder(root) {
    const banner = root.querySelector('#founder-special');
    const board = root.querySelector('#founder-board');
    const msgs = root.querySelector('#founder-msgs');
    if (!banner || !board || !msgs) return;

    const active = Founder.activeSpecials();
    if (active.length) {
      banner.hidden = false;
      banner.innerHTML = active.map(s => {
        const job = JOBS[s.jobId];
        const mins = Math.max(0, Math.round((s.until - Date.now()) / 60000));
        const left = mins >= 120 ? Math.round(mins / 60) + ' hrs' : mins >= 60 ? '1 hr' : mins + ' min';
        return `<div class="founder-special-row">🎉 <b>${s.mult}× MONEY</b> for <b>${esc(job ? job.name : s.jobId)}</b> ${job ? job.emoji : ''} — ${left} left!</div>`;
      }).join('');
    } else { banner.hidden = true; banner.innerHTML = ''; }

    const list = Founder.messages || [];
    if (list.length) {
      board.hidden = false;
      msgs.innerHTML = list.slice(0, 8).map(m => {
        const warn = m.kind === 'warning';
        const when = new Date(m.at || 0);
        const stamp = (m.at && isFinite(when.getTime())) ? when.toLocaleString() : '';
        return `<div class="founder-msg${warn ? ' warn' : ''}">
          <div class="founder-msg-head"><b>${warn ? '⚠️ ' : ''}${esc(m.from)}</b><span class="founder-msg-when">${esc(stamp)}</span></div>
          <div class="founder-msg-text">${esc(m.text)}</div>
        </div>`;
      }).join('');
    } else { board.hidden = true; }
  },

  // A little "top players" preview on the title screen. Only appears when
  // there's real cloud data to show (no misleading solo board when offline).
  renderBoard(root) {
    const board = root.querySelector('#home-board');
    const list = root.querySelector('#home-board-list');
    if (!board || !list || !PAGES.leaderboard) return;
    board.hidden = true;
    if (!Cloud.on()) return;
    Cloud.loadAll().then(all => {
      if (!all || root.querySelector('#home-board') !== board) return;
      const rows = PAGES.leaderboard.rank(all).slice(0, 5);
      if (!rows.length) return;
      list.innerHTML = rows.map(r => PAGES.leaderboard.rowHTML(r)).join('');
      board.hidden = false;
    });
  },
};
