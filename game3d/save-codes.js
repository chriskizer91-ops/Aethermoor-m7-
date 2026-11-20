// game3d/save-codes.js: what M7's Settings screen (game/src/ui/screens/settings.js) imports from core/save.js, for the
// 3D game (Together, November 20). game3d/swap.mjs hands it to that screen in place of M7's own at build time, so the
// screen's save codes, backup and restore read and write the 3D game's keys (game3d/save.js), never M7's. The codes
// themselves are M7's (AETH6.): a code from the 2D game loads here, and one from here loads there.
// The earlier milestones' saves are only ever read, as in M7.
import { saveLive, backupLive, KEYS } from './save.js';
export { exportCode, importCode, exportV1Code, exportV2Code, exportM4Code, exportM45Code, exportM5Code, exportM6Code, readV1, hasV1, readV2, hasV2, readM4, hasM4, readM45, hasM45, readM5, hasM5, readM6, hasM6 } from '../game/src/core/save.js';

const parse = (raw) => { try { const g = JSON.parse(raw); return g && g.version ? g : null; } catch (e) { return null; } };
const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
export const saveGame = (g) => saveLive(g);
export const backupGame = () => backupLive();
export const hasBackup = () => !!parse(get(KEYS.bak));
export function restoreBackup(migrate) { const g = parse(get(KEYS.bak)); if (!g) return null; try { return migrate ? migrate(g) : g; } catch (e) { return null; } }
