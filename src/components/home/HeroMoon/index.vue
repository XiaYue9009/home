<script setup>
const canvasRef = ref(null);
let animationId = 0;
let resizeHandler = null;
let themeObserver = null;

let willowStrands = [];
let canopyLeaves = [];

function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'nature';
}

function readThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  const parse = (name) => styles.getPropertyValue(name).trim();

  return {
    star: parse('--hero-star'),
    glow: parse('--hero-glow'),
    moon: parse('--hero-moon'),
    moonShadow: parse('--hero-moon-shadow'),
    opacity: parseFloat(parse('--hero-opacity') || '0.85'),
  };
}

function buildFoliage(w, h) {
  willowStrands = [];
  for (let i = 0; i < 28; i++) {
    willowStrands.push({
      ax: w * (0.02 + Math.random() * 0.4),
      ay: -h * 0.02,
      len: h * (0.45 + Math.random() * 0.55),
      phase: Math.random() * Math.PI * 2,
      amp: 0.012 + Math.random() * 0.022,
      speed: 0.0007 + Math.random() * 0.0006,
      width: 0.8 + Math.random() * 1.2,
      hue: 55 + Math.random() * 35,
    });
  }
  for (let i = 0; i < 18; i++) {
    willowStrands.push({
      ax: -w * 0.02,
      ay: h * (0.02 + Math.random() * 0.35),
      len: h * (0.35 + Math.random() * 0.5),
      phase: Math.random() * Math.PI * 2,
      amp: 0.01 + Math.random() * 0.018,
      speed: 0.0006 + Math.random() * 0.0005,
      width: 0.7 + Math.random() * 1,
      hue: 50 + Math.random() * 30,
    });
  }

  canopyLeaves = [];
  const greens = [
    [52, 140, 70],
    [68, 160, 82],
    [42, 120, 58],
    [78, 175, 90],
    [38, 105, 52],
    [88, 185, 98],
    [58, 148, 74],
  ];
  for (let i = 0; i < 110; i++) {
    const c = greens[Math.floor(Math.random() * greens.length)];
    canopyLeaves.push({
      x: Math.random() * w * 0.44,
      y: Math.random() * h * 0.58,
      w: w * (0.025 + Math.random() * 0.045),
      h: w * (0.018 + Math.random() * 0.035),
      rot: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0008 + Math.random() * 0.0012,
      r: c[0],
      g: c[1],
      b: c[2],
    });
  }
}

function drawCanopyLeaf(ctx, leaf, time, opacity) {
  const sway = Math.sin(time * leaf.speed + leaf.phase) * 0.18;
  const bob = Math.sin(time * leaf.speed * 1.6 + leaf.phase * 0.7) * 2;
  ctx.save();
  ctx.translate(leaf.x, leaf.y + bob);
  ctx.rotate(leaf.rot + sway);
  ctx.beginPath();
  ctx.moveTo(0, -leaf.h * 0.5);
  ctx.quadraticCurveTo(leaf.w * 0.55, 0, 0, leaf.h * 0.5);
  ctx.quadraticCurveTo(-leaf.w * 0.55, 0, 0, -leaf.h * 0.5);
  ctx.fillStyle = `rgba(${leaf.r}, ${leaf.g}, ${leaf.b}, ${opacity * 0.88})`;
  ctx.fill();
  ctx.restore();
}

function drawWillowStrand(ctx, s, w, h, time, opacity) {
  const segs = 14;
  const points = [{ x: s.ax, y: s.ay }];
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const wind = Math.sin(time * s.speed + s.phase + t * 2.5);
    const wind2 = Math.sin(time * s.speed * 1.4 + s.phase * 1.3 + t * 4);
    const dx = (wind * s.amp + wind2 * s.amp * 0.4) * w;
    const dy = s.len * t;
    const spread = s.ax < w * 0.05 ? t * w * 0.06 : 0;
    points.push({ x: s.ax + dx + spread, y: s.ay + dy });
  }

  ctx.strokeStyle = `rgba(55, 110, 60, ${opacity * 0.55})`;
  ctx.lineWidth = s.width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const c = points[i];
    ctx.quadraticCurveTo(p.x, p.y, (p.x + c.x) / 2, (p.y + c.y) / 2);
  }
  ctx.stroke();

  for (let i = 2; i < points.length; i += 2) {
    const p = points[i];
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.sin(time * s.speed * 2 + s.phase + i) * 0.3);
    ctx.beginPath();
    ctx.ellipse(0, 0, s.width * 1.8, s.width * 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${60 + s.hue * 0.3}, ${130 + s.hue * 0.5}, ${65 + s.hue * 0.2}, ${opacity * 0.65})`;
    ctx.fill();
    ctx.restore();
  }
}

function drawTreeShade(ctx, w, h, time, opacity) {
  const canopy = ctx.createLinearGradient(0, 0, w * 0.5, h * 0.6);
  canopy.addColorStop(0, `rgba(45, 115, 58, ${opacity * 0.55})`);
  canopy.addColorStop(0.45, `rgba(55, 130, 68, ${opacity * 0.35})`);
  canopy.addColorStop(1, 'rgba(45, 115, 58, 0)');
  ctx.fillStyle = canopy;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.48, 0);
  ctx.lineTo(w * 0.38, h * 0.62);
  ctx.lineTo(0, h * 0.72);
  ctx.closePath();
  ctx.fill();

  for (const leaf of canopyLeaves) drawCanopyLeaf(ctx, leaf, time, opacity);
  for (const strand of willowStrands) drawWillowStrand(ctx, strand, w, h, time, opacity);

  const fade = ctx.createLinearGradient(w * 0.26, 0, w * 0.48, 0);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, `rgba(232, 242, 236, ${opacity * 0.12})`);
  ctx.fillStyle = fade;
  ctx.fillRect(w * 0.26, 0, w * 0.24, h);
}

function drawNatureScene(ctx, w, h, colors, time, motes) {
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.2, 0, w * 0.5, h * 0.3, w * 0.6);
  glow.addColorStop(0, `rgba(${colors.glow}, ${0.12 * colors.opacity})`);
  glow.addColorStop(1, `rgba(${colors.glow}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  drawTreeShade(ctx, w, h, time, colors.opacity);

  for (const mote of motes) {
    const alpha = (0.2 + Math.sin(time * mote.speed + mote.phase) * 0.15) * colors.opacity;
    ctx.beginPath();
    ctx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${colors.star}, ${alpha})`;
    ctx.fill();
  }
}

function drawNightScene(ctx, w, h, colors, time, stars) {
  for (const star of stars) {
    const alpha = (0.25 + Math.sin(time * star.speed + star.phase) * 0.25) * colors.opacity;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${colors.star}, ${alpha})`;
    ctx.fill();
  }

  const moonX = w * 0.75;
  const moonY = h * 0.35;
  const moonR = Math.min(w, h) * 0.12;
  const glow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 2.5);
  glow.addColorStop(0, `rgba(${colors.glow}, ${0.28 * colors.opacity})`);
  glow.addColorStop(1, `rgba(${colors.glow}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  ctx.fillStyle = colors.moon;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(moonX + moonR * 0.35, moonY - moonR * 0.1, moonR * 0.85, 0, Math.PI * 2);
  ctx.fillStyle = colors.moonShadow;
  ctx.fill();
}

function drawMinimalScene(ctx, w, h, colors) {
  const cx = w * 0.78;
  const cy = h * 0.32;
  const r = Math.min(w, h) * 0.08;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${colors.glow}, ${0.25 * colors.opacity})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${colors.star}, ${0.2 * colors.opacity})`;
  ctx.fill();
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let colors = readThemeColors();

  const resize = () => {
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    buildFoliage(canvas.offsetWidth, canvas.offsetHeight);
  };
  resizeHandler = resize;
  resize();
  window.addEventListener('resize', resize);

  themeObserver = new MutationObserver(() => {
    colors = readThemeColors();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  window.addEventListener('theme-change', () => {
    colors = readThemeColors();
  });

  const motes = Array.from({ length: 40 }, () => ({
    x: Math.random() * canvas.offsetWidth,
    y: Math.random() * canvas.offsetHeight,
    r: Math.random() * 1.8 + 0.6,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.015 + 0.008,
  }));

  const stars = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.offsetWidth,
    y: Math.random() * canvas.offsetHeight,
    r: Math.random() * 1.5 + 0.5,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.02 + 0.01,
  }));

  const draw = (time) => {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    const theme = getTheme();
    if (theme === 'nature') {
      drawNatureScene(ctx, w, h, colors, time, motes);
    } else if (theme === 'minimal') {
      drawMinimalScene(ctx, w, h, colors);
    } else {
      drawNightScene(ctx, w, h, colors, time, stars);
    }

    animationId = requestAnimationFrame(draw);
  };
  animationId = requestAnimationFrame(draw);
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  if (resizeHandler) window.removeEventListener('resize', resizeHandler);
  themeObserver?.disconnect();
});
</script>

<template>
  <canvas
    ref="canvasRef"
    class="pointer-events-none absolute inset-0 h-full w-full"
    aria-hidden="true"
  />
</template>
