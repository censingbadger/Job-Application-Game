/* ============================================================
   LEVELS — where you actually DO the job.
   Fishermen get the sea. Everyone else gets a work day
   (and their fatality rate...).
   ============================================================ */

PAGES.levels = {
  engine: null,

  init(root) {
    UI.spikyAll(root);
    const gameRoot = root.querySelector('#game-root');
    this.engine = State.job().special === 'fishing' ? Fishing : WorkShift;
    this.engine.start(gameRoot);
  },

  leave() {
    if (this.engine) this.engine.stop();
    this.engine = null;
  },
};
