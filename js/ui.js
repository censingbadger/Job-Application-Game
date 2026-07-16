/* ============================================================
   UI — shared pieces: the top bar, the spinner wheel, popups,
   the spiky hand-lettered titles, and page switching.
   ============================================================ */

const PAGES = {}; // each page script registers itself here: PAGES.home = { init(root), leave() }

const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- tiny DOM helpers ---------------------------------------
function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function esc(text) {
  return String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// A tiny, deliberately-simple scramble so a character's password isn't kept
// in the clear (not real security — this is a friendly "keep out" lock).
function hashPass(s) {
  let h = 5381;
  const str = String(s);
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return 'p' + h.toString(36);
}

// The "grown-up" master password (stored scrambled, like everyone else's).
// A grown-up who knows it can wipe any character's password so they can set
// a new one. To change it: run hashPass('your new word') and paste the result.
const GROWNUP_HASH = 'pfxmkiu';

// A few kid-friendly "secret questions". When you make a password you pick one
// and give an answer — if you ever forget your password, answering it lets YOU
// reset it (no grown-up needed). Answers are matched loosely (trimmed + lower-case).
const SECRET_QUESTIONS = ['Favorite animal?', 'Favorite color?', 'Favorite food?', 'A secret word'];

// ---- page boot & navigation ----------------------------------
// The game works two ways:
//  - as separate .html pages (links navigate normally)
//  - bundled into ONE file (play.html) where links switch sections
let currentPage = null;

function Boot() {
  State.load();
  if (Cloud.on()) Founder.load();   // pull the live money specials + banner color
  if (window.SINGLE_FILE) {
    document.addEventListener('click', e => {
      const link = e.target.closest('a[data-nav]');
      if (!link) return;
      e.preventDefault();
      showPage(link.dataset.nav);
    });
  }
  // Nobody signed in yet? Ask "Who's playing?" before anything else.
  if (!State.signedIn()) {
    UI.signInGate(() => { State.load(); renderCurrentPage(); });
  } else {
    renderCurrentPage();
    // Already signed in on this device — pull a newer cloud save if one exists.
    if (Cloud.on()) {
      Cloud.start();
      Profiles.reconcileCurrent().then(changed => {
        if (changed) {
          UI.refreshWealth();
          const page = window.SINGLE_FILE ? currentPage : document.body.dataset.page;
          if (page === 'home') renderCurrentPage();
        }
      });
    }
  }
}

// Draw whichever page this document/section is showing right now.
function renderCurrentPage() {
  if (window.SINGLE_FILE) {
    showPage(currentPage || 'home');
  } else {
    const page = document.body.dataset.page;
    UI.renderHeader(page);
    currentPage = page;
    if (PAGES[page]) PAGES[page].init(document.querySelector('main'));
  }
}

function showPage(page) {
  if (currentPage && PAGES[currentPage] && PAGES[currentPage].leave) PAGES[currentPage].leave();
  document.querySelectorAll('section.page').forEach(s => { s.hidden = s.dataset.page !== page; });
  document.body.dataset.page = page;
  UI.renderHeader(page);
  currentPage = page;
  window.scrollTo(0, 0);
  const root = document.querySelector(`section.page[data-page="${page}"] main`);
  if (PAGES[page]) PAGES[page].init(root);
}

// ---- shared UI -----------------------------------------------
const UI = {

  // The top bar on every page except home.
  renderHeader(activePage) {
    const header = document.getElementById('site-header');
    if (!header) return;
    if (activePage === 'home') { header.innerHTML = ''; header.hidden = true; return; }
    header.hidden = false;
    const links = [
      ['paths', 'PATHS', 'paths.html'],
      ['levels', 'WORK', 'levels.html'],
      ['applications', 'APPLICATIONS', 'applications.html'],
      ['leaderboard', '🏆', 'leaderboard.html'],
    ];
    const player = Profiles.currentName() || 'Player';
    header.innerHTML = `
      <a class="home-hex" href="index.html" data-nav="home" aria-label="Home">🏠</a>
      <nav>${links.map(([id, label, href]) =>
        `<a href="${href}" data-nav="${id}" class="${id === activePage ? 'active' : ''}">${label}</a>`).join('')}
      </nav>
      <button class="player-pill" id="player-pill" title="Switch player">${esc(State.avatar())} <b>${esc(player)}</b> ▾</button>
      <span class="wealth-pill" title="Your wealth">💰 <b id="wealth-pill">${fmtMoney(State.data.wealth)}</b></span>`;
    const pill = header.querySelector('#player-pill');
    if (pill) pill.addEventListener('click', () => UI.switchPlayer());
  },

  // The "Who's playing?" screen. Type a name to start or continue.
  // onDone() runs once someone is signed in.
  signInGate(onDone) {
    const box = el('div', 'signin');
    const players = Profiles.list();
    const returning = players.length
      ? `<div class="signin-returning">
           <div class="signin-sub">Tap your name to keep going:</div>
           <div class="signin-players">${players.map(p => {
             const job = JOBS[p.data.path.jobId];
             return `<button class="signin-player" data-name="${esc(p.name)}">
               <span class="signin-avatar">${p.data.avatar || (job ? job.emoji : '🙂')}</span>
               <span class="signin-who"><b>${esc(p.name)}</b>
               <small>Day ${p.data.day} · ${fmtMoney(p.data.wealth)}</small></span>
             </button>`;
           }).join('')}</div>
           <div class="signin-or">— or start a new one —</div>
         </div>`
      : '';
    box.innerHTML = `
      <div class="signin-logo"><span data-spiky>JOB</span> <span class="signin-logo2" data-spiky>APPLICATION</span></div>
      <h2 class="signin-title" data-spiky>WHO'S PLAYING?</h2>
      ${returning}
      <div class="signin-avatars" role="radiogroup" aria-label="Pick your character">
        ${AVATARS.map((a, i) => `<button type="button" class="signin-pick${i === 0 ? ' picked' : ''}" data-avatar="${a}">${a}</button>`).join('')}
      </div>
      <form class="signin-form" autocomplete="off">
        <input class="signin-input" id="signin-name" type="text" maxlength="20"
               placeholder="Type your name..." aria-label="Your name" enterkeyhint="go">
        <button class="btn btn-go signin-go" type="submit">Let's go!</button>
      </form>
      <p class="signin-note">🔒 You'll set a secret <b>password</b> so only YOU can play as your character.</p>
      <button class="btn signin-grownup" type="button" style="margin-top:4px;font-size:.82em;opacity:.75">🔑 Grown-up: admin (fix &amp; restore)</button>`;
    const modal = UI.openModal(box, { locked: true });
    UI.spikyAll(box);

    let avatar = AVATARS[0];
    box.querySelectorAll('.signin-pick').forEach(b => b.addEventListener('click', () => {
      box.querySelectorAll('.signin-pick').forEach(x => x.classList.remove('picked'));
      b.classList.add('picked');
      avatar = b.dataset.avatar;
    }));

    const finish = async (name, chosenAvatar) => {
      box.innerHTML = `<h2 class="signin-title" data-spiky>ONE SEC...</h2>
        <p class="signin-note">Looking up <b>${esc(name)}</b>...</p>`;
      UI.spikyAll(box);

      // Is there already a character with this name (here or in the cloud),
      // and does it have a password? That decides ENTER vs. MAKE a password.
      const local = Profiles.localData(name);
      let cloud = null;
      if (Cloud.on()) { Cloud.start(); try { const r = await Cloud.load(name); if (r && r.path) cloud = r; } catch (e) { /* offline */ } }
      // Pull the password AND its secret-question from whichever copy has them.
      const withPass = (cloud && cloud.pass) ? cloud : (local && local.pass) ? local : null;
      const saved = {
        hash: withPass ? withPass.pass : null,
        secretQ: withPass ? withPass.secretQ : null,
        secretA: withPass ? withPass.secretA : null,
      };
      const exists = !!(local || cloud);

      // `apply` = a new password (and maybe secret) to store once we're signed in.
      let apply = null;
      if (saved.hash) {
        const r = await UI._passEnter(box, name, saved);              // enter / change / forgot
        if (!r) { modal.close(); UI.signInGate(onDone); return; }     // false = backed out
        if (r !== true) apply = r;                                    // object = changed or reset
      } else {
        const s = await UI._passSet(box, name, exists);              // set one (+ secret question)
        if (s == null) { modal.close(); UI.signInGate(onDone); return; }
        apply = { newPass: s.pw, newSecretQ: s.secretQ, newSecretA: s.secretA };
      }

      box.innerHTML = `<h2 class="signin-title" data-spiky>LOADING...</h2>
        <p class="signin-note">Finding <b>${esc(name)}</b>'s character...</p>`;
      UI.spikyAll(box);
      const res = await Profiles.signInAsync(name, chosenAvatar);
      if (apply) {
        State.data.pass = hashPass(apply.newPass);
        if (apply.newSecretQ) {
          State.data.secretQ = apply.newSecretQ;
          State.data.secretA = hashPass(String(apply.newSecretA).trim().toLowerCase());
        }
        Profiles.saveActive();
        if (Cloud.on()) Cloud.pushNow().catch(() => { /* offline — the background pusher retries */ });
      }
      modal.close();
      const who = Profiles.currentName();
      const msg = res.isNew ? `New character — good luck, ${who}!`
        : (res.source === 'cloud' ? `Welcome back, ${who}! Progress synced.` : `Welcome back, ${who}!`);
      UI.toast(msg, res.isNew ? '🌟' : '👋');
      if (!res.isNew) UI.confetti(14);
      onDone();
    };

    box.querySelectorAll('.signin-player').forEach(b =>
      b.addEventListener('click', () => finish(b.dataset.name)));
    const form = box.querySelector('.signin-form');
    const input = box.querySelector('#signin-name');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) { input.classList.add('shake'); setTimeout(() => input.classList.remove('shake'), 500); input.focus(); return; }
      finish(name, avatar);
    });
    const grown = box.querySelector('.signin-grownup');
    if (grown) grown.addEventListener('click', () => UI._adminPanel(box, () => { modal.close(); UI.signInGate(onDone); }));
    setTimeout(() => { if (!Profiles.list().length) input.focus(); }, 60);
  },

  // tiny shared helpers ---------------------------------------------------
  _shake(node) { if (!node) return; node.classList.add('shake'); setTimeout(() => node.classList.remove('shake'), 500); node.focus(); },

  // The secret-question picker (chips + an answer box) reused when setting a
  // password. `intro` overrides the little heading above it.
  _secretPickerHTML(intro) {
    return `
      <div class="signin-secret">
        <p class="signin-note signin-secret-intro">${intro || '🤔 <b>Optional:</b> pick a secret question, so YOU can reset your password if you ever forget it:'}</p>
        <div class="secret-chips">
          ${SECRET_QUESTIONS.map((q, i) => `<button type="button" class="btn secret-chip${i === 0 ? ' picked' : ''}" data-q="${esc(q)}">${esc(q)}</button>`).join('')}
        </div>
        <input class="signin-input" id="signin-secret" type="text" maxlength="24" placeholder="Your secret answer..." aria-label="Secret answer" enterkeyhint="go">
      </div>`;
  },
  // Wire the chips so tapping one selects it; returns a live {q} of the choice.
  _wireSecretChips(box) {
    const state = { q: SECRET_QUESTIONS[0] };
    box.querySelectorAll('.secret-chip').forEach(c => c.addEventListener('click', () => {
      box.querySelectorAll('.secret-chip').forEach(x => x.classList.remove('picked'));
      c.classList.add('picked');
      state.q = c.dataset.q;
    }));
    return state;
  },

  // MAKE a password (for a new character, or an old one that never had one).
  // `returning` = an existing character being upgraded → show the funny notice.
  // Resolves { pw, secretQ, secretA } (a secret question for self-reset), or
  // null if they backed out.
  _passSet(box, name, returning) {
    return new Promise(resolve => {
      box.innerHTML = `
        <h2 class="signin-title" data-spiky>${returning ? '🚨 NEW RULE! 🚨' : '🔒 MAKE A PASSWORD'}</h2>
        ${returning ? `<p class="signin-sus" style="font-weight:800;color:#b23b2e;font-size:1.12em;line-height:1.4;margin:6px 0">
             Asher and Jinghe saw some <b>SUS</b> behavior and <b>FUNNY BUSINESS</b> — and now we need <b>PASSWORDS</b>!!!</p>` : ''}
        <p class="signin-note">${returning
            ? `Pick a password for <b>${esc(name)}</b> so nobody else can play as them:`
            : `Pick a password to keep <b>${esc(name)}</b> safe — only you'll know it:`}</p>
        <form class="signin-form" autocomplete="off">
          <input class="signin-input" id="signin-pass" type="text" maxlength="24" placeholder="Type a password..." aria-label="Choose a password" enterkeyhint="next">
          ${UI._secretPickerHTML()}
          <button class="btn btn-go signin-pass-go" type="submit">${returning ? 'Set it!' : 'Set password'}</button>
        </form>
        <button class="btn signin-pass-back" type="button">← back</button>`;
      UI.spikyAll(box);
      const sec = UI._wireSecretChips(box);
      const form = box.querySelector('.signin-form');
      const input = box.querySelector('#signin-pass');
      const secret = box.querySelector('#signin-secret');
      form.addEventListener('submit', e => {
        e.preventDefault();
        const pw = input.value.trim();
        const ans = secret.value.trim();
        if (!pw) { UI._shake(input); return; }
        // The secret is optional — set it only if they typed an answer.
        resolve({ pw, secretQ: ans ? sec.q : null, secretA: ans || null });
      });
      box.querySelector('.signin-pass-back').addEventListener('click', () => resolve(null));
      setTimeout(() => input.focus(), 60);
    });
  },

  // ENTER the password for a character that has one. `saved` = { hash, secretQ,
  // secretA }. Resolves: true (correct → sign in), false (backed out), or a
  // { newPass, newSecretQ?, newSecretA? } when they CHANGED it or reset it via
  // the secret question.
  _passEnter(box, name, saved) {
    const savedHash = saved.hash;
    return new Promise(resolve => {
      // --- the normal "type your password" screen (with change / forgot) ---
      const renderEnter = wrong => {
        box.innerHTML = `
          <h2 class="signin-title" data-spiky>🔒 PASSWORD</h2>
          <p class="signin-note">Enter <b>${esc(name)}</b>'s password to play:</p>
          <form class="signin-form" autocomplete="off">
            <input class="signin-input" id="signin-pass" type="text" maxlength="24" placeholder="Password..." aria-label="Password" enterkeyhint="go">
            <button class="btn btn-go signin-pass-go" type="submit">Go!</button>
          </form>
          ${wrong ? '<p class="signin-wrong" style="color:#b23b2e;font-weight:700;margin:6px 0">❌ Nope — that\'s not it. Try again!</p>' : ''}
          <div class="signin-pass-links">
            <button class="btn signin-pass-change" type="button">🔑 Change my password</button>
            <button class="btn signin-pass-forgot" type="button">🤔 Forgot it?</button>
            <button class="btn signin-pass-back" type="button">← not you? go back</button>
          </div>`;
        UI.spikyAll(box);
        const form = box.querySelector('.signin-form');
        const input = box.querySelector('#signin-pass');
        form.addEventListener('submit', e => {
          e.preventDefault();
          if (hashPass(input.value.trim()) === savedHash) { resolve(true); return; }
          renderEnter(true);
        });
        box.querySelector('.signin-pass-change').addEventListener('click', () => renderChange(false));
        box.querySelector('.signin-pass-forgot').addEventListener('click', () => renderForgot());
        box.querySelector('.signin-pass-back').addEventListener('click', () => resolve(false));
        setTimeout(() => input.focus(), 60);
      };

      // --- change it (must know the current one) ---
      const renderChange = wrong => {
        const needSecret = !saved.secretQ;   // older characters get to add one now
        box.innerHTML = `
          <h2 class="signin-title" data-spiky>🔑 CHANGE PASSWORD</h2>
          <p class="signin-note">Type your <b>current</b> password, then pick a new one:</p>
          <form class="signin-form" autocomplete="off">
            <input class="signin-input" id="signin-pass-old" type="text" maxlength="24" placeholder="Current password..." aria-label="Current password">
            <input class="signin-input" id="signin-pass" type="text" maxlength="24" placeholder="New password..." aria-label="New password" enterkeyhint="${needSecret ? 'next' : 'go'}">
            ${needSecret ? UI._secretPickerHTML('🤔 Also pick a secret question, so you can reset it yourself next time:') : ''}
            <button class="btn btn-go signin-pass-go" type="submit">Change it</button>
          </form>
          ${wrong ? '<p class="signin-wrong" style="color:#b23b2e;font-weight:700;margin:6px 0">❌ That\'s not your current password.</p>' : ''}
          <button class="btn signin-pass-back" type="button">← back</button>`;
        UI.spikyAll(box);
        const sec = needSecret ? UI._wireSecretChips(box) : null;
        const form = box.querySelector('.signin-form');
        const oldInp = box.querySelector('#signin-pass-old');
        const newInp = box.querySelector('#signin-pass');
        const secret = box.querySelector('#signin-secret');
        form.addEventListener('submit', e => {
          e.preventDefault();
          if (hashPass(oldInp.value.trim()) !== savedHash) { renderChange(true); return; }
          const np = newInp.value.trim();
          if (!np) { UI._shake(newInp); return; }
          const out = { newPass: np };
          if (needSecret) {                       // optional — only if they typed one
            const ans = secret.value.trim();
            if (ans) { out.newSecretQ = sec.q; out.newSecretA = ans; }
          }
          resolve(out);
        });
        box.querySelector('.signin-pass-back').addEventListener('click', () => renderEnter(false));
        setTimeout(() => oldInp.focus(), 60);
      };

      // --- forgot it: answer the secret question (or ask a grown-up) ---
      const renderForgot = () => {
        if (!saved.secretQ || !saved.secretA) {
          box.innerHTML = `
            <h2 class="signin-title" data-spiky>🤔 FORGOT IT?</h2>
            <p class="signin-note">No secret question was set for <b>${esc(name)}</b> yet, so a grown-up needs to reset it: go <b>← back</b> and tap <b>🔑 Grown-up</b> on the sign-in screen.</p>
            <button class="btn signin-pass-back" type="button">← back</button>`;
          UI.spikyAll(box);
          box.querySelector('.signin-pass-back').addEventListener('click', () => renderEnter(false));
          return;
        }
        const askAnswer = wrong => {
          box.innerHTML = `
            <h2 class="signin-title" data-spiky>🤔 FORGOT IT?</h2>
            <p class="signin-note">Answer your secret question to make a new password:</p>
            <p class="signin-secret-q">${esc(saved.secretQ)}</p>
            <form class="signin-form" autocomplete="off">
              <input class="signin-input" id="signin-secret" type="text" maxlength="24" placeholder="Your answer..." aria-label="Secret answer" enterkeyhint="go">
              <button class="btn btn-go signin-pass-go" type="submit">Check</button>
            </form>
            ${wrong ? '<p class="signin-wrong" style="color:#b23b2e;font-weight:700;margin:6px 0">❌ That\'s not the answer. Try again!</p>' : ''}
            <button class="btn signin-pass-back" type="button">← back</button>`;
          UI.spikyAll(box);
          const form = box.querySelector('.signin-form');
          const inp = box.querySelector('#signin-secret');
          form.addEventListener('submit', e => {
            e.preventDefault();
            if (hashPass(inp.value.trim().toLowerCase()) === saved.secretA) { renderNewAfterReset(); return; }
            askAnswer(true);
          });
          box.querySelector('.signin-pass-back').addEventListener('click', () => renderEnter(false));
          setTimeout(() => inp.focus(), 60);
        };
        askAnswer(false);
      };

      // --- they proved it's them → pick a fresh password ---
      const renderNewAfterReset = () => {
        box.innerHTML = `
          <h2 class="signin-title" data-spiky>✅ CORRECT!</h2>
          <p class="signin-note">Now pick a new password for <b>${esc(name)}</b>:</p>
          <form class="signin-form" autocomplete="off">
            <input class="signin-input" id="signin-pass" type="text" maxlength="24" placeholder="New password..." aria-label="New password" enterkeyhint="go">
            <button class="btn btn-go signin-pass-go" type="submit">Set it</button>
          </form>`;
        UI.spikyAll(box);
        const form = box.querySelector('.signin-form');
        const inp = box.querySelector('#signin-pass');
        form.addEventListener('submit', e => {
          e.preventDefault();
          const np = inp.value.trim();
          if (!np) { UI._shake(inp); return; }
          resolve({ newPass: np });   // keep the existing secret question
        });
        setTimeout(() => inp.focus(), 60);
      };

      renderEnter(false);
    });
  },

  // Ask for the grown-up master password in its OWN pop-up (used to guard
  // risky things like START OVER). Calls opts.onOk() when the password is
  // right. Returns the modal so the caller can hold onto it.
  requireGrownup(opts = {}) {
    const box = el('div', 'signin');
    const render = wrong => {
      box.innerHTML = `
        <h2 class="signin-title" data-spiky>${esc(opts.title || '🔑 GROWN-UP ONLY')}</h2>
        <p class="signin-note">${opts.note || 'Type the <b>master password</b> to continue:'}</p>
        <form class="signin-form" autocomplete="off">
          <input class="signin-input" id="signin-pass" type="password" maxlength="32" placeholder="Master password..." aria-label="Master password" enterkeyhint="go">
          <button class="btn btn-go signin-pass-go" type="submit">${esc(opts.go || 'Unlock')}</button>
        </form>
        ${wrong ? '<p class="signin-wrong" style="color:#b23b2e;font-weight:700;margin:6px 0">❌ That\'s not the master password.</p>' : ''}
        <button class="btn signin-pass-back" type="button">← cancel</button>`;
      UI.spikyAll(box);
      const form = box.querySelector('.signin-form');
      const inp = box.querySelector('#signin-pass');
      form.addEventListener('submit', e => {
        e.preventDefault();
        if (hashPass(inp.value.trim()) === GROWNUP_HASH) { modal.close(); if (opts.onOk) opts.onOk(); return; }
        inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 500);
        render(true);
      });
      box.querySelector('.signin-pass-back').addEventListener('click', () => { modal.close(); if (opts.onCancel) opts.onCancel(); });
      setTimeout(() => inp.focus(), 60);
    };
    const modal = UI.openModal(box, { locked: true });
    render(false);
    return modal;
  },

  // GROWN-UP ADMIN: type the master password, then view EVERY character
  // (on this device and in the cloud), fix their money/day/job, restore a
  // wiped one from an automatic backup, or clear a forgotten password.
  // `onExit` returns to the "Who's playing?" screen.
  _adminPanel(box, onExit) {
    const back = '<button class="btn signin-pass-back" type="button" style="margin-top:10px">← back</button>';
    const summary = d => {
      const job = JOBS[d.path && d.path.jobId];
      return `Day ${d.day || 1} · ${fmtMoney(d.wealth || 0)} · ${job ? job.name : '—'}`;
    };

    // 1) master-password gate --------------------------------------------
    const askMaster = wrong => {
      box.innerHTML = `
        <h2 class="signin-title" data-spiky>🔑 GROWN-UP ADMIN</h2>
        <p class="signin-note">Grown-ups only! Type the <b>master password</b> to fix or restore characters:</p>
        <form class="signin-form" autocomplete="off">
          <input class="signin-input" id="signin-pass" type="password" maxlength="32" placeholder="Master password..." aria-label="Master password" enterkeyhint="go">
          <button class="btn btn-go signin-pass-go" type="submit">Unlock</button>
        </form>
        ${wrong ? '<p class="signin-wrong" style="color:#b23b2e;font-weight:700;margin:6px 0">❌ That\'s not the master password.</p>' : ''}
        <button class="btn signin-pass-back" type="button">← back</button>`;
      UI.spikyAll(box);
      const form = box.querySelector('.signin-form');
      const inp = box.querySelector('#signin-pass');
      form.addEventListener('submit', e => {
        e.preventDefault();
        if (hashPass(inp.value.trim()) === GROWNUP_HASH) { showList(); return; }
        inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 500);
        askMaster(true);
      });
      box.querySelector('.signin-pass-back').addEventListener('click', () => onExit());
      setTimeout(() => inp.focus(), 60);
    };

    // 2) the roster of every character -----------------------------------
    const showList = async () => {
      box.innerHTML = `
        <h2 class="signin-title" data-spiky>🔑 GROWN-UP ADMIN</h2>
        <p class="signin-note">Loading everyone…</p>`;
      UI.spikyAll(box);
      const chars = await Admin.allCharacters();
      const rows = chars.length ? chars.map((c, i) => {
        const job = JOBS[c.data.path && c.data.path.jobId];
        const where = c.where === 'cloud' ? '☁️' : c.where === 'both' ? '☁️📱' : '📱';
        const lock = c.data.pass ? '🔒' : '🔓';
        return `<div class="admin-row grownup-row" data-i="${i}" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 4px;border-bottom:1px solid rgba(43,43,51,.12)">
          <span style="display:flex;align-items:center;gap:8px;min-width:0">
            <span style="font-size:1.5em">${c.data.avatar || (job ? job.emoji : '🙂')}</span>
            <span style="min-width:0">
              <b style="display:block">${esc(c.name)} <span style="font-weight:400;opacity:.6;font-size:.8em">${where} ${lock}</span></b>
              <small style="opacity:.75">${esc(summary(c.data))}</small>
            </span>
          </span>
          <span style="display:flex;gap:4px;flex-shrink:0">
            <button class="btn admin-edit" data-i="${i}" style="font-size:.78em">Edit</button>
            <button class="btn admin-restore" data-i="${i}" style="font-size:.78em">Restore</button>
            ${c.data.pass ? `<button class="btn grownup-clear admin-clear" data-name="${esc(c.name)}" data-i="${i}" style="font-size:.78em">🔓</button>` : ''}
          </span>
        </div>`;
      }).join('') : '<p class="signin-note">No characters found — on this device or in the cloud.</p>';
      box.innerHTML = `
        <h2 class="signin-title" data-spiky>🔑 GROWN-UP ADMIN</h2>
        <p class="signin-note">Tap <b>Edit</b> to change money/day/job, <b>Restore</b> to bring back a wiped character, or 🔓 to clear a password.</p>
        <div class="grownup-list admin-list" style="text-align:left;max-width:360px;margin:0 auto;max-height:48vh;overflow:auto">${rows}</div>
        <button class="btn admin-founder" type="button" style="margin-top:10px">📢 Founder tools (messages &amp; specials)</button>
        <button class="btn signin-pass-back" type="button" style="margin-top:6px">← done</button>`;
      UI.spikyAll(box);
      box.querySelector('.admin-founder').addEventListener('click', () => founderConsole());
      box.querySelectorAll('.admin-edit').forEach(b => b.addEventListener('click', () => editChar(chars[+b.dataset.i], chars)));
      box.querySelectorAll('.admin-restore').forEach(b => b.addEventListener('click', () => restoreChar(chars[+b.dataset.i])));
      box.querySelectorAll('.admin-clear').forEach(b => b.addEventListener('click', () => {
        const c = chars[+b.dataset.i];
        Profiles.clearPass(c.name);
        if (c.data) { delete c.data.pass; delete c.data.secretQ; delete c.data.secretA; }
        if (Cloud.on()) Cloud.save(c.name, c.data).catch(() => { /* offline */ });
        UI.toast(`Cleared ${c.name}'s password`, '🔓');
        showList();
      }));
      box.querySelector('.signin-pass-back').addEventListener('click', () => onExit());
    };

    // 3) edit one character's money / day / job --------------------------
    const editChar = (entry, allChars) => {
      const d = entry.data;
      const jobs = Object.keys(JOBS).sort((a, b) => JOBS[a].name.localeCompare(JOBS[b].name));
      const curJob = d.path && d.path.jobId;
      box.innerHTML = `
        <h2 class="signin-title" data-spiky>✏️ EDIT</h2>
        <p class="signin-note">Change <b>${esc(entry.name)}</b> — then Save.</p>
        <form class="signin-form admin-form" autocomplete="off" style="display:flex;flex-direction:column;gap:10px;max-width:300px;margin:0 auto;text-align:left">
          <label style="font-weight:700">🙂 Name
            <input class="signin-input admin-in" id="admin-name" type="text" maxlength="20" value="${esc(entry.name)}" style="width:100%">
          </label>
          <label style="font-weight:700">💰 Money
            <input class="signin-input admin-in" id="admin-wealth" type="number" step="1" value="${Math.floor(d.wealth || 0)}" style="width:100%">
          </label>
          <label style="font-weight:700">📅 Day
            <input class="signin-input admin-in" id="admin-day" type="number" min="1" step="1" value="${Math.max(1, d.day || 1)}" style="width:100%">
          </label>
          <label style="font-weight:700">🧰 Job
            <select class="signin-input admin-in" id="admin-job" style="width:100%">
              ${jobs.map(id => `<option value="${id}"${id === curJob ? ' selected' : ''}>${esc(JOBS[id].name)}</option>`).join('')}
            </select>
          </label>
          <p class="signin-wrong admin-name-err" style="display:none;color:#b23b2e;font-weight:700;margin:0">❌ That name is already taken.</p>
          <button class="btn btn-go admin-save" type="submit">Save changes</button>
        </form>
        <button class="btn btn-danger admin-delete" type="button" style="margin-top:10px">🗑️ Delete this character</button>
        ${back}`;
      UI.spikyAll(box);
      box.querySelector('.admin-form').addEventListener('submit', async e => {
        e.preventDefault();
        const newName = box.querySelector('#admin-name').value.trim().slice(0, 20) || entry.name;
        const w = Math.floor(Number(box.querySelector('#admin-wealth').value));
        const day = Math.max(1, Math.floor(Number(box.querySelector('#admin-day').value)));
        const jobId = box.querySelector('#admin-job').value;
        const renaming = Profiles.key(newName) !== Profiles.key(entry.name);
        if (renaming && (allChars || []).some(c => c !== entry && Profiles.key(c.name) === Profiles.key(newName))) {
          box.querySelector('.admin-name-err').style.display = 'block';
          return;
        }
        const next = Object.assign(State.fresh(), d);   // fill any missing fields
        next.name = newName;
        next.wealth = isFinite(w) ? w : (d.wealth || 0);
        next.day = isFinite(day) ? day : (d.day || 1);
        if (JOBS[jobId]) {
          const rank = (d.path && d.path.rank) || 0;
          const career = (d.path && d.path.career) || 0;
          next.path = { jobId, rank: Math.min(rank, RANK_UP_AT.length - 1), career };
        }
        next.lastPlayed = Date.now();
        if (next.stats && next.wealth > (next.stats.peakWealth || 0)) next.stats.peakWealth = next.wealth;
        if (renaming) await Admin.renameCharacter(entry.name, newName, next);
        else await Admin.saveCharacter(newName, next);
        entry.name = newName; entry.data = next;
        UI.toast(`Saved ${newName}`, '✅');
        showList();
      });
      box.querySelector('.admin-delete').addEventListener('click', () => {
        const c = el('div', 'day-summary');
        c.innerHTML = `<h2 data-spiky>DELETE ${esc(entry.name)}?</h2>
          <p>This removes <b>${esc(entry.name)}</b> from the game — for everyone. A backup is tucked away first, just in case.</p>
          <div class="summary-actions">
            <button class="btn btn-danger" id="del-yes">Yes, delete</button>
            <button class="btn" id="del-no">Cancel</button>
          </div>`;
        const conf = UI.openModal(c);
        UI.spikyAll(c);
        c.querySelector('#del-yes').addEventListener('click', async () => {
          conf.close();
          await Admin.deleteCharacter(entry.name, entry.data);
          UI.toast(`Deleted ${entry.name}`, '🗑️');
          showList();
        });
        c.querySelector('#del-no').addEventListener('click', () => conf.close());
      });
      box.querySelector('.signin-pass-back').addEventListener('click', () => showList());
    };

    // 4) restore one character from an automatic backup ------------------
    const restoreChar = async entry => {
      box.innerHTML = `
        <h2 class="signin-title" data-spiky>♻️ RESTORE</h2>
        <p class="signin-note">Looking for saved snapshots of <b>${esc(entry.name)}</b>…</p>`;
      UI.spikyAll(box);
      const snaps = await Backups.list(entry.name);
      const rows = snaps.length ? snaps.map((s, i) => {
        const when = new Date(s.at || 0);
        const label = isFinite(when.getTime()) && s.at ? when.toLocaleString() : 'earlier';
        return `<button class="btn admin-snap" data-i="${i}" style="display:block;width:100%;text-align:left;margin:5px 0;font-size:.86em">
          <b>📅 ${esc(label)}</b><br><small style="opacity:.8">${esc(summary(s.snapshot || {}))}</small>
        </button>`;
      }).join('') : `<p class="signin-note">No snapshots saved yet for <b>${esc(entry.name)}</b>. From now on the game saves one automatically whenever they sign out or start over.</p>`;
      box.innerHTML = `
        <h2 class="signin-title" data-spiky>♻️ RESTORE</h2>
        <p class="signin-note">Pick a snapshot to bring <b>${esc(entry.name)}</b> back to:</p>
        <div class="admin-snaps" style="max-width:340px;margin:0 auto;max-height:48vh;overflow:auto">${rows}</div>
        ${back}`;
      UI.spikyAll(box);
      box.querySelectorAll('.admin-snap').forEach(b => b.addEventListener('click', () => {
        const snap = snaps[+b.dataset.i];
        const restored = Object.assign(State.fresh(), snap.snapshot || {});
        restored.name = entry.name;
        if (!restored.path || !JOBS[restored.path.jobId]) restored.path = { jobId: 'fisherman', rank: 0, career: 0 };
        restored.lastPlayed = Date.now();
        const c = el('div', 'day-summary');
        c.innerHTML = `<h2 data-spiky>RESTORE THIS?</h2>
          <p>Bring <b>${esc(entry.name)}</b> back to <b>${esc(summary(restored))}</b>? This replaces their current progress.</p>
          <div class="summary-actions">
            <button class="btn btn-go" id="rs-yes">Yes, restore</button>
            <button class="btn" id="rs-no">Cancel</button>
          </div>`;
        const conf = UI.openModal(c);
        UI.spikyAll(c);
        c.querySelector('#rs-yes').addEventListener('click', async () => {
          conf.close();
          entry.data = restored;
          await Admin.saveCharacter(entry.name, restored);
          UI.toast(`Restored ${entry.name}`, '♻️');
          UI.confetti(12);
          showList();
        });
        c.querySelector('#rs-no').addEventListener('click', () => conf.close());
      }));
      box.querySelector('.signin-pass-back').addEventListener('click', () => showList());
    };

    // 5) founder tools — the parent (with the master password) can open them too.
    const founderConsole = () => UI.founderTools(box, showList);

    askMaster(false);
  },

  // FOUNDER TOOLS — start money specials (sales/events) and pick the special
  // banner's color. Renders into `box`; `onBack` returns where you came from.
  // Used by BOTH the grown-up admin panel and a founder's home button.
  async founderTools(box, onBack) {
    box.innerHTML = `<h2 class="signin-title" data-spiky>📢 FOUNDER TOOLS</h2><p class="signin-note">Loading…</p>`;
    UI.spikyAll(box);
    await Founder.load();
    const endOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); };
    const jobs = Object.keys(JOBS).sort((a, b) => JOBS[a].name.localeCompare(JOBS[b].name));
    const COLORS = [['', 'Default'], ['#f6d55c', 'Yellow'], ['#f39ac0', 'Pink'], ['#7fc8f0', 'Blue'], ['#9ad98f', 'Green'], ['#c8a2e8', 'Purple'], ['#f0a868', 'Orange']];
    const render = () => {
      const active = Founder.activeSpecials();
      const cur = (Founder.banner && Founder.banner.color) || '';
      box.innerHTML = `
        <h2 class="signin-title" data-spiky>📢 FOUNDER TOOLS</h2>
        <div class="fc-wrap" style="text-align:left;max-width:360px;margin:0 auto;display:grid;gap:14px">
          <div class="fc-card">
            <p class="signin-note" style="margin:0 0 6px"><b>🎉 Start a money special (a sale!)</b></p>
            <select id="fc-job" class="signin-input" style="width:100%;box-sizing:border-box;margin-bottom:6px">${jobs.map(id => `<option value="${id}">${esc(JOBS[id].name)}</option>`).join('')}</select>
            <div style="display:flex;gap:6px;margin-bottom:6px">
              <select id="fc-mult" class="signin-input" style="flex:1;min-width:0"><option value="2">2× money</option><option value="3">3× money</option><option value="5">5× money</option></select>
              <select id="fc-dur" class="signin-input" style="flex:1;min-width:0"><option value="today">rest of today</option><option value="1">1 hour</option><option value="3">3 hours</option><option value="168">1 week</option></select>
            </div>
            <button class="btn btn-go" id="fc-special" style="width:100%">Start the special</button>
          </div>
          ${active.length ? `<div class="fc-card"><p class="signin-note" style="margin:0 0 6px"><b>Running specials</b></p>${active.map(s => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:4px 0"><span>${esc((JOBS[s.jobId] || {}).name || s.jobId)} — <b>${s.mult}×</b></span><button class="btn fc-endspecial" data-job="${esc(s.jobId)}" style="font-size:.8em">End now</button></div>`).join('')}</div>` : ''}
          <div class="fc-card">
            <p class="signin-note" style="margin:0 0 6px"><b>🎨 Banner color</b></p>
            <div class="fc-colors" style="display:flex;flex-wrap:wrap;gap:6px">
              ${COLORS.map(([c, name]) => `<button type="button" class="btn fc-color${c === cur ? ' picked' : ''}" data-color="${c}" title="${name}" style="width:34px;height:34px;padding:0;${c ? `background:${c}` : ''}">${c ? '' : '∅'}</button>`).join('')}
            </div>
            <div class="founder-special-row" style="margin-top:8px${cur ? `;background:${esc(cur)}` : ''}">🎉 <b>2× MONEY</b> preview</div>
          </div>
        </div>
        <button class="btn signin-pass-back" type="button" style="margin-top:12px">← back</button>`;
      UI.spikyAll(box);
      box.querySelector('#fc-special').addEventListener('click', async () => {
        const jobId = box.querySelector('#fc-job').value;
        const mult = Number(box.querySelector('#fc-mult').value);
        const dv = box.querySelector('#fc-dur').value;
        const until = dv === 'today' ? endOfToday() : Date.now() + Number(dv) * 3600000;
        const jobName = (JOBS[jobId] || {}).name || jobId;
        await Founder.setSpecial(jobId, mult, until);
        UI.toast(`${mult}× ${jobName} is LIVE!`, '🎉');
        UI.confetti(14);
        render();
      });
      box.querySelectorAll('.fc-endspecial').forEach(b => b.addEventListener('click', async () => {
        await Founder.clearSpecial(b.dataset.job);
        UI.toast('Special ended', '🛑');
        render();
      }));
      box.querySelectorAll('.fc-color').forEach(b => b.addEventListener('click', async () => {
        await Founder.setBanner(b.dataset.color);
        UI.toast('Banner color set', '🎨');
        render();
      }));
      box.querySelector('.signin-pass-back').addEventListener('click', () => { if (onBack) onBack(); });
    };
    render();
  },

  // Save the current character and go back to the "Who's playing?" screen.
  switchPlayer() {
    State.save();
    // A game might be mid-play (the name pill is on the WORK screen too) — stop
    // it first so its loop doesn't run against a signed-out character.
    if (typeof GAMES !== 'undefined') Object.values(GAMES).forEach(g => { if (g && g.running && g.stop) g.stop(); });
    Profiles.signOut();
    UI.signInGate(() => { State.load(); renderCurrentPage(); });
  },

  refreshWealth() {
    const debt = State.data.wealth < 0;
    const pill = document.getElementById('wealth-pill');
    if (pill) { pill.textContent = fmtMoney(State.data.wealth); pill.classList.toggle('in-debt', debt); }
    document.querySelectorAll('[data-wealth]').forEach(n => { n.textContent = fmtMoney(State.data.wealth); n.classList.toggle('in-debt', debt); });
  },

  // A floating "+$500" that drifts up from the wealth pill.
  moneyPop(amount) {
    const pill = document.getElementById('wealth-pill');
    const pop = el('div', 'money-pop', (amount >= 0 ? '+' : '−') + fmtMoney(Math.abs(amount)));
    if (amount < 0) pop.classList.add('down');
    document.body.appendChild(pop);
    if (pill) {
      const r = pill.getBoundingClientRect();
      pop.style.left = (r.left + r.width / 2) + 'px';
      pop.style.top = (r.bottom + 6) + 'px';
    } else {
      pop.style.left = '50%'; pop.style.top = '70px';
    }
    setTimeout(() => pop.remove(), 1400);
    this.refreshWealth();
  },

  // Hand-lettered titles: every letter gets its own little tilt.
  spiky(node) {
    const text = node.textContent;
    node.textContent = '';
    node.classList.add('spiky');
    [...text].forEach((ch, i) => {
      if (ch === ' ') {
        node.appendChild(document.createTextNode(' ')); // keep real spaces between words
        return;
      }
      const span = el('span');
      span.textContent = ch;
      const tilt = ((i * 37) % 9) - 4;                  // deterministic wobble
      const lift = ((i * 23) % 5) - 2;
      span.style.transform = `rotate(${tilt}deg) translateY(${lift}px)`;
      node.appendChild(span);
    });
  },

  spikyAll(root) { (root || document).querySelectorAll('[data-spiky]').forEach(n => UI.spiky(n)); },

  // ---- modal --------------------------------------------------
  openModal(content, opts = {}) {
    const overlay = el('div', 'overlay');
    const box = el('div', 'modal card');
    if (typeof content === 'string') box.innerHTML = content; else box.appendChild(content);
    if (!opts.locked) {
      const x = el('button', 'modal-x', '✕');
      x.addEventListener('click', close);
      box.appendChild(x);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    }
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    function close() { overlay.remove(); if (opts.onClose) opts.onClose(); }
    return { close, box };
  },

  toast(message, emoji = '') {
    const t = el('div', 'toast', `${emoji} ${esc(message)}`.trim());
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2600);
  },

  confetti(count = 26) {
    if (REDUCED_MOTION) return;
    const bits = ['🎉', '⭐', '💰', '🎊', '✨'];
    for (let i = 0; i < count; i++) {
      const bit = el('span', 'confetti', bits[i % bits.length]);
      bit.style.left = (5 + Math.random() * 90) + 'vw';
      bit.style.animationDelay = (Math.random() * 0.5) + 's';
      bit.style.fontSize = (14 + Math.random() * 22) + 'px';
      document.body.appendChild(bit);
      setTimeout(() => bit.remove(), 2600);
    }
  },

  // ---- THE WHEEL ----------------------------------------------
  // segments: [{ label, color, value }]  → onDone(segment) after the spin.
  // Segments with value 'again' automatically respin for free.
  spinWheel({ title = 'SPIN!', segments, onDone }) {
    const wrap = el('div', 'wheel-wrap');
    wrap.innerHTML = `
      <h2 class="wheel-title" data-spiky>${esc(title)}</h2>
      <div class="wheel-stage">
        <canvas width="640" height="640"></canvas>
        <div class="wheel-pointer">▼</div>
        <div class="wheel-hub">🎯</div>
      </div>
      <button class="btn btn-go wheel-spin-btn">SPIN THE WHEEL</button>
      <p class="wheel-note">No take-backs. What job will <u>YOU</u> get?</p>`;
    const modal = UI.openModal(wrap, { locked: true });
    UI.spikyAll(wrap);

    const canvas = wrap.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const n = segments.length;
    const slice = (Math.PI * 2) / n;
    let rotation = -Math.PI / 2 - slice / 2; // slice 0 starts centered at the top

    function draw() {
      const r = canvas.width / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(r, r);
      segments.forEach((seg, i) => {
        const a0 = rotation + i * slice;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r - 6, a0, a0 + slice);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();
        ctx.strokeStyle = '#2b2b33';
        ctx.lineWidth = 3;
        ctx.stroke();
        // label along the slice
        ctx.save();
        ctx.rotate(a0 + slice / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#2b2b33';
        ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
        ctx.fillText(seg.label.slice(0, 14), r - 22, 8);
        ctx.restore();
      });
      ctx.restore();
      // outer ring
      ctx.beginPath();
      ctx.arc(r, r, r - 5, 0, Math.PI * 2);
      ctx.strokeStyle = '#2b2b33';
      ctx.lineWidth = 8;
      ctx.stroke();
    }
    draw();

    const btn = wrap.querySelector('.wheel-spin-btn');
    btn.addEventListener('click', () => spin());

    function spin() {
      btn.disabled = true;
      btn.textContent = '...';
      const winner = Math.floor(Math.random() * n);
      // rotate so the winner's center lands under the top pointer
      const target = -Math.PI / 2 - (winner + 0.5) * slice;
      const current = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const extraSpins = REDUCED_MOTION ? 1 : 5 + Math.floor(Math.random() * 3);
      const finalRotation = rotation + (extraSpins * Math.PI * 2) + (target - current);
      const startRotation = rotation;
      const duration = REDUCED_MOTION ? 700 : 3800;
      const startTime = performance.now();

      (function tick(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - t, 3); // ease-out
        rotation = startRotation + (finalRotation - startRotation) * ease;
        draw();
        if (t < 1) { requestAnimationFrame(tick); return; }
        const seg = segments[winner];
        if (seg.value === 'again') {
          UI.toast('SPIN AGAIN! Free spin!', '🔁');
          btn.disabled = false;
          btn.textContent = 'SPIN AGAIN!';
          return;
        }
        setTimeout(() => { modal.close(); onDone(seg); }, 650);
      })(performance.now());
    }
  },

  // Wheel segments for jobs, colored like markers.
  jobWheelSegments(jobIds, spinAgainCount = 2) {
    const markers = ['#79b4d9', '#8fca8f', '#e6c86e', '#d98f79', '#b79bd9', '#e69ac0', '#7fcdc3'];
    const segs = jobIds.map((id, i) => ({
      label: JOBS[id].name,
      color: markers[i % markers.length],
      value: id,
    }));
    for (let i = 0; i < spinAgainCount; i++) {
      const at = Math.floor(((i + 1) * segs.length) / (spinAgainCount + 1));
      segs.splice(at, 0, { label: 'Spin again', color: '#f3e19a', value: 'again' });
    }
    return segs;
  },

  // A little job card used in offers, wheel results, chests.
  jobCardHTML(jobId, { rank = 0 } = {}) {
    const job = JOBS[jobId];
    const rarity = RARITY[job.rarity];
    const salary = job.special === 'fishing'
      ? 'Depends on fish caught'
      : fmtMoney(job.salary * RANK_SALARY_MULT[rank]) + ' / day';
    return `
      <div class="job-card-head">
        <b class="job-card-name">${esc(job.name)}</b>
        <span class="rarity-chip" style="--chip:${rarity.color}">${rarity.label}</span>
        <span class="hex hex-small"><span>${job.emoji}</span></span>
      </div>
      <div class="job-card-stats">
        <div>Power: <b>${job.power}%</b></div>
        <div>Salary: <b>${salary}</b></div>
        <div>Fatality rate: <b class="${job.fatality >= 40 ? 'danger-text' : ''}">${job.fatality}%</b></div>
      </div>`;
  },
};

// ============================================================
// ADMIN — the grown-up's tools behind the master password.
// Sees every character (this device AND the cloud) so the owner can
// fix or restore anyone's game, even one that lives on another device.
// ============================================================
const Admin = {
  // Everyone we can find, merged by name. Cloud data wins when a character
  // exists both here and in the cloud (the cloud is the shared source).
  async allCharacters() {
    const byName = new Map();
    Profiles.list().forEach(p => {
      byName.set(Profiles.key(p.name), { name: p.name, data: p.data, where: 'local' });
    });
    if (Cloud.on()) {
      let all = null;
      try { all = await Cloud.loadAll(); } catch (e) { all = null; }
      if (all && typeof all === 'object') {
        Object.values(all).forEach(rec => {
          if (!rec || typeof rec !== 'object' || !rec.path) return;
          const name = rec.name || 'Player';
          const k = Profiles.key(name);
          byName.set(k, { name, data: rec, where: byName.has(k) ? 'both' : 'cloud' });
        });
      }
    }
    return [...byName.values()].sort((a, b) => (b.data.lastPlayed || 0) - (a.data.lastPlayed || 0));
  },

  // Persist an edit/restore to wherever the character lives: this device's
  // save if they have one here, AND the cloud so it reaches their device.
  async saveCharacter(name, data) {
    const key = Profiles.key(name);
    if (Profiles.store.players[key]) {
      Profiles.store.players[key].data = data;
      if (Profiles.store.current === key) State.data = data;
      Profiles._write();
    }
    if (Cloud.on()) { try { await Cloud.save(name, data); } catch (e) { /* offline — retries via device sync */ } }
  },

  // Remove a character for everyone. A backup is tucked away first, so a
  // mistaken delete is still recoverable.
  async deleteCharacter(name, data) {
    if (data) Backups.save(name, data);
    Profiles.erase(name);                                 // this device
    if (Cloud.on()) { try { await Cloud.remove(name); } catch (e) { /* offline */ } }
  },

  // Rename a character (re-keys it here and in the cloud). Returns
  // { ok: true } or { error: 'exists' } if the new name is already taken.
  async renameCharacter(oldName, newName, data) {
    const clean = String(newName).trim().slice(0, 20) || 'Player';
    const oldKey = Profiles.key(oldName);
    const newKey = Profiles.key(clean);
    if (newKey !== oldKey && Profiles.store.players[newKey]) return { error: 'exists' };
    data = Object.assign({}, data, { name: clean });
    if (Profiles.store.players[oldKey]) {                 // only if it lives on this device
      delete Profiles.store.players[oldKey];
      Profiles.store.players[newKey] = { name: clean, data };
      if (Profiles.store.current === oldKey) { Profiles.store.current = newKey; State.data = data; }
      Profiles._write();
    }
    if (Cloud.on()) {
      try { await Cloud.save(clean, data); if (newKey !== oldKey) await Cloud.remove(oldName); }
      catch (e) { /* offline */ }
    }
    return { ok: true };
  },
};
