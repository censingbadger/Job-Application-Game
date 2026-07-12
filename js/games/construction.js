/* ============================================================
   CONSTRUCTION WORKER 👷 — BUILD THE RICKETY HOUSE (stacking).
   A plank slides across the top — TAP to drop it onto the stack.
   Line it up! Any overhang is trimmed off and the house narrows,
   so stack neatly to build tall for big money. Land it dead-centre
   for a bonus. Miss completely and the house shudders. And watch
   for the Falling beam!
   ============================================================ */

GAMES.construction = defineShift({
  hint: 'TAP to <b>drop</b> the sliding plank square onto the stack — line it up to build the house tall! Overhang gets trimmed. Dodge the <b>Falling beam!</b>',
  duration: r => 46 + r * 6,

  init(g) {
    const baseW = 210;
    g.groundY = GH - 42;
    g.floorH = 26;
    g.stack = [{ x: (GW - baseW) / 2, w: baseW }];     // the foundation
    g.floors = 0;
    g.camY = 0;
    g.unit = Math.max(2, Math.floor(State.salary() / 8));
    g.speed = 250 + g.rank * 45;
    g.falling = [];
    g.pop = null;
    g.shake = 0;
    g.beam = this._spawn(g);
  },

  _spawn(g) {
    const top = g.stack[g.stack.length - 1];
    const fromLeft = Math.random() < 0.5;
    return { w: top.w, x: fromLeft ? -top.w * 0.8 : GW - top.w * 0.2, dir: fromLeft ? 1 : -1 };
  },

  _beamY(g, level) { return g.groundY - level * g.floorH; },   // y of the top face of `level` floors

  pointer(g) {
    const top = g.stack[g.stack.length - 1];
    const b = g.beam;
    const left = Math.max(b.x, top.x);
    const right = Math.min(b.x + b.w, top.x + top.w);
    const overlap = right - left;
    const y = this._beamY(g, g.stack.length);

    if (overlap <= 8) {                                 // total miss — the plank tumbles
      g.falling.push({ x: b.x, y, w: b.w, vx: b.dir * 60, vy: -40, rot: 0 });
      g.flash('#d9534f'); Sound.thud(); g.shake = 0.35;
      g.beam = this._spawn(g);
      return;
    }
    // trim the overhang (it falls away)
    if (b.x < left) g.falling.push({ x: b.x, y, w: left - b.x, vx: -50, vy: -20, rot: 0 });
    if (b.x + b.w > right) g.falling.push({ x: right, y, w: (b.x + b.w) - right, vx: 50, vy: -20, rot: 0 });

    const perfect = overlap >= top.w - 10;
    g.stack.push({ x: left, w: perfect ? top.w : overlap, cx: left + overlap / 2 });  // perfect keeps full width
    if (perfect) g.stack[g.stack.length - 1].x = top.x;       // snap back to full over the top
    g.floors++;
    g.earn(g.unit * (perfect ? 2 : 1));
    g.pop = { x: left + overlap / 2, y, perfect, t: 0 };
    Sound.coin(); if (perfect) g.flash('#2f7d3f');
    g.beam = this._spawn(g);
  },

  update(g, dt) {
    const b = g.beam;
    b.x += b.dir * g.speed * dt;
    if (b.x <= 0) { b.x = 0; b.dir = 1; }
    if (b.x + b.w >= GW) { b.x = GW - b.w; b.dir = -1; }

    // keep the working row on screen as the house climbs
    const topY = this._beamY(g, g.stack.length);
    const want = topY < 150 ? 150 - topY : 0;
    g.camY += (want - g.camY) * Math.min(1, dt * 4);

    g.falling.forEach(f => { f.vy += 1100 * dt; f.y += f.vy * dt; f.x += f.vx * dt; f.rot += dt * 5; });
    g.falling = g.falling.filter(f => f.y < GH + 140);
    if (g.pop) { g.pop.t += dt; if (g.pop.t > 0.5) g.pop = null; }
    if (g.shake > 0) g.shake -= dt;
  },

  draw(g, t) {
    const ctx = g.ctx;
    ctx.fillStyle = '#bfe0ef'; ctx.fillRect(0, 0, GW, GH);           // sky
    ctx.fillStyle = '#e8b06a'; ctx.fillRect(0, g.groundY + g.camY, GW, GH);   // ground moves with camera
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, g.groundY + g.camY); ctx.lineTo(GW, g.groundY + g.camY); ctx.stroke();
    Draw.bigText(ctx, '👷 BUILD IT UP', GW / 2, 40, 26, '#7a3d0c');

    ctx.save();
    const sx = g.shake > 0 ? Math.sin(t * 60) * 4 * g.shake : 0;
    ctx.translate(sx, g.camY);

    // the stacked planks (foundation darker)
    g.stack.forEach((s, i) => {
      const y = this._beamY(g, i);
      ctx.fillStyle = i === 0 ? '#8a5a2b' : (i % 2 ? '#c98a5b' : '#b87a4b');
      ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
      ctx.fillRect(s.x, y - g.floorH, s.w, g.floorH); ctx.strokeRect(s.x, y - g.floorH, s.w, g.floorH);
      // plank grain
      ctx.strokeStyle = 'rgba(43,43,51,.18)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(s.x + 4, y - g.floorH / 2); ctx.lineTo(s.x + s.w - 4, y - g.floorH / 2); ctx.stroke();
    });
    // a little roof once there are a few floors
    if (g.stack.length > 1) {
      const topS = g.stack[g.stack.length - 1], ry = this._beamY(g, g.stack.length);
      ctx.fillStyle = '#c0392b'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(topS.x - 6, ry); ctx.lineTo(topS.x + topS.w / 2, ry - 22); ctx.lineTo(topS.x + topS.w + 6, ry); ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // the sliding plank (drawn one floor above the stack top, minus the roof)
    const by = this._beamY(g, g.stack.length) - 30;
    ctx.fillStyle = '#e0a86a'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 3;
    ctx.fillRect(g.beam.x, by, g.beam.w, g.floorH); ctx.strokeRect(g.beam.x, by, g.beam.w, g.floorH);
    // a crane cable holding it
    ctx.strokeStyle = 'rgba(43,43,51,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(g.beam.x + g.beam.w / 2, by); ctx.lineTo(g.beam.x + g.beam.w / 2, by - 60); ctx.stroke();

    // trimmed pieces tumbling
    g.falling.forEach(f => {
      ctx.save(); ctx.translate(f.x + f.w / 2, f.y - g.floorH / 2); ctx.rotate(f.rot);
      ctx.fillStyle = '#c98a5b'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2;
      ctx.fillRect(-f.w / 2, -g.floorH / 2, f.w, g.floorH); ctx.strokeRect(-f.w / 2, -g.floorH / 2, f.w, g.floorH);
      ctx.restore();
    });

    if (g.pop) Draw.bigText(ctx, g.pop.perfect ? 'PERFECT! ×2' : 'NICE!', g.pop.x, g.pop.y - 18, g.pop.perfect ? 24 : 20, g.pop.perfect ? '#2f7d3f' : '#7a3d0c');
    ctx.restore();

    Draw.bigText(ctx, `Floors: ${g.floors}`, GW / 2, GH - 14, 22, '#7a3d0c');
  },
});
