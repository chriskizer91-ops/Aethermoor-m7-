// game3d/lore.js: the lore's names over M7's, where Chris chose them (Together, November 24). Chris: "Use the lore name
// from Moon Faire and Envoi". What the player reads only: ids, saves and game/ are never touched.
//   M7's "Mother's Hollow" -> "the fen's dark heart"
// Used twice: game3d/swap.mjs rewrites M7's own text as it is bundled (loreName), and the page renames the places' and
// the Atlas's text once their scripts have loaded (loreWalk on window.W3D_PLACES, window.M7_ATLAS_DATA...).
const PAIRS = [['The Mother', 'The fen'], ['the Mother', 'the fen']];
// each quoting the sources use: \' inside single-quoted strings, a plain ' and the curly apostrophe
const LORE = [];
for (const q of ["\\'", "'", '’']) for (const [a, b] of PAIRS) LORE.push([`${a}${q}s Hollow`, `${b}${q}s dark heart`]);
export function loreName(s) {
  if (typeof s !== 'string' || !s.includes('Hollow')) return s;
  for (const [a, b] of LORE) if (s.includes(a)) s = s.split(a).join(b);
  return s;
}
// every string in a loaded data tree (names, labels, texts), renamed in place
export function loreWalk(o, seen = new Set()) {
  if (!o || typeof o !== 'object' || seen.has(o)) return;
  seen.add(o);
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (typeof v === 'string') { const n = loreName(v); if (n !== v) o[k] = n; } else if (v && typeof v === 'object') loreWalk(v, seen);
  }
}
