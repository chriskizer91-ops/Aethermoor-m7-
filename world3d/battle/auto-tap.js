// M7's Auto (game/src/rules/autoplay.js), exactly as it is, for the battle screen; with one test switch (step 4):
// ?land=1 has the party use only plain weapon attacks, which never stagger, so a foe's charge (the Sand Wyrm's Swallow,
// the Thunder-Roc's Carry Off) lands as M7 plays it, instead of being broken off by a staggering skill. The rules are
// never touched: this only chooses which of M7's own commands the party gives.
import { autoCommand as auto0 } from '../../game/src/rules/autoplay.js';
import { commands, targets } from '../../game/src/rules/battle.js';

export * from '../../game/src/rules/autoplay.js';
const LAND = typeof location !== 'undefined' && /[?&]land=1\b/.test(location.search);
export function autoCommand(state, heroId, opts) {
  if (LAND) {
    const atk = commands(state, heroId).find((c) => c.type === 'attack' && c.enabled);
    const t = atk && targets(state, atk)[0];
    if (t) return { ...atk, target: t };
  }
  return auto0(state, heroId, opts);
}
