// game3d/save.js: the 3D game's own save (Together, November 20). Every milestone keeps its own save (the game's rule):
// this one writes only its own keys. M7's live save is read, never written or removed, so a party can be carried over
// (Chris's open call 10, the suggestion: offer it, read only).
//   aethermoor.save.3d         the live save (a game state as M7's rules make it: version 6)
//   aethermoor.save.3d.bak     the previous live save (kept before a new journey or a carry-over)
//   aethermoor.settings.3d     the 3D game's settings
//   aethermoor.save.m7         M7's save: read only
// Every access is guarded: the game runs with storage blocked (it just won't remember).
import { migrate } from '../game/src/rules/migrate.js';

export const KEYS = Object.freeze({ live: 'aethermoor.save.3d', bak: 'aethermoor.save.3d.bak', settings: 'aethermoor.settings.3d', m7: 'aethermoor.save.m7' });

const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
const del = (k) => { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } };
function parse(raw) { if (!raw) return null; try { const g = JSON.parse(raw); return g && g.version ? g : null; } catch (e) { return null; } }

// the 3D game's own journey, migrated to M7's current version (a no-op for its own saves)
export function loadLive() { const g = parse(get(KEYS.live)); if (!g) return null; try { return migrate(g); } catch (e) { return null; } }
export const hasLive = () => !!parse(get(KEYS.live));
export function saveLive(game) { if (!game) return false; return set(KEYS.live, JSON.stringify(game)); }
export function backupLive() { const raw = get(KEYS.live); return raw ? set(KEYS.bak, raw) : false; }
export function clearLive() { del(KEYS.live); }

// M7's save, migrated in memory (read only: nothing is ever written to its key)
export function readM7() { const g = parse(get(KEYS.m7)); if (!g) return null; try { return migrate(g); } catch (e) { return null; } }

export function loadSettings(defaults) { try { const s = JSON.parse(get(KEYS.settings) || 'null'); return { ...defaults, ...(s && typeof s === 'object' ? s : {}) }; } catch (e) { return { ...defaults }; } }
export function saveSettings(s) { set(KEYS.settings, JSON.stringify(s)); }
