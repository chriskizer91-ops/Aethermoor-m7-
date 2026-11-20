// M7's battle rules exactly as they are (game/src/rules/battle.js), for the battle screen. act() and foeTurn() are
// passed straight through and only watched: the field hears each command as it is given (a guard, a drink, a spell),
// so the hero on the ground can move to it while the screen plays its events. Nothing here changes a result.
import { act as act0, foeTurn as foeTurn0 } from '../../game/src/rules/battle.js';
import { arena } from './arena.js';

export * from '../../game/src/rules/battle.js';
export function act(state, cmd) {
  const r = act0(state, cmd);
  try { arena.heard(cmd, state); } catch (e) { console.warn(e); }
  return r;
}
export function foeTurn(state) {
  const r = foeTurn0(state);
  return r;
}
