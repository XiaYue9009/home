import { toSimplifiedChinese } from './zh-cn';

const WMO = {
  0: { description: '晴', emoji: '☀️' },
  1: { description: '大部晴朗', emoji: '🌤️' },
  2: { description: '多云', emoji: '⛅' },
  3: { description: '阴', emoji: '☁️' },
  45: { description: '雾', emoji: '🌫️' },
  48: { description: '雾凇', emoji: '🌫️' },
  51: { description: '小毛毛雨', emoji: '🌦️' },
  53: { description: '毛毛雨', emoji: '🌦️' },
  55: { description: '大毛毛雨', emoji: '🌧️' },
  56: { description: '冻毛毛雨', emoji: '🌧️' },
  57: { description: '冻毛毛雨', emoji: '🌧️' },
  61: { description: '小雨', emoji: '🌧️' },
  63: { description: '中雨', emoji: '🌧️' },
  65: { description: '大雨', emoji: '🌧️' },
  66: { description: '冻雨', emoji: '🌨️' },
  67: { description: '冻雨', emoji: '🌨️' },
  71: { description: '小雪', emoji: '🌨️' },
  73: { description: '中雪', emoji: '❄️' },
  75: { description: '大雪', emoji: '❄️' },
  77: { description: '雪粒', emoji: '❄️' },
  80: { description: '小阵雨', emoji: '🌦️' },
  81: { description: '阵雨', emoji: '🌧️' },
  82: { description: '大阵雨', emoji: '⛈️' },
  85: { description: '小阵雪', emoji: '🌨️' },
  86: { description: '大阵雪', emoji: '❄️' },
  95: { description: '雷暴', emoji: '⛈️' },
  96: { description: '雷暴伴小冰雹', emoji: '⛈️' },
  99: { description: '雷暴伴大冰雹', emoji: '⛈️' },
};

export function weatherFromCode(code) {
  return WMO[code] ?? { description: '未知', emoji: '🌡️' };
}

export async function fetchCurrentWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
    timezone: 'auto',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('天气数据获取失败');

  const data = await res.json();
  const current = data.current;
  const { description, emoji } = weatherFromCode(current.weather_code);

  return {
    temp: Math.round(current.temperature_2m),
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    description,
    emoji,
  };
}

function stripSuffix(name, suffix) {
  return name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
}

function normalizePlace(name) {
  return toSimplifiedChinese(name.trim());
}

function shortCityName(name) {
  return stripSuffix(stripSuffix(normalizePlace(name), '市'), '省');
}

export function formatOsmAddress(address, fallback) {
  if (!address) return normalizePlace(fallback);

  const districtRaw =
    address.district || address.suburb || address.borough || address.county;
  const cityRaw =
    address.city || address.town || address.municipality || address.village;
  const stateRaw = address.state;

  const district = districtRaw ? normalizePlace(districtRaw) : undefined;
  let city = cityRaw ? shortCityName(cityRaw) : undefined;

  if (!city && stateRaw?.endsWith('市')) {
    city = shortCityName(stateRaw);
  } else if (!city && stateRaw?.endsWith('省')) {
    city = shortCityName(stateRaw);
  }

  if (city && district) {
    if (district.includes(city)) return district;
    return `${city} ${district}`;
  }

  const result = city || district || (stateRaw ? normalizePlace(stateRaw) : fallback);
  return normalizePlace(result);
}

export async function resolveCityName(lat, lon, fallback) {
  const simplifiedFallback = normalizePlace(fallback);

  try {
    const params = new URLSearchParams({
      format: 'json',
      lat: String(lat),
      lon: String(lon),
      'accept-language': 'zh-CN',
      addressdetails: '1',
      zoom: '10',
    });

    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: {
        'Accept-Language': 'zh-CN',
        'User-Agent': 'MoonHome/1.0 (https://github.com/XiaYue9009/home)',
      },
    });

    if (!res.ok) return simplifiedFallback;

    const data = await res.json();
    return formatOsmAddress(data.address, simplifiedFallback);
  } catch {
    return simplifiedFallback;
  }
}

export function getDefaultLocation() {
  const lat = parseFloat(import.meta.env.PUBLIC_WEATHER_LAT || '39.9042');
  const lon = parseFloat(import.meta.env.PUBLIC_WEATHER_LON || '116.4074');
  const district = import.meta.env.PUBLIC_WEATHER_DISTRICT;
  const city = import.meta.env.PUBLIC_WEATHER_CITY || '北京';
  const label = district ? `${city} ${district}` : city;
  return { lat, lon, city: normalizePlace(label) };
}
