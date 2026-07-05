# JOB APPLICATION 🎣

**What job will YOU get?** — By Jing & Ash Games

A game designed on paper by Asher and brought to life as a website.
Start as a Lowly Fisherman, earn your wealth one catch at a time, climb the
mystery ranks of your path... or risk it all on a job with a 69% fatality rate.

## Play it live 🌐

Once GitHub Pages is turned on (Settings → Pages → Source → **GitHub Actions**),
the game is live on the web and updates itself every time a change reaches `main`:

### 🔗 https://censingbadger.github.io/Job-Application-Game/

The `.github/workflows/deploy.yml` workflow does the publishing automatically —
you never have to upload anything by hand.

## How to play

**Easiest:** open `play.html` — the whole game in a single file. Double-click it,
or send it to family so they can play too.

**The website version:** open `index.html`. Each page is its own file, just like
Asher designed it:

| Page | File | What happens there |
|---|---|---|
| Home | `index.html` | The big logo and the PLAY button |
| Paths | `paths.html` | Your career trail, mystery ranks, and the job wheel (45M to spin!) |
| Levels | `levels.html` | DO your job — fish the sea, or survive a work day |
| Applications | `applications.html` | Daily job offers (accept/decline) and the SHOP |

Your progress saves automatically in the browser.

## Players 👤

When the game opens it asks **"Who's playing?"** Type a simple name (no password!)
to start a character. Come back later, type the **same name**, and you pick up
right where you left off — your wealth, path, and luck are all still there.

Lots of people can share one device: each name is its own separate character.
Tap **switch player** any time to hop between them. It all saves in this browser
(so a character made on the iPad lives on the iPad).

## The rules of the world

- **Wealth** 💰 — you earn it by working. Fish are worth $50 (Minnow) to $20M (the legendary Jingfish).
- **Power** — how good you are at your job. Promotions raise it.
- **Luck** 🍀 — buy lucky items in the shop; rare fish and rare job offers show up more.
- **Fatality rate** ☠️ — dangerous jobs pay big, but if you miss the dodge, it's a
  hospital bill and back to the fishing boat.
- **Paths** — every job has 4 ranks. Earn money at your job to climb. The top rank is a mystery...
- One day of work = one in-game day. New job applications arrive daily.

## Asher's editing desk ✏️

Almost every number and name in the game lives in **`js/data.js`** —
fish, values, jobs, salaries, fatality rates, shop prices, rank names.
Change something, save the file, reload the game. It's in.

After editing, rebuild the single-file version with:

```
python3 tools/build_single.py
```

## How the code is organized

```
index.html / paths.html / levels.html / applications.html   ← the pages
css/style.css        ← the hand-drawn-on-paper look
js/data.js           ← ALL the game numbers and names (edit me!)
js/state.js          ← saving, money, jobs, offers
js/ui.js             ← top bar, the spinner wheel, popups
js/games/fishing.js  ← the fishing minigame
js/games/workshift.js← the work-day minigame (every other job)
js/pages/*.js        ← one script per page
tools/build_single.py← bundles everything into play.html
```

*Original design: four pencil drawings by Asher, 2026.*
