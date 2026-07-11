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
    this.startOfferTimer();
  },

  // clean up the countdown when leaving the page
  leave() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  },

  // Tick the "next batch in m:ss" countdown; refresh the offers when it's due.
  startOfferTimer() {
    if (this._timer) clearInterval(this._timer);
    const tick = () => {
      const ms = State.msUntilOffers();
      const el = this.root.querySelector('#apps-timer');
      if (ms <= 0) {
        State.ensureOffers();       // rolls a fresh batch (10 minutes have passed)
        this.renderOffers();
        return;
      }
      if (el) {
        const s = Math.ceil(ms / 1000);
        el.textContent = `🕒 New applications in ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      }
    };
    tick();
    this._timer = setInterval(tick, 1000);
  },

  // ---- job offers ---------------------------------------------
  renderOffers() {
    const box = this.root.querySelector('#apps-offers');
    if (!State.data.offers.length) {
      const s = Math.ceil(State.msUntilOffers() / 1000);
      box.innerHTML = `<div class="card offer-card empty-card">No applications left right now.<br>A fresh batch arrives in <b>${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</b>.</div>`;
      return;
    }
    box.innerHTML = '';
    State.data.offers.forEach((offer, i) => {
      const card = el('div', 'card offer-card job-card');
      card.innerHTML = `
        ${UI.jobCardHTML(offer.jobId)}
        <div class="offer-actions">
          <button class="btn btn-go" data-accept="${i}">Apply</button>
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
    // Run the full application: paperwork -> (skill trial) -> (luck draw).
    Apply.start(offer.jobId, (hired, consumed) => {
      if (consumed) {
        const i = State.data.offers.indexOf(offer);
        if (i >= 0) State.removeOffer(i);
      }
      this.renderOffers();
    });
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

    // POTIONS — cheap random gambles
    const potions = root.querySelector('#shop-potions');
    if (potions) {
      potions.innerHTML = '';
      Object.entries(POTIONS).forEach(([id, p]) => {
        const card = el('div', 'card shop-item potion-item');
        card.innerHTML = `
          <div class="shop-emoji">${p.emoji}</div>
          <b class="shop-name">${esc(p.name)}</b>
          <div class="shop-blurb">A random effect — could be great, could be deadly!</div>
          <button class="btn btn-money" data-potion="${id}">${fmtMoney(p.cost)}</button>`;
        potions.appendChild(card);
      });
      potions.querySelectorAll('[data-potion]').forEach(b => b.addEventListener('click', () => this.buyPotion(b.dataset.potion)));
    }

    // LUCKY items — show the cheapest charms you don't own yet; buying one
    // makes the next one appear (the shop restocks). Collect them all!
    const lucky = root.querySelector('#shop-lucky');
    lucky.innerHTML = '';
    const total = Object.keys(LUCK_ITEMS).length;
    const ownedCount = State.data.luckItems.filter(id => LUCK_ITEMS[id]).length;
    const unowned = Object.entries(LUCK_ITEMS)
      .filter(([id]) => !State.data.luckItems.includes(id))
      .sort((a, b) => a[1].cost - b[1].cost);
    if (unowned.length === 0) {
      lucky.innerHTML = `<div class="card shop-item lucky-complete">
        <div class="shop-emoji">✨</div>
        <b class="shop-name">Every charm collected!</b>
        <div class="shop-blurb">All ${total} lucky charms are yours. Luck maxed at <b>+${State.luck()}%</b>!</div></div>`;
    } else {
      unowned.slice(0, 4).forEach(([id, item]) => {
        const card = el('div', 'card shop-item');
        card.innerHTML = `
          <div class="shop-emoji">${item.emoji}</div>
          <b class="shop-name">${esc(item.name)}</b>
          <div class="shop-blurb">+${item.luck}% Luck</div>
          <button class="btn btn-money" data-luck="${id}">${fmtMoney(item.cost)}</button>
          <div class="shop-stock">${ownedCount}/${total} charms owned</div>`;
        lucky.appendChild(card);
      });
      lucky.querySelectorAll('[data-luck]').forEach(b => b.addEventListener('click', () => this.buyLuck(b.dataset.luck)));
    }

    // APPLICATIONS section — a ROTATING shelf of extras (just like the lucky
    // charms): buy one and a different option rotates into its place.
    const apps = root.querySelector('#shop-apps');
    apps.innerHTML = '';
    State.appShelf(SHOP_APP_SHOWN).forEach(id => {
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
    const moreLeft = Object.keys(LUCK_ITEMS).some(k => !State.data.luckItems.includes(k));
    UI.toast(`${item.name}! Luck +${State.luck()}%.${moreLeft ? ' A new charm is in stock!' : ' Every charm collected!'}`, item.emoji);
    this.renderShop();
  },

  // Drink a random potion — could be luck, cash, a jackpot, a new job,
  // a dud... or a deadly one that wipes you out.
  buyPotion(id) {
    const p = POTIONS[id];
    if (!State.spend(p.cost)) return this.cantAfford(p.cost);
    UI.moneyPop(-p.cost);
    Sound.splash();
    const outcome = this.rollPotion(p);

    const box = el('div', 'day-summary potion-reveal');
    box.innerHTML = `
      <div class="potion-glug">${p.emoji}</div>
      <h2 data-spiky>${outcome.title}</h2>
      <p>${outcome.text}</p>
      <div class="summary-actions"><button class="btn btn-go" id="potion-ok">OK</button></div>`;
    const modal = UI.openModal(box, { locked: true });
    UI.spikyAll(box);
    if (outcome.good) { UI.confetti(outcome.big ? 45 : 16); Sound.jackpot(); }
    else Sound.thud();
    box.querySelector('#potion-ok').addEventListener('click', () => {
      modal.close();
      UI.refreshWealth();
      this.renderShop();
      this.renderOffers();
    });
  },

  // Roll and APPLY a potion's random effect; returns how to show it.
  rollPotion(p) {
    const t = p.tier;   // 0 cheap, 1 mid, 2 pricey
    const kind = weightedPick([
      ['luck', 26], ['wealth', 32], ['jackpot', [4, 6, 9][t]],
      ['job', 18], ['dud', [12, 10, 7][t]], ['death', [6, 10, 14][t]],
    ]);

    if (kind === 'luck') {
      const amt = [8, 15, 30][t] + Math.floor(Math.random() * [7, 10, 20][t]);
      State.data.bonusLuck = (State.data.bonusLuck || 0) + amt;
      State.save();
      return { good: true, title: '🍀 LUCKY!', text: `The potion glows green — <b>+${amt}% luck</b>, forever! Your luck is now <b>+${State.luck()}%</b>.` };
    }
    if (kind === 'wealth') {
      const amt = Math.floor(p.cost * (2 + Math.random() * 5));
      State.addWealth(amt);
      return { good: true, title: '💰 CASH!', text: `Coins pour out of the bottle — you gained <b>${fmtMoney(amt)}</b>!` };
    }
    if (kind === 'jackpot') {
      const base = [100e3, 1e6, 10e6][t];
      const amt = base + Math.floor(Math.random() * base);
      State.addWealth(amt);
      return { good: true, big: true, title: '🎉 JACKPOT!!', text: `Liquid treasure! The potion was worth <b>${fmtMoney(amt)}</b>!!!` };
    }
    if (kind === 'job') {
      const allow = [['common', 'uncommon'], ['common', 'uncommon', 'rare'], ['uncommon', 'rare', 'epic']][t];
      const pool = Object.keys(JOBS).filter(jid => !JOBS[jid].shopOnly && allow.includes(JOBS[jid].rarity));
      const jobId = pool[Math.floor(Math.random() * pool.length)] || 'peasant';
      State.addOffer(jobId);
      return { good: true, title: '📋 A NEW JOB!', text: `A <b>${esc(JOBS[jobId].name)}</b> application fizzed up — it's in your Daily offers!` };
    }
    if (kind === 'dud') {
      return { good: false, title: '😐 ...nothing.', text: `It tastes like flat lemonade. Nothing happens. Oh well — worth a try!` };
    }
    // death — the risk you took
    const lost = State.data.wealth;
    const oldJob = State.rankName();
    State.data.wealth = 0;
    State.data.stats.knockouts += 1;
    State.switchJob('fisherman');
    State.save();
    return { good: false, death: true, title: '☠️ POISON!', text: `It was deadly! You lose <b>everything</b> (${fmtMoney(lost)}) and your job as <b>${esc(oldJob)}</b>, and wake up broke on the fishing boat.` };
  },

  buyExtra(id) {
    const item = SHOP_EXTRAS[id];
    if (State.data.wealth < item.cost) return this.cantAfford(item.cost);
    State.spend(item.cost);
    UI.moneyPop(-item.cost);
    State.rotateShelf(id);        // consumed → a DIFFERENT extra rotates into its slot
    this.renderShop();           // the shelf visibly refreshes right away

    if (id === 'avgwheel') {
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
    } else if (id === 'resume') {
      const j1 = State.rollOfferJob(), j2 = State.rollOfferJob();
      State.addOffer(j1); State.addOffer(j2);
      UI.toast(`Résumés out! ${JOBS[j1].name} & ${JOBS[j2].name} added to your offers.`, '📨');
      this.renderOffers();
    } else if (id === 'anything') {
      this.openChest('COULD-BE-ANYTHING BOX', '❓', () => this.rollAnythingLoot());
    } else if (id === 'headhunter') {
      const pool = Object.keys(JOBS).filter(jid => ['rare', 'epic'].includes(JOBS[jid].rarity) && !JOBS[jid].shopOnly);
      const jobId = pool[Math.floor(Math.random() * pool.length)] || 'bodyguard';
      State.addOffer(jobId);
      const content = el('div', 'day-summary');
      content.innerHTML = `
        <h2 data-spiky>📞 HEADHUNTER!</h2>
        <div class="card job-card">${UI.jobCardHTML(jobId)}</div>
        <p>A recruiter lined up a <b>${esc(JOBS[jobId].name)}</b> — it's waiting in your Daily offers.</p>`;
      UI.openModal(content);
      UI.spikyAll(content);
      this.renderOffers();
    } else if (id === 'epicchest') {
      this.openChest('EPIC CHEST', '🎁', () => this.rollEpicLoot());
    } else if (id === 'frogcard') {
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
      const prize = 2e12 + Math.floor(Math.random() * 4e12);
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
