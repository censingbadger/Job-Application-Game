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
    // Each job picks its own game from the registry; jobs without a
    // custom game yet fall back to the shared work-day game.
    this.engine = GAMES[State.data.path.jobId] || WorkShift;
    this.engine.start(gameRoot);
  },

  leave() {
    if (this.engine) this.engine.stop();
    this.engine = null;
  },
};
