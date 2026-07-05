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

const CLOUD_URL = '';   // <-- paste your Firebase Realtime Database URL here

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

  // Fetch a character from the cloud (or null if none / offline).
  async load(name) {
    if (!this.on()) return null;
    try {
      const res = await fetch(this._url(name), { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data && typeof data === 'object' ? data : null;
    } catch (e) { return null; }
  },

  // Save a character to the cloud. Returns true on success.
  async save(name, data) {
    if (!this.on()) return false;
    try {
      const res = await fetch(this._url(name), { method: 'PUT', body: JSON.stringify(data) });
      return res.ok;
    } catch (e) { return false; }
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
