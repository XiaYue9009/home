/** 装备阶段筛选 */
export const ITEM_STAGE_OPTIONS = [
  { id: 'finished', label: '成装' },
  { id: 'component', label: '散件' },
  { id: 'basic', label: '基础' },
  { id: 'all', label: '全部' },
];

export const DEFAULT_ITEM_STAGE = 'finished';

/** 装备属性分组（对应 API types 字段） */
export const ITEM_ATTRIBUTE_GROUPS = [
  {
    id: 'damage',
    label: '攻击',
    types: ['Damage', 'CriticalStrike', 'AttackSpeed', 'LifeSteal', 'OnHit'],
  },
  {
    id: 'spell',
    label: '法术',
    types: ['SpellDamage'],
  },
  {
    id: 'defense',
    label: '防御',
    types: ['Armor', 'MagicResist', 'Health', 'HealthRegen', 'Tenacity', 'SpellBlock'],
  },
  { id: 'armorPen', label: '物穿', types: ['ArmorPenetration'] },
  { id: 'magicPen', label: '法穿', types: ['MagicPenetration'] },
  { id: 'haste', label: '冷却', types: ['AbilityHaste', 'CooldownReduction'] },
  { id: 'mana', label: '法力', types: ['Mana', 'ManaRegen'] },
  { id: 'boots', label: '鞋子', types: ['Boots'] },
  { id: 'movement', label: '移速', types: ['NonbootsMovement'] },
  { id: 'support', label: '辅助', types: ['Aura', 'Active', 'Vision', 'Slow'] },
];
