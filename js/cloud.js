/* ============================================================
   CLOUD SYNC — makes your character follow you across devices.

   HOW TO TURN IT ON (one-time, free, ~3 minutes):
   1. Go to https://console.firebase.google.com and sign in.
   2. Click "Create a project" (any name, e.g. job-application).
      You can turn OFF Google Analytics — not needed.
   3. In the left menu: Build → Realtime Database → "Create Database".
      Pick any location, then choose "Start in TEST mode" → Enable.
   4. Go to the database's "Rules" tab and paste EXACTLY this, then Publish:
        { "rules": { ".read": true, ".write": true } }
      (This lets anyone with the link save/load characters. There are
       no passwords — friends should each pick a unique name.)
   5. Copy your database URL from the "Data" tab. It looks like:
        https://job-application-xxxx-default-rtdb.firebaseio.com
   6. Paste it between the quotes on the CLOUD_URL line below and save.
      (Or just send Jing the URL and it gets pasted in for you.)

   Leave CLOUD_URL empty to stay local-only (saves just on this device).
   ============================================================ */

const CLOUD_URL = 'https://job-application-game-default-rtdb.firebaseio.com';   // Firebase Realtime Database

const Cloud = {
  dirty: false,
  _pushing: false,
  _timer: null,

  // Testing hook: a page can set window.CLOUD_URL_OVERRIDE before load.
  base() {
    const u = (typeof window !== 'undefined' && window.CLOUD_URL_OVERRIDE) || CLOUD_URL;
    return (u || '').replace(/\/+$/, '');
  },
  on() { return !!this.base(); },

  // Turn a player's name into a safe database key.
  _key(name) {
    return encodeURIComponent(String(name).trim().toLowerCase().replace(/[.#$/\[\]]/g, '_')).slice(0, 80);
  },
  _url(name) { return `${this.base()}/players/${this._key(name)}.json`; },

  // fetch with a timeout, so a slow/offline database never hangs sign-in
  async _fetch(url, opts, ms) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), ms || 8000);
    try { return await fetch(url, Object.assign({ signal: ctl.signal }, opts)); }
    finally { clearTimeout(timer); }
  },

  // Fetch a character from the cloud (or null if none / offline).
  async load(name) {
    if (!this.on()) return null;
    try {
      const res = await this._fetch(this._url(name), { cache: 'no-store' }, 8000);
      if (!res.ok) return null;
      const data = await res.json();
      return data && typeof data === 'object' ? data : null;
    } catch (e) { return null; }
  },

  // Fetch EVERY player (for the leaderboard). Returns { key: character }
  // or null if offline / empty.
  async loadAll() {
    if (!this.on()) return null;
    try {
      const res = await this._fetch(`${this.base()}/players.json`, { cache: 'no-store' }, 8000);
      if (!res.ok) return null;
      const data = await res.json();
      return data && typeof data === 'object' ? data : null;
    } catch (e) { return null; }
  },

  // Save a character to the cloud. Returns true on success.
  async save(name, data) {
    if (!this.on()) return false;
    try {
      const res = await this._fetch(this._url(name), { method: 'PUT', body: JSON.stringify(data) }, 8000);
      return res.ok;
    } catch (e) { return false; }
  },

  _backupUrl(name) { return `${this.base()}/backups/${this._key(name)}.json`; },

  // Tuck a snapshot of a character into the cloud (a short history kept per
  // player) so a grown-up can restore it from any device. Best-effort.
  async backup(name, data) {
    if (!this.on() || !data) return false;
    try {
      let list = [];
      try {
        const r = await this._fetch(this._backupUrl(name), { cache: 'no-store' }, 8000);
        if (r.ok) { const j = await r.json(); if (Array.isArray(j)) list = j; }
      } catch (e) { /* start fresh */ }
      const top = list[0] && list[0].snapshot;
      const same = top && top.wealth === data.wealth && top.day === data.day && (top.lastPlayed || 0) === (data.lastPlayed || 0);
      if (!same) list.unshift({ at: Date.now(), snapshot: data });
      list = list.slice(0, 10);
      const res = await this._fetch(this._backupUrl(name), { method: 'PUT', body: JSON.stringify(list) }, 8000);
      return res.ok;
    } catch (e) { return false; }
  },

  // The cloud snapshots kept for a character (newest first, or [] if none).
  async loadBackups(name) {
    if (!this.on()) return [];
    try {
      const res = await this._fetch(this._backupUrl(name), { cache: 'no-store' }, 8000);
      if (!res.ok) return [];
      const j = await res.json();
      return Array.isArray(j) ? j : [];
    } catch (e) { return []; }
  },

  markDirty() { this.dirty = true; },

  // Start the background pusher: every few seconds, if the character
  // changed, save it to the cloud. Also flush when the tab is hidden.
  start() {
    if (!this.on() || this._timer) return;
    this._timer = setInterval(() => this._maybePush(), 4000);
    const flush = () => this._flush();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  },

  async _maybePush() {
    if (!this.dirty || this._pushing || !State.data || !Profiles.currentName()) return;
    this._pushing = true;
    this.dirty = false;
    const ok = await this.save(Profiles.currentName(), State.data);
    if (!ok) this.dirty = true;    // failed — try again next tick
    this._pushing = false;
  },

  // Force a save right now (used on sign-out and by tests).
  async pushNow() {
    if (!this.on() || !State.data || !Profiles.currentName()) return;
    this.dirty = false;
    await this.save(Profiles.currentName(), State.data);
  },

  // Best-effort save as the tab closes (keepalive keeps it alive).
  _flush() {
    if (!this.on() || !this.dirty || !State.data || !Profiles.currentName()) return;
    try {
      fetch(this._url(Profiles.currentName()), { method: 'PUT', body: JSON.stringify(State.data), keepalive: true });
      this.dirty = false;
    } catch (e) { /* nothing more we can do */ }
  },
};

/* ============================================================
   FOUNDER — the two bosses (Asher & Jinghe) can post messages to a
   "Message from the Founders" board everyone sees, and start a real
   "special" (e.g. double money for Frogkeepers today) that actually
   boosts that job's pay while it's live. Both live in the cloud so
   every player gets them.
   ============================================================ */
const Founder = {
  messages: [],   // cached [{ at, from, text, kind }]  (kind: 'message' | 'warning' | 'special')
  specials: [],   // cached [{ jobId, mult, until, at }]

  _msgUrl() { return Cloud.base() ? `${Cloud.base()}/founderMessages.json` : null; },
  _specialUrl() { return Cloud.base() ? `${Cloud.base()}/founderSpecials.json` : null; },

  // Pull the board + specials from the cloud into the caches (best-effort).
  async load() {
    if (!Cloud.on()) return;
    try {
      const [m, s] = await Promise.all([
        Cloud._fetch(this._msgUrl(), { cache: 'no-store' }, 8000).then(r => r.ok ? r.json() : null).catch(() => null),
        Cloud._fetch(this._specialUrl(), { cache: 'no-store' }, 8000).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      if (Array.isArray(m)) this.messages = m;
      if (Array.isArray(s)) this.specials = s;
    } catch (e) { /* offline — keep whatever we had */ }
  },

  // Specials that haven't expired yet.
  activeSpecials() {
    const now = Date.now();
    return this.specials.filter(s => s && s.until > now);
  },

  // The pay multiplier for a job right now (1 = normal).
  mult(jobId) {
    const s = this.activeSpecials().find(x => x.jobId === jobId);
    return s && s.mult > 0 ? s.mult : 1;
  },

  // Post a message to the board (newest first, keep the last 20).
  async post(from, text, kind) {
    if (!Cloud.on()) return false;
    const msg = { at: Date.now(), from: String(from || 'Founders').slice(0, 20), text: String(text || '').slice(0, 200), kind: kind || 'message' };
    this.messages.unshift(msg);
    this.messages = this.messages.slice(0, 20);
    try { const r = await Cloud._fetch(this._msgUrl(), { method: 'PUT', body: JSON.stringify(this.messages) }, 8000); return r.ok; }
    catch (e) { return false; }
  },

  // Start (or replace) a special for a job. Also announces it on the board.
  async setSpecial(jobId, mult, until, from) {
    if (!Cloud.on()) return false;
    const now = Date.now();
    this.specials = this.specials.filter(s => s && s.until > now && s.jobId !== jobId);
    this.specials.unshift({ jobId, mult, until, at: now });
    try { await Cloud._fetch(this._specialUrl(), { method: 'PUT', body: JSON.stringify(this.specials) }, 8000); }
    catch (e) { return false; }
    return true;
  },

  // End a running special early.
  async clearSpecial(jobId) {
    if (!Cloud.on()) return false;
    this.specials = this.specials.filter(s => s && s.jobId !== jobId);
    try { const r = await Cloud._fetch(this._specialUrl(), { method: 'PUT', body: JSON.stringify(this.specials) }, 8000); return r.ok; }
    catch (e) { return false; }
  },
};
