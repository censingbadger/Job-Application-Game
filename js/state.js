/* ============================================================
   STATE — saving, loading, money, jobs, luck, offers.
   Your game saves itself in the browser (localStorage).

   PLAYERS: everyone types a simple name (no password) and gets
   their own character. Type the same name next time to pick up
   right where you left off. All characters live side by side.
   ============================================================ */

const PROFILES_KEY = 'jobApplicationGame.profiles.v1';
const LEGACY_KEY = 'jobApplicationGame.v1';   // the old one-character save

// ------------------------------------------------------------
// PROFILES — the list of everyone who plays on this device,
// and which one is signed in right now.
//   store = { current: "asher", players: { asher: {name, data} } }
// The name you type is the label; we match on its lowercase form
// so "Asher", "asher" and "ASHER" are the same character.
// ------------------------------------------------------------
const Profiles = {
  store: { current: null, players: {} },

  init() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(PROFILES_KEY)); } catch (e) { /* none yet */ }
    if (!s || typeof s !== 'object') s = { current: null, players: {} };
    if (!s.players || typeof s.players !== 'object') s.players = {};
    this.store = s;
    return this.store;
  },

  _write() {
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(this.store)); } catch (e) { /* private mode */ }
  },

  key(name) { return String(name).trim().toLowerCase(); },
  exists(name) { return !!this.store.players[this.key(name)]; },

  // Everyone on this device, most-recently-played first.
  list() {
    return Object.values(this.store.players)
      .sort((a, b) => (b.data.lastPlayed || 0) - (a.data.lastPlayed || 0));
  },

  currentName() {
    const c = this.store.current;
    return c && this.store.players[c] ? this.store.players[c].name : null;
  },

  // The active character's save data (the real object we keep mutating).
  activeData() {
    const c = this.store.current;
    return c && this.store.players[c] ? this.store.players[c].data : null;
  },

  // Type a name to start a new character or continue an old one.
  // Returns { data, isNew }.
  signIn(name) {
    const clean = String(name).trim().slice(0, 20) || 'Player';
    const key = this.key(clean);
    let isNew = false;
    if (!this.store.players[key]) {
      isNew = true;
      let data = State.fresh();
      // First-ever character on this device inherits any old single save,
      // so nobody's early progress is lost when we add names.
      if (Object.keys(this.store.players).length === 0) {
        const legacy = this._takeLegacy();
        if (legacy) { data = legacy; isNew = false; }
      }
      data.name = clean;
      this.store.players[key] = { name: clean, data };
    }
    this.store.current = key;
    this._write();
    State.data = this.store.players[key].data;
    State.data.name = clean;                 // keep the label fresh
    if (!JOBS[State.data.path.jobId]) State.data.path = { jobId: 'fisherman', rank: 0, career: 0 };
    State.ensureOffers();
    return { data: State.data, isNew };
  },

  // Sign out to the "Who's playing?" screen (keeps the character saved).
  signOut() {
    State.save();
    this.store.current = null;
    this._write();
    State.data = null;
  },

  // Erase ONE character forever.
  erase(name) {
    delete this.store.players[this.key(name)];
    if (this.store.current === this.key(name)) this.store.current = null;
    this._write();
    if (!this.store.current) State.data = null;
  },

  saveActive() {
    const c = this.store.current;
    if (c && this.store.players[c] && State.data) {
      State.data.lastPlayed = Date.now();
      this.store.players[c].data = State.data;
      this._write();
    }
  },

  // Move a pre-names save into the profile system (once), then remove it.
  _takeLegacy() {
    let l = null;
    try { l = JSON.parse(localStorage.getItem(LEGACY_KEY)); } catch (e) { return null; }
    if (!l) return null;
    try { localStorage.removeItem(LEGACY_KEY); } catch (e) { /* ignore */ }
    return Object.assign(State.fresh(), l);
  },
};

const State = {
  data: null,

  fresh() {
    return {
      name: null,
      wealth: CONFIG.startWealth,
      day: 1,
      path: { jobId: 'fisherman', rank: 0, career: 0 },
      luckItems: [],            // ids from LUCK_ITEMS you own
      offers: [],               // today's job offers: [{ jobId }]
      offersDay: 0,             // which day the offers were made for
      pendingPromotion: null,   // rank name to celebrate next time you look
      mythicalOwned: false,
      lastPlayed: 0,            // when this character last played (for sorting)
      stats: { fishCaught: 0, daysWorked: 0, knockouts: 0, biggestCatch: 0, jobsHeld: 1 },
    };
  },

  // Load the signed-in character (or null if nobody is signed in yet).
  load() {
    Profiles.init();
    this.data = Profiles.activeData();
    if (!this.data) return null;
    if (!JOBS[this.data.path.jobId]) this.data.path = { jobId: 'fisherman', rank: 0, career: 0 };
    this.ensureOffers();
    return this.data;
  },

  signedIn() { return !!this.data; },

  save() {
    if (!this.data) return;
    Profiles.saveActive();
  },

  // Erase the CURRENT character back to a brand-new start (same name).
  reset() {
    if (!this.data) return;
    const name = this.data.name;
    this.data = this.fresh();
    this.data.name = name;
    const c = Profiles.store.current;
    if (c && Profiles.store.players[c]) Profiles.store.players[c].data = this.data;
    this.save();
  },

  // ---- money ------------------------------------------------
  addWealth(n) {
    this.data.wealth = Math.max(0, Math.floor(this.data.wealth + n));
    this.save();
  },

  spend(n) {
    if (this.data.wealth < n) return false;
    this.data.wealth -= n;
    this.save();
    return true;
  },

  // ---- your job & path ---------------------------------------
  job() { return JOBS[this.data.path.jobId]; },

  rankName(rank = this.data.path.rank, jobId = this.data.path.jobId) {
    const job = JOBS[jobId];
    const ladder = job.special === 'fishing' ? RANKS.fishing : RANKS.generic;
    return ladder[rank].replace('{job}', job.name);
  },

  power() { return this.job().power + RANK_POWER_BONUS[this.data.path.rank]; },

  salary() { return Math.floor(this.job().salary * RANK_SALARY_MULT[this.data.path.rank]); },

  luck() {
    return this.data.luckItems.reduce((sum, id) => sum + (LUCK_ITEMS[id] ? LUCK_ITEMS[id].luck : 0), 0);
  },

  // Earnings at your job push you up the career ladder.
  addCareerEarnings(n) {
    const p = this.data.path;
    p.career += n;
    while (p.rank < RANK_UP_AT.length - 1 && p.career >= RANK_UP_AT[p.rank + 1]) {
      p.rank += 1;
      this.data.pendingPromotion = this.rankName();
    }
    this.save();
  },

  switchJob(jobId) {
    this.data.path = { jobId, rank: 0, career: 0 };
    this.data.stats.jobsHeld += 1;
    this.save();
  },

  // A day of work is done: the calendar moves forward.
  nextDay() {
    this.data.day += 1;
    this.data.stats.daysWorked += 1;
    this.ensureOffers();
    this.save();
  },

  // ---- daily job offers --------------------------------------
  ensureOffers() {
    if (this.data.offersDay === this.data.day && this.data.offers.length) return;
    this.data.offersDay = this.data.day;
    this.data.offers = [];
    for (let i = 0; i < CONFIG.offersPerDay; i++) this.data.offers.push({ jobId: this.rollOfferJob() });
    this.save();
  },

  // Pick a rarity (luck helps the rare ones), then a job of that rarity.
  rollOfferJob() {
    const luckBoost = 1 + this.luck() / 100;
    const entries = Object.entries(RARITY).map(([id, r]) => {
      const w = id === 'common' ? r.weight : r.weight * luckBoost;
      return [id, w];
    });
    const rarity = weightedPick(entries);
    const pool = Object.keys(JOBS).filter(id => JOBS[id].rarity === rarity && !JOBS[id].shopOnly);
    return pool[Math.floor(Math.random() * pool.length)] || 'peasant';
  },

  addOffer(jobId) {
    this.data.offers.push({ jobId });
    this.save();
  },

  removeOffer(index) {
    this.data.offers.splice(index, 1);
    this.save();
  },
};

// Pick from [[value, weight], ...] at random, respecting weights.
function weightedPick(entries) {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [value, w] of entries) {
    roll -= w;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

// $50 → "$50",  $1,000 → "$1,000",  800000 → "$800K",  20000000 → "$20M"
function fmtMoney(n) {
  n = Math.floor(Math.max(0, n));
  if (n < 100e3) return '$' + n.toLocaleString('en-US');
  const units = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [size, letter] of units) {
    if (n >= size) {
      const x = n / size;
      let str = x >= 100 ? String(Math.round(x)) : x >= 10 ? x.toFixed(1) : x.toFixed(2);
      str = str.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
      return '$' + str + letter;
    }
  }
  return '$' + n.toLocaleString('en-US');
}
