/** 对线难度（数值越小越难；unknown 表示未对线过） */
export const DEFAULT_MATCHUP_DIFFICULTY = 'unknown';

export const MATCHUP_DIFFICULTIES = [
  { id: 'hard', label: '困难', order: 0 },
  { id: 'harder', label: '较难', order: 1 },
  { id: 'normal', label: '一般', order: 2 },
  { id: 'easy', label: '轻松', order: 3 },
  { id: 'unknown', label: '未知', order: 4 },
];

const DIFFICULTY_BY_ID = new Map(MATCHUP_DIFFICULTIES.map((item) => [item.id, item]));

export function getDifficultyMeta(id = '') {
  return DIFFICULTY_BY_ID.get(id) || null;
}

export function getDifficultyLabel(id = '') {
  return getDifficultyMeta(id)?.label || '—';
}

export function getDifficultyOrder(id = '') {
  const resolved = id || DEFAULT_MATCHUP_DIFFICULTY;
  return getDifficultyMeta(resolved)?.order ?? Number.MAX_SAFE_INTEGER;
}

export function compareDifficulty(a = '', b = '', direction = 'asc') {
  const diff = getDifficultyOrder(a) - getDifficultyOrder(b);
  return direction === 'desc' ? -diff : diff;
}

/** Element Plus el-tag type */
export function getDifficultyTagType(id = '') {
  switch (id) {
    case 'hard':
      return 'danger';
    case 'harder':
      return 'warning';
    case 'easy':
      return 'success';
    case 'normal':
      return 'primary';
    default:
      return 'info';
  }
}
