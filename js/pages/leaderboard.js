/* ============================================================
   LEADERBOARD — the top 15 richest players ever, pulled live
   from the cloud. "Richest ever" = the most money you've ever
   held (your peak), so it never drops when you spend or die.
   ============================================================ */

const MEDALS = ['🥇', '🥈', '🥉'];

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
    status.textContent = `${n} player${n === 1 ? '' : 's'} competing · ranked by richest ever 💰`;
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

    const rows = Object.entries(map).map(([key, p]) => {
      const score = (p.stats && p.stats.peakWealth) || p.wealth || 0;
      const jobId = p.path && JOBS[p.path.jobId] ? p.path.jobId : 'fisherman';
      return { name: p.name || key, score, jobId, me: key === meKey };
    })
      .filter(r => r.score > 0 || r.me)     // hide brand-new $0 players, but never hide you
      .sort((a, b) => b.score - a.score);
    rows.forEach((r, i) => { r.place = i + 1; });
    return rows;
  },

  render(list, rows) {
    if (!rows.length) {
      list.innerHTML = '<div class="lb-empty">No players on the board yet. Be the first — go get rich! 💰</div>';
      return;
    }
    let html = rows.slice(0, 15).map(r => this.rowHTML(r)).join('');
    // if you didn't make the top 15, show your rank pinned at the bottom
    const me = rows.find(r => r.me);
    if (me && me.place > 15) html += '<div class="lb-gap">· · ·</div>' + this.rowHTML(me);
    list.innerHTML = html;
  },

  rowHTML(r) {
    const job = JOBS[r.jobId];
    const rank = r.place <= 3 ? MEDALS[r.place - 1] : '#' + r.place;
    const cls = 'lb-row' + (r.me ? ' lb-me' : '') + (r.place <= 3 ? ' lb-top' : '');
    return `
      <div class="${cls}">
        <div class="lb-rank">${rank}</div>
        <div class="lb-emoji">${job.emoji}</div>
        <div class="lb-who">
          <div class="lb-name">${esc(r.name)}${r.me ? ' <span class="lb-badge">YOU</span>' : ''}</div>
          <div class="lb-job">${esc(job.name)}</div>
        </div>
        <div class="lb-score">${fmtMoney(r.score)}</div>
      </div>`;
  },
};
