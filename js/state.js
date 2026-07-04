/* ============================================================
   STATE — saving, loading, money, jobs, luck, offers.
   Your game saves itself in the browser (localStorage).
   ============================================================ */

const SAVE_KEY = 'jobApplicationGame.v1';

const State = {
  data: null,

  fresh() {
    return {
      wealth: CONFIG.startWealth,
      day: 1,
      path: { jobId: 'fisherman', rank: 0, career: 0 },
      luckItems: [],            // ids from LUCK_ITEMS you own
      offers: [],               // today's job offers: [{ jobId }]
      offersDay: 0,             // which day the offers were made for
      pendingPromotion: null,   // rank name to celebrate next time you look
      mythicalOwned: false,
      stats: { fishCaught: 0, daysWorked: 0, knockouts: 0, biggestCatch: 0, jobsHeld: 1 },
    };
  },

  load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { /* no save yet */ }
    this.data = Object.assign(this.fresh(), saved || {});
    if (!JOBS[this.data.path.jobId]) this.data.path = { jobId: 'fisherman', rank: 0, career: 0 };
    this.ensureOffers();
    return this.data;
  },

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* private mode */ }
  },

  reset() {
    this.data = this.fresh();
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
