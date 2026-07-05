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

// ---- page boot & navigation ----------------------------------
// The game works two ways:
//  - as separate .html pages (links navigate normally)
//  - bundled into ONE file (play.html) where links switch sections
let currentPage = null;

function Boot() {
  State.load();
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
      ['levels', 'LEVELS', 'levels.html'],
      ['applications', 'APPLICATIONS', 'applications.html'],
    ];
    const player = Profiles.currentName() || 'Player';
    header.innerHTML = `
      <a class="home-hex" href="index.html" data-nav="home" aria-label="Home">🏠</a>
      <nav>${links.map(([id, label, href]) =>
        `<a href="${href}" data-nav="${id}" class="${id === activePage ? 'active' : ''}">${label}</a>`).join('')}
      </nav>
      <button class="player-pill" id="player-pill" title="Switch player">👤 <b>${esc(player)}</b> ▾</button>
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
               <span class="signin-avatar">${job ? job.emoji : '🙂'}</span>
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
      <form class="signin-form" autocomplete="off">
        <input class="signin-input" id="signin-name" type="text" maxlength="20"
               placeholder="Type your name..." aria-label="Your name" enterkeyhint="go">
        <button class="btn btn-go signin-go" type="submit">Let's go!</button>
      </form>
      <p class="signin-note">No password needed — just your name keeps your character safe on this device.</p>`;
    const modal = UI.openModal(box, { locked: true });
    UI.spikyAll(box);

    const finish = async name => {
      // brief "loading" state while we check the cloud for this character
      const loading = el('div', 'signin');
      loading.innerHTML = `<h2 class="signin-title" data-spiky>LOADING...</h2>
        <p class="signin-note">Finding <b>${esc(name)}</b>'s character...</p>`;
      box.innerHTML = '';
      box.appendChild(loading);
      UI.spikyAll(box);
      const res = await Profiles.signInAsync(name);
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
      finish(name);
    });
    setTimeout(() => { if (!Profiles.list().length) input.focus(); }, 60);
  },

  // Save the current character and go back to the "Who's playing?" screen.
  switchPlayer() {
    State.save();
    Profiles.signOut();
    UI.signInGate(() => { State.load(); renderCurrentPage(); });
  },

  refreshWealth() {
    const pill = document.getElementById('wealth-pill');
    if (pill) pill.textContent = fmtMoney(State.data.wealth);
    document.querySelectorAll('[data-wealth]').forEach(n => { n.textContent = fmtMoney(State.data.wealth); });
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
