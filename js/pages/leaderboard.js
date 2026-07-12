/* ============================================================
   LEADERBOARD — EVERY player who's ever played, pulled live from
   the cloud and ranked by "richest ever" (the most money you've
   ever held — your peak, so it never drops when you spend or die).
   No cap: the full list shows the all-time player count.
   ============================================================ */

const MEDALS = ['🥇', '🥈', '🥉'];

// The game's makers — Jing & Ash. Their names wear a FOUNDER badge on the
// board, however they type them (matched by the same normalised key the
// cloud uses, so "Asher"/"asher" both count). Add a name here to crown it.
const FOUNDER_NAMES = ['asher', 'hamham3745', 'jinghe'];
function isFounder(name) {
  return name != null && FOUNDER_NAMES.includes(Cloud._key(name));
}

PAGES.leaderboard = {
  init(root) {
    this.root = root;
    UI.spikyAll(root);
    const status = root.querySelector('#lb-status');
    const list = root.querySelector('#lb-list');
    list.innerHTML = '';
    status.textContent = 'Loading the leaderboard…';

    if (!Cloud.on()) {
      status.innerHTML = 'The leaderboard needs cloud sync (it\'s on by default). Playing offline — here\'s just you:';
      this.render(list, this.rank({}));
      return;
    }
    // fire-and-forget: make sure our latest score is in the cloud, then read
    if (Cloud.pushNow) Cloud.pushNow();
    this.load(root, status, list);
  },

  async load(root, status, list) {
    const all = await Cloud.loadAll();
    // guard against the page having been left while we waited
    if (this.root !== root || !document.body.contains(status)) return;
    if (all === null) {
      status.innerHTML = '⚠️ Couldn\'t reach the leaderboard (offline?). <button class="linkish" id="lb-retry">Try again</button>';
      const retry = status.querySelector('#lb-retry');
      if (retry) retry.addEventListener('click', () => this.init(root));
      this.render(list, this.rank({}));   // still show yourself
      return;
    }
    const rows = this.rank(all);
    const n = rows.length;
    status.textContent = `${n} player${n === 1 ? '' : 's'} have played all-time · ranked by riches 💰`;
    this.render(list, rows);
  },

  // Build the ranked list. Always overlays YOUR real local score so you
  // see your true standing even if the cloud copy is a little stale.
  rank(all) {
    const name = Profiles.currentName() || '';
    const meKey = Cloud.on() ? Cloud._key(name) : '__me__';
    const map = Object.assign({}, all);
    const myScore = (State.data.stats && State.data.stats.peakWealth) || State.data.wealth || 0;
    const mine = map[meKey] || {};
    map[meKey] = Object.assign({}, mine, {
      name: name || mine.name || 'You',
      path: State.data.path,
      stats: Object.assign({}, mine.stats, {
        peakWealth: Math.max(myScore, (mine.stats && mine.stats.peakWealth) || 0),
      }),
    });

    // Everyone who's ever played is included (so the board shows the all-time
    // count) — only genuinely malformed cloud entries are skipped.
    const rows = Object.entries(map)
      .filter(([, p]) => p && typeof p === 'object')
      .map(([key, p]) => {
        const peak = (p.stats && p.stats.peakWealth) || 0;
        const score = Math.max(0, peak || p.wealth || 0);   // never negative (debt)
        const jobId = p.path && JOBS[p.path.jobId] ? p.path.jobId : 'fisherman';
        return { name: p.name || key, score, jobId, me: key === meKey };
      })
      .sort((a, b) => b.score - a.score);
    rows.forEach((r, i) => { r.place = i + 1; });
    return rows;
  },

  render(list, rows) {
    if (!rows.length) {
      list.innerHTML = '<div class="lb-empty">No players on the board yet. Be the first — go get rich! 💰</div>';
      return;
    }
    // the whole hall of fame — every player who's ever played, no cap
    list.innerHTML = rows.map(r => this.rowHTML(r)).join('');
  },

  rowHTML(r) {
    const job = JOBS[r.jobId];
    const rank = r.place <= 3 ? MEDALS[r.place - 1] : '#' + r.place;
    const cls = 'lb-row' + (r.me ? ' lb-me' : '') + (r.place <= 3 ? ' lb-top' : '');
    const badges =
      (isFounder(r.name) ? ' <span class="lb-badge lb-founder">👑 FOUNDER</span>' : '') +
      (r.me ? ' <span class="lb-badge">YOU</span>' : '');
    return `
      <div class="${cls}">
        <div class="lb-rank">${rank}</div>
        <div class="lb-emoji">${job.emoji}</div>
        <div class="lb-who">
          <div class="lb-name">${esc(r.name)}${badges}</div>
          <div class="lb-job">${esc(job.name)}</div>
        </div>
        <div class="lb-score">${fmtMoney(r.score)}</div>
      </div>`;
  },
};
