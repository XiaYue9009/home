import matchups134 from './134.js';
import matchups131 from './131.js';
import matchups950 from './950.js';

const MATCHUP_TABLES = {
  134: matchups134,
  131: matchups131,
  950: matchups950,
};

export function getLolMatchups(heroId) {
  return MATCHUP_TABLES[heroId]?.matchups ?? [];
}

/** 编辑对线表：在 src/data/lol/matchups/{heroId}.js 中维护 */
export function getLolMatchupEditorPath(heroId) {
  return `src/data/lol/matchups/${heroId}.js`;
}
