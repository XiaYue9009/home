import { prefersReducedMotion } from './trigger.js';

/**
 * IntersectionObserver 滚动显现
 * @param {import('vue').Ref<HTMLElement|null>} targetRef
 * @param {import('vue').Ref<boolean>} visibleRef
 * @param {{ once?: boolean, threshold?: number, rootMargin?: string }} options
 */
export function useScrollReveal(
  targetRef,
  visibleRef,
  {
    once = true,
    threshold = 0.12,
    rootMargin = '0px 0px -6% 0px',
  } = {},
) {
  let observer = null;

  const reveal = () => {
    visibleRef.value = true;
  };

  onMounted(() => {
    const el = targetRef.value;
    if (!el) return;

    if (prefersReducedMotion()) {
      reveal();
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal();
          if (once) observer?.unobserve(entry.target);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
  });

  onUnmounted(() => {
    observer?.disconnect();
    observer = null;
  });
}
