/* ============================================================
   JOB APPLICATION — GAME DATA
   Designed by Asher (Ash Games). Built by Jing & Ash.

   ASHER: THIS FILE IS YOURS!
   Change any number or name, save, and reload the game.
   - Add a fish to FISH and it can be caught.
   - Add a job to JOBS and it appears on the wheel + applications.
   ============================================================ */

// Boy avatar faces you can pick when you create your character.
const AVATARS = ['👦', '👦🏻', '👦🏼', '👦🏽', '👦🏾', '👦🏿', '🧒'];

// ------------------------------------------------------------
// THE JOB APPLICATION — a paperwork + skill + luck gauntlet to
// get hired, scaled by the job's rarity (better jobs = harder).
//   paperwork : always — fill the form and stamp it
//   trial     : play the job's game for `seconds`, earning at least
//               (base salary * goalMult) to pass the skill test
//   luck      : a spinner whose HIRE zone starts at luckBase% and
//               grows with your Luck stat (rarer job = smaller zone)
//   fee       : what it costs to APPLY AGAIN after a rejection
// ------------------------------------------------------------
const APPLICATION = {
  common:    { trial: false, luck: false, fee: 1e3 },
  uncommon:  { trial: true, goalMult: 0.30, seconds: 22, luck: false, fee: 50e3 },
  rare:      { trial: true, goalMult: 0.45, seconds: 24, luck: true, luckBase: 42, fee: 1e6 },
  epic:      { trial: true, goalMult: 0.60, seconds: 26, luck: true, luckBase: 26, fee: 20e6 },
  legendary: { trial: true, goalMult: 0.85, seconds: 28, luck: true, luckBase: 14, fee: 150e6 },
};

// Big settings for the whole game
const CONFIG = {
  startWealth: 0,            // what a brand-new player starts with
  pathChangeCost: 45e6,      // the "change" button on the Paths page: 45 M
  fishingShiftSeconds: 75,   // how long one fishing day lasts
  workShiftSeconds: 45,      // how long one work day lasts (other jobs)
  offersPerDay: 3,           // how many job offers appear in a batch
  offerRefreshMinutes: 10,   // a fresh batch of offers every this many real minutes
  workHP: 3,                 // hearts you have per work day; run out and you die
  fireQuotaMult: 0.15,       // flop a shift (earn under salary×this) and you're FIRED
  lotteryPerDay: 3,          // most peasant lottery tickets you can buy in one day
};

// ------------------------------------------------------------
// FISH RARITY — how often each kind of fish shows up.
// Luck makes the rarer tiers more likely (just like jobs!).
// ------------------------------------------------------------
const FISH_RARITY = {
  common:       { label: 'common',       color: '#8a8a94', weight: 100 },
  rare:         { label: 'rare',         color: '#1e7fbf', weight: 26 },
  epic:         { label: 'epic',         color: '#8d5bd4', weight: 6 },
  legendary:    { label: 'LEGENDARY',    color: '#c98a00', weight: 0.8 },
  divine:       { label: 'DIVINE',       color: '#e0459e', weight: 0.15 },
  transcendent: { label: 'TRANSCENDENT', color: '#7c3aed', weight: 0.02 },
};

// ------------------------------------------------------------
// FISH — every fish you can catch. value = what it sells for.
// ASHER: add a fish here (name, rarity, value, emoji, size) and
// you can catch it right away! Rarer tiers are worth more.
// ------------------------------------------------------------
const FISH = [
  // --- common ---
  { name: 'Minnow',    rarity: 'common', value: 25,   emoji: '🐟', size: 28 },
  { name: 'Clownfish', rarity: 'common', value: 60,   emoji: '🐠', size: 30 },
  { name: 'Cod',       rarity: 'common', value: 120,  emoji: '🐟', size: 34 },
  { name: 'Bass',      rarity: 'common', value: 200,  emoji: '🐟', size: 36 },
  { name: 'Salmon',    rarity: 'common', value: 320,  emoji: '🐟', size: 40 },
  { name: 'Pike',      rarity: 'common', value: 500,  emoji: '🐟', size: 44 },
  // --- rare ---
  { name: 'Carp',       rarity: 'rare', value: 1200,  emoji: '🐟', size: 42 },
  { name: 'Char',       rarity: 'rare', value: 3500,  emoji: '🐠', size: 44 },
  { name: 'Archerfish', rarity: 'rare', value: 8000,  emoji: '🐠', size: 44 },
  { name: 'Gar',        rarity: 'rare', value: 18e3,  emoji: '🐟', size: 50 },
  { name: 'Catfish',    rarity: 'rare', value: 35e3,  emoji: '🐟', size: 52 },
  { name: 'Angelfish',  rarity: 'rare', value: 60e3,  emoji: '🐠', size: 46 },
  { name: 'Lionfish',   rarity: 'rare', value: 90e3,  emoji: '🐡', size: 48 },
  // --- epic ---
  { name: 'Anglerfish',     rarity: 'epic', value: 250e3, emoji: '🐡', size: 58 },
  { name: 'Sunfish',        rarity: 'epic', value: 600e3, emoji: '🐡', size: 70 },
  { name: 'Monstrous Fish', rarity: 'epic', value: 1.5e6, emoji: '🐡', size: 78 },
  { name: 'Shark',          rarity: 'epic', value: 4e6,   emoji: '🦈', size: 76 },
  { name: 'Orca',           rarity: 'epic', value: 9e6,   emoji: '🐋', size: 84 },
  { name: 'Jingfish',       rarity: 'epic', value: 20e6,  emoji: '🐠', size: 80 },
  // --- legendary ---
  { name: 'Lungfish',          rarity: 'legendary', value: 100e6, emoji: '🐟', size: 72 },
  { name: 'Platinum Arowana',  rarity: 'legendary', value: 350e6, emoji: '🐉', size: 88 },
  { name: 'Sapphire Jingfish', rarity: 'legendary', value: 800e6, emoji: '🐠', size: 90 },
  { name: 'Emerald Jingfish',  rarity: 'legendary', value: 2e9,   emoji: '🐠', size: 92 },
  // --- divine ---
  { name: 'Rainbow Swordfish',       rarity: 'divine', value: 6e9,  emoji: '🐟', size: 92 },
  { name: 'Black Sapphire Jingfish', rarity: 'divine', value: 15e9, emoji: '🐠', size: 94 },
  { name: 'Ultra Kingfish',          rarity: 'divine', value: 40e9, emoji: '🐡', size: 98 },
  // --- transcendent (the rarest fish of all) ---
  { name: 'Black Diamond Jingfish',  rarity: 'transcendent', value: 250e9, emoji: '🐠', size: 104 },
];

// ------------------------------------------------------------
// FISHING RODS — your fishing equipment. A bigger fish PULLS
// harder; if its value is more than the rod's `strength`, the
// line can SNAP and the fish gets away. Better rods = land the
// big ones. `strength` = the value of fish it safely lands.
// ASHER: change a name, emoji, cost, or strength and reload!
// ------------------------------------------------------------
const RODS = [
  { id: 'wood',     name: 'Wooden Rod',   emoji: '🪵', strength: 800,      cost: 0 },
  { id: 'bamboo',   name: 'Bamboo Rod',   emoji: '🎋', strength: 120e3,    cost: 2500 },
  { id: 'metal',    name: 'Metal Rod',    emoji: '🔩', strength: 30e6,     cost: 150e3 },
  { id: 'titanium', name: 'Titanium Rod', emoji: '🛡️', strength: 3e9,      cost: 25e6 },
  { id: 'diamond',  name: 'Diamond Rod',  emoji: '💎', strength: Infinity, cost: 2e9 },
];

// ------------------------------------------------------------
// GEAR — every NON-fishing job has better equipment you can buy
// to earn more. Five tiers; each multiplies what you earn that
// day. The tiers share one power/price curve (GEAR_TIERS); each
// job just names its five tools. Cost scales with the job's
// salary, so fancier jobs have fancier (pricier) gear.
// (Fishing has its own thing — rods — see RODS above.)
// ASHER: rename any tool or change the curve and reload!
// ------------------------------------------------------------
const GEAR_TIERS = [
  { mult: 1,   costMult: 0 },     // your starting kit (free)
  { mult: 1.6, costMult: 6 },     // cost = the job's salary × costMult
  { mult: 2.4, costMult: 22 },
  { mult: 3.6, costMult: 70 },
  { mult: 5,   costMult: 220 },
];

const GEAR = {
  peasant:      [['🖐️','Bare Hands'], ['🪓','Wooden Hoe'],    ['🌾','Iron Scythe'],    ['🐂','Ox & Plow'],      ['🚜','Steam Tractor']],
  prisoner:     [['🖐️','Bare Hands'], ['🥄','Bent Spoon'],    ['🔪','Sharp Shiv'],     ['🔨','Rock Hammer'],    ['🗝️','Master Key']],
  teacher:      [['🖐️','Chalk Stub'], ['🖊️','Red Pen'],       ['📗','Textbook'],       ['🖥️','Smartboard'],     ['🤖','AI Tutor']],
  chef:         [['🔪','Rusty Knife'], ['🍳','Frying Pan'],    ['🔪','Chef’s Knife'],   ['🔥','Pro Range'],      ['⭐','Michelin Kit']],
  nomad:        [['🦯','Walking Stick'],['🧴','Water Skin'],    ['🧭','Compass'],        ['🐪','Trusty Camel'],   ['🛺','Caravan']],
  gamer:        [['💻','Office PC'],    ['🖱️','Gaming Mouse'],  ['⌨️','Mech Keyboard'],  ['🖥️','Gaming Rig'],     ['🕹️','Pro Setup']],
  beekeeper:    [['🖐️','Bare Hands'],  ['🥽','Bee Veil'],      ['💨','Smoker'],         ['🥼','Bee Suit'],       ['🤖','Apiary Bots']],
  socialworker: [['📋','Clipboard'],    ['☎️','Hotline'],       ['🚗','Case Car'],       ['🏢','Field Office'],   ['🤝','Community Center']],
  soldier:      [['🪃','Slingshot'],    ['🔫','Pistol'],        ['🎖️','Rifle'],         ['🦺','Body Armor'],     ['🚙','Tank']],
  criminal:     [['🗝️','Lockpick'],    ['🪛','Crowbar'],       ['🏍️','Getaway Bike'],  ['🏎️','Fast Car'],       ['💻','Hacker Kit']],
  miner:        [['⛏️','Rusty Pick'],   ['⛏️','Iron Pick'],     ['🔩','Steel Drill'],    ['🧨','Dynamite'],       ['💎','Diamond Drill']],
  construction: [['🧤','Work Gloves'],   ['🔨','Hammer'],        ['🪛','Power Tools'],    ['🏗️','Tower Crane'],    ['🏢','Skyscraper Crew']],
  zookeeper:    [['🧹','Push Broom'],     ['🪣','Feed Bucket'],   ['🥅','Catch Net'],      ['🚙','Zoo Buggy'],      ['🏞️','Safari Reserve']],
  bodyguard:    [['🖐️','Bare Fists'],   ['🌶️','Pepper Spray'], ['⚡','Taser'],          ['🦺','Kevlar Vest'],    ['🛡️','Riot Shield']],
  engineer:     [['🪛','Screwdriver'],  ['🔧','Wrench Set'],    ['🔩','Power Drill'],    ['🖥️','CAD Station'],    ['🦾','Robot Arm']],
  lawyer:       [['📎','Paperclip'],     ['📁','Case File'],     ['💼','Briefcase'],      ['📚','Law Library'],    ['⚖️','Supreme Bench']],
  executioner:  [['🪓','Dull Axe'],      ['🪓','Sharp Axe'],     ['⚔️','Broadsword'],    ['🗡️','Great Axe'],      ['🔻','Guillotine']],
  bountyhunter: [['🪢','Lasso'],         ['🔫','Revolver'],      ['🥅','Net Gun'],        ['🛸','Tracker Drone'],  ['🚀','Bounty Rig']],
  firefighter:  [['🧤','Fire Gloves'],   ['🪣','Water Bucket'],  ['🧯','Extinguisher'],   ['🚿','Fire Hose'],      ['🚁','Water Bomber']],
  hardware:     [['🔩','Loose Screws'],  ['🔨','Claw Hammer'],   ['🪚','Power Saw'],      ['🚚','Delivery Truck'], ['🏭','Warehouse']],
  detective:    [['🔎','Magnifier'],     ['🗒️','Notepad'],       ['📷','Spy Camera'],     ['🧬','Forensics Kit'],  ['🕵️','Master Sleuth']],
  dungeoneer:   [['🔦','Torch'],         ['🗡️','Short Sword'],   ['🛡️','Shield'],        ['⚔️','Enchanted Blade'],['🐉','Dragon Armor']],
  deadshot:     [['🪃','Slingshot'],     ['🔫','Pistol'],        ['🎯','Sniper Rifle'],   ['🔴','Laser Sight'],    ['🚀','Rail Gun']],
  athlete:      [['👟','Worn Sneakers'], ['🏀','Team Ball'],     ['🦵','Knee Braces'],    ['💪','Personal Trainer'],['🏆','MVP Contract']],
  jobapplicator:[['✏️','Pencil'],        ['🖊️','Nice Pen'],      ['📄','Résumé Kit'],     ['💼','Briefcase'],      ['🏆','Golden Stapler']],
  archaeologist:[['🖌️','Soft Brush'],    ['⛏️','Hand Pick'],     ['🔦','Head Torch'],     ['🛰️','Ground Radar'],   ['🏛️','Museum Grant']],
  frogkeeper:   [['🥅','Little Net'],    ['🪷','Lily Pad'],      ['🪟','Terrarium'],      ['🎵','Frog Whistle'],   ['🏅','Golden Pond']],
  king:         [['👑','Wooden Crown'],  ['👑','Silver Crown'],  ['👑','Gold Crown'],     ['🔱','Jeweled Scepter'],['💎','Diamond Throne']],
};

// ------------------------------------------------------------
// JOB RARITY — how often each rarity shows up in daily offers.
// Luck makes the rarer ones more likely.
// ------------------------------------------------------------
const RARITY = {
  common:    { label: 'common',    color: '#8a8a94', weight: 100 },
  uncommon:  { label: 'uncommon',  color: '#3fa555', weight: 40 },
  rare:      { label: 'rare',      color: '#1e7fbf', weight: 14 },
  epic:      { label: 'epic',      color: '#8d5bd4', weight: 4 },
  legendary: { label: 'LEGENDARY', color: '#c98a00', weight: 1 },
};

// ------------------------------------------------------------
// JOBS — every job in the game.
//   power    = how good you are at the job (%)
//   salary   = pay for ONE day of work
//   fatality = how dangerous one day of work is (%)
//   danger   = the thing that jumps out at you while you work
//   special: 'fishing' = has its own real minigame
// ------------------------------------------------------------
const JOBS = {
  fisherman:    { name: 'Fisherman',      emoji: '🎣', rarity: 'common',    power: 20, salary: 0,     fatality: 0,  danger: 'Shark!',              special: 'fishing', path: 'Fishing' },
  peasant:      { name: 'Peasant',        emoji: '🌾', rarity: 'common',    power: 3,  salary: 100,   fatality: 0,  danger: 'Runaway goat!' },
  prisoner:     { name: 'Prisoner',       emoji: '⛓️', rarity: 'common',    power: 1,  salary: 3,     fatality: 46, danger: 'Jailbreak!' },
  teacher:      { name: 'Teacher',        emoji: '📚', rarity: 'common',    power: 5,  salary: 900,   fatality: 2,  danger: 'Pop quiz riot!' },
  chef:         { name: 'Chef',           emoji: '🍳', rarity: 'common',    power: 8,  salary: 2500,  fatality: 9,  danger: 'Grease fire!' },
  nomad:        { name: 'Nomad',          emoji: '🐪', rarity: 'common',    power: 4,  salary: 250,   fatality: 6,  danger: 'Sandstorm!' },
  gamer:        { name: 'Gamer',          emoji: '🎮', rarity: 'uncommon',  power: 7,  salary: 1200,  fatality: 1,  danger: 'Lag spike!' },
  beekeeper:    { name: 'Beekeeper',      emoji: '🐝', rarity: 'uncommon',  power: 10, salary: 7500,  fatality: 13, danger: 'Bee swarm!' },
  socialworker: { name: 'Social Worker',  emoji: '🤝', rarity: 'uncommon',  power: 8,  salary: 5000,  fatality: 3,  danger: 'Burnout!' },
  soldier:      { name: 'Soldier',        emoji: '🪖', rarity: 'uncommon',  power: 18, salary: 45e3,  fatality: 52, danger: 'Incoming!' },
  criminal:     { name: 'Criminal',       emoji: '🕶️', rarity: 'uncommon',  power: 12, salary: 90e3,  fatality: 38, danger: 'The cops!' },
  miner:        { name: 'Miner',          emoji: '⛏️', rarity: 'uncommon',  power: 20, salary: 3e6,   fatality: 69, danger: 'Cave-in!' },
  construction: { name: 'Construction Worker', emoji: '👷', rarity: 'uncommon', power: 15, salary: 80e3, fatality: 28, danger: 'Falling beam!' },
  zookeeper:    { name: 'Zookeeper',      emoji: '🦁', rarity: 'uncommon',  power: 14, salary: 120e3, fatality: 22, danger: 'Lion loose!' },
  bodyguard:    { name: 'Bodyguard',      emoji: '🕴️', rarity: 'rare',      power: 22, salary: 250e3, fatality: 33, danger: 'Ambush!' },
  engineer:     { name: 'Engineer',       emoji: '🛠️', rarity: 'rare',      power: 25, salary: 500e3, fatality: 11, danger: 'Bridge wobble!' },
  lawyer:       { name: 'Lawyer',         emoji: '⚖️', rarity: 'rare',      power: 26, salary: 1.2e6, fatality: 4,  danger: 'Held in contempt!' },
  executioner:  { name: 'Executioner',    emoji: '🪓', rarity: 'rare',      power: 24, salary: 800e3, fatality: 21, danger: 'Axe slipped!' },
  bountyhunter: { name: 'Bounty Hunter',  emoji: '🤠', rarity: 'rare',      power: 28, salary: 2e6,   fatality: 55, danger: 'Target fights back!' },
  firefighter:  { name: 'Firefighter',    emoji: '🚒', rarity: 'rare',      power: 26, salary: 1.5e6, fatality: 65, danger: 'Backdraft!' },
  hardware:     { name: 'Hardware Store Owner', emoji: '🔨', rarity: 'rare', power: 24, salary: 600e3, fatality: 10, danger: 'Rusty nail!' },
  detective:    { name: 'Detective',      emoji: '🕵️', rarity: 'rare',      power: 24, salary: 700e3, fatality: 18, danger: 'Armed suspect!' },
  dungeoneer:   { name: 'Dungeoneer',     emoji: '🗝️', rarity: 'epic',      power: 32, salary: 5e6,   fatality: 57, danger: 'A dragon!' },
  deadshot:     { name: 'Deadshot',       emoji: '🎯', rarity: 'epic',      power: 35, salary: 8e6,   fatality: 60, danger: 'Return fire!' },
  athlete:      { name: 'Athlete',        emoji: '🏀', rarity: 'epic',      power: 34, salary: 12e6,  fatality: 42, danger: 'Blown knee!' },
  jobapplicator:{ name: 'Job Applicator', emoji: '📋', rarity: 'epic',      power: 30, salary: 4e6,   fatality: 5,  danger: 'Paper cut!' },
  archaeologist:{ name: 'Archaeologist',  emoji: '🏺', rarity: 'epic',      power: 31, salary: 3e6,   fatality: 30, danger: 'Tomb collapse!' },
  frogkeeper:   { name: 'Frog Keeper',    emoji: '🐸', rarity: 'legendary', power: 45, salary: 8e6,   fatality: 1,  danger: 'Frog stampede!', shopOnly: true },
  king:         { name: 'King',           emoji: '👑', rarity: 'legendary', power: 50, salary: 50e6,  fatality: 15, danger: 'A coup!' },
};

// ------------------------------------------------------------
// GETTING FIRED — survive the day but do a BAD job (earn less than
// your boss's quota, salary × CONFIG.fireQuotaMult) and you're sacked:
// you KEEP your money but lose the job and drift back to fishing. Each
// job has its own reason for the pink slip. Fishing is the fallback —
// you can't be fired from it (it has no salary / no quota).
// ASHER: reword any of these!
// ------------------------------------------------------------
const FIRE_REASONS = {
  peasant:      'You let the crops rot — the landlord evicted you!',
  prisoner:     'You slacked on the chain gang — work detail revoked!',
  teacher:      'The class revolted — the principal let you go!',
  chef:         'You burned the signature dish — the head chef sacked you!',
  nomad:        'You lost the trail — the caravan moved on without you!',
  gamer:        'You went on a losing streak — benched and dropped!',
  beekeeper:    'The hive absconded on your watch — you were let go!',
  socialworker: 'Too many missed home visits — the agency let you go!',
  soldier:      'You abandoned your post — dishonorable discharge!',
  criminal:     'You botched the heist — the crew cut you loose!',
  miner:        'You came up empty — the foreman laid you off!',
  construction: 'You misread the blueprint — the site foreman let you go!',
  zookeeper:    'A lion got loose on your watch — the zoo let you go!',
  bodyguard:    'You let danger slip through — the client dropped you!',
  engineer:     'Your bridge wobbled once too often — laid off!',
  lawyer:       'You lost the big case — the firm showed you the door!',
  executioner:  'Cold feet on the job — you were dismissed!',
  bountyhunter: 'You let the target walk — license revoked!',
  firefighter:  'You let it burn — suspended by the fire chief!',
  hardware:     'A big-box rival undercut you — your store went bust!',
  detective:    'You collared the wrong suspect — the chief pulled your badge!',
  dungeoneer:   'You came back empty-handed — the guild expelled you!',
  deadshot:     'You kept missing — banned from the range!',
  athlete:      'Bad knees and a locker-room feud — your team traded you!',
  jobapplicator:'Your application to keep applying was... rejected!',
  archaeologist:'You shattered a priceless relic — the museum cut your funding!',
  frogkeeper:   'The frogs all hopped away — you were let go!',
  king:         'The people revolted — you were overthrown!',
};

// ------------------------------------------------------------
// PATHS — your career ladder. You climb by earning money at
// your job ("career earnings"). The mystery ranks (???) get
// revealed as you reach them.
// ASHER: rename the fishing ranks! These are placeholders.
// ------------------------------------------------------------
const RANKS = {
  fishing: ['Lowly Fisherman', 'Deckhand', 'Fisherman', 'First Mate', 'Boat Captain', 'Fleet Admiral', 'FISH KING'],
  generic: ['Lowly {job}', 'Junior {job}', '{job}', 'Senior {job}', 'Expert {job}', 'Master {job}', 'LEGENDARY {job}'],
};
// Career earnings needed to reach each rank — a real climb, with the
// milestones getting bigger each time (rank up at 1M, then +2M, +4M, ...).
const RANK_UP_AT       = [0, 1e6, 3e6, 7e6, 15e6, 35e6, 80e6];
const RANK_SALARY_MULT = [1, 1.5, 2.5, 4, 7, 12, 25];   // salary multiplier at each rank
const RANK_POWER_BONUS = [0, 8, 18, 30, 45, 65, 100];   // extra power at each rank

// ------------------------------------------------------------
// SHOP — LUCKY section. Luck makes rare fish, rare job offers
// and better chest loot more likely. The shop shows the cheapest
// charms you don't own yet and RESTOCKS a fresh one each time you
// buy — collect all of them for maximum luck!
// ASHER: add a charm here and it shows up in the shop to buy.
// ------------------------------------------------------------
const LUCK_ITEMS = {
  clover:    { name: 'Clover in a Jar',    emoji: '🍀', cost: 3e6,   luck: 25 },
  dice:      { name: 'Lucky Dice',         emoji: '🎲', cost: 12e6,  luck: 45 },
  goblet:    { name: 'Enchanted Goblet',   emoji: '🏆', cost: 25e6,  luck: 60 },
  coin:      { name: 'Lucky Coin',         emoji: '🪙', cost: 120e6, luck: 130 },
  paste:     { name: 'Jingfish Paste',     emoji: '🧴', cost: 750e6, luck: 200 },
  rabbitfoot:{ name: "Rabbit's Foot",      emoji: '🐰', cost: 4e9,   luck: 450 },
  crystal:   { name: 'Jingathyst Crystal', emoji: '💎', cost: 30e9,  luck: 1000 },
  star:      { name: 'Shooting Star',      emoji: '🌟', cost: 200e9, luck: 2500 },
};

// ------------------------------------------------------------
// SHOP — POTIONS. Cheap ($1K–$10K) gambles with a RANDOM effect:
// luck, cash, a jackpot, a new job offer, a dud... or death! The
// pricier the potion, the bigger the rewards (and the risk).
// ASHER: change a name, emoji or cost and reload.
// ------------------------------------------------------------
const POTIONS = {
  mystery:  { name: 'Mystery Potion', emoji: '🧪', cost: 1000,  tier: 0 },
  fizzy:    { name: 'Fizzy Potion',   emoji: '⚗️', cost: 5000,  tier: 1 },
  bubbling: { name: 'Bubbling Brew',  emoji: '🧫', cost: 10000, tier: 2 },
};

// SHOP — APPLICATIONS section. The repeatable extras sit on a rotating
// SHELF (like the lucky charms): only a few show at once, and buying one
// sends it to the back so a DIFFERENT option rotates into its place.
const SHOP_EXTRAS = {
  avgwheel:  { name: 'Spin the Average Wheel', emoji: '🎡', cost: 6e6,   blurb: 'Spins a wheel of everyday jobs and adds the winner to your offers.' },
  resume:    { name: 'Résumé Blast',           emoji: '📨', cost: 20e6,  blurb: 'Mails out applications — 2 random job offers appear.' },
  anything:  { name: 'Could-Be-Anything Box',  emoji: '❓', cost: 120e6, blurb: 'Could be ANYTHING.' },
  headhunter:{ name: 'Headhunter Call',        emoji: '📞', cost: 300e6, blurb: 'A recruiter lines up a guaranteed RARE (or better) job offer.' },
  epicchest: { name: 'Epic Chest',             emoji: '🎁', cost: 600e6, blurb: 'Wealth, a lucky item, or a rare job offer.' },
  frogcard:  { name: 'Frog Keeper Job Card',   emoji: '🐸', cost: 2e9,   blurb: 'Power 45% · Salary $8M · Fatality 1%.' },
  mythical:  { name: 'Rainbow Black Diamond Mythical Chest', emoji: '🌈', cost: 3e12, blurb: 'The rarest chest ever made.' },
};

// The repeatable extras, in shelf order (cheapest first). The shop shows
// the first few and rotates a fresh one in after each purchase. (mythical
// is NOT here — it's a one-time buy with its own spot.)
const SHOP_APP_POOL = ['avgwheel', 'resume', 'anything', 'headhunter', 'epicchest', 'frogcard'];
const SHOP_APP_SHOWN = 4;   // how many shelf slots are visible at once
