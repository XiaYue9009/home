/** 从腾讯 CDN 拉取符文、装备等游戏元数据（对线表选装弹窗用）。 */
const LOL_REFERER = 'https://101.qq.com/';

const RUNE_TREE_IDS = new Set(['8000', '8100', '8200', '8300', '8400']);

export const RUNE_TREE_NAMES = ['精密', '主宰', '巫术', '坚决', '启迪'];

export const RUNE_SLOT_ORDER = {
  精密: ['基石', '英武', '传说', '战斗'],
  主宰: ['基石', '预谋', '追踪', '狩猎'],
  巫术: ['基石', '宝物', '卓越', '威能'],
  坚决: ['基石', '蛮力', '抵抗', '生机'],
  启迪: ['基石', '巧具', '未来', '超越'],
};

export const LOADOUT_ITEM_SLOTS = 6;

let runeCache = null;
let itemCache = null;
let runeDisplayOrder = null;

const DDRAGON_RUNE_ORDER_URL =
  'https://ddragon.leagueoflegends.com/cdn/15.12.1/data/zh_CN/runesReforged.json';

async function loadRuneDisplayOrder() {
  if (runeDisplayOrder) return runeDisplayOrder;

  try {
    const res = await fetch(DDRAGON_RUNE_ORDER_URL);
    if (!res.ok) throw new Error('符文顺序获取失败');

    const data = await res.json();
    const map = new Map();
    let index = 0;

    for (const style of data) {
      for (const slot of style.slots || []) {
        for (const rune of slot.runes || []) {
          map.set(String(rune.id), index++);
        }
      }
    }

    runeDisplayOrder = map;
  } catch {
    runeDisplayOrder = new Map();
  }

  return runeDisplayOrder;
}

function runeSortKey(id, orderMap) {
  const order = orderMap.get(String(id));
  return order != null ? order : Number(id);
}

function splitLabels(text = '') {
  return text
    .split(/[+＋,，、/\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function matchByLabels(labels, catalog) {
  const ids = [];

  for (const label of labels) {
    const item = catalog.find(
      (entry) =>
        entry.name === label ||
        entry.name.includes(label) ||
        label.includes(entry.name) ||
        entry.keywords?.includes(label),
    );
    if (item && !ids.includes(item.id)) ids.push(item.id);
  }

  return ids;
}

export function splitRuneIds(ids = [], catalog = []) {
  if (!ids.length) {
    return { primaryRuneIds: [], secondaryRuneIds: [] };
  }

  const resolved = ids
    .map((id) => catalog.find((rune) => rune.id === id))
    .filter(Boolean);

  const keystone = resolved.find((rune) => rune.isKeystone);
  if (keystone) {
    const primary = resolved.filter((rune) => rune.styleName === keystone.styleName);
    const secondary = resolved.filter(
      (rune) => rune.styleName && rune.styleName !== keystone.styleName,
    );
    return {
      primaryRuneIds: primary.map((rune) => rune.id),
      secondaryRuneIds: secondary.map((rune) => rune.id),
    };
  }

  if (resolved.length === 1) {
    return { primaryRuneIds: [resolved[0].id], secondaryRuneIds: [] };
  }

  return {
    primaryRuneIds: [resolved[0].id],
    secondaryRuneIds: resolved.slice(1).map((rune) => rune.id),
  };
}

function stripRuneHtml(html = '') {
  return String(html)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<hr[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchLolRunes() {
  if (runeCache) return runeCache;

  const res = await fetch('https://game.gtimg.cn/images/lol/act/img/js/runeList/rune_list.js', {
    headers: { Referer: LOL_REFERER },
  });
  if (!res.ok) throw new Error('符文数据获取失败');

  const data = await res.json();
  const orderMap = await loadRuneDisplayOrder();

  runeCache = Object.entries(data.rune)
    .filter(([id, rune]) => rune.icon && rune.key && !RUNE_TREE_IDS.has(id) && !id.startsWith('5'))
    .map(([id, rune]) => ({
      id,
      name: rune.name,
      icon: rune.icon,
      key: rune.key,
      styleName: rune.styleName || '',
      slotLabel: rune.slotLabel || '',
      isKeystone: rune.slotLabel === '基石',
      shortdesc: stripRuneHtml(rune.shortdesc || rune.longdesc || rune.tooltip || ''),
      keywords: [rune.name, rune.styleName, rune.slotLabel].filter(Boolean).join(' '),
      displayOrder: runeSortKey(id, orderMap),
    }));

  return runeCache;
}

export async function fetchLolItems() {
  if (itemCache) return itemCache;

  const res = await fetch('https://game.gtimg.cn/images/lol/act/img/js/items/items.js', {
    headers: { Referer: LOL_REFERER },
  });
  if (!res.ok) throw new Error('装备数据获取失败');

  const data = await res.json();
  itemCache = data.items
    .filter(
      (item) =>
        item.itemId &&
        item.iconPath &&
        Array.isArray(item.maps) &&
        item.maps.includes('召唤师峡谷'),
    )
    .map((item) => {
      const into = Array.isArray(item.into) ? item.into : [];
      const from = Array.isArray(item.from) ? item.from : [];
      const types = Array.isArray(item.types) ? item.types : [];

      return {
        id: item.itemId,
        name: item.name,
        icon: item.iconPath,
        keywords: item.keywords || item.name,
        types,
        into,
        from,
        stage: resolveItemStage(into, from),
        isFinished: into.length === 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

  return itemCache;
}

export function resolveItemStage(into = [], from = []) {
  if (!into.length) return 'finished';
  if (!from.length) return 'basic';
  return 'component';
}

export function itemMatchesStage(item, stage) {
  if (!stage || stage === 'all') return true;
  return item.stage === stage;
}

export function itemMatchesAttributes(item, attributeGroups = [], catalog = ITEM_ATTRIBUTE_GROUPS) {
  if (!attributeGroups.length) return true;

  const selectedTypes = new Set(
    catalog
      .filter((group) => attributeGroups.includes(group.id))
      .flatMap((group) => group.types),
  );

  return item.types.some((type) => selectedTypes.has(type));
}

export function filterLoadoutItems(
  catalog = [],
  { query = '', stage = 'finished', attributes = [] } = {},
  attributeCatalog = [],
) {
  const q = query.trim().toLowerCase();

  return catalog.filter((item) => {
    if (!itemMatchesStage(item, stage)) return false;
    if (!itemMatchesAttributes(item, attributes, attributeCatalog)) return false;
    if (!q) return true;

    return [item.name, item.keywords, ...(item.types || [])]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });
}

export function parseRuneIds(text = '', catalog = []) {
  if (!text) return [];
  return matchByLabels(splitLabels(text), catalog);
}

export function parseItemIds(text = '', catalog = []) {
  if (!text) return [];
  return matchByLabels(splitLabels(text), catalog);
}

export function getRuneById(catalog, id) {
  return catalog.find((rune) => rune.id === id);
}

export function getItemById(catalog, id) {
  return catalog.find((item) => item.id === id);
}

export function allRuneIdsFromRow(row) {
  return [...(row.primaryRuneIds || []), ...(row.secondaryRuneIds || [])];
}

export function groupRunesByTree(catalog = []) {
  const map = Object.fromEntries(
    RUNE_TREE_NAMES.map((tree) => [tree, Object.fromEntries(RUNE_SLOT_ORDER[tree].map((slot) => [slot, []]))]),
  );

  for (const rune of catalog) {
    if (!rune.styleName || !map[rune.styleName]?.[rune.slotLabel]) continue;
    map[rune.styleName][rune.slotLabel].push(rune);
  }

  for (const tree of RUNE_TREE_NAMES) {
    for (const slot of RUNE_SLOT_ORDER[tree]) {
      map[tree][slot].sort((a, b) => a.displayOrder - b.displayOrder);
    }
  }

  return map;
}

export function runeStyleFromIds(ids = [], catalog = []) {
  for (const id of ids) {
    const style = catalog.find((rune) => rune.id === id)?.styleName;
    if (style) return style;
  }
  return '';
}

/** 按符文系槽位顺序排列（列表展示与游戏内一致） */
export function sortRuneIdsBySlot(ids = [], catalog = [], styleName = '') {
  const order = RUNE_SLOT_ORDER[styleName];
  if (!order?.length) return [...ids];

  const slotIndex = (id) => {
    const slot = catalog.find((rune) => rune.id === id)?.slotLabel;
    const index = order.indexOf(slot);
    return index >= 0 ? index : order.length;
  };

  return [...ids].sort((a, b) => {
    const diff = slotIndex(a) - slotIndex(b);
    if (diff !== 0) return diff;
    const orderA = catalog.find((rune) => rune.id === a)?.displayOrder ?? 0;
    const orderB = catalog.find((rune) => rune.id === b)?.displayOrder ?? 0;
    return orderA - orderB;
  });
}

export function orderRuneLoadout(primaryRuneIds = [], secondaryRuneIds = [], catalog = []) {
  const primaryStyle = runeStyleFromIds(primaryRuneIds, catalog);
  const secondaryStyle = runeStyleFromIds(secondaryRuneIds, catalog);

  return {
    primaryRuneIds: sortRuneIdsBySlot(primaryRuneIds, catalog, primaryStyle),
    secondaryRuneIds: sortRuneIdsBySlot(secondaryRuneIds, catalog, secondaryStyle),
  };
}

export function primaryRuneInSlot(ids = [], catalog = [], tree, slot) {
  return ids.find((id) => {
    const rune = catalog.find((entry) => entry.id === id);
    return rune?.styleName === tree && rune?.slotLabel === slot;
  });
}

export function normalizeItemSlots(itemIds = [], slotCount = LOADOUT_ITEM_SLOTS) {
  const slots = Array.from({ length: slotCount }, (_, index) => itemIds[index] || '');
  return slots;
}

export function itemIdsFromSlots(slots = []) {
  return slots.filter(Boolean);
}
