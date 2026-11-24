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

  // Escape direction: rises PATH_DROP of the window height while crossing 80% of its width
  const PATH_DROP = .45;

  // Stick figure with a telescope tracking the runaway (same pages)
  const FIGURE_X = .07;      // left edge of the scene, fraction of window width (matches text margin)
  const FIGURE_UP = 100;     // px from the bottom of the window to the ground line
  const FIGURE_MIN_W = 760, FIGURE_MIN_H = 560;   // hidden on smaller windows
  const ZOOM = 3.4;          // magnification shown in the eyepiece bubble
  let aim = -.6;             // telescope angle (eased toward the target each frame)
  let away = 0;              // 0 = at the eyepiece, 1 = jumped back in surprise
  let jumpStart = -1e9;      // time the last jump started
  const VIEW = Array.from({ length: 14 }, () =>       // faint stars in the eyepiece view
    [(Math.random() - .5) * 40, (Math.random() - .5) * 40, Math.random() * .8 + .3]);

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

    if (RUNAWAY && !still) {
      const star = drawRunaway(t, w, h, cx, cy, scale);
      if (w >= FIGURE_MIN_W && h >= FIGURE_MIN_H) drawFigure(t, w, h, star, cx, cy);
    }

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
    if (travel <= 0 || travel >= 1) { ctx.globalAlpha = 1; return { flash: phase < FLASH }; }
    const dir = Math.atan2(h * PATH_DROP, -w * .8);
    const dist = travel * Math.hypot(w, h);
    const ux = Math.cos(dir), uy = Math.sin(dir);
    const px = cx + ux * dist, py = cy + uy * dist;
    const fade = travel > .85 ? (1 - travel) / .15 : 1;   // fade out near the end

    // Dashed back-trace to the origin
    ctx.globalAlpha = .35 * fade; ctx.strokeStyle = PALETTE[2];
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
    ctx.setLineDash([]);

    // Trail and the white dwarf itself
    ctx.globalAlpha = fade;
    drawStar(px, py, ux, uy, scale);

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
    return { x: px, y: py, ux, uy, scale, fade, flash: phase < FLASH };
  }

  // The runaway: a motion trail (off-white fading to tangerine) and a blue-white dot
  function drawStar(px, py, ux, uy, scale) {
    const tail = 90 * scale;
    const trail = ctx.createLinearGradient(px, py, px - ux * tail, py - uy * tail);
    trail.addColorStop(0, 'rgba(247, 239, 230, .9)');
    trail.addColorStop(1, 'rgba(240, 138, 75, 0)');
    ctx.strokeStyle = trail; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - ux * tail, py - uy * tail); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = '#f4f8ff';
    ctx.beginPath(); ctx.arc(px, py, 2.6, 0, 6.28); ctx.fill();
  }

  // Stick figure at a small telescope that tracks the runaway. A bubble shows
  // the eyepiece view; at each supernova the figure jumps back in surprise.
  // `star` comes from drawRunaway(); cx, cy is the cluster centre.
  function drawFigure(t, w, h, star, cx, cy) {
    const ink = PALETTE[3], gold = v('--accent-2'), slate = v('--slate');
    const ground = h - FIGURE_UP;
    const mx = w * FIGURE_X + 100, my = ground - 52;       // tripod head (telescope pivot)
    const line = (p, q) => { ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke(); };

    // Jump at the explosion; `away` eases between eyepiece (0) and standing back (1)
    if (star.flash && t - jumpStart > 1500) jumpStart = t;
    const j = (t - jumpStart) / 700;
    const lift = j >= 0 && j < 1 ? Math.sin(j * Math.PI) * 30
               : j >= 1 && j < 1.6 ? Math.sin((j - 1) / .6 * Math.PI) * 12 : 0;
    const air = lift > 2;
    away += ((j >= 0 && j < 2.2 ? 1 : 0) - away) * .12;

    // Aim at the star if one is flying, else the cluster; keep the tube above the horizon
    const target = star.x !== undefined ? [star.x, star.y] : [cx, cy];
    let want = Math.atan2(target[1] - my, target[0] - mx);
    if (want > -.2 && want < Math.PI / 2) want = -.2;
    else if (want < -Math.PI + .2 || want >= Math.PI / 2) want = -Math.PI + .2;
    aim += (want - aim) * .05;
    const dx = Math.cos(aim), dy = Math.sin(aim), side = dx >= 0 ? -1 : 1;   // side the observer stands on

    ctx.save();
    ctx.globalAlpha = .9;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // Ground line
    ctx.strokeStyle = slate; ctx.lineWidth = 1;
    line([mx - 90, ground + .5], [mx + 70, ground + .5]);

    // Tripod
    ctx.strokeStyle = ink; ctx.lineWidth = 2;
    line([mx, my], [mx - 20, ground]); line([mx, my], [mx + 20, ground]); line([mx, my], [mx + 3, ground]);

    // Telescope: tube, dew shield, eyepiece, finder scope (drawn rotated)
    ctx.save();
    ctx.translate(mx, my); ctx.rotate(aim);
    ctx.fillStyle = v('--bg'); ctx.strokeStyle = ink; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.rect(-22, -4.5, 62, 9); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(36, -6.5, 10, 13); ctx.fill(); ctx.strokeStyle = gold; ctx.stroke();
    ctx.strokeStyle = ink;
    ctx.beginPath(); ctx.rect(-30, -2.5, 8, 5); ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.rect(2, -10, 16, 4); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(mx, my, 2.5, 0, 6.28); ctx.fill();

    // Observer: head at the eyepiece, or standing back after a jump
    const eyepiece = [mx - dx * 30, my - dy * 30];
    const standX = eyepiece[0] + side * 16 + side * away * 18;
    const fy = ground - lift, hip = [standX + side * 4, fy - 32];
    const headAtScope = [eyepiece[0] + side * 9, Math.min(eyepiece[1] + 1, fy - 48)];
    const headUp = [standX, fy - 80];
    const head = [headAtScope[0] + (headUp[0] - headAtScope[0]) * away,
                  headAtScope[1] + (headUp[1] - headAtScope[1]) * away];
    const neck = [head[0] + (hip[0] - head[0]) * .2, head[1] + (hip[1] - head[1]) * .2];
    const shoulder = [neck[0] + (hip[0] - neck[0]) * .15, neck[1] + (hip[1] - neck[1]) * .15];

    ctx.strokeStyle = ink; ctx.lineWidth = 2.2;
    line(hip, [hip[0] - 9, fy - (air ? 6 : 0)]);
    line(hip, [hip[0] + 9, fy - (air ? 6 : 0)]);
    line(hip, neck);
    if (away > .5) {                      // arms up in surprise
      line(shoulder, [shoulder[0] + 12, shoulder[1] - 20]);
      line(shoulder, [shoulder[0] - 12, shoulder[1] - 20]);
    } else {                              // one hand on the tube, one at the side
      const grip = [mx - dx * 8, my - dy * 8 + 3];
      const elbow = [(shoulder[0] + grip[0]) / 2, (shoulder[1] + grip[1]) / 2 + 8];
      ctx.beginPath(); ctx.moveTo(...shoulder); ctx.lineTo(...elbow); ctx.lineTo(...grip); ctx.stroke();
      line(shoulder, [shoulder[0] + side * 4, shoulder[1] + 20]);
    }
    ctx.beginPath(); ctx.arc(...head, 10, 0, 6.28); ctx.stroke();
    ctx.fillStyle = ink;
    if (away < .5) {                      // one eye, pressed to the eyepiece
      ctx.beginPath(); ctx.arc(head[0] - side * 6, head[1], 1.6, 0, 6.28); ctx.fill();
    } else {                              // both eyes and an "o" mouth
      ctx.beginPath(); ctx.arc(head[0] - 3, head[1] - 1, 1.6, 0, 6.28); ctx.arc(head[0] + 3, head[1] - 1, 1.6, 0, 6.28); ctx.fill();
      ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(head[0], head[1] + 5, 2.2, 0, 6.28); ctx.stroke();
    }
    if (air && j < 1) {
      ctx.globalAlpha = .9 * (1 - j);
      ctx.fillStyle = gold; ctx.font = '600 16px sans-serif';
      ctx.fillText('!', head[0] + 12, head[1] - 14);
    }

    // Eyepiece view bubble (fades out while the observer is away)
    const view = 1 - away;
    if (view > .02) {
      const bub = [mx - 60, ground - 150], R = 26;
      ctx.globalAlpha = .7 * view; ctx.fillStyle = ink;
      for (const [f, r] of [[.3, 2], [.6, 3]]) {          // thought-bubble dots
        ctx.beginPath(); ctx.arc(head[0] + (bub[0] - head[0]) * f, head[1] + (bub[1] - head[1]) * f, r, 0, 6.28); ctx.fill();
      }
      ctx.save();
      ctx.beginPath(); ctx.arc(...bub, R, 0, 6.28);
      ctx.globalAlpha = view; ctx.fillStyle = '#05080c'; ctx.fill(); ctx.clip();
      for (const [a, b, r] of VIEW) {
        ctx.globalAlpha = .6 * view; ctx.fillStyle = '#dcebff';
        ctx.beginPath(); ctx.arc(bub[0] + a, bub[1] + b, r, 0, 6.28); ctx.fill();
      }
      if (star.x !== undefined) {
        ctx.globalAlpha = view;
        ctx.setTransform(ZOOM, 0, 0, ZOOM, bub[0] - star.x * ZOOM, bub[1] - star.y * ZOOM);
        drawStar(star.x, star.y, star.ux, star.uy, star.scale);
      }
      ctx.restore();
      ctx.globalAlpha = view; ctx.strokeStyle = gold; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(...bub, R, 0, 6.28); ctx.stroke();
      ctx.globalAlpha = .4 * view; ctx.lineWidth = 1;           // crosshairs
      line([bub[0] - R + 6, bub[1]], [bub[0] - 6, bub[1]]); line([bub[0] + 6, bub[1]], [bub[0] + R - 6, bub[1]]);
      line([bub[0], bub[1] - R + 6], [bub[0], bub[1] - 6]); line([bub[0], bub[1] + 6], [bub[0], bub[1] + R - 6]);
    }
    ctx.restore();
  }

  addEventListener('resize', () => { resize(); if (still) draw(0); });
  resize();
  requestAnimationFrame(t => { last = t; draw(t); });
})();
