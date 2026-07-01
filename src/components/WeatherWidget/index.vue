<script setup>
const CACHE_KEY = 'moonhome-weather-v4';
const CACHE_TTL = 15 * 60 * 1000;

const status = ref('loading');
const weather = ref(null);
const errorMsg = ref('');

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
}

function getLocation() {
  const fallback = getDefaultLocation();

  if (!navigator.geolocation) {
    return Promise.resolve(fallback);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(fallback),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: CACHE_TTL },
    );
  });
}

async function loadWeather(force = false) {
  if (!force) {
    const cached = readCache();
    if (cached) {
      weather.value = cached;
      status.value = 'ready';
      return;
    }
  }

  status.value = 'loading';
  errorMsg.value = '';

  try {
    const loc = await getLocation();
    const fallback = getDefaultLocation();
    const cityName =
      loc.city ?? (await resolveCityName(loc.lat, loc.lon, fallback.city));

    const current = await fetchCurrentWeather(loc.lat, loc.lon);
    const data = { city: cityName, ...current };

    weather.value = data;
    writeCache(data);
    status.value = 'ready';
  } catch {
    status.value = 'error';
    errorMsg.value = '天气加载失败';
  }
}

onMounted(() => loadWeather());
</script>

<template>
  <div
    class="weather-widget flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs sm:gap-2 sm:px-3"
    :title="weather ? `${weather.city} · 湿度 ${weather.humidity}% · 风速 ${weather.windSpeed} km/h` : '实时天气'"
  >
    <template v-if="status === 'loading'">
      <span class="text-subtle animate-pulse">天气…</span>
    </template>

    <template v-else-if="status === 'error'">
      <button type="button" class="text-subtle transition hover:text-accent" @click="loadWeather(true)">
        {{ errorMsg }} ↻
      </button>
    </template>

    <template v-else-if="weather">
      <span class="text-base leading-none" aria-hidden="true">{{ weather.emoji }}</span>
      <span class="hidden max-w-[7rem] truncate font-medium text-heading sm:inline">{{ weather.city }}</span>
      <span class="font-medium text-accent">{{ weather.temp }}°</span>
      <span class="hidden text-subtle lg:inline">{{ weather.description }}</span>
      <button
        type="button"
        class="ml-0.5 text-subtle opacity-0 transition hover:text-accent group-hover:opacity-100 focus:opacity-100"
        aria-label="刷新天气"
        @click="loadWeather(true)"
      >
        ↻
      </button>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.weather-widget {
  background-color: var(--color-glass-bg);
  border: 1px solid var(--color-border);

  &:hover {
    border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  }
}
</style>
