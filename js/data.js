/* ============================================================
   JOB APPLICATION — GAME DATA
   Designed by Asher (Ash Games). Built by Jing & Ash.

   ASHER: THIS FILE IS YOURS!
   Change any number or name, save, and reload the game.
   - Add a fish to FISH and it can be caught.
   - Add a job to JOBS and it appears on the wheel + applications.
   ============================================================ */

// Big settings for the whole game
const CONFIG = {
  startWealth: 0,            // what a brand-new player starts with
  pathChangeCost: 45e6,      // the "change" button on the Paths page: 45 M
  fishingShiftSeconds: 75,   // how long one fishing day lasts
  workShiftSeconds: 45,      // how long one work day lasts (other jobs)
  offersPerDay: 3,           // job offers waiting on the Applications page
  hospitalBillPercent: 10,   // % of your wealth you pay if you get knocked out
};

// ------------------------------------------------------------
// FISH RARITY — how often each kind of fish shows up.
// Luck makes the rarer tiers more likely (just like jobs!).
// ------------------------------------------------------------
const FISH_RARITY = {
  common:    { label: 'common',    color: '#8a8a94', weight: 100 },
  rare:      { label: 'rare',      color: '#1e7fbf', weight: 26 },
  epic:      { label: 'epic',      color: '#8d5bd4', weight: 6 },
  legendary: { label: 'LEGENDARY', color: '#c98a00', weight: 0.8 },
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
];

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
  soldier:      { name: 'Soldier',        emoji: '🪖', rarity: 'uncommon',  power: 18, salary: 45e3,  fatality: 52, danger: 'Incoming!' },
  criminal:     { name: 'Criminal',       emoji: '🕶️', rarity: 'uncommon',  power: 12, salary: 90e3,  fatality: 38, danger: 'The cops!' },
  miner:        { name: 'Miner',          emoji: '⛏️', rarity: 'uncommon',  power: 20, salary: 3e6,   fatality: 69, danger: 'Cave-in!' },
  bodyguard:    { name: 'Bodyguard',      emoji: '🕴️', rarity: 'rare',      power: 22, salary: 250e3, fatality: 33, danger: 'Ambush!' },
  engineer:     { name: 'Engineer',       emoji: '🛠️', rarity: 'rare',      power: 25, salary: 500e3, fatality: 11, danger: 'Bridge wobble!' },
  executioner:  { name: 'Executioner',    emoji: '🪓', rarity: 'rare',      power: 24, salary: 800e3, fatality: 21, danger: 'Axe slipped!' },
  bountyhunter: { name: 'Bounty Hunter',  emoji: '🤠', rarity: 'rare',      power: 28, salary: 2e6,   fatality: 55, danger: 'Target fights back!' },
  dungeoneer:   { name: 'Dungeoneer',     emoji: '🗝️', rarity: 'epic',      power: 32, salary: 5e6,   fatality: 57, danger: 'A dragon!' },
  deadshot:     { name: 'Deadshot',       emoji: '🎯', rarity: 'epic',      power: 35, salary: 8e6,   fatality: 60, danger: 'Return fire!' },
  jobapplicator:{ name: 'Job Applicator', emoji: '📋', rarity: 'epic',      power: 30, salary: 4e6,   fatality: 5,  danger: 'Paper cut!' },
  frogkeeper:   { name: 'Frog Keeper',    emoji: '🐸', rarity: 'legendary', power: 45, salary: 8e6,   fatality: 1,  danger: 'Frog stampede!', shopOnly: true },
  king:         { name: 'King',           emoji: '👑', rarity: 'legendary', power: 50, salary: 50e6,  fatality: 15, danger: 'A coup!' },
};

// ------------------------------------------------------------
// PATHS — your career ladder. You climb by earning money at
// your job ("career earnings"). The mystery ranks (???) get
// revealed as you reach them.
// ASHER: rename the fishing ranks! These are placeholders.
// ------------------------------------------------------------
const RANKS = {
  fishing: ['Lowly Fisherman', 'Fisherman', 'Boat Captain', 'FISH KING'],
  generic: ['Lowly {job}', '{job}', 'Expert {job}', 'LEGENDARY {job}'],
};
const RANK_UP_AT       = [0, 100e3, 5e6, 250e6]; // career earnings needed for each rank
const RANK_SALARY_MULT = [1, 3, 8, 20];          // salary multiplier at each rank
const RANK_POWER_BONUS = [0, 15, 35, 70];        // extra power at each rank

// ------------------------------------------------------------
// SHOP — LUCKY section. Luck makes rare fish, rare job offers
// and better chest loot more likely.
// ------------------------------------------------------------
const LUCK_ITEMS = {
  clover:  { name: 'Clover in a Jar',    emoji: '🍀', cost: 3e6,   luck: 25 },
  goblet:  { name: 'Enchanted Goblet',   emoji: '🏆', cost: 25e6,  luck: 60 },
  paste:   { name: 'Jingfish Paste',     emoji: '🧴', cost: 750e6, luck: 200 },
  crystal: { name: 'Jingathyst Crystal', emoji: '💎', cost: 30e9,  luck: 1000 },
};

// SHOP — APPLICATIONS section
const SHOP_EXTRAS = {
  avgwheel:  { name: 'Spin the Average Wheel', emoji: '🎡', cost: 6e6,   blurb: 'Spins a wheel of everyday jobs and adds the winner to your offers.' },
  epicchest: { name: 'Epic Chest',             emoji: '🎁', cost: 600e6, blurb: 'Wealth, a lucky item, or a rare job offer.' },
  anything:  { name: 'Could-Be-Anything Box',  emoji: '❓', cost: 120e6, blurb: 'Could be ANYTHING.' },
  frogcard:  { name: 'Frog Keeper Job Card',   emoji: '🐸', cost: 2e9,   blurb: 'Power 45% · Salary $8M · Fatality 1%.' },
  mythical:  { name: 'Rainbow Black Diamond Mythical Chest', emoji: '🌈', cost: 3e12, blurb: 'The rarest chest ever made.' },
};
