// Star-rangoli background: a globular-cluster core (Plummer profile)
// with rangoli petals and rings traced out by stars, plus a field of
// background stars. Rotates slowly and twinkles; static if the visitor
// prefers reduced motion. Colours come from CSS variables in style.css.
(() => {
  const canvas = document.getElementById('sky');
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(document.documentElement);
  const v = name => css.getPropertyValue(name).trim();

  // Rangoli colour slots: 0 petals, 1 rings, 2 inner petals, 3 core ring
  const PALETTE = [v('--accent'), v('--accent-3'), v('--accent-2'), v('--text')];
  // Realistic star colours, hot (blue) to cool (red)
  const TEMPS = ['#9bb7ff', '#cad7ff', '#f8f7ff', '#fff1d8', '#ffd2a1', '#ffb07a'];

  // --- Tunable settings ---
  const OPACITY = 0.38;      // how strongly the rangoli shows
  const ROT_SPEED = 0.00004; // radians per ms
  const CORE_RADIUS = 22;    // Plummer scale radius (pattern units)

  // Runaway white dwarf: only on pages whose front matter sets `runaway: true`
  const RUNAWAY = document.body.hasAttribute('data-runaway');
  const CYCLE = 25000;       // ms between explosions
  const FLASH = 0.04;        // fraction of the cycle the explosion flash lasts
  const TRAVEL = 0.55;       // fraction of the cycle the escape takes

  const rnd = Math.random;
  const stars = [];          // {x, y, r, color, alpha, phase, speed} in pattern units
  const add = (x, y, r, color, alpha) =>
    stars.push({ x, y, r, color, alpha, phase: rnd() * 6.28, speed: rnd() * 1.5 + .5 });

  // Cluster core: sample radii from a Plummer distribution
  for (let i = 0; i < 900; i++) {
    const u = rnd() * .98 + .01;
    const r = CORE_RADIUS / Math.sqrt(Math.pow(u, -2 / 3) - 1);
    if (r > 290) continue;
    const t = rnd() * 6.28;
    add(r * Math.cos(t), r * Math.sin(t), rnd() * .9 + .3, TEMPS[Math.floor(rnd() * TEMPS.length)], rnd() * .5 + .4);
  }

  // Point on a quadratic Bezier curve
  const bez = (a, b, c, t) => [
    (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0],
    (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1],
  ];

  // n petals from radius r0 to r1, half-width w, drawn with `steps` stars per side
  function petals(n, r0, r1, w, slot, steps, offset = 0) {
    for (let i = 0; i < n; i++) {
      const a = i * 2 * Math.PI / n + offset, ca = Math.cos(a), sa = Math.sin(a);
      const P = (d, s) => [d * ca - s * sa, d * sa + s * ca];
      for (const side of [1, -1])
        for (let j = 0; j <= steps; j++) {
          const [x, y] = bez(P(r0, 0), P((r0 + r1) / 2, side * w), P(r1, 0), j / steps);
          add(x + (rnd() - .5) * 2, y + (rnd() - .5) * 2, rnd() * .7 + .9, PALETTE[slot], .95);
        }
    }
  }

  // n evenly spaced stars on a circle
  function ring(n, r, slot, size) {
    for (let i = 0; i < n; i++) {
      const a = i * 2 * Math.PI / n;
      add(r * Math.cos(a), r * Math.sin(a), size, PALETTE[slot], 1);
    }
  }

  // The rangoli design itself
  petals(16, 120, 250, 40, 0, 14);
  petals(16, 140, 205, 16, 2, 7, Math.PI / 16);
  ring(64, 210, 1, 1.1);
  ring(16, 262, 1, 2.4);
  petals(8, 62, 130, 34, 0, 10);
  ring(8, 140, 1, 2.6);
  ring(40, 58, 3, 1);

  let field = [], angle = 0, last = 0;

  // Rebuild the background star field to fit the window
  function resize() {
    canvas.width = innerWidth; canvas.height = innerHeight;
    field = Array.from({ length: Math.floor(innerWidth * innerHeight / 9000) }, () =>
      [rnd() * canvas.width, rnd() * canvas.height, rnd() + .3, rnd() * .5 + .3]);
  }

  function draw(t) {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background field stars
    for (const [x, y, r, a] of field) {
      ctx.globalAlpha = a; ctx.fillStyle = '#dcebff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
    }

    // Rangoli cluster, centred near the top-right corner, mostly on-screen.
    // Pattern radius is ~290 units, so this keeps it to ~half the short side.
    const scale = Math.min(w, h) / 600, cx = w - .14 * w, cy = .2 * h;
    const c = Math.cos(angle), s = Math.sin(angle);
    for (const st of stars) {
      const twinkle = still ? .8 : .55 + .45 * Math.abs(Math.sin(st.phase + t * st.speed * .001));
      ctx.globalAlpha = OPACITY * st.alpha * twinkle;
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.arc(cx + (st.x * c - st.y * s) * scale, cy + (st.x * s + st.y * c) * scale, Math.max(.5, st.r * scale), 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (RUNAWAY && !still) drawRunaway(t, w, h, cx, cy, scale);

    if (!still) {
      angle += (t - last) * ROT_SPEED; last = t;
      requestAnimationFrame(draw);
    }
  }

  // Explosion in the cluster core, then a white dwarf escaping toward the
  // lower left with a dashed back-traced path to its origin.
  function drawRunaway(t, w, h, cx, cy, scale) {
    const phase = (t % CYCLE) / CYCLE;

    // 1. Flash: expanding glow plus a shock ring
    if (phase < FLASH) {
      const k = phase / FLASH, r = (15 + k * 150) * scale;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      glow.addColorStop(0, '#fff6d8');
      glow.addColorStop(.3, PALETTE[1]);
      glow.addColorStop(1, 'rgba(240, 138, 75, 0)');
      ctx.globalAlpha = (1 - k) * .6; ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.28); ctx.fill();
      ctx.globalAlpha = (1 - k) * .8; ctx.strokeStyle = PALETTE[0];
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.2, 0, 6.28); ctx.stroke();
    }

    // 2. Escape: position along a straight line out of the core
    const travel = (phase - FLASH / 2) / TRAVEL;
    if (travel <= 0 || travel >= 1) { ctx.globalAlpha = 1; return; }
    const dir = Math.atan2(h * .6, -w * .8);
    const dist = travel * Math.hypot(w, h);
    const ux = Math.cos(dir), uy = Math.sin(dir);
    const px = cx + ux * dist, py = cy + uy * dist;
    const fade = travel > .85 ? (1 - travel) / .15 : 1;   // fade out near the end

    // Dashed back-trace to the origin
    ctx.globalAlpha = .35 * fade; ctx.strokeStyle = PALETTE[2];
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
    ctx.setLineDash([]);

    // Motion trail, off-white fading to tangerine
    const tail = 90 * scale;
    const trail = ctx.createLinearGradient(px, py, px - ux * tail, py - uy * tail);
    trail.addColorStop(0, 'rgba(247, 239, 230, .9)');
    trail.addColorStop(1, 'rgba(240, 138, 75, 0)');
    ctx.globalAlpha = fade; ctx.strokeStyle = trail; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - ux * tail, py - uy * tail); ctx.stroke();
    ctx.lineWidth = 1;

    // The white dwarf itself (hot, so blue-white)
    ctx.fillStyle = '#f4f8ff';
    ctx.beginPath(); ctx.arc(px, py, 2.6, 0, 6.28); ctx.fill();

    // Targeting brackets
    const b = 10;
    ctx.globalAlpha = .8 * fade; ctx.strokeStyle = PALETTE[0];
    ctx.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.moveTo(px + sx * b, py + sy * (b - 5));
      ctx.lineTo(px + sx * b, py + sy * b);
      ctx.lineTo(px + sx * (b - 5), py + sy * b);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  addEventListener('resize', () => { resize(); if (still) draw(0); });
  resize();
  requestAnimationFrame(t => { last = t; draw(t); });
})();
