// Lightweight twinkling starfield. No dependencies; skipped if user prefers reduced motion.
(() => {
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stars = [];

  function resize() {
    canvas.width = innerWidth; canvas.height = innerHeight;
    // Star count scales with screen area
    stars = Array.from({ length: Math.floor(innerWidth * innerHeight / 7000) }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + .2, phase: Math.random() * 6.28, speed: Math.random() * .02 + .005,
    }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const a = .4 + .6 * Math.abs(Math.sin(s.phase + t * s.speed * .06));
      ctx.fillStyle = `rgba(255,248,235,${still ? .7 : a})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
    }
    if (!still) requestAnimationFrame(draw);
  }

  addEventListener('resize', () => { resize(); if (still) draw(0); });
  resize(); requestAnimationFrame(draw);
})();
