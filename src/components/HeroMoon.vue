<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationId = 0;
let resizeHandler: (() => void) | null = null;
let themeObserver: MutationObserver | null = null;

function readThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  const parseRgb = (name: string) => styles.getPropertyValue(name).trim();

  return {
    star: parseRgb('--hero-star'),
    glow: parseRgb('--hero-glow'),
    moon: parseRgb('--hero-moon'),
    moonShadow: parseRgb('--hero-moon-shadow'),
    opacity: parseFloat(parseRgb('--hero-opacity') || '0.8'),
  };
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

  const stars = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.offsetWidth,
    y: Math.random() * canvas.offsetHeight,
    r: Math.random() * 1.5 + 0.5,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.02 + 0.01,
  }));

  const draw = (time: number) => {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

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
