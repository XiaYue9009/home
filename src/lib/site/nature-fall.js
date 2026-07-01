/** 自然主题下的落叶 Canvas 动画，由 App.vue 在路由切换时初始化。 */
const CANVAS_ID = 'nature-fall-canvas';

function isNatureTheme() {
  return document.documentElement.getAttribute('data-theme') === 'nature';
}

function pickKind() {
  const roll = Math.random();
  if (roll < 0.07) return 'flower';
  if (roll < 0.18) return 'petal';
  if (roll < 0.58) return 'leaf';
  return 'bamboo';
}

function spawnParticle(w) {
  const side = Math.random() < 0.5 ? 'left' : 'right';
  const band = w * 0.14;
  const x = side === 'left' ? Math.random() * band : w - band + Math.random() * band;

  return {
    kind: pickKind(),
    x,
    y: -20 - Math.random() * 40,
    size: Math.random() * 10 + 8,
    speed: Math.random() * 0.6 + 0.35,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: Math.random() * 0.02 + 0.008,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.03,
    opacity: Math.random() * 0.35 + 0.45,
  };
}

function drawLeaf(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.beginPath();
  ctx.moveTo(0, -p.size * 0.5);
  ctx.quadraticCurveTo(p.size * 0.55, 0, 0, p.size * 0.5);
  ctx.quadraticCurveTo(-p.size * 0.55, 0, 0, -p.size * 0.5);
  ctx.fillStyle = `rgba(61, 107, 71, ${p.opacity})`;
  ctx.fill();
  ctx.restore();
}

function drawBamboo(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.beginPath();
  ctx.ellipse(0, 0, p.size * 0.18, p.size * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(74, 124, 89, ${p.opacity})`;
  ctx.fill();
  ctx.restore();
}

function drawPetal(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.beginPath();
  ctx.ellipse(0, 0, p.size * 0.22, p.size * 0.38, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(220, 160, 180, ${p.opacity * 0.85})`;
  ctx.fill();
  ctx.restore();
}

function drawFlower(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  const r = p.size * 0.22;
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5;
    ctx.beginPath();
    ctx.ellipse(Math.cos(angle) * r, Math.sin(angle) * r, r * 0.55, r * 0.9, angle, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(232, 140, 160, ${p.opacity})`;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(240, 200, 80, ${p.opacity})`;
  ctx.fill();
  ctx.restore();
}

function drawParticle(ctx, p) {
  switch (p.kind) {
    case 'leaf':
      drawLeaf(ctx, p);
      break;
    case 'bamboo':
      drawBamboo(ctx, p);
      break;
    case 'petal':
      drawPetal(ctx, p);
      break;
    case 'flower':
      drawFlower(ctx, p);
      break;
  }
}

export function initNatureFall() {
  if (typeof window === 'undefined') return;

  let canvas = document.getElementById(CANVAS_ID);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = CANVAS_ID;
    canvas.className = 'nature-fall pointer-events-none fixed inset-0';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let animationId = 0;
  let particles = [];

  const syncTheme = () => {
    const active = isNatureTheme();
    canvas.classList.toggle('nature-fall--active', active);
    if (!active) particles = [];
  };

  const resize = () => {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  };

  const tick = (w, h) => {
    if (particles.length < 48 && Math.random() < 0.04) {
      particles.push(spawnParticle(w));
    }

    particles = particles.filter((p) => {
      p.y += p.speed;
      p.sway += p.swaySpeed;
      p.x += Math.sin(p.sway) * 0.35;
      p.rotation += p.spin;
      return p.y < h + 30;
    });
  };

  const loop = () => {
    if (!isNatureTheme()) {
      syncTheme();
      animationId = requestAnimationFrame(loop);
      return;
    }

    syncTheme();
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    tick(w, h);
    for (const p of particles) drawParticle(ctx, p);
    animationId = requestAnimationFrame(loop);
  };

  syncTheme();
  resize();
  window.addEventListener('resize', resize);

  const themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  window.addEventListener('theme-change', syncTheme);

  animationId = requestAnimationFrame(loop);
}
