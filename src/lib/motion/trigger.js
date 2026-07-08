import { ANIMATE_PREFIX } from './presets.js';

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function buildAnimateClasses(animation, { speed } = {}) {
  const classes = [`${ANIMATE_PREFIX}animated`, `${ANIMATE_PREFIX}${animation}`];
  if (speed) classes.push(`${ANIMATE_PREFIX}${speed}`);
  return classes;
}

/**
 * 对元素播放一次 Animate.css 动画（官方文档推荐写法）
 * @param {Element} node
 * @param {string} animation 不含前缀的动画名，如 fadeInUp
 */
export function triggerAnimate(node, animation, { speed, prefix = ANIMATE_PREFIX } = {}) {
  if (!node || prefersReducedMotion()) return Promise.resolve();

  const animationName = `${prefix}${animation}`;
  const classes = [`${prefix}animated`, animationName];
  if (speed) classes.push(`${prefix}${speed}`);

  return new Promise((resolve) => {
    function handleAnimationEnd(event) {
      if (event.target !== node) return;
      event.stopPropagation();
      node.classList.remove(...classes);
      node.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    }

    node.classList.add(...classes);
    node.addEventListener('animationend', handleAnimationEnd, { once: true });
  });
}
