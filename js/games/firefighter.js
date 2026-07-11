/* ============================================================
   FIREFIGHTER 🚒 — PUT OUT THE FLAMES (fast reflexes).
   Fires break out across the burning building — TAP each one to
   blast it with water before it spreads. The longer a fire burns
   the bigger (and more valuable) it grows... but let it rage too
   long and it FLASHES OVER. And watch for the Backdraft! 🔥
   ============================================================ */

GAMES.firefighter = defineShift({
  hint: 'TAP the <b>flames</b> 🔥 to blast them with water before they spread! A big blaze pays <b>double</b> — but don\'t let one <b>flash over</b>. Dodge the <b>Backdraft!</b>',
  duration: r => 46 + r * 6,

  init(g) {
    g.fires = [];
    g.spawnEvery = 1.0 / g.diff;
    g.spawnT = 0.3;
    g.life = Math.max(1.8, 3.2 - g.rank * 0.3);        // seconds a fire burns before flashover
    g.unit = Math.max(2, Math.floor(State.salary() / 10));
    g.out = 0;
    g.spray = null;                                     // {x,y,t} water-blast effect
    g.pop = null;                                       // {x,y,big,t} "OUT!" popup
    g.nozzle = { x: GW / 2, y: GH - 120 };
  },

  move(g, x, y) { g.nozzle.x = x; g.nozzle.y = y; },

  pointer(g, x, y) {
    g.nozzle.x = x; g.nozzle.y = y;
    g.spray = { x, y, t: 0 };
    Sound.splash();
    for (let i = g.fires.length - 1; i >= 0; i--) {
      const f = g.fires[i];
      if (Math.hypot(f.x - x, f.y - y) <= f.r + 10) {
        const big = f.age > f.life * 0.6;
        g.earn(g.unit * (big ? 2 : 1));
        g.out++;
        g.pop = { x: f.x, y: f.y, big, t: 0 };
        g.fires.splice(i, 1);
        Sound.coin();
        return;
      }
    }
  },

  update(g, dt) {
    if (g.spray) { g.spray.t += dt; if (g.spray.t > 0.25) g.spray = null; }
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.5) g.pop = null; }
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = g.spawnEvery * (0.7 + Math.random() * 0.6);
      const cols = 5, rows = 3;
      const c = Math.floor(Math.random() * cols), r = Math.floor(Math.random() * rows);
      g.fires.push({ x: 100 + c * ((GW - 200) / (cols - 1)), y: 140 + r * 100, age: 0, life: g.life, r: 18 });
    }
    for (let i = g.fires.length - 1; i >= 0; i--) {
      const f = g.fires[i];
      f.age += dt;
      f.r = 18 + Math.min(1, f.age / f.life) * 22;      // grows as it burns
      if (f.age >= f.life) {                             // flashed over — it spreads away!
        g.fires.splice(i, 1);
        g.flash('#d9534f'); Sound.thud();
      }
    }
  },

  draw(g, t) {
    const ctx = g.ctx;
    // smoky night sky
    ctx.fillStyle = '#241a2b'; ctx.fillRect(0, 0, GW, GH);
    // the burning building
    ctx.fillStyle = '#3b3550'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.fillRect(60, 90, GW - 120, GH - 150); ctx.strokeRect(60, 90, GW - 120, GH - 150);
    // window grid (matches where fires appear)
    const cols = 5, rows = 3;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const x = 100 + c * ((GW - 200) / (cols - 1)) - 30;
      const y = 140 + r * 100 - 30;
      ctx.fillStyle = '#2a2540'; ctx.fillRect(x, y, 60, 60); ctx.strokeRect(x, y, 60, 60);
    }
    // street
    ctx.fillStyle = '#2b2b33'; ctx.fillRect(0, GH - 60, GW, 60);
    Draw.bigText(ctx, '🚒 FIRE! FIRE!', GW / 2, 46, 28, '#ff8a3c');

    // the flames
    g.fires.forEach(f => {
      const flick = 1 + Math.sin(t * 20 + f.x) * 0.08;
      Draw.emoji(ctx, '🔥', f.x, f.y, f.r * 2 * flick);
      if (f.age > f.life * 0.72) Draw.emoji(ctx, '⚠️', f.x, f.y - f.r - 16, 22);
    });

    // water spray burst
    if (g.spray) {
      ctx.fillStyle = 'rgba(120,190,240,.7)';
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2, rr = 10 + g.spray.t * 130;
        ctx.beginPath(); ctx.arc(g.spray.x + Math.cos(a) * rr, g.spray.y + Math.sin(a) * rr, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (g.pop) Draw.bigText(ctx, g.pop.big ? 'OUT! ×2' : 'OUT!', g.pop.x, g.pop.y - 28, g.pop.big ? 24 : 20, '#3aa0e0');

    // hose stream from the truck to your nozzle
    const n = g.nozzle;
    ctx.strokeStyle = 'rgba(120,190,240,.45)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(GW / 2, GH - 8); ctx.lineTo(n.x, n.y); ctx.stroke();
    Draw.emoji(ctx, '🚿', n.x, n.y, 34);

    Draw.bigText(ctx, `Fires out: ${g.out}`, GW / 2, GH - 22, 22, '#ff8a3c');
  },
});
