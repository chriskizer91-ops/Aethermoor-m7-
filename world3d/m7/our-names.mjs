// our-names.mjs (Places, November 24): M7 places whose name in the 3D world differs from game/src/data/maps (Chris's calls).
// m7/convert.mjs (place titles, the labels on ways out) and m7/atlas-data.mjs (the Atlas) read it. Once the game's own
// text carries the name (Together renames it there), an entry here changes nothing and may go.
//   Chris, November 24 (decisions.md, call 8): "Use the lore name from Moon Faire and Envoi": the Mother's Hollow is the
//   fen's dark heart, as Envoi and Coven name it (the Lanternfen and the Lantern Mother keep their names).
export const OUR_NAMES = { 'mothers-hollow': 'The fen’s dark heart' };
export const nameOf = (id, name) => OUR_NAMES[id] || name;
