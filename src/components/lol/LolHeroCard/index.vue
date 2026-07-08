<script setup>
const props = defineProps({
  hero: { type: Object, required: true },
});

const router = useRouter();
const splashAlt = computed(() => `${props.hero.fullName} ${props.hero.name}`.trim());

function openHero() {
  router.push(`/lol/${props.hero.id}`);
}
</script>

<template>
  <article class="lol-hero-card group overflow-hidden" @click="openHero">
    <div class="lol-hero-card__art relative aspect-[3/4] overflow-hidden bg-black/20">
      <img
        :src="hero.image"
        :alt="splashAlt"
        class="lol-hero-card__splash h-full w-full object-cover object-top"
        loading="eager"
        decoding="async"
      />
      <img
        :src="hero.icon"
        alt=""
        class="lol-hero-card__icon absolute left-4 top-4 z-[1] h-12 w-12 rounded-full border-2 border-white/30 shadow-lg pointer-events-none"
        loading="lazy"
        decoding="async"
        aria-hidden="true"
      />

      <div class="lol-hero-card__body block p-5">
        <p class="lol-hero-card__alias">{{ hero.alias }}</p>
        <h2 class="lol-hero-card__names mt-1 font-display text-xl font-bold">
          <span>{{ hero.fullName }}</span>
          <span>{{ hero.name }}</span>
        </h2>
        <p class="lol-hero-card__role mt-3 text-xs">{{ hero.roleLabel }}</p>
        <p class="lol-hero-card__cta mt-4 text-sm">
          查看对线笔记 →
        </p>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.lol-hero-card {
  border-radius: 1rem;
  border: 1px solid var(--color-glass-border);
  box-shadow: 0 4px 16px rgba(8, 14, 22, 0.08);
  cursor: pointer;
  transition:
    transform 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.3s ease,
    box-shadow 0.38s ease;

  &:hover {
    transform: translateY(-6px);
    border-color: color-mix(in srgb, var(--color-accent) 38%, transparent);
    box-shadow:
      0 16px 36px -8px rgba(8, 14, 22, 0.3),
      0 0 0 1px color-mix(in srgb, var(--color-accent) 14%, transparent);
  }

  &:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--color-accent) 55%, transparent);
    outline-offset: 3px;
  }

  &__icon {
    transition:
      transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 0.4s ease,
      border-color 0.3s ease;
  }

  &:hover &__icon {
    transform: scale(1.1);
    border-color: rgba(255, 255, 255, 0.55);
    box-shadow:
      0 4px 14px rgba(8, 14, 22, 0.35),
      0 0 18px color-mix(in srgb, var(--color-accent) 40%, transparent);
  }

  &__art .lol-hero-card__splash {
    transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &:hover .lol-hero-card__splash {
    transform: scale(1.08);
  }

  &__body {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    background: linear-gradient(
      to top,
      rgba(255, 255, 255, 0.92) 0%,
      rgba(255, 255, 255, 0.72) 55%,
      rgba(255, 255, 255, 0.08) 100%
    );
    transition: background 0.35s ease;
  }

  &:hover &__body {
    background: linear-gradient(
      to top,
      rgba(255, 255, 255, 0.97) 0%,
      rgba(255, 255, 255, 0.82) 50%,
      rgba(255, 255, 255, 0.16) 100%
    );
  }

  &__alias {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #2f5233;
    transition: letter-spacing 0.35s ease;
  }

  &:hover &__alias {
    letter-spacing: 0.16em;
  }

  &__names {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem 0.5rem;
    color: #111827;
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &:hover &__names {
    transform: translateX(3px);
  }

  &__role {
    color: #374151;
    transition: color 0.3s ease;
  }

  &:hover &__role {
    color: #2f5233;
  }

  &__cta {
    color: #2f5233;
    font-weight: 500;
    opacity: 0;
    transform: translateY(8px);
    transition:
      opacity 0.32s ease,
      transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &:hover &__cta {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lol-hero-card {
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: none;
    }

    &:hover .lol-hero-card__splash,
    &:hover &__icon,
    &:hover &__names,
    &:hover &__cta {
      transform: none;
    }
  }
}
</style>
