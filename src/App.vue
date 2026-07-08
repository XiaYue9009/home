<script setup>
import AppHeader from './components/layout/AppHeader/index.vue';
import AppFooter from './components/layout/AppFooter/index.vue';
import PageEnter from './components/motion/PageEnter/index.vue';
import { initNatureFall } from './lib/site/nature-fall.js';

const route = useRoute();
const fitViewport = computed(() => route.meta?.fitViewport === true);
const showFooter = computed(() => !fitViewport.value);

watch(
  fitViewport,
  (value) => {
    document.body.classList.toggle('layout-fit-viewport', value);
  },
  { immediate: true },
);

watch(
  () => route.fullPath,
  () => {
    initNatureFall();
  },
);

onMounted(() => {
  initNatureFall();
});
</script>

<template>
  <div
    class="flex min-h-0 flex-1 flex-col"
    :class="fitViewport ? 'overflow-hidden' : ''"
  >
    <AppHeader />
    <main
      class="flex flex-1 flex-col"
      :class="fitViewport ? 'min-h-0 overflow-hidden' : ''"
    >
      <RouterView v-slot="{ Component, route }">
        <PageEnter
          :key="route.fullPath"
          :class="route.meta?.fitViewport ? 'page-fit min-h-0 overflow-hidden' : ''"
        >
          <component
            :is="Component"
            :class="route.meta?.fitViewport ? 'page-fit flex min-h-0 flex-1 flex-col overflow-hidden' : ''"
          />
        </PageEnter>
      </RouterView>
    </main>
    <AppFooter v-if="showFooter" />
  </div>
</template>
