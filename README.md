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
| Levels | `levels.html` | DO your job — a different mini-game for each one! |
| Applications | `applications.html` | Daily job offers (accept/decline) and the SHOP |

Your progress saves automatically in the browser.

## The job mini-games 🎮

**Every one of the 20 jobs has its own game!** Each plays completely differently:

| Job | Game | Style |
|---|---|---|
| Fisherman 🎣 | Cast, wait for the **!**, reel before the shark | Timing |
| Chef 🍳 | Flip each dish when the bar hits the **green** | Timing |
| Miner ⛏️ | Swing your pickaxe when the marker hits the **green vein** | Timing |
| Teacher 📚 | Tap the right answer before the pop-quiz timer | Timing |
| Engineer 🛠️ | Set rivets in the **green** to build each girder | Timing |
| Executioner 🪓 | Drop the axe when the log lines up in the **green** | Timing |
| Prisoner ⛓️ | Switch lanes to grab money, dodge guards | Dodge |
| Nomad 🐪 | Jump over cacti, grab floating water | Dodge |
| Dungeoneer 🗝️ | Move up/down to grab treasure, dodge fireballs | Dodge |
| Peasant 🌾 | Catch falling crops, dodge the runaway goat | Catch |
| Beekeeper 🐝 | Catch honeycombs, dodge the bees | Catch |
| Frog Keeper 🐸 | Net the frogs, grab the golden one, skip the poison | Catch |
| Soldier 🪖 | Tap the targets before they fire back | Aim |
| Deadshot 🎯 | Nail the small targets — bullseyes pay triple | Aim |
| Bounty Hunter 🤠 | Tag the fast, zig-zagging outlaw | Aim |
| Gamer 🎮 | Tap bugs & power-ups, never the bombs | Aim |
| Bodyguard 🕴️ | Block threats to the VIP, spare the fans | Aim |
| King 👑 | Blast invaders before they reach the castle | Aim |
| Criminal 🕶️ | Grab loot on **green**, freeze on **red** (heist!) | Aim + timing |
| Job Applicator 📋 | Stamp Accept/Decline to match each applicant | Sort + timing |

The games get **harder as you rank up**, and the job's **fatality rate**
still shows up as a "dodge it or get knocked out" danger.

## Players 👤

When the game opens it asks **"Who's playing?"** Type a simple name (no password!)
to start a character. Come back later, type the **same name**, and you pick up
right where you left off — your wealth, path, and luck are all still there.

Lots of people can share one device: each name is its own separate character.
Tap **switch player** any time to hop between them.

### Play across devices ☁️ (optional)

By default a character saves **in that browser** (a character made on the iPad
lives on the iPad). If you want a character to follow you **across devices** —
start on the iPad, keep going on a laptop — turn on cloud sync:

1. Open **`js/cloud.js`** and follow the short comment at the top to create a
   free Firebase Realtime Database (~3 minutes).
2. Paste your database URL into the `CLOUD_URL` line and commit.

Once it's set, typing the same name on any device loads that character from the
cloud and keeps it in sync. Until then, everything works exactly as before,
saved per-device. (No passwords, so friends should each pick a **unique name**.)

## The rules of the world

- **Wealth** 💰 — you earn it by working. Fish come in six rarity tiers — common,
  rare, epic, legendary, divine, and transcendent — from the $25 Minnow all the way
  up to the transcendent **$250B Black Diamond Jingfish**, the rarest catch of all.
  Luck makes the rarer ones bite more often.
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
js/games/engine.js   ← shared game harness (timer, danger, payday)
js/games/fishing.js  ← the fishing minigame
js/games/workshift.js← the fallback work-day (jobs without a custom game yet)
js/games/chef.js · miner.js · prisoner.js · soldier.js  ← custom job games
js/pages/*.js        ← one script per page
tools/build_single.py← bundles everything into play.html
```

*Original design: four pencil drawings by Asher, 2026.*
