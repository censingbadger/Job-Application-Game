/* ============================================================
   HOME — the title screen. JOB APPLICATION: what job will
   YOU get? By Jing & Ash Games.
   ============================================================ */

PAGES.home = {
  init(root) {
    UI.spikyAll(root);
    const day = root.querySelector('#home-day');
    if (day) day.textContent = `Day ${State.data.day}`;
    const wealth = root.querySelector('#home-wealth');
    if (wealth) wealth.textContent = fmtMoney(State.data.wealth);
    const badge = root.querySelector('#home-mythical');
    if (badge) badge.hidden = !State.data.mythicalOwned;

    const reset = root.querySelector('#home-reset');
    if (reset && !reset.dataset.wired) {
      reset.dataset.wired = '1';
      reset.addEventListener('click', () => {
        const content = el('div', 'day-summary');
        content.innerHTML = `
          <h2 data-spiky>START OVER?</h2>
          <p>This erases your save: wealth, path, luck... everything. Forever!</p>
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
      });
    }
  },
};
