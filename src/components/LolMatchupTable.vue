<script setup>
import ConfirmDialog from './ConfirmDialog.vue';
import MatchupDifficultySelect from './MatchupDifficultySelect.vue';
import {
  FLASH_SPELL_ID,
  LOL_SUMMONER_SPELLS,
  createDefaultSkillIds,
  getSummonerSpell,
  summonerSpellIcon,
} from '../config/lol-summoner-spells.js';
import {
  DEFAULT_SECOND_SPELL_IDS,
  MAX_SECOND_SPELL_CANDIDATES,
  getSelectableSecondSpells,
  normalizeCandidateSpellIds,
} from '../config/lol-matchup-spells.js';
import {
  compareDifficulty,
  getDifficultyLabel,
} from '../config/lol-matchup-difficulty.js';
import {
  LOL_MATCHUP_EDIT_PASSWORD,
  isMatchupEditUnlocked,
  setMatchupEditUnlocked,
} from '../config/lol-matchup-edit.js';
import {
  DEFAULT_ITEM_STAGE,
  ITEM_ATTRIBUTE_GROUPS,
  ITEM_STAGE_OPTIONS,
} from '../config/lol-items.js';
import {
  LOADOUT_ITEM_SLOTS,
  RUNE_SLOT_ORDER,
  RUNE_TREE_NAMES,
  allRuneIdsFromRow,
  fetchLolItems,
  fetchLolRunes,
  filterLoadoutItems,
  getItemById,
  getRuneById,
  groupRunesByTree,
  itemIdsFromSlots,
  normalizeItemSlots,
  orderRuneLoadout,
  primaryRuneInSlot,
  runeStyleFromIds,
  sortRuneIdsBySlot,
} from '../lib/lol-game-data.js';
import {
  buildHeroLookup,
  compactRowsForStorage,
  createEmptyMatchupRow,
  fetchLolHeroList,
  fetchMidHeroIds,
  isCloudSyncEnabled,
  mergeMidMatchupRows,
  normalizeMatchups,
  persistMatchups,
  resolveMatchupSource,
} from '../lib/lol-matchup.js';

const props = defineProps({
  matchups: { type: Array, default: () => [] },
  heroName: { type: String, default: '' },
  heroId: { type: String, default: '' },
  compact: { type: Boolean, default: false },
});

const searchInput = ref('');
const appliedQuery = ref('');
const difficultyFilter = ref('');
const difficultySort = ref('asc');
const rows = ref([]);
const heroes = ref([]);
const runes = ref([]);
const items = ref([]);
const loading = ref(true);
const picker = ref(null);
const pickerQuery = ref('');
const itemQuery = ref('');
const itemStage = ref(DEFAULT_ITEM_STAGE);
const itemAttributes = ref([]);
const loadoutDraft = ref(null);
const loadoutClipboard = ref(null);
const activeItemSlot = ref(0);
const runeTooltip = ref(null);
const runeTooltipPos = ref({ top: 0, left: 0 });
const pendingDeleteRow = ref(null);
const syncStatus = ref('idle');
const hydrating = ref(true);
const isMounted = ref(false);
const canEdit = ref(false);
const editPasswordInput = ref('');
const editAuthError = ref('');

const syncStatusLabel = computed(() => {
  if (!isCloudSyncEnabled()) return '仅本地';
  if (syncStatus.value === 'syncing') return '同步中…';
  if (syncStatus.value === 'error') return '同步失败';
  return '云端';
});

const syncStatusTone = computed(() => {
  if (!isCloudSyncEnabled()) return 'local';
  if (syncStatus.value === 'syncing') return 'syncing';
  if (syncStatus.value === 'error') return 'error';
  return 'cloud';
});

const syncElTagType = computed(() => {
  const tone = syncStatusTone.value;
  if (tone === 'error') return 'danger';
  if (tone === 'syncing') return 'warning';
  if (tone === 'cloud') return 'success';
  return 'info';
});

const tableWrapRef = ref(null);
const tableHeight = ref(480);
let tableResizeObserver;

function updateTableHeight() {
  if (!props.compact || !tableWrapRef.value) return;
  const height = tableWrapRef.value.clientHeight;
  if (height > 0) tableHeight.value = height;
}

function bindTableResize() {
  tableResizeObserver?.disconnect();
  if (!tableWrapRef.value || typeof ResizeObserver === 'undefined') return;
  tableResizeObserver = new ResizeObserver(() => updateTableHeight());
  tableResizeObserver.observe(tableWrapRef.value);
  updateTableHeight();
}

watch(
  () => [props.compact, loading.value],
  () => nextTick(bindTableResize),
);

const lookup = computed(() => {
  const heroLookup = buildHeroLookup(heroes.value);
  heroLookup.spellById = new Map(LOL_SUMMONER_SPELLS.map((spell) => [spell.id, spell]));
  heroLookup.runeById = new Map(runes.value.map((rune) => [rune.id, rune]));
  heroLookup.itemById = new Map(items.value.map((item) => [item.id, item]));
  return heroLookup;
});

const filteredRows = computed(() => {
  let list = rows.value;

  const q = appliedQuery.value.trim().toLowerCase();
  if (q) list = list.filter((row) => rowSearchText(row).includes(q));

  if (difficultyFilter.value) {
    list = list.filter((row) => row.difficulty === difficultyFilter.value);
  }

  if (difficultySort.value) {
    list = [...list].sort((a, b) => {
      const diff = compareDifficulty(a.difficulty, b.difficulty, difficultySort.value);
      if (diff !== 0) return diff;
      const nameA = heroForRow(a)?.name || a.enemyName || '';
      const nameB = heroForRow(b)?.name || b.enemyName || '';
      return nameA.localeCompare(nameB, 'zh-CN');
    });
  }

  return list;
});

const filterSummary = computed(() => {
  const parts = [];
  if (appliedQuery.value.trim()) parts.push(`「${appliedQuery.value.trim()}」`);
  if (difficultyFilter.value) {
    parts.push(getDifficultyLabel(difficultyFilter.value));
  }
  return parts.length ? parts.join(' · ') : '当前条件';
});

const filteredHeroes = computed(() => filterCatalog(heroes.value));
const filteredLoadoutItems = computed(() =>
  filterLoadoutItems(
    items.value,
    {
      query: itemQuery.value,
      stage: itemStage.value,
      attributes: itemAttributes.value,
    },
    ITEM_ATTRIBUTE_GROUPS,
  ),
);
const runesByTree = computed(() => groupRunesByTree(runes.value));

const runeTreeIcons = computed(() => {
  const icons = {};
  for (const tree of RUNE_TREE_NAMES) {
    const keystones = runesByTree.value[tree]?.['基石'] || [];
    icons[tree] = keystones[0]?.icon || '';
  }
  return icons;
});

const loadoutPrimaryStyle = computed(() => {
  if (loadoutDraft.value?.primaryTree) return loadoutDraft.value.primaryTree;
  return runeStyleFromIds(loadoutDraft.value?.primaryRuneIds || [], runes.value);
});

const loadoutSecondaryStyle = computed(() => {
  if (loadoutDraft.value?.secondaryTree) return loadoutDraft.value.secondaryTree;
  return runeStyleFromIds(loadoutDraft.value?.secondaryRuneIds || [], runes.value);
});

const activeRow = computed(() =>
  rows.value.find((row) => row.id === picker.value?.rowId) || null,
);

const pickerTitle = computed(() => {
  if (!picker.value) return '';
  if (picker.value.type === 'hero') return '选择英雄';
  if (picker.value.type === 'candidates') return '调整候选技能';
  return '配置天赋与装备';
});

const selectableSecondSpells = getSelectableSecondSpells();

const activeCandidateCount = computed(() => activeRow.value?.candidateSpellIds?.length || 0);

const deleteConfirmOpen = computed({
  get: () => !!pendingDeleteRow.value,
  set: (open) => {
    if (!open) pendingDeleteRow.value = null;
  },
});

const deleteConfirmMessage = computed(() => {
  const row = pendingDeleteRow.value;
  if (!row) return '';
  const hero = heroForRow(row);
  const label = hero?.name || row.enemyName || '该对线';
  return `确定删除「${label}」的对线笔记吗？`;
});

const canPasteLoadout = computed(() => !!loadoutClipboard.value);

function filterCatalog(list) {
  const q = pickerQuery.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter((entry) =>
    [entry.name, entry.keywords, entry.fullName, entry.alias]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q)),
  );
}

function rowSearchText(row) {
  const hero = lookup.value.byId.get(row.enemyId);
  return [
    hero?.fullName,
    hero?.name,
    hero?.alias,
    hero?.keywords,
    row.enemyName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function heroForRow(row) {
  return lookup.value.byId.get(row.enemyId) || null;
}

function secondSpellOptions(row) {
  return normalizeCandidateSpellIds(row.candidateSpellIds, row.enemyId);
}

function candidateSpellsForRow(row) {
  return secondSpellOptions(row)
    .map((id) => getSummonerSpell(id))
    .filter(Boolean);
}

function sanitizeRowSkills(row) {
  row.candidateSpellIds = normalizeCandidateSpellIds(row.candidateSpellIds, row.enemyId);
  row.skillIds = createDefaultSkillIds();
}

function ensureCanEdit() {
  return canEdit.value;
}

function unlockEdit() {
  editAuthError.value = '';
  if (editPasswordInput.value === LOL_MATCHUP_EDIT_PASSWORD) {
    canEdit.value = true;
    setMatchupEditUnlocked(true);
    editPasswordInput.value = '';
    return;
  }
  editAuthError.value = '密码错误';
}

function lockEdit() {
  canEdit.value = false;
  setMatchupEditUnlocked(false);
  editPasswordInput.value = '';
  editAuthError.value = '';
  closePicker();
  pendingDeleteRow.value = null;
}

function openCandidatePicker(rowId) {
  if (!ensureCanEdit()) return;
  picker.value = { type: 'candidates', rowId };
  pickerQuery.value = '';
}

function toggleCandidateSpell(spellId) {
  const row = activeRow.value;
  if (!row) return;

  const ids = [...row.candidateSpellIds];
  const index = ids.indexOf(spellId);

  if (index >= 0) {
    ids.splice(index, 1);
  } else if (ids.length < MAX_SECOND_SPELL_CANDIDATES) {
    ids.push(spellId);
  }

  row.candidateSpellIds = normalizeCandidateSpellIds(ids, row.enemyId);
  sanitizeRowSkills(row);
}

function isCandidatePickerDisabled(spellId) {
  const row = activeRow.value;
  if (!row) return true;
  if (row.candidateSpellIds.includes(spellId)) return false;
  return row.candidateSpellIds.length >= MAX_SECOND_SPELL_CANDIDATES;
}

function openLoadoutPicker(rowId) {
  if (!ensureCanEdit()) return;
  const row = rows.value.find((entry) => entry.id === rowId);
  if (!row) return;

  loadoutDraft.value = {
    primaryTree: runeStyleFromIds(row.primaryRuneIds, runes.value),
    secondaryTree: runeStyleFromIds(row.secondaryRuneIds, runes.value),
    primaryRuneIds: [...row.primaryRuneIds],
    secondaryRuneIds: [...row.secondaryRuneIds],
    itemSlots: normalizeItemSlots(row.itemIds),
  };
  activeItemSlot.value = loadoutDraft.value.itemSlots.findIndex((id) => !id);
  if (activeItemSlot.value < 0) activeItemSlot.value = 0;

  picker.value = { type: 'loadout', rowId };
  pickerQuery.value = '';
  itemQuery.value = '';
  itemStage.value = DEFAULT_ITEM_STAGE;
  itemAttributes.value = [];
}

function applySearch() {
  appliedQuery.value = searchInput.value.trim().toLowerCase();
}

function setDifficultySort(direction) {
  difficultySort.value = difficultySort.value === direction ? '' : direction;
}

function openHeroPicker(rowId) {
  if (!ensureCanEdit()) return;
  picker.value = { type: 'hero', rowId };
  pickerQuery.value = '';
}

function syncLoadoutDraftToRow() {
  const row = activeRow.value;
  if (!row || !loadoutDraft.value) return;

  const ordered = orderRuneLoadout(
    loadoutDraft.value.primaryRuneIds,
    loadoutDraft.value.secondaryRuneIds,
    runes.value,
  );
  row.primaryRuneIds = ordered.primaryRuneIds;
  row.secondaryRuneIds = ordered.secondaryRuneIds;
  row.itemIds = itemIdsFromSlots(loadoutDraft.value.itemSlots);
}

function closePicker() {
  if (picker.value?.type === 'loadout') {
    syncLoadoutDraftToRow();
  }

  picker.value = null;
  pickerQuery.value = '';
  itemQuery.value = '';
  itemStage.value = DEFAULT_ITEM_STAGE;
  itemAttributes.value = [];
  loadoutDraft.value = null;
  activeItemSlot.value = 0;
  runeTooltip.value = null;
}

function showRuneTooltip(rune, event) {
  const rect = event.currentTarget.getBoundingClientRect();
  runeTooltip.value = rune;
  runeTooltipPos.value = {
    top: rect.bottom + 8,
    left: rect.left + rect.width / 2,
  };
}

function hideRuneTooltip() {
  runeTooltip.value = null;
}

function toggleItemAttribute(groupId) {
  if (itemAttributes.value.includes(groupId)) {
    itemAttributes.value = itemAttributes.value.filter((id) => id !== groupId);
  } else {
    itemAttributes.value = [...itemAttributes.value, groupId];
  }
}

function selectHero(hero) {
  const row = activeRow.value;
  if (!row) return;
  row.enemyId = hero.id;
  row.enemyName = hero.name;
  sanitizeRowSkills(row);
  closePicker();
}

function selectPrimaryTree(tree) {
  if (!loadoutDraft.value || loadoutPrimaryStyle.value === tree) return;

  const previousTree = loadoutPrimaryStyle.value;
  loadoutDraft.value.primaryTree = tree;

  if (previousTree) {
    loadoutDraft.value.primaryRuneIds = loadoutDraft.value.primaryRuneIds.filter((id) => {
      const rune = getRuneById(runes.value, id);
      return rune?.styleName !== previousTree;
    });
  }

  if (loadoutSecondaryStyle.value === tree) {
    loadoutDraft.value.secondaryTree = '';
    loadoutDraft.value.secondaryRuneIds = [];
  }

  syncLoadoutDraftToRow();
}

function selectSecondaryTree(tree) {
  if (!loadoutDraft.value || tree === loadoutPrimaryStyle.value) return;
  if (loadoutSecondaryStyle.value === tree) return;

  loadoutDraft.value.secondaryTree = tree;
  loadoutDraft.value.secondaryRuneIds = [];
  syncLoadoutDraftToRow();
}

function selectPrimaryRune(rune) {
  if (!loadoutDraft.value || !rune?.styleName || !rune?.slotLabel) return;

  loadoutDraft.value.primaryTree = rune.styleName;

  const { primaryRuneIds } = loadoutDraft.value;
  const current = primaryRuneInSlot(primaryRuneIds, runes.value, rune.styleName, rune.slotLabel);

  if (current === rune.id) {
    loadoutDraft.value.primaryRuneIds = primaryRuneIds.filter((id) => id !== rune.id);
    syncLoadoutDraftToRow();
    return;
  }

  loadoutDraft.value.primaryRuneIds = [
    ...primaryRuneIds.filter((id) => {
      const entry = getRuneById(runes.value, id);
      return !(entry?.styleName === rune.styleName && entry?.slotLabel === rune.slotLabel);
    }),
    rune.id,
  ];

  if (loadoutSecondaryStyle.value === rune.styleName) {
    loadoutDraft.value.secondaryTree = '';
    loadoutDraft.value.secondaryRuneIds = [];
  }

  syncLoadoutDraftToRow();
}

function selectSecondaryRune(rune) {
  if (!loadoutDraft.value || !rune?.styleName || rune.isKeystone) return;
  if (rune.styleName === loadoutPrimaryStyle.value) return;

  loadoutDraft.value.secondaryTree = rune.styleName;

  const { secondaryRuneIds } = loadoutDraft.value;
  if (secondaryRuneIds.includes(rune.id)) {
    loadoutDraft.value.secondaryRuneIds = secondaryRuneIds.filter((id) => id !== rune.id);
    syncLoadoutDraftToRow();
    return;
  }

  const sameRow = secondaryRuneIds.find((id) => {
    const entry = getRuneById(runes.value, id);
    return entry?.styleName === rune.styleName && entry?.slotLabel === rune.slotLabel;
  });

  let next = secondaryRuneIds.filter((id) => id !== sameRow);
  if (next.length >= 2) {
    next = next.slice(1);
  }
  next.push(rune.id);
  loadoutDraft.value.secondaryRuneIds = next;
  syncLoadoutDraftToRow();
}

function selectLoadoutItem(itemId) {
  if (!loadoutDraft.value) return;

  const slots = [...loadoutDraft.value.itemSlots];
  const existingIndex = slots.indexOf(itemId);
  if (existingIndex >= 0) {
    slots[existingIndex] = '';
    loadoutDraft.value.itemSlots = slots;
    activeItemSlot.value = existingIndex;
    syncLoadoutDraftToRow();
    return;
  }

  const emptyIndex = slots.indexOf('');
  if (emptyIndex >= 0) {
    slots[emptyIndex] = itemId;
    loadoutDraft.value.itemSlots = slots;
    activeItemSlot.value = slots.indexOf('') >= 0 ? slots.indexOf('') : emptyIndex;
    syncLoadoutDraftToRow();
    return;
  }

  slots[activeItemSlot.value] = itemId;
  loadoutDraft.value.itemSlots = slots;
  syncLoadoutDraftToRow();
}

function clearLoadoutItemSlot(index) {
  if (!loadoutDraft.value) return;
  const slots = [...loadoutDraft.value.itemSlots];
  slots[index] = '';
  loadoutDraft.value.itemSlots = slots;
  activeItemSlot.value = index;
  syncLoadoutDraftToRow();
}

function isPrimaryRuneSelected(runeId) {
  return loadoutDraft.value?.primaryRuneIds.includes(runeId) || false;
}

function isSecondaryRuneSelected(runeId) {
  return loadoutDraft.value?.secondaryRuneIds.includes(runeId) || false;
}

function isLoadoutItemSelected(itemId) {
  return loadoutDraft.value?.itemSlots.includes(itemId) || false;
}

function isKeystoneRune(runeId) {
  return Boolean(getRuneById(runes.value, runeId)?.isKeystone);
}

function sortedPrimaryRunes(row) {
  const style = runeStyleFromIds(row.primaryRuneIds, runes.value);
  return sortRuneIdsBySlot(row.primaryRuneIds, runes.value, style);
}

function sortedSecondaryRunes(row) {
  const style = runeStyleFromIds(row.secondaryRuneIds, runes.value);
  return sortRuneIdsBySlot(row.secondaryRuneIds, runes.value, style);
}

function addRow() {
  if (!ensureCanEdit()) return;
  rows.value.push(createEmptyMatchupRow('', lookup.value));
}

function copyLoadout(row) {
  if (!ensureCanEdit()) return;
  loadoutClipboard.value = {
    primaryRuneIds: [...row.primaryRuneIds],
    secondaryRuneIds: [...row.secondaryRuneIds],
    itemIds: [...row.itemIds],
  };
}

function pasteLoadout(row) {
  if (!ensureCanEdit()) return;
  const data = loadoutClipboard.value;
  if (!data) return;
  const ordered = orderRuneLoadout(data.primaryRuneIds, data.secondaryRuneIds, runes.value);
  row.primaryRuneIds = ordered.primaryRuneIds;
  row.secondaryRuneIds = ordered.secondaryRuneIds;
  row.itemIds = [...data.itemIds];
}

function confirmRemoveRow(row) {
  if (!ensureCanEdit()) return;
  pendingDeleteRow.value = row;
}

function executeRemoveRow() {
  const row = pendingDeleteRow.value;
  if (!row) return;
  rows.value = rows.value.filter((entry) => entry.id !== row.id);
  pendingDeleteRow.value = null;
}

let saveTimer;
let rowsSnapshot = '';

function buildRowsSnapshot(value) {
  return JSON.stringify(compactRowsForStorage(value));
}

function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), ms);
    }),
  ]);
}

watch(
  rows,
  (value) => {
    if (!props.heroId || loading.value || hydrating.value || !canEdit.value) return;
    if (buildRowsSnapshot(value) === rowsSnapshot) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      if (isCloudSyncEnabled()) syncStatus.value = 'syncing';
      const result = await persistMatchups(props.heroId, value);
      if (!isCloudSyncEnabled()) return;
      if (result.ok) {
        rowsSnapshot = buildRowsSnapshot(value);
      }
      syncStatus.value = result.ok ? 'synced' : 'error';
    }, 250);
  },
  { deep: true },
);

onMounted(async () => {
  isMounted.value = true;
  canEdit.value = isMatchupEditUnlocked();
  if (isCloudSyncEnabled()) syncStatus.value = 'syncing';

  try {
    [heroes.value, runes.value, items.value] = await Promise.all([
      fetchLolHeroList(),
      fetchLolRunes(),
      fetchLolItems(),
    ]);
  } catch {
    heroes.value = [];
    runes.value = [];
    items.value = [];
  }

  try {
    const heroLookup = buildHeroLookup(heroes.value);
    const catalogs = { runes: runes.value, items: items.value };
    const source = await withTimeout(
      resolveMatchupSource(props.heroId, props.matchups),
    );
    let normalized = normalizeMatchups(source, heroLookup, catalogs);

    const midHeroIds = await fetchMidHeroIds();
    normalized = mergeMidMatchupRows(normalized, {
      pageHeroId: props.heroId,
      midHeroIds,
      heroLookup,
    });

    rows.value = normalized;
    rowsSnapshot = buildRowsSnapshot(rows.value);
  } catch {
    rows.value = normalizeMatchups(props.matchups, buildHeroLookup(heroes.value), {
      runes: runes.value,
      items: items.value,
    });
    rowsSnapshot = buildRowsSnapshot(rows.value);
  } finally {
    loading.value = false;
    hydrating.value = false;
    if (isCloudSyncEnabled() && syncStatus.value === 'syncing') {
      syncStatus.value = 'synced';
    }
    nextTick(bindTableResize);
  }
});

onUnmounted(() => {
  tableResizeObserver?.disconnect();
});
</script>

<template>
  <section class="lol-matchup-panel glass-card overflow-hidden" :class="{ 'lol-matchup-panel--compact': compact }">
    <div class="lol-matchup-panel__head">
      <div class="lol-matchup-panel__title-wrap">
        <div class="lol-matchup-panel__title-row">
          <h2 class="font-display font-semibold text-heading">对线笔记</h2>
          <el-tag :type="syncElTagType" size="small" effect="plain">
            {{ syncStatusLabel }}
          </el-tag>
        </div>
        <p v-if="!compact" class="mt-1 text-sm text-muted">
          {{ heroName ? `${heroName} · ` : '' }}符文、召唤师技能与出装思路
        </p>
      </div>
      <div class="lol-matchup-panel__tools">
        <el-input
          v-model="searchInput"
          class="lol-matchup-panel__search-input"
          placeholder="搜索称呼或名字"
          clearable
          :disabled="loading"
          @keyup.enter="applySearch"
        >
          <template #append>
            <el-button :disabled="loading" @click="applySearch">搜索</el-button>
          </template>
        </el-input>
        <MatchupDifficultySelect
          v-model="difficultyFilter"
          size="md"
          variant="select"
          placeholder="全部难度"
          :disabled="loading"
        />
        <div v-if="canEdit" class="lol-matchup-panel__auth lol-matchup-panel__auth--unlocked">
          <el-tag type="success" size="small" effect="plain">已解锁编辑</el-tag>
          <el-button size="small" @click="lockEdit">锁定</el-button>
        </div>
        <div v-else class="lol-matchup-panel__auth">
          <el-input
            v-model="editPasswordInput"
            type="password"
            inputmode="numeric"
            autocomplete="off"
            size="small"
            placeholder="编辑密码"
            aria-label="编辑密码"
            @keyup.enter="unlockEdit"
          />
          <el-button
            type="primary"
            size="small"
            :disabled="loading || !editPasswordInput"
            @click="unlockEdit"
          >
            解锁
          </el-button>
          <span v-if="editAuthError" class="lol-matchup-panel__auth-error" role="alert">
            {{ editAuthError }}
          </span>
        </div>
        <el-button
          type="primary"
          size="small"
          :disabled="loading || !canEdit"
          :title="canEdit ? '新增对线笔记' : '请先输入密码解锁编辑'"
          @click="addRow"
        >
          新增
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="lol-matchup-panel__empty">
      <p class="text-muted">加载数据…</p>
    </div>

    <div v-else-if="rows.length === 0" class="lol-matchup-panel__empty">
      <p class="text-muted">还没有对线数据。</p>
      <el-button
        type="primary"
        class="mt-4"
        :disabled="!canEdit"
        :title="canEdit ? '新增对线笔记' : '请先输入密码解锁编辑'"
        @click="addRow"
      >
        新增
      </el-button>
    </div>

    <div v-else class="lol-matchup-panel__body">
      <div ref="tableWrapRef" class="lol-matchup-panel__table-wrap">
        <el-table
          :data="filteredRows"
          row-key="id"
          class="lol-matchup-el-table"
          :height="compact ? tableHeight : undefined"
          :size="compact ? 'small' : 'default'"
          border
        >
          <template #empty>
            <span class="lol-matchup-panel__no-result">没有匹配{{ filterSummary }}的结果</span>
          </template>

          <el-table-column label="英雄" min-width="168" class-name="lol-matchup-panel__hero-cell">
            <template #default="{ row }">
              <button
                v-if="canEdit"
                type="button"
                class="lol-matchup-panel__hero-btn"
                :title="heroForRow(row) ? `${heroForRow(row).fullName} ${heroForRow(row).name}` : '选择英雄'"
                @click="openHeroPicker(row.id)"
              >
                <img
                  v-if="heroForRow(row)"
                  :src="heroForRow(row).icon"
                  :alt="heroForRow(row).name"
                  class="lol-matchup-panel__hero-icon"
                />
                <span v-else class="lol-matchup-panel__hero-placeholder">?</span>
                <span class="lol-matchup-panel__hero-name">
                  <template v-if="heroForRow(row)">
                    <span class="lol-matchup-panel__hero-epithet">{{ heroForRow(row).fullName }}</span>
                    <span class="lol-matchup-panel__hero-title">{{ heroForRow(row).name }}</span>
                  </template>
                  <template v-else>{{ row.enemyName || '选择英雄' }}</template>
                </span>
              </button>
              <div
                v-else
                class="lol-matchup-panel__hero-btn lol-matchup-panel__hero-btn--readonly"
                :title="heroForRow(row) ? `${heroForRow(row).fullName} ${heroForRow(row).name}` : row.enemyName || '未选择英雄'"
              >
                <img
                  v-if="heroForRow(row)"
                  :src="heroForRow(row).icon"
                  :alt="heroForRow(row).name"
                  class="lol-matchup-panel__hero-icon"
                />
                <span v-else class="lol-matchup-panel__hero-placeholder">?</span>
                <span class="lol-matchup-panel__hero-name">
                  <template v-if="heroForRow(row)">
                    <span class="lol-matchup-panel__hero-epithet">{{ heroForRow(row).fullName }}</span>
                    <span class="lol-matchup-panel__hero-title">{{ heroForRow(row).name }}</span>
                  </template>
                  <template v-else>{{ row.enemyName || '—' }}</template>
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column min-width="90" class-name="lol-matchup-panel__difficulty-cell">
            <template #header>
              <div class="lol-matchup-panel__sort-head">
                <span>对线难度</span>
                <span class="lol-matchup-panel__sort-carets" aria-label="按对线难度排序">
                  <el-button
                    link
                    size="small"
                    :class="{ 'is-active': difficultySort === 'desc' }"
                    title="易 → 难"
                    aria-label="按难度从易到难排序"
                    @click="setDifficultySort('desc')"
                  >
                    ▲
                  </el-button>
                  <el-button
                    link
                    size="small"
                    :class="{ 'is-active': difficultySort === 'asc' }"
                    title="难 → 易"
                    aria-label="按难度从难到易排序"
                    @click="setDifficultySort('asc')"
                  >
                    ▼
                  </el-button>
                </span>
              </div>
            </template>
            <template #default="{ row }">
              <MatchupDifficultySelect
                v-model="row.difficulty"
                size="sm"
                variant="plain"
                :allow-empty="false"
                :disabled="!canEdit"
              />
            </template>
          </el-table-column>

          <el-table-column label="闪现" width="72" class-name="lol-matchup-panel__skills-flash-cell">
            <template #default>
              <span class="lol-matchup-panel__icon-btn lol-matchup-panel__icon-btn--locked" title="闪现（必带）">
                <img :src="summonerSpellIcon(FLASH_SPELL_ID)" alt="闪现" />
              </span>
            </template>
          </el-table-column>

          <el-table-column label="候选技能" min-width="150" class-name="lol-matchup-panel__skills-candidates-cell">
            <template #default="{ row }">
              <div class="lol-matchup-panel__candidates-wrap">
                <div class="lol-matchup-panel__icons lol-matchup-panel__icons--candidates">
                  <span
                    v-for="spell in candidateSpellsForRow(row)"
                    :key="spell.id"
                    class="lol-matchup-panel__icon-btn lol-matchup-panel__icon-btn--candidate lol-matchup-panel__icon-btn--readonly"
                    :title="spell.name"
                  >
                    <img :src="summonerSpellIcon(spell.id)" :alt="spell.name" />
                  </span>
                </div>
                <el-button
                  v-if="canEdit"
                  link
                  size="small"
                  type="primary"
                  title="调整候选技能（最多4个）"
                  @click="openCandidatePicker(row.id)"
                >
                  调整
                </el-button>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="天赋" width="190" class-name="lol-matchup-panel__runes-cell">
            <template #default="{ row }">
              <button
                v-if="canEdit"
                type="button"
                class="lol-matchup-panel__loadout-btn"
                title="配置天赋"
                @click="openLoadoutPicker(row.id)"
              >
                <div class="lol-matchup-panel__rune-rows">
                  <div class="lol-matchup-panel__rune-row">
                    <span class="lol-matchup-panel__rune-label">主</span>
                    <div class="lol-matchup-panel__icons">
                      <span
                        v-for="runeId in sortedPrimaryRunes(row)"
                        :key="`p-${runeId}`"
                        class="lol-matchup-panel__icon-btn lol-matchup-panel__icon-btn--readonly"
                        :class="{ 'lol-matchup-panel__icon-btn--keystone': isKeystoneRune(runeId) }"
                        :title="getRuneById(runes, runeId)?.name"
                      >
                        <img :src="getRuneById(runes, runeId)?.icon" :alt="getRuneById(runes, runeId)?.name" />
                      </span>
                      <span v-if="!row.primaryRuneIds.length" class="lol-matchup-panel__loadout-empty">+</span>
                    </div>
                  </div>
                  <div class="lol-matchup-panel__rune-row">
                    <span class="lol-matchup-panel__rune-label">副</span>
                    <div class="lol-matchup-panel__icons">
                      <span
                        v-for="runeId in sortedSecondaryRunes(row)"
                        :key="`s-${runeId}`"
                        class="lol-matchup-panel__icon-btn lol-matchup-panel__icon-btn--readonly"
                        :title="getRuneById(runes, runeId)?.name"
                      >
                        <img :src="getRuneById(runes, runeId)?.icon" :alt="getRuneById(runes, runeId)?.name" />
                      </span>
                    </div>
                  </div>
                </div>
              </button>
              <div v-else class="lol-matchup-panel__loadout-btn lol-matchup-panel__loadout-btn--readonly">
                <div class="lol-matchup-panel__rune-rows">
                  <div class="lol-matchup-panel__rune-row">
                    <span class="lol-matchup-panel__rune-label">主</span>
                    <div class="lol-matchup-panel__icons">
                      <span
                        v-for="runeId in sortedPrimaryRunes(row)"
                        :key="`p-read-${runeId}`"
                        class="lol-matchup-panel__icon-btn lol-matchup-panel__icon-btn--readonly"
                        :class="{ 'lol-matchup-panel__icon-btn--keystone': isKeystoneRune(runeId) }"
                        :title="getRuneById(runes, runeId)?.name"
                      >
                        <img :src="getRuneById(runes, runeId)?.icon" :alt="getRuneById(runes, runeId)?.name" />
                      </span>
                      <span v-if="!row.primaryRuneIds.length" class="lol-matchup-panel__loadout-empty">—</span>
                    </div>
                  </div>
                  <div class="lol-matchup-panel__rune-row">
                    <span class="lol-matchup-panel__rune-label">副</span>
                    <div class="lol-matchup-panel__icons">
                      <span
                        v-for="runeId in sortedSecondaryRunes(row)"
                        :key="`s-read-${runeId}`"
                        class="lol-matchup-panel__icon-btn lol-matchup-panel__icon-btn--readonly"
                        :title="getRuneById(runes, runeId)?.name"
                      >
                        <img :src="getRuneById(runes, runeId)?.icon" :alt="getRuneById(runes, runeId)?.name" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="装备" min-width="230" class-name="lol-matchup-panel__items-cell">
            <template #default="{ row }">
              <button
                v-if="canEdit"
                type="button"
                class="lol-matchup-panel__loadout-btn"
                title="配置装备"
                @click="openLoadoutPicker(row.id)"
              >
                <div class="lol-matchup-panel__icons">
                  <span
                    v-for="itemId in row.itemIds"
                    :key="itemId"
                    class="lol-matchup-panel__icon-btn lol-matchup-panel__icon-btn--item lol-matchup-panel__icon-btn--readonly"
                    :title="getItemById(items, itemId)?.name"
                  >
                    <img :src="getItemById(items, itemId)?.icon" :alt="getItemById(items, itemId)?.name" />
                  </span>
                  <span v-if="!row.itemIds.length" class="lol-matchup-panel__loadout-empty">+</span>
                </div>
              </button>
              <div v-else class="lol-matchup-panel__loadout-btn lol-matchup-panel__loadout-btn--readonly">
                <div class="lol-matchup-panel__icons">
                  <span
                    v-for="itemId in row.itemIds"
                    :key="`item-read-${itemId}`"
                    class="lol-matchup-panel__icon-btn lol-matchup-panel__icon-btn--item lol-matchup-panel__icon-btn--readonly"
                    :title="getItemById(items, itemId)?.name"
                  >
                    <img :src="getItemById(items, itemId)?.icon" :alt="getItemById(items, itemId)?.name" />
                  </span>
                  <span v-if="!row.itemIds.length" class="lol-matchup-panel__loadout-empty">—</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="190" fixed="right" class-name="lol-matchup-panel__ops-cell">
            <template #default="{ row }">
              <div v-if="canEdit" class="lol-matchup-panel__ops">
                <div class="lol-matchup-panel__ops-row">
                  <el-button size="small" type="primary" plain title="复制天赋与装备" @click="copyLoadout(row)">
                    一键复制
                  </el-button>
                  <el-button
                    size="small"
                    type="success"
                    plain
                    title="粘贴天赋与装备"
                    :disabled="!canPasteLoadout"
                    @click="pasteLoadout(row)"
                  >
                    一键粘贴
                  </el-button>
                </div>
                <div class="lol-matchup-panel__ops-row">
                  <el-button size="small" type="danger" plain title="删除此行" @click="confirmRemoveRow(row)">
                    删除此行
                  </el-button>
                </div>
              </div>
              <el-tag v-else size="small" type="info" effect="plain">只读</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div v-if="!compact && !loading && rows.length" class="lol-matchup-panel__foot">
      <el-button
        type="primary"
        :disabled="!canEdit"
        :title="canEdit ? '新增对线笔记' : '请先输入密码解锁编辑'"
        @click="addRow"
      >
        新增
      </el-button>
    </div>

    <Teleport v-if="isMounted" to="body">
      <div
        v-if="picker"
        class="lol-matchup-panel__overlay"
        :class="{ 'lol-matchup-panel__overlay--loadout': picker.type === 'loadout' }"
        @click.self="closePicker"
      >
        <div
          class="lol-matchup-panel__picker"
          :class="{
            'lol-matchup-panel__picker--wide': picker.type !== 'loadout',
            'lol-matchup-panel__picker--loadout': picker.type === 'loadout',
          }"
        >
        <template v-if="picker.type === 'hero'">
          <div class="lol-matchup-panel__picker-head">
            <h3>{{ pickerTitle }}</h3>
            <button type="button" class="lol-matchup-panel__picker-close" aria-label="关闭" @click="closePicker">
              ×
            </button>
          </div>
          <input
            v-model="pickerQuery"
            type="search"
            class="lol-matchup-panel__picker-search"
            placeholder="搜索英雄…"
            autofocus
          />
          <div class="lol-matchup-panel__hero-grid">
            <button
              v-for="hero in filteredHeroes"
              :key="hero.id"
              type="button"
              class="lol-matchup-panel__hero-option"
              @click="selectHero(hero)"
            >
              <img :src="hero.icon" :alt="hero.name" />
              <span>{{ hero.name }}</span>
            </button>
          </div>
        </template>

        <template v-else-if="picker.type === 'candidates'">
          <div class="lol-matchup-panel__picker-head">
            <h3>{{ pickerTitle }}</h3>
            <button type="button" class="lol-matchup-panel__picker-close" aria-label="关闭" @click="closePicker">
              ×
            </button>
          </div>
          <p class="lol-matchup-panel__picker-hint">
            已选 {{ activeCandidateCount }} / {{ MAX_SECOND_SPELL_CANDIDATES }} · 点击图标加入或移除候选
          </p>
          <div class="lol-matchup-panel__spell-grid">
            <button
              v-for="spell in selectableSecondSpells"
              :key="spell.id"
              type="button"
              class="lol-matchup-panel__spell-option"
              :class="{
                'is-selected': activeRow?.candidateSpellIds.includes(spell.id),
                'is-disabled': isCandidatePickerDisabled(spell.id),
              }"
              :disabled="isCandidatePickerDisabled(spell.id)"
              :title="spell.name"
              @click="toggleCandidateSpell(spell.id)"
            >
              <span class="lol-matchup-panel__spell-option-icon">
                <img :src="summonerSpellIcon(spell.id)" :alt="spell.name" />
                <span
                  v-if="activeRow?.candidateSpellIds.includes(spell.id)"
                  class="lol-matchup-panel__spell-option-check"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 12 12" width="11" height="11">
                    <path
                      d="M2.5 6.2 4.8 8.5 9.5 3.5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
              </span>
              <span class="lol-matchup-panel__spell-option-name">{{ spell.name }}</span>
            </button>
          </div>
        </template>

        <template v-else-if="picker.type === 'loadout' && loadoutDraft">
          <header class="lol-matchup-panel__picker-toolbar">
            <div class="lol-matchup-panel__picker-title">
              <h3>{{ pickerTitle }}</h3>
              <p v-if="heroForRow(activeRow)?.name" class="lol-matchup-panel__picker-subtitle">
                对阵 {{ heroForRow(activeRow).name }}
              </p>
            </div>
            <button
              type="button"
              class="lol-matchup-panel__picker-close"
              aria-label="关闭"
              @click="closePicker"
            >
              ×
            </button>
          </header>

          <div class="lol-matchup-panel__picker-body">
            <div class="lol-loadout">
              <div class="lol-loadout__body">
                <aside class="lol-loadout__runes">
                  <section class="lol-loadout__runes-card">
                    <div class="lol-loadout__rune-block">
                      <div class="lol-loadout__block-head">
                        <h4 class="lol-loadout__block-title">主系</h4>
                        <div class="lol-loadout__tree-tabs">
                          <button
                            v-for="tree in RUNE_TREE_NAMES"
                            :key="`primary-${tree}`"
                            type="button"
                            class="lol-loadout__tree-tab"
                            :class="{ 'is-active': loadoutPrimaryStyle === tree }"
                            :title="tree"
                            @click="selectPrimaryTree(tree)"
                          >
                            <img
                              v-if="runeTreeIcons[tree]"
                              class="lol-loadout__tree-tab-icon"
                              :src="runeTreeIcons[tree]"
                              alt=""
                              aria-hidden="true"
                            />
                            <span>{{ tree }}</span>
                          </button>
                        </div>
                      </div>

                      <div v-if="loadoutPrimaryStyle" class="lol-loadout__rune-rows">
                        <div
                          v-for="slot in RUNE_SLOT_ORDER[loadoutPrimaryStyle]"
                          :key="`primary-slot-${slot}`"
                          class="lol-loadout__rune-row"
                          :class="{ 'lol-loadout__rune-row--keystone': slot === '基石' }"
                        >
                          <div
                            class="lol-loadout__rune-options"
                            :style="{ '--rune-count': runesByTree[loadoutPrimaryStyle][slot].length }"
                          >
                            <button
                              v-for="rune in runesByTree[loadoutPrimaryStyle][slot]"
                              :key="rune.id"
                              type="button"
                              class="lol-loadout__rune-btn"
                              :class="{ 'is-selected': isPrimaryRuneSelected(rune.id) }"
                              @click="selectPrimaryRune(rune)"
                              @mouseenter="showRuneTooltip(rune, $event)"
                              @mouseleave="hideRuneTooltip"
                              @focus="showRuneTooltip(rune, $event)"
                              @blur="hideRuneTooltip"
                            >
                              <img :src="rune.icon" :alt="rune.name" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <p v-else class="lol-loadout__hint">选择主系</p>
                    </div>

                    <div class="lol-loadout__rune-divider" aria-hidden="true" />

                    <div class="lol-loadout__rune-block lol-loadout__rune-block--secondary">
                      <div class="lol-loadout__block-head">
                        <h4 class="lol-loadout__block-title">副系</h4>
                        <div class="lol-loadout__tree-tabs">
                          <button
                            v-for="tree in RUNE_TREE_NAMES"
                            :key="`secondary-${tree}`"
                            type="button"
                            class="lol-loadout__tree-tab"
                            :class="{
                              'is-active': loadoutSecondaryStyle === tree,
                              'is-disabled': tree === loadoutPrimaryStyle,
                            }"
                            :disabled="tree === loadoutPrimaryStyle"
                            :title="tree"
                            @click="selectSecondaryTree(tree)"
                          >
                            <img
                              v-if="runeTreeIcons[tree]"
                              class="lol-loadout__tree-tab-icon"
                              :src="runeTreeIcons[tree]"
                              alt=""
                              aria-hidden="true"
                            />
                            <span>{{ tree }}</span>
                          </button>
                        </div>
                      </div>

                      <div v-if="loadoutSecondaryStyle" class="lol-loadout__rune-rows">
                        <div
                          v-for="slot in RUNE_SLOT_ORDER[loadoutSecondaryStyle].filter((entry) => entry !== '基石')"
                          :key="`secondary-slot-${slot}`"
                          class="lol-loadout__rune-row"
                        >
                          <div
                            class="lol-loadout__rune-options"
                            :style="{ '--rune-count': runesByTree[loadoutSecondaryStyle][slot].length }"
                          >
                            <button
                              v-for="rune in runesByTree[loadoutSecondaryStyle][slot]"
                              :key="rune.id"
                              type="button"
                              class="lol-loadout__rune-btn lol-loadout__rune-btn--secondary"
                              :class="{ 'is-selected': isSecondaryRuneSelected(rune.id) }"
                              @click="selectSecondaryRune(rune)"
                              @mouseenter="showRuneTooltip(rune, $event)"
                              @mouseleave="hideRuneTooltip"
                              @focus="showRuneTooltip(rune, $event)"
                              @blur="hideRuneTooltip"
                            >
                              <img :src="rune.icon" :alt="rune.name" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <p v-else class="lol-loadout__hint">选择副系，点 2 个天赋</p>
                    </div>
                  </section>
                </aside>

                <section class="lol-loadout__items">
                  <div class="lol-loadout__panel-head">
                    <h4>装备</h4>
                    <span class="lol-loadout__hint">选中格子后点装备填入，双击格子清空</span>
                  </div>

                  <div class="lol-loadout__item-slots">
                    <button
                      v-for="(itemId, index) in loadoutDraft.itemSlots"
                      :key="`item-slot-${index}`"
                      type="button"
                      class="lol-loadout__item-slot"
                      :class="{ 'is-active': activeItemSlot === index }"
                      :title="itemId ? getItemById(items, itemId)?.name : `装备位 ${index + 1}`"
                      @click="activeItemSlot = index"
                      @dblclick.prevent="clearLoadoutItemSlot(index)"
                    >
                      <img
                        v-if="itemId"
                        :src="getItemById(items, itemId)?.icon"
                        :alt="getItemById(items, itemId)?.name"
                      />
                      <span v-else>{{ index + 1 }}</span>
                    </button>
                  </div>

                  <div class="lol-loadout__filters">
                    <div class="lol-loadout__filter-group">
                      <span class="lol-loadout__filter-label">阶段</span>
                      <div class="lol-loadout__filter-tabs">
                        <button
                          v-for="option in ITEM_STAGE_OPTIONS"
                          :key="option.id"
                          type="button"
                          class="lol-loadout__filter-tab"
                          :class="{ 'is-active': itemStage === option.id }"
                          @click="itemStage = option.id"
                        >
                          {{ option.label }}
                        </button>
                      </div>
                    </div>

                    <div class="lol-loadout__filter-group">
                      <span class="lol-loadout__filter-label">属性</span>
                      <div class="lol-loadout__filter-tabs">
                        <button
                          v-for="group in ITEM_ATTRIBUTE_GROUPS"
                          :key="group.id"
                          type="button"
                          class="lol-loadout__filter-tab"
                          :class="{ 'is-active': itemAttributes.includes(group.id) }"
                          @click="toggleItemAttribute(group.id)"
                        >
                          {{ group.label }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <input
                    v-model="itemQuery"
                    type="search"
                    class="lol-matchup-panel__picker-search"
                    placeholder="搜索装备…"
                  />

                  <p class="lol-loadout__hint lol-loadout__result-count">
                    共 {{ filteredLoadoutItems.length }} 件
                  </p>

                  <div class="lol-matchup-panel__catalog-grid lol-loadout__item-grid">
                    <button
                      v-for="item in filteredLoadoutItems"
                      :key="item.id"
                      type="button"
                      class="lol-matchup-panel__catalog-option lol-loadout__catalog-option"
                      :class="{ 'is-selected': isLoadoutItemSelected(item.id) }"
                      :title="item.name"
                      @click="selectLoadoutItem(item.id)"
                    >
                      <img :src="item.icon" :alt="item.name" />
                      <span>{{ item.name }}</span>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </template>
        </div>
      </div>
    </Teleport>

    <Teleport v-if="isMounted" to="body">
      <div
        v-if="runeTooltip"
        class="lol-rune-tooltip"
        :style="{ top: `${runeTooltipPos.top}px`, left: `${runeTooltipPos.left}px` }"
        role="tooltip"
      >
        <p class="lol-rune-tooltip__name">{{ runeTooltip.name }}</p>
        <p v-if="runeTooltip.shortdesc" class="lol-rune-tooltip__desc">{{ runeTooltip.shortdesc }}</p>
        <p v-else class="lol-rune-tooltip__desc lol-rune-tooltip__desc--muted">暂无描述</p>
      </div>
    </Teleport>

    <ConfirmDialog
      v-model:open="deleteConfirmOpen"
      title="删除对线笔记"
      :message="deleteConfirmMessage"
      confirm-text="删除"
      cancel-text="取消"
      danger
      @confirm="executeRemoveRow"
    />
  </section>
</template>

<style lang="scss" scoped>
.lol-matchup-panel {
  padding: 1.25rem;

  &--compact {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    min-height: 0;
    padding: 0.45rem 0.6rem 0.4rem;

    .lol-matchup-panel__head {
      flex-shrink: 0;
      flex-direction: column;
      gap: 0.3rem;
      margin-bottom: 0.25rem;

      @media (min-width: 640px) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 0.35rem;
      }
    }

    .lol-matchup-panel__title-wrap h2 {
      font-size: 1rem;
      line-height: 1.2;
    }

    .lol-matchup-panel__title-row {
      gap: 0.4rem;
    }

    .lol-matchup-panel__sync-badge {
      font-size: 0.6875rem;
      padding: 0.1rem 0.45rem;
    }

    .lol-matchup-panel__tools {
      display: flex;
      align-items: stretch;
      gap: 0.55rem;
      width: 100%;

      @media (min-width: 640px) {
        width: auto;
        flex-shrink: 0;
      }
    }

    .lol-matchup-panel__search-group {
      flex: 1;
      min-width: 0;
      min-height: 2rem;

      @media (min-width: 640px) {
        flex: none;
        width: 11.5rem;
      }
    }

    .lol-matchup-panel__input {
      padding: 0.35rem 0.75rem;
      font-size: 0.8125rem;
      min-height: 2rem;
    }

    .lol-matchup-panel__action {
      min-height: 2rem;
      padding: 0.35rem 0.75rem;
      font-size: 0.8125rem;

      &--search {
        padding-inline: 0.75rem;
      }

      &--primary {
        width: fit-content;
        padding-inline: 1.375rem 1.625rem;
        font-weight: 500;
      }
    }

    .lol-matchup-panel__body {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    .lol-matchup-panel__table-wrap {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    :deep(.lol-matchup-el-table) {
      min-width: 50rem;
      font-size: 0.8125rem;

      .el-table__header-wrapper th.el-table__cell {
        padding: 0.55rem 0.5rem;
        font-size: 0.875rem;
      }

      .el-table__body-wrapper .el-table__cell {
        padding: 0.35rem 0.45rem;
      }
    }

    .lol-matchup-panel__hero-name {
      gap: 0.08rem;
    }

    .lol-matchup-panel__hero-epithet {
      font-size: 0.8125rem;
    }

    .lol-matchup-panel__hero-title {
      font-size: 0.75rem;
    }

    .lol-matchup-panel__hero-icon,
    .lol-matchup-panel__hero-placeholder {
      width: 3.25rem;
      height: 3.25rem;
    }

    .lol-matchup-panel__icon-btn {
      width: 1.65rem;
      height: 1.65rem;

      &--locked {
        width: 2rem;
        height: 2rem;
      }

      &--item {
        width: 2.25rem;
        height: 2.25rem;
      }

      &--keystone {
        width: 1.9rem;
        height: 1.9rem;
      }
    }

    .lol-matchup-panel__field {
      min-width: 6rem;
      padding: 0.3rem 0.45rem;
      font-size: 0.8125rem;
    }

    .lol-matchup-panel__empty,
    .lol-matchup-panel__no-result {
      padding: 1rem;
    }
  }

  &__head {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;

    @media (min-width: 640px) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  &__title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__sync-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.15rem 0.55rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.2;
    border: 1px solid var(--color-border);
    white-space: nowrap;

    &::before {
      content: '';
      width: 0.4rem;
      height: 0.4rem;
      border-radius: 50%;
      flex-shrink: 0;
    }

    &--local {
      color: var(--color-text-muted);
      background: color-mix(in srgb, var(--color-glass-bg) 90%, transparent);

      &::before {
        background: var(--color-text-muted);
      }
    }

    &--cloud {
      color: #059669;
      border-color: color-mix(in srgb, #059669 35%, var(--color-border));
      background: color-mix(in srgb, #059669 10%, transparent);

      &::before {
        background: #059669;
      }
    }

    &--syncing {
      color: #2563eb;
      border-color: color-mix(in srgb, #2563eb 35%, var(--color-border));
      background: color-mix(in srgb, #2563eb 10%, transparent);

      &::before {
        background: #2563eb;
        animation: lol-sync-pulse 1s ease-in-out infinite;
      }
    }

    &--error {
      color: #dc2626;
      border-color: color-mix(in srgb, #dc2626 35%, var(--color-border));
      background: color-mix(in srgb, #dc2626 10%, transparent);

      &::before {
        background: #dc2626;
      }
    }
  }

  @keyframes lol-sync-pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.35;
    }
  }

  &__tools {
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
    flex-wrap: wrap;

    @media (min-width: 640px) {
      flex-wrap: nowrap;
    }

    .lol-matchup-panel__action--primary {
      width: fit-content;
      flex-shrink: 0;
    }
  }

  &__auth {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    min-height: 2.125rem;

    &--unlocked {
      flex-wrap: nowrap;
    }
  }

  &__auth-input {
    width: 6.5rem;
    min-height: 2.125rem;
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 9999px;
    background: color-mix(in srgb, var(--color-glass-bg) 94%, transparent);
    font-size: 0.8125rem;
    color: var(--color-heading);
    outline: none;

    &:focus {
      border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 10%, transparent);
    }
  }

  &__auth-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.55rem;
    border-radius: 9999px;
    border: 1px solid color-mix(in srgb, #059669 35%, var(--color-border));
    background: color-mix(in srgb, #059669 10%, transparent);
    font-size: 0.75rem;
    font-weight: 600;
    color: #059669;
    white-space: nowrap;
  }

  &__auth-error {
    width: 100%;
    font-size: 0.75rem;
    color: #dc2626;
  }

  &__ops-locked {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-subtle);
  }

  &__search-group {
    display: flex;
    align-items: stretch;
    flex: 1;
    min-width: min(100%, 10rem);
    max-width: 18rem;
    min-height: 2.125rem;
    border: 1px solid var(--color-border);
    border-radius: 9999px;
    background: color-mix(in srgb, var(--color-glass-bg) 94%, transparent);
    overflow: hidden;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:focus-within {
      border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 10%, transparent);
    }
  }

  &__search {
    flex: 1;
    min-width: 0;
    display: flex;
  }

  &__input,
  &__field,
  &__picker-search {
    width: 100%;
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
    background: var(--color-glass-bg);
    padding: 0.55rem 0.75rem;
    font-size: 0.875rem;
    color: var(--color-heading);
    outline: none;
    transition: border-color 0.2s ease;

    &:focus {
      border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
    }

    &::placeholder {
      color: var(--color-text-subtle);
    }
  }

  &__input {
    border: none;
    border-radius: 0;
    background: transparent;
    padding: 0.45rem 0.875rem;
    font-size: 0.8125rem;
    min-height: 2.125rem;

    &:focus {
      border-color: transparent;
      box-shadow: none;
    }
  }

  &__field {
    min-width: 6rem;
    background: transparent;

    &--wide {
      min-width: 8rem;
    }
  }

  &__body {
    min-height: 0;
  }

  &__search-input {
    width: 100%;

    @media (min-width: 640px) {
      width: 11.5rem;
    }
  }

  &__table-wrap {
    overflow: hidden;
    border-radius: 0.75rem;
    border: 1px solid var(--color-border);
  }

  :deep(.lol-matchup-el-table) {
    --el-table-border-color: var(--color-border);
    --el-table-header-bg-color: color-mix(in srgb, var(--color-accent) 10%, var(--color-glass-bg));
    --el-table-tr-bg-color: transparent;
    --el-table-row-hover-bg-color: color-mix(in srgb, var(--color-accent) 6%, transparent);
    --el-table-text-color: var(--color-text);
    --el-table-header-text-color: var(--color-heading);
    width: 100%;
    min-width: 64rem;
    background: transparent;

    .el-table__header-wrapper th.el-table__cell {
      font-weight: 600;
      white-space: nowrap;
      padding-block: 0.8rem;
    }

    .el-table__body-wrapper .el-table__cell {
      vertical-align: middle;
    }
  }

  &__hero-cell {
    min-width: 10rem;
  }

  &__difficulty-head {
    width: 9rem;
    min-width: 9rem;
    text-align: center;
    white-space: nowrap;
  }

  &__difficulty-cell {
    width: 9rem;
    min-width: 9rem;
    text-align: center;

    :deep(.difficulty-select-plain),
    :deep(.difficulty-select-filter) {
      width: 100%;
      justify-content: center;
    }
  }

  &__sort-head {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.28rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-heading);
  }

  &__sort-carets {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.07rem;
    line-height: 0;
    margin-inline-start: 0.1rem;

    :deep(.el-button) {
      height: auto;
      min-height: 0;
      padding: 0;
      margin: 0;
      font-size: 0.625rem;
      line-height: 1;
      color: var(--color-text-subtle);

      &:hover {
        color: var(--color-text-muted);
      }

      &.is-active,
      &.is-active:hover {
        color: var(--color-accent);
      }
    }
  }

  &__sort-caret {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 0.8125rem;
    height: 0.44rem;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-text-subtle);
    cursor: pointer;
    line-height: 0;
    transition: color 0.15s ease;

    svg {
      display: block;
      flex-shrink: 0;
    }

    &:hover {
      color: var(--color-text-muted);
    }

    &.is-active {
      color: var(--color-accent);
    }
  }

  &__hero-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.15rem 0.35rem 0.15rem 0.15rem;
    border: 1px solid transparent;
    border-radius: 9999px;
    background: transparent;
    cursor: pointer;

    &:hover {
      border-color: var(--color-border);
      background: color-mix(in srgb, var(--color-glass-bg) 80%, transparent);
    }

    &--readonly {
      cursor: default;
      pointer-events: none;
    }
  }

  &__hero-icon,
  &__hero-placeholder {
    width: 3.75rem;
    height: 3.75rem;
    border-radius: 9999px;
    flex-shrink: 0;
  }

  &__hero-icon {
    object-fit: cover;
    border: 1px solid var(--color-border);
  }

  &__hero-placeholder {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--color-glass-bg) 90%, transparent);
    color: var(--color-text-subtle);
    font-weight: 600;
  }

  &__hero-name {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.12rem;
    min-width: 0;
    line-height: 1.2;
  }

  &__hero-epithet {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-heading);
    white-space: nowrap;
  }

  &__hero-title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  &__icons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;

    &--candidates {
      gap: 0.3rem;
    }
  }

  &__skills-flash-cell {
    width: 3.25rem;
    min-width: 3.25rem;
    text-align: center;
    vertical-align: middle;
  }

  &__skills-candidates-cell {
    min-width: 10.5rem;
  }

  &__candidates-wrap {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  &__candidates-edit {
    flex-shrink: 0;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 9999px;
    background: color-mix(in srgb, var(--color-glass-bg) 90%, transparent);
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-text-muted);
    cursor: pointer;
    white-space: nowrap;
    transition:
      border-color 0.2s ease,
      color 0.2s ease,
      background-color 0.2s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
      color: var(--color-heading);
      background: color-mix(in srgb, var(--color-accent) 10%, transparent);
    }
  }

  &__runes-cell {
    min-width: 10.5rem;
  }

  &__items-cell {
    min-width: 11rem;

    .lol-matchup-panel__loadout-empty {
      width: 2.75rem;
      height: 2.75rem;
    }
  }

  &__ops-head {
    width: 10.5rem;
    min-width: 10.5rem;
    text-align: center;
  }

  &__ops-cell {
    width: 10.5rem;
    min-width: 10.5rem;
    vertical-align: middle;
  }

  &__ops {
    --op-btn-width: 4.625rem;
    --op-btn-height: 2rem;

    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    padding: 0.1rem 0;
  }

  &__ops-row {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.45rem;
  }

  &__op-btn {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 var(--op-btn-width);
    width: var(--op-btn-width);
    height: var(--op-btn-height);
    min-height: var(--op-btn-height);
    padding: 0 0.25rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--color-glass-bg) 96%, transparent);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-text-muted);
    cursor: pointer;
    white-space: nowrap;
    transition:
      border-color 0.2s ease,
      color 0.2s ease,
      background-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover:not(:disabled) {
      border-color: color-mix(in srgb, var(--color-accent) 38%, transparent);
      color: var(--color-heading);
      background: color-mix(in srgb, var(--color-accent) 8%, transparent);
    }

    &--accent {
      color: var(--color-heading);
      border-color: color-mix(in srgb, var(--color-accent) 32%, transparent);
      background: color-mix(in srgb, var(--color-accent) 10%, transparent);

      &:hover:not(:disabled) {
        border-color: color-mix(in srgb, var(--color-accent) 48%, transparent);
        background: color-mix(in srgb, var(--color-accent) 16%, transparent);
        box-shadow: 0 2px 8px -4px var(--color-btn-shadow);
      }
    }

    &--paste {
      color: var(--color-heading);
      border-style: dashed;
      border-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
      background: transparent;

      &:hover:not(:disabled) {
        border-style: solid;
        background: color-mix(in srgb, var(--color-accent) 8%, transparent);
      }
    }

    &--danger {
      color: color-mix(in srgb, #e06c75 88%, var(--color-text-muted));
      border-color: color-mix(in srgb, #e06c75 22%, var(--color-border));

      &:hover:not(:disabled) {
        color: #e06c75;
        border-color: color-mix(in srgb, #e06c75 45%, transparent);
        background: color-mix(in srgb, #e06c75 8%, transparent);
      }
    }

    &:disabled {
      opacity: 0.38;
      cursor: not-allowed;
    }
  }

  &__rune-rows {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__rune-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  &__rune-label {
    flex-shrink: 0;
    width: 1rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-text-subtle);
    text-align: center;
  }

  &__loadout-btn {
    display: block;
    width: 100%;
    padding: 0.15rem;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    background: transparent;
    cursor: pointer;
    text-align: left;

    &:hover {
      border-color: var(--color-border);
      background: color-mix(in srgb, var(--color-glass-bg) 80%, transparent);
    }

    &--readonly {
      cursor: default;
      pointer-events: none;
    }
  }

  &__loadout-empty {
    display: inline-flex;
    width: 2rem;
    height: 2rem;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--color-border);
    border-radius: 0.375rem;
    color: var(--color-text-subtle);
    font-size: 1rem;
    line-height: 1;
  }

  &__loadout-empty {
    display: inline-flex;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    overflow: hidden;
    background: var(--color-glass-bg);
    cursor: pointer;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &--add,
    .lol-matchup-panel__icon-add {
      color: var(--color-text-muted);
      font-size: 1.1rem;
      line-height: 1;
    }

    &--keystone {
      width: 2.35rem;
      height: 2.35rem;
    }

    &--item {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.5rem;
    }

    &--readonly {
      cursor: inherit;
      pointer-events: none;
    }

    &--locked {
      cursor: default;
      opacity: 0.92;
      background: color-mix(in srgb, var(--color-glass-bg) 70%, transparent);

      &:hover {
        border-color: var(--color-border);
      }
    }

    &--candidate {
      opacity: 1;
      cursor: default;
    }

    &:hover {
      border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
    }
  }

  &__foot {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  &__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 2.125rem;
    padding: 0.4rem 1rem;
    border: 1px solid transparent;
    border-radius: 9999px;
    background: transparent;
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.2;
    color: var(--color-heading);
    white-space: nowrap;
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      color 0.2s ease;

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    &--search {
      flex-shrink: 0;
      min-height: auto;
      padding: 0 0.875rem;
      border: none;
      border-left: 1px solid var(--color-border);
      border-radius: 0;
      background: color-mix(in srgb, var(--color-accent) 8%, transparent);
      font-weight: 600;

      &:hover:not(:disabled) {
        background: color-mix(in srgb, var(--color-accent) 16%, transparent);
      }
    }

    &--unlock,
    &--lock {
      flex-shrink: 0;
      min-height: 2.125rem;
      padding-inline: 0.875rem;
      border: 1px solid var(--color-border);
      background: color-mix(in srgb, var(--color-glass-bg) 94%, transparent);
      font-weight: 600;
    }

    &--unlock:hover:not(:disabled) {
      border-color: color-mix(in srgb, var(--color-accent) 38%, transparent);
      background: color-mix(in srgb, var(--color-accent) 8%, transparent);
    }

    &--lock:hover:not(:disabled) {
      border-color: color-mix(in srgb, var(--color-text-muted) 35%, var(--color-border));
    }

    &--primary {
      width: fit-content;
      padding-inline: 1.5rem 1.75rem;
      background: var(--color-accent);
      color: var(--color-accent-text);
      font-weight: 500;
      box-shadow: 0 2px 8px -3px var(--color-btn-shadow);

      &:hover:not(:disabled) {
        background: var(--color-accent-hover);
        box-shadow: 0 4px 12px -4px var(--color-btn-shadow);
      }
    }
  }

  &__empty,
  &__no-result {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--color-text-subtle);
  }

  &__overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(8, 14, 22, 0.45);
    backdrop-filter: blur(2px);

    &--loadout {
      z-index: 100;
      align-items: stretch;
      justify-content: center;
      padding: 0.625rem 0.75rem;
      background: rgba(8, 14, 22, 0.52);
    }
  }

  &__picker {
    width: min(100%, 24rem);
    max-height: min(80vh, 32rem);
    overflow: auto;
    border-radius: 1rem;
    border: 1px solid var(--color-border);
    background: var(--color-glass-bg, #fff);
    padding: 1rem;
    box-shadow: 0 20px 40px rgba(8, 14, 22, 0.18);

    &--wide {
      width: min(100%, 40rem);
      max-height: min(85vh, 40rem);
    }

    &--loadout {
      width: min(calc(100vw - 1.5rem), 94rem);
      height: calc(100dvh - 3.5rem);
      max-height: calc(100dvh - 3.5rem);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 0;
      margin: auto;
      align-self: center;

      .lol-loadout {
        flex: 1;
        min-height: 0;
      }
    }
  }

  &__picker-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-shrink: 0;
    min-height: 2.75rem;
    padding: 0.55rem 1rem;
    border-bottom: 1px solid var(--color-border);
    background: color-mix(in srgb, var(--color-glass-bg) 92%, transparent);
  }

  &__picker-title {
    min-width: 0;

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      line-height: 1.25;
      color: var(--color-heading);
    }
  }

  &__picker-subtitle {
    margin: 0.125rem 0 0;
    font-size: 0.75rem;
    line-height: 1.2;
    color: var(--color-text-muted);
  }

  &__picker-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 0.65rem 1rem;
    display: flex;
    flex-direction: column;

    .lol-loadout {
      height: 100%;
      min-height: 0;
    }
  }

  &__picker-foot {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    flex-shrink: 0;
    min-height: 2.75rem;
    padding: 0.5rem 1rem;
    border-top: 1px solid var(--color-border);
    background: color-mix(in srgb, var(--color-glass-bg) 92%, transparent);
  }

  &__picker-btn {
    min-width: 5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.45rem;
    background: transparent;
    padding: 0.4rem 0.9rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-heading);
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;

    &:hover {
      background: color-mix(in srgb, var(--color-glass-bg) 80%, transparent);
      border-color: color-mix(in srgb, var(--color-accent) 30%, var(--color-border));
    }

    &--primary {
      border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
      background: color-mix(in srgb, var(--color-accent) 22%, transparent);
      font-weight: 600;

      &:hover {
        background: color-mix(in srgb, var(--color-accent) 30%, transparent);
      }
    }
  }

  &__picker-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-heading);
    }
  }

  &__picker-close {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--color-border);
    border-radius: 0.45rem;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 1.2rem;
    line-height: 1;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

    &:hover {
      color: var(--color-heading);
      border-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-border));
      background: color-mix(in srgb, var(--color-accent) 8%, transparent);
    }
  }

  &__picker-hint {
    margin: 0 0 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-text-subtle);
  }

  &__hero-grid,
  &__catalog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(4.5rem, 1fr));
    gap: 0.5rem;
    max-height: 24rem;
    overflow: auto;
    padding-top: 0.25rem;
  }

  &__hero-option,
  &__catalog-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.25rem;
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    background: transparent;
    cursor: pointer;

    img {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.375rem;
      object-fit: cover;
    }

    span {
      font-size: 0.6875rem;
      line-height: 1.2;
      color: var(--color-heading);
      text-align: center;
    }

    &.is-selected {
      border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
      background: color-mix(in srgb, var(--color-accent) 12%, transparent);
    }

    &.is-disabled:not(.is-selected) {
      opacity: 0.38;
      cursor: not-allowed;
    }

    &--keystone img {
      width: 2.75rem;
      height: 2.75rem;
    }
  }

  &__spell-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 0.35rem 0.5rem;
    border: 1.5px solid var(--color-border);
    border-radius: 0.85rem;
    background: color-mix(in srgb, var(--color-glass-bg) 88%, transparent);
    cursor: pointer;
    transition:
      transform 0.16s ease,
      border-color 0.16s ease,
      background-color 0.16s ease,
      box-shadow 0.16s ease;

    &:hover:not(:disabled):not(.is-selected) {
      transform: translateY(-1px);
      border-color: color-mix(in srgb, var(--color-accent) 38%, var(--color-border));
      background: color-mix(in srgb, var(--color-accent) 6%, var(--color-glass-bg));
      box-shadow: 0 4px 12px color-mix(in srgb, var(--color-accent) 10%, transparent);
    }

    &.is-selected {
      border-color: var(--color-accent);
      background: color-mix(in srgb, var(--color-accent) 30%, var(--color-glass-bg));
      box-shadow:
        0 0 0 2px color-mix(in srgb, var(--color-accent) 32%, transparent),
        inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 20%, transparent),
        0 6px 16px color-mix(in srgb, var(--color-accent) 24%, transparent);
    }

    &.is-disabled:not(.is-selected) {
      opacity: 0.34;
      cursor: not-allowed;
      filter: grayscale(0.35);
    }
  }

  &__spell-option-icon {
    position: relative;
    display: inline-flex;

    img {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.45rem;
      object-fit: cover;
      box-shadow: 0 2px 6px color-mix(in srgb, var(--color-bg) 18%, transparent);
    }
  }

  &__spell-option-check {
    position: absolute;
    right: -0.35rem;
    bottom: -0.35rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.05rem;
    height: 1.05rem;
    border-radius: 9999px;
    border: 1.5px solid var(--color-glass-bg, #fff);
    background: var(--color-accent);
    color: var(--color-accent-text);
    box-shadow: 0 2px 6px color-mix(in srgb, var(--color-accent) 30%, transparent);
  }

  &__spell-option-name {
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-heading);
    text-align: center;

    .lol-matchup-panel__spell-option.is-selected & {
      color: var(--color-accent);
    }
  }

  &__hero-option img {
    border-radius: 9999px;
  }

  &__spell-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
    gap: 0.55rem;
  }
}

.lol-loadout {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
  flex: 1;

  &__body {
    display: grid;
    grid-template-columns: minmax(0, auto) minmax(0, 1fr);
    gap: 0.75rem;
    align-items: stretch;
    min-height: 0;
    flex: 1;
    overflow: hidden;

    @media (max-width: 720px) {
      grid-template-columns: 1fr;
      overflow: auto;
      align-items: stretch;

      .lol-loadout__runes {
        width: 100%;
        min-width: 0;
      }
    }
  }

  &__runes {
    --rune-keystone-size: 3.75rem;
    --rune-primary-size: 3.25rem;
    --rune-secondary-size: 2.75rem;
    --rune-tree-icon-size: 1.5rem;
    --rune-gap: 0.65rem;
    --rune-minor-gap: 0.9rem;
    --rune-row-gap: 0.85rem;
    --rune-row-padding: 0.45rem 0.4rem;
    --rune-max-per-row: 4;
    --rune-card-padding-x: 2rem;

    width: fit-content;
    min-width: max(
      30rem,
      calc(
        var(--rune-max-per-row) * var(--rune-primary-size) +
          (var(--rune-max-per-row) - 1) * var(--rune-minor-gap) + 0.8rem + var(--rune-card-padding-x)
      )
    );
    max-width: 100%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    align-self: stretch;
    overflow: visible;
  }

  &__runes-card {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.65rem;
    height: 100%;
    min-height: 100%;
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    background: color-mix(in srgb, var(--color-glass-bg) 70%, transparent);
  }

  &__rune-block {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;

    &--secondary {
      .lol-loadout__rune-options {
        --rune-size: var(--rune-secondary-size);
        --rune-gap: var(--rune-minor-gap);
      }

      .lol-loadout__rune-row {
        padding: var(--rune-row-padding);
      }
    }
  }

  &__rune-divider {
    height: 1px;
    background: var(--color-border);
    margin-inline: -0.1rem;
  }

  &__block-head {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__block-title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-heading);
  }

  &__tree-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  &__tree-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border: 1px solid var(--color-border);
    border-radius: 9999px;
    background: transparent;
    padding: 0.3rem 0.65rem 0.3rem 0.45rem;
    font-size: 0.75rem;
    line-height: 1.2;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;

    &-icon {
      width: var(--rune-tree-icon-size);
      height: var(--rune-tree-icon-size);
      border-radius: 9999px;
      object-fit: cover;
      flex-shrink: 0;
      opacity: 0.75;
    }

    &.is-active {
      border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
      background: color-mix(in srgb, var(--color-accent) 12%, transparent);
      color: var(--color-heading);
      font-weight: 600;

      .lol-loadout__tree-tab-icon {
        opacity: 1;
      }
    }

    &.is-disabled,
    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    min-height: 0;
    height: 100%;
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    padding: 0.75rem;
    background: color-mix(in srgb, var(--color-glass-bg) 70%, transparent);
    overflow: hidden;
  }

  &__panel {
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    padding: 0.75rem;
    background: color-mix(in srgb, var(--color-glass-bg) 70%, transparent);
  }

  &__panel-head {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0;
    flex-shrink: 0;

    h4 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-heading);
    }
  }

  &__hint {
    margin: 0;
    font-size: 0.6875rem;
    color: var(--color-text-subtle);
    text-align: center;
    padding: 0.25rem 0;
  }

  &__rune-rows {
    display: flex;
    flex-direction: column;
    gap: var(--rune-row-gap);
    align-items: center;
  }

  &__rune-row {
    display: flex;
    justify-content: center;
    width: 100%;

    &:not(.lol-loadout__rune-row--keystone) {
      padding: var(--rune-row-padding);

      .lol-loadout__rune-options {
        --rune-gap: var(--rune-minor-gap);
      }
    }

    &--keystone {
      padding-bottom: 0.5rem;
      margin-bottom: 0.25rem;
      border-bottom: 1px solid color-mix(in srgb, var(--color-border) 65%, transparent);

      .lol-loadout__rune-options {
        --rune-size: var(--rune-keystone-size);
        --rune-gap: var(--rune-gap);
      }
    }
  }

  &__rune-options {
    --rune-size: var(--rune-primary-size);
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: var(--rune-gap);
    width: max-content;
    min-width: calc(
      var(--rune-count, 3) * var(--rune-size) + (var(--rune-count, 3) - 1) * var(--rune-gap)
    );
  }

  &__rune-btn {
    display: inline-flex;
    flex-shrink: 0;
    width: var(--rune-size);
    height: var(--rune-size);
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 9999px;
    overflow: hidden;
    background: color-mix(in srgb, var(--color-glass-bg) 50%, transparent);
    cursor: pointer;
    opacity: 0.55;
    transition: opacity 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &.is-selected {
      opacity: 1;
      border-color: color-mix(in srgb, var(--color-accent) 65%, transparent);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 20%, transparent);
    }

    &:hover:not(.is-selected) {
      opacity: 0.85;
      border-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-border));
    }
  }

  &__item-slots {
    display: grid;
    grid-template-columns: repeat(6, 3rem);
    gap: 0.45rem;
    flex-shrink: 0;
  }

  &__item-slot {
    width: 3rem;
    height: 3rem;
    aspect-ratio: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    border-radius: 0.45rem;
    background: color-mix(in srgb, var(--color-glass-bg) 90%, transparent);
    cursor: pointer;
    overflow: hidden;
    font-size: 0.75rem;
    color: var(--color-text-subtle);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &.is-active {
      border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 15%, transparent);
    }
  }

  &__catalog-option {
    gap: 0.4rem;
    padding: 0.55rem 0.35rem;

    img {
      width: 2.875rem;
      height: 2.875rem;
      border-radius: 0.45rem;
      object-fit: cover;
    }

    span {
      font-size: 0.75rem;
      line-height: 1.25;
    }
  }

  &__item-grid {
    flex: 1;
    min-height: 0;
    max-height: none;
    overflow: auto;
    grid-template-columns: repeat(auto-fill, minmax(5.75rem, 1fr));
    gap: 0.55rem;
  }

  &__filters {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  &__filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__filter-label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  &__filter-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  &__filter-tab {
    border: 1px solid var(--color-border);
    border-radius: 9999px;
    background: transparent;
    padding: 0.28rem 0.7rem;
    font-size: 0.8125rem;
    line-height: 1.2;
    color: var(--color-text-muted);
    cursor: pointer;

    &.is-active {
      border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
      background: color-mix(in srgb, var(--color-accent) 12%, transparent);
      color: var(--color-heading);
      font-weight: 600;
    }
  }

  &__result-count {
    flex-shrink: 0;
  }
}

.lol-rune-tooltip {
  position: fixed;
  z-index: 200;
  width: min(18rem, calc(100vw - 2rem));
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.65rem;
  background: var(--color-glass-bg, #fff);
  box-shadow: 0 12px 28px rgba(8, 14, 22, 0.22);
  pointer-events: none;
  transform: translateX(-50%);

  &__name {
    margin: 0 0 0.35rem;
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--color-heading);
    line-height: 1.3;
  }

  &__desc {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.45;
    color: var(--color-text-muted);

    &--muted {
      color: var(--color-text-subtle);
      font-style: italic;
    }
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
