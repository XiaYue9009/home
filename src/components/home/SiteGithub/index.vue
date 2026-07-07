<script setup>
import { SITE } from '@/config/consts';
</script>

<template>
  <section id="github" class="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
    <h2 class="mb-6 font-display text-2xl font-bold text-heading">GitHub</h2>
    <a
      :href="SITE.github"
      target="_blank"
      rel="noopener noreferrer"
      class="glass-card glass-card-hover group block p-6 transition sm:p-8"
    >
      <p class="font-display text-lg font-semibold text-heading group-hover:text-accent-soft">
        {{ SITE.github.replace('https://github.com/', '') }}
      </p>
      <p class="mt-2 text-sm text-muted">查看源码、提交 Issue 或参与讨论 →</p>
    </a>
  </section>
</template>
