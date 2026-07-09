/** 从视频标题、话题、POI 中提取省市区与具体地名。 */

const MUNICIPALITIES = ['北京', '上海', '天津', '重庆'];

const PROVINCES = [
  '黑龙江', '内蒙古', '新疆', '宁夏', '广西', '西藏',
  '河北', '山西', '辽宁', '吉林', '江苏', '浙江', '安徽', '福建', '江西',
  '山东', '河南', '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南',
  '陕西', '甘肃', '青海', '台湾', '香港', '澳门',
  ...MUNICIPALITIES,
];

const PLACE_SUFFIXES = [
  '国家级风景名胜区', '风景名胜区', '国家森林公园', '国家地质公园', '地质公园',
  '森林公园', '湿地公园', '古城', '古镇', '古村', '老街', '步行街', '美食街',
  '风景区', '景区', '公园', '湿地', '峡谷', '栈道', '草原', '沙漠', '沙滩',
  '海岛', '岛屿', '半岛', '湖泊', '水库', '瀑布', '温泉', '滑雪场', '索道',
  '博物馆', '纪念馆', '寺', '庙', '塔', '楼', '阁', '殿', '宫', '洞', '窟',
  '山', '峰', '岭', '谷', '湖', '海', '岛', '湾', '江', '河', '溪', '泉',
  '村', '镇', '乡', '街', '路', '巷', '坊', '里', '坞', '坪', '坡', '台',
];

function uniqueStrings(list) {
  return [...new Set(list.filter(Boolean))];
}

export function extractTopicsFromAweme(aweme) {
  const topics = [];
  const textExtra = aweme?.text_extra || aweme?.textExtra || [];
  for (const item of textExtra) {
    if (item?.hashtag_name) topics.push(String(item.hashtag_name).trim());
  }
  const chaList = aweme?.cha_list || aweme?.chaList || [];
  for (const item of chaList) {
    if (item?.cha_name) topics.push(String(item.cha_name).trim());
  }
  const title = String(aweme?.desc || '');
  for (const match of title.matchAll(/#([^#\s，,。！!？?；;：:【】\[\]()（）]+)/g)) {
    topics.push(match[1].trim());
  }
  return uniqueStrings(topics);
}

export function extractPoiNameFromAweme(aweme) {
  const anchor = aweme?.anchor || aweme?.anchor_info;
  if (!anchor) return '';
  if (typeof anchor?.poi_name === 'string') return anchor.poi_name.trim();
  const extra = anchor?.extra;
  if (typeof extra === 'string') {
    try {
      const parsed = JSON.parse(extra);
      if (parsed?.poi_name) return String(parsed.poi_name).trim();
    } catch {
      // ignore
    }
  }
  if (extra && typeof extra === 'object' && extra.poi_name) {
    return String(extra.poi_name).trim();
  }
  return '';
}

function stripPlaceSuffix(name) {
  let result = String(name || '').trim();
  for (const suffix of PLACE_SUFFIXES.sort((a, b) => b.length - a.length)) {
    if (result.endsWith(suffix) && result.length > suffix.length + 1) {
      result = result.slice(0, -suffix.length);
      break;
    }
  }
  return result.trim();
}

function findProvince(text) {
  const sorted = [...PROVINCES].sort((a, b) => b.length - a.length);
  for (const name of sorted) {
    if (text.includes(name)) return name;
  }
  const provinceMatch = text.match(/([\u4e00-\u9fa5]{2,7}?)省/);
  return provinceMatch?.[1] ? `${provinceMatch[1]}省` : '';
}

function findCity(text, province) {
  if (MUNICIPALITIES.includes(province)) return province;
  const cityMatch = text.match(/([\u4e00-\u9fa5]{2,7}?)市/);
  if (cityMatch?.[1]) return `${cityMatch[1]}市`;
  const countyLevel = text.match(/([\u4e00-\u9fa5]{2,6}?)州/);
  if (countyLevel?.[1]) return `${countyLevel[1]}州`;
  return '';
}

function findDistrict(text) {
  const districtMatch = text.match(/([\u4e00-\u9fa5]{1,6}?(?:区|县|旗))/);
  return districtMatch?.[1] || '';
}

function extractPlaceName(text, { province, city, poiName }) {
  const source = poiName || text;
  if (!source) return '';

  let candidate = stripPlaceSuffix(poiName || '');
  if (!candidate) {
    for (const suffix of PLACE_SUFFIXES) {
      const re = new RegExp(`([\u4e00-\u9fa5A-Za-z0-9·]{2,12}?)${suffix}`);
      const match = source.match(re);
      if (match?.[1]) {
        candidate = `${match[1]}${suffix}`;
        break;
      }
    }
  }

  if (!candidate) return '';

  for (const token of [province, city, findDistrict(source)].filter(Boolean)) {
    candidate = candidate.replaceAll(token, '');
  }
  candidate = candidate.replace(/^的|^在|^于/, '').trim();
  return stripPlaceSuffix(candidate) || candidate.slice(0, 24);
}

function buildGeoLabel({ province, city, district, placeName }) {
  const parts = uniqueStrings([province, city, district, placeName]);
  return parts.join('·');
}

/**
 * @param {{ title?: string, topics?: string[], poiName?: string }} input
 */
export function extractGeoFromVideo(input = {}) {
  const title = String(input.title || '').trim();
  const topics = Array.isArray(input.topics) ? input.topics : [];
  const poiName = String(input.poiName || '').trim();
  const merged = uniqueStrings([title, topics.join(' '), poiName]).join(' ');

  const province = findProvince(merged);
  const city = findCity(merged, province);
  const district = findDistrict(merged);
  const placeName = extractPlaceName(merged, { province, city, poiName });

  return {
    province,
    city,
    district,
    placeName,
    label: buildGeoLabel({ province, city, district, placeName }),
  };
}

export function groupVideosByGeo(videos = []) {
  const tree = new Map();

  for (const video of videos) {
    const province = video.province || '未识别';
    const city = video.city || '未识别';
    const place = video.placeName || video.geoLabel || '未识别地点';

    if (!tree.has(province)) tree.set(province, new Map());
    const cityMap = tree.get(province);
    if (!cityMap.has(city)) cityMap.set(city, new Map());
    const placeMap = cityMap.get(city);
    if (!placeMap.has(place)) placeMap.set(place, []);
    placeMap.get(place).push(video);
  }

  return [...tree.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
    .map(([province, cityMap]) => ({
      province,
      cities: [...cityMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
        .map(([city, placeMap]) => ({
          city,
          places: [...placeMap.entries()]
            .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
            .map(([placeName, items]) => ({
              placeName,
              videos: items,
            })),
        })),
    }));
}

export function collectGeoOptions(videos = []) {
  const provinces = new Set();
  const cities = new Set();
  const districts = new Set();
  const places = new Set();

  for (const video of videos) {
    if (video.province) provinces.add(video.province);
    if (video.city) cities.add(video.city);
    if (video.district) districts.add(video.district);
    if (video.placeName) places.add(video.placeName);
  }

  const sortZh = (a, b) => a.localeCompare(b, 'zh-CN');
  return {
    provinces: [...provinces].sort(sortZh),
    cities: [...cities].sort(sortZh),
    districts: [...districts].sort(sortZh),
    places: [...places].sort(sortZh),
  };
}
