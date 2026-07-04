/* ============================================================
   APPLICATIONS — today's job offers (accept or decline!) and
   the SHOP: lucky items, chests, and one very mythical chest.
   ============================================================ */

PAGES.applications = {
  init(root) {
    this.root = root;
    UI.spikyAll(root);
    State.ensureOffers();
    this.renderOffers();
    this.renderShop();
  },

  // ---- daily offers -------------------------------------------
  renderOffers() {
    const box = this.root.querySelector('#apps-offers');
    if (!State.data.offers.length) {
      box.innerHTML = `<div class="card offer-card empty-card">No offers left today.<br>Work a day — new applications arrive tomorrow!</div>`;
      return;
    }
    box.innerHTML = '';
    State.data.offers.forEach((offer, i) => {
      const card = el('div', 'card offer-card job-card');
      card.innerHTML = `
        ${UI.jobCardHTML(offer.jobId)}
        <div class="offer-actions">
          <button class="btn btn-go" data-accept="${i}">Accept</button>
          <button class="btn btn-danger" data-decline="${i}">Decline</button>
        </div>`;
      box.appendChild(card);
    });
    box.querySelectorAll('[data-accept]').forEach(b => b.addEventListener('click', () => this.accept(+b.dataset.accept)));
    box.querySelectorAll('[data-decline]').forEach(b => b.addEventListener('click', () => this.decline(+b.dataset.decline)));
  },

  accept(index) {
    const offer = State.data.offers[index];
    if (!offer) return;
    if (offer.jobId === State.data.path.jobId) {
      UI.toast(`You are already a ${JOBS[offer.jobId].name}!`, '🤨');
      return;
    }
    const job = JOBS[offer.jobId];
    State.removeOffer(index);
    State.switchJob(offer.jobId);
    UI.confetti(24);
    Sound.jackpot();

    const content = el('div', 'day-summary');
    content.innerHTML = `
      <h2 data-spiky>YOU GOT THE JOB!</h2>
      <div class="card job-card">${UI.jobCardHTML(offer.jobId)}</div>
      <p>You start as <b>${esc(State.rankName())}</b>.${job.fatality >= 40 ? ' Try not to die.' : ''}</p>
      <div class="summary-actions">
        <a class="btn btn-go" href="levels.html" data-nav="levels">▶ Start working</a>
        <button class="btn" id="apps-stay">Keep browsing</button>
      </div>`;
    const modal = UI.openModal(content, { locked: true });
    UI.spikyAll(content);
    content.querySelector('#apps-stay').addEventListener('click', () => { modal.close(); this.renderOffers(); });
    content.querySelectorAll('a[data-nav]').forEach(a => a.addEventListener('click', () => modal.close()));
    this.renderOffers();
  },

  decline(index) {
    const offer = State.data.offers[index];
    if (!offer) return;
    State.removeOffer(index);
    UI.toast(`Declined ${JOBS[offer.jobId].name}. Their loss!`, '🗑️');
    this.renderOffers();
  },

  // ---- the shop ------------------------------------------------
  renderShop() {
    const root = this.root;
    root.querySelector('#shop-luck').textContent = '+' + State.luck() + '%';

    // LUCKY items
    const lucky = root.querySelector('#shop-lucky');
    lucky.innerHTML = '';
    Object.entries(LUCK_ITEMS).forEach(([id, item]) => {
      const owned = State.data.luckItems.includes(id);
      const card = el('div', 'card shop-item' + (owned ? ' owned' : ''));
      card.innerHTML = `
        <div class="shop-emoji">${item.emoji}</div>
        <b class="shop-name">${esc(item.name)}</b>
        <div class="shop-blurb">+${item.luck}% Luck</div>
        ${owned
          ? '<span class="owned-badge">OWNED</span>'
          : `<button class="btn btn-money" data-luck="${id}">${fmtMoney(item.cost)}</button>`}`;
      lucky.appendChild(card);
    });
    lucky.querySelectorAll('[data-luck]').forEach(b => b.addEventListener('click', () => this.buyLuck(b.dataset.luck)));

    // APPLICATIONS section
    const apps = root.querySelector('#shop-apps');
    apps.innerHTML = '';
    ['avgwheel', 'epicchest', 'anything', 'frogcard'].forEach(id => {
      const item = SHOP_EXTRAS[id];
      const card = el('div', 'card shop-item');
      card.innerHTML = `
        <div class="shop-emoji">${item.emoji}</div>
        <b class="shop-name">${esc(item.name)}</b>
        <div class="shop-blurb">${esc(item.blurb)}</div>
        <button class="btn btn-money" data-extra="${id}">${fmtMoney(item.cost)}</button>`;
      apps.appendChild(card);
    });
    apps.querySelectorAll('[data-extra]').forEach(b => b.addEventListener('click', () => this.buyExtra(b.dataset.extra)));

    // THE MYTHICAL CHEST
    const myth = root.querySelector('#shop-mythical');
    const item = SHOP_EXTRAS.mythical;
    myth.innerHTML = `
      <div class="mythical-inner">
        <div class="shop-emoji mythical-emoji">${State.data.mythicalOwned ? '👑' : item.emoji}</div>
        <b class="shop-name">${esc(item.name)}</b>
        ${State.data.mythicalOwned
          ? '<div class="shop-blurb">You own the rarest chest ever made. Show-off.</div>'
          : `<div class="shop-blurb">Only <b>${fmtMoney(item.cost)}</b> — or —</div>
             <div class="mythical-actions">
               <button class="btn btn-money" id="myth-buy">${fmtMoney(item.cost)}</button>
               <button class="btn" id="myth-real">$99 real dollars!</button>
             </div>`}
      </div>`;
    if (!State.data.mythicalOwned) {
      myth.querySelector('#myth-buy').addEventListener('click', () => this.buyMythical());
      myth.querySelector('#myth-real').addEventListener('click', () => {
        UI.openModal(`
          <div class="day-summary">
            <h2>🛑 NICE TRY!</h2>
            <p>This game <b>never ever</b> takes real money.<br>(That part is just Asher being funny.)</p>
            <p>Go catch a Jingfish instead — it's worth $20M!</p>
          </div>`);
      });
    }
  },

  buyLuck(id) {
    const item = LUCK_ITEMS[id];
    if (!State.spend(item.cost)) return this.cantAfford(item.cost);
    State.data.luckItems.push(id);
    State.save();
    UI.moneyPop(-item.cost);
    UI.confetti(14);
    Sound.jackpot();
    UI.toast(`${item.name}! Your luck is now +${State.luck()}%`, item.emoji);
    this.renderShop();
  },

  buyExtra(id) {
    const item = SHOP_EXTRAS[id];
    if (State.data.wealth < item.cost) return this.cantAfford(item.cost);

    if (id === 'avgwheel') {
      State.spend(item.cost);
      UI.moneyPop(-item.cost);
      const commons = Object.keys(JOBS).filter(jid => JOBS[jid].rarity === 'common' && !JOBS[jid].shopOnly);
      UI.spinWheel({
        title: 'THE AVERAGE WHEEL',
        segments: UI.jobWheelSegments(commons, 1),
        onDone: seg => {
          State.addOffer(seg.value);
          UI.toast(`${JOBS[seg.value].name} application added to your offers!`, '📋');
          this.renderOffers();
        },
      });
    } else if (id === 'epicchest') {
      State.spend(item.cost);
      UI.moneyPop(-item.cost);
      this.openChest('EPIC CHEST', '🎁', () => this.rollEpicLoot());
    } else if (id === 'anything') {
      State.spend(item.cost);
      UI.moneyPop(-item.cost);
      this.openChest('COULD-BE-ANYTHING BOX', '❓', () => this.rollAnythingLoot());
    } else if (id === 'frogcard') {
      State.spend(item.cost);
      UI.moneyPop(-item.cost);
      State.addOffer('frogkeeper');
      const content = el('div', 'day-summary');
      content.innerHTML = `
        <h2 data-spiky>RIBBIT.</h2>
        <div class="card job-card">${UI.jobCardHTML('frogkeeper')}</div>
        <p>The Frog Keeper application is waiting in your Daily offers.</p>`;
      UI.openModal(content);
      UI.spikyAll(content);
      this.renderOffers();
    }
  },

  buyMythical() {
    const item = SHOP_EXTRAS.mythical;
    if (!State.spend(item.cost)) return this.cantAfford(item.cost);
    UI.moneyPop(-item.cost);
    State.data.mythicalOwned = true;
    State.save();
    this.openChest('THE MYTHICAL CHEST', '🌈', () => {
      const prize = 500e9 + Math.floor(Math.random() * 500e9);
      State.addWealth(prize);
      State.addOffer('king');
      const missing = Object.keys(LUCK_ITEMS).filter(id => !State.data.luckItems.includes(id));
      missing.forEach(id => State.data.luckItems.push(id));
      State.save();
      UI.confetti(80);
      return [
        `💰 <b>${fmtMoney(prize)}</b> in rainbow black diamonds`,
        `👑 A <b>KING</b> job application`,
        missing.length ? `🍀 Every lucky item you were missing` : `🍀 (You already had every lucky item)`,
      ];
    });
  },

  openChest(title, emoji, lootFn) {
    const content = el('div', 'day-summary chest-box');
    content.innerHTML = `
      <h2 data-spiky>${esc(title)}</h2>
      <div class="chest-emoji" id="chest-emoji">${emoji}</div>
      <div class="summary-actions"><button class="btn btn-go" id="chest-open">OPEN IT!</button></div>
      <ul class="collection" id="chest-loot" hidden></ul>`;
    const modal = UI.openModal(content, { locked: true });
    UI.spikyAll(content);
    content.querySelector('#chest-open').addEventListener('click', () => {
      const chestEl = content.querySelector('#chest-emoji');
      chestEl.classList.add('shaking');
      content.querySelector('#chest-open').disabled = true;
      setTimeout(() => {
        chestEl.classList.remove('shaking');
        chestEl.textContent = '✨';
        const loot = lootFn();
        const list = content.querySelector('#chest-loot');
        list.hidden = false;
        list.innerHTML = loot.map(l => `<li>${l}</li>`).join('');
        Sound.jackpot();
        UI.refreshWealth();
        const done = el('div', 'summary-actions', '<button class="btn btn-go">Take it!</button>');
        content.appendChild(done);
        done.querySelector('button').addEventListener('click', () => { modal.close(); this.renderOffers(); this.renderShop(); });
      }, REDUCED_MOTION ? 100 : 900);
    });
  },

  rollEpicLoot() {
    const roll = Math.random();
    const luckBoost = State.luck() / 100;
    if (roll < 0.45) {
      const prize = Math.floor((15e6 + Math.random() * 45e6) * (1 + luckBoost / 4));
      State.addWealth(prize);
      return [`💰 A pile of wealth: <b>${fmtMoney(prize)}</b>`];
    }
    if (roll < 0.8) {
      const missing = Object.keys(LUCK_ITEMS).filter(id => !State.data.luckItems.includes(id));
      if (missing.length) {
        const id = missing[Math.floor(Math.random() * missing.length)];
        State.data.luckItems.push(id);
        State.save();
        return [`${LUCK_ITEMS[id].emoji} <b>${esc(LUCK_ITEMS[id].name)}</b> (+${LUCK_ITEMS[id].luck}% luck!)`];
      }
      const prize = 30e6;
      State.addWealth(prize);
      return [`💰 You had every lucky item, so: <b>${fmtMoney(prize)}</b>`];
    }
    const pool = Object.keys(JOBS).filter(id => ['rare', 'epic'].includes(JOBS[id].rarity) && !JOBS[id].shopOnly);
    const jobId = pool[Math.floor(Math.random() * pool.length)];
    State.addOffer(jobId);
    return [`📋 A <b>${esc(JOBS[jobId].name)}</b> job application (check your offers!)`];
  },

  rollAnythingLoot() {
    const outcomes = [
      () => { State.addWealth(5); return ['💵 Five dollars. <b>$5</b>. That is all.']; },
      () => { const p = 77e3; State.addWealth(p); return [`💰 A briefcase with <b>${fmtMoney(p)}</b>`]; },
      () => { const p = Math.floor(1e6 + Math.random() * 149e6); State.addWealth(p); return [`💰 WHOA: <b>${fmtMoney(p)}</b>!`]; },
      () => { State.addWealth(1000); return ['🐠 A Char?! In a box?! Sold for <b>$1,000</b>']; },
      () => { const jobId = State.rollOfferJob(); State.addOffer(jobId); return [`📋 A <b>${esc(JOBS[jobId].name)}</b> job application`]; },
      () => { State.addOffer(State.rollOfferJob()); State.addOffer(State.rollOfferJob()); return ['📋📋 TWO extra job applications']; },
      () => ['🕳️ It\'s empty. Classic.'],
      () => { const p = 10e6; State.addWealth(p); return [`💰 Your money back... doubled: <b>${fmtMoney(p * 2 - 10e6)}</b>... wait, no, just <b>${fmtMoney(p)}</b>`]; },
    ];
    return outcomes[Math.floor(Math.random() * outcomes.length)]();
  },

  cantAfford(cost) {
    UI.toast(`You need ${fmtMoney(cost)} for that!`, '🚫');
    Sound.danger();
  },
};
