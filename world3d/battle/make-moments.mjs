// Writes champion-moves.js (step 5): a 3D moment for every named move of every Champion, Relic-Bearer, Hollow Council
// member and the Unsmith in M7 (game/src/data/foes.js), read from M7's own words and effects for the move:
//   move    [the foe's own move by M7's id, then the foe kit's common move the words suggest]
//   fx      effect recipes (champions.js RECIPES) the words call for: thorns, rain, roots, quake, vines, ward, summon,
//           heal, fire, frost, storm, blight, tide, light, hex, song, slash, maw, dig, dive
//   camera  'close' for a charge or a summoning, 'wide' for a blow at everyone, else none
// Hand-made moments (champions.js MOMENTS: Briarmaw's, the Rotwarden's) win over these.
//   node battle/make-moments.mjs        (again whenever M7's foes change; they never do: M7 is frozen)
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOES } from '../../game/src/data/foes.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const BIG = new Set(['champion', 'relic-bearer', 'hollow', 'unsmith']);
const has = (re, s) => re.test(s);

function moment(m) {
  const words = `${m.name} ${m.text || ''}`.toLowerCase(), effs = m.effects || [];
  const kinds = effs.map((e) => `${e.kind || ''} ${e.aspect || ''} ${(e.riders || []).map((r) => r.status || '').join(' ')} ${e.status || ''}`).join(' ').toLowerCase();
  const all = `${words} ${kinds}`;
  const self = m.target === 'self', everyone = m.target === 'all-enemies';
  const attacks = effs.some((e) => e.type === 'attack'), summons = effs.some((e) => e.type === 'summon');
  const fx = [];
  if (summons) fx.push('summon');
  if (self && has(/ward|guard|plate|shell|hide|bark|armou?r|aegis|shield|knit/, all)) fx.push(has(/bramble|bark|vine|root|thorn/, all) ? 'vines' : 'ward');
  if (has(/regenerat|heal|bloom|drinks|mend/, all)) fx.push('heal');
  if (has(/thorn|spine|quill|arrow|bolt|shard|needle|dart|seed|spit|splinter|nail|rivet/, words)) fx.push(has(/storm|rain|hail|volley of|from above|sky/, words) ? 'rain' : 'thorns');
  else if (has(/storm|rain|hail/, words) && !has(/lightning|thunder/, words)) fx.push('rain');
  if (has(/root|floor reaches|grasp|tangle|snare|vine/, words) && !self) fx.push('roots');
  if (has(/heave|quake|stamp|stomp|slam|earth|ground|rockslide|avalanche|landslide|fall of/, words) && !self) fx.push('quake');
  if (has(/ember|fire|flame|burn|cinder|forge|molten|smelt|ash|bellows|spark/, all)) fx.push('fire');
  if (has(/frost|ice|chill|rime|snow|freez|cold|hush/, all)) fx.push('frost');
  if (has(/storm|lightning|thunder|crack/, all) && !fx.includes('rain')) fx.push('storm');
  if (has(/blight|rot|sap|ichor|poison|venom|bile|mire|bog|scum/, all)) fx.push('blight');
  if (has(/tide|water|drown|wave|flood|river|black water|channel|lake/, all)) fx.push('tide');
  if (has(/radiant|hearth|light|lantern|glow|dawn|sun/, all) && !fx.includes('fire')) fx.push('light');
  if (has(/hex|charm|curse|beguile|lure|mask|stolen|steal|unmak|grief/, all)) fx.push('hex');
  if (has(/song|sing|hymn|choir|toll|bell|hush|chant|downbeat|howl|roar|cry/, words)) fx.push('song');
  if (has(/maw|swallow|devour|carry|drown|takes one of you|lead them|walks you/, words)) fx.push('maw');
  // going under (a burrow into the floor, a dive into the water): its own moment, nothing else
  if (self && has(/burrow|goes down into|slides under|dives?\b|pours itself back/, words)) { fx.length = 0; fx.push(has(/water|surface|river|channel/, words) && !has(/as if it were water/, words) ? 'dive' : 'dig'); }
  if (attacks && !everyone && !fx.some((f) => ['thorns', 'rain', 'maw'].includes(f))) fx.push('slash');
  if (!fx.length) fx.push(self ? 'ward' : everyone ? 'song' : 'slash');
  const common = self || has(/call|cry|howl|roar|sing|hymn|cast|spell|hex|graft|curse|summon|hush|lure|beguile|song|choir|bell|toll|mask/, words) ? (has(/roar|howl|cry/, words) || summons ? 'roar' : 'cast')
    : has(/claw|swipe|rake|maul|slash|cut|lash|whip|scythe|blade|sword|axe|sabre|knife|cleave/, words) ? 'swipe'
      : has(/slam|stomp|crush|hammer|smash|bash|charge|gore|butt|club|fist|maul|pound|anvil/, words) ? 'strike' : 'bite';
  const camera = m.charge || summons ? 'close' : everyone && (attacks || effs.some((e) => e.type === 'damage')) ? 'wide' : null;
  return { move: [m.id, common], fx: [...new Set(fx)], camera, text: m.text || m.name };
}

const lines = [];
let n = 0;
for (const f of Object.values(FOES)) {
  const take = (key, tier, moves) => {
    if (!BIG.has(tier)) return;
    for (const [id, m] of Object.entries(moves || {})) { const M = moment({ ...m, id }); n++; lines.push(`  ${JSON.stringify(`${key}:${id}`)}: { move: ${JSON.stringify(M.move)}, fx: ${JSON.stringify(M.fx)}, camera: ${JSON.stringify(M.camera)} }, // ${M.text.replace(/\n/g, ' ')}`); }
  };
  take(f.id, f.tier, f.moves);
  for (const [vid, v] of Object.entries(f.variants || {})) take(`${f.id}/${vid}`, v.tier || f.tier, v.moves || f.moves);
}
writeFileSync(path.join(here, 'champion-moves.js'), `// Made by make-moments.mjs from M7's own foes (game/src/data/foes.js): do not edit by hand; change make-moments.mjs and run
// it again, or make a moment by hand in champions.js (it wins). Keyed 'family:move' or 'family/variant:move'.
export const GENERATED = {
${lines.join('\n')}
};
`);
console.log(`wrote champion-moves.js: ${n} moments`);
