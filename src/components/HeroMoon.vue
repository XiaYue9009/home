<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationId = 0;
let resizeHandler: (() => void) | null = null;

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = () => {
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  };
  resizeHandler = resize;
  resize();
  window.addEventListener('resize', resize);

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
      const alpha = 0.3 + Math.sin(time * star.speed + star.phase) * 0.3;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(196, 181, 253, ${alpha})`;
      ctx.fill();
    }

    const moonX = w * 0.75;
    const moonY = h * 0.35;
    const moonR = Math.min(w, h) * 0.12;
    const glow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 2.5);
    glow.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
    glow.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fillStyle = '#ddd6fe';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + moonR * 0.35, moonY - moonR * 0.1, moonR * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    animationId = requestAnimationFrame(draw);
  };

  animationId = requestAnimationFrame(draw);
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  if (resizeHandler) window.removeEventListener('resize', resizeHandler);
});
</script>

<template>
  <canvas
    ref="canvasRef"
    class="pointer-events-none absolute inset-0 h-full w-full opacity-80"
    aria-hidden="true"
  />
</template>
