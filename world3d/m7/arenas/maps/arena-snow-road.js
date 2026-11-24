// arena-snow-road.js: the The Snow Road arena (made by m7/arenas/make.mjs from m7/arenas/sets.mjs: do not edit by hand)
export default {
 "id": "arena-snow-road",
 "name": "The Snow Road",
 "region": "ironspire",
 "biome": "tundra",
 "dark": false,
 "w": 21,
 "h": 21,
 "rows": [
  "T^^^^^^^^T^^^^^^^^^TT",
  "T^^TT^^^^TT^^^TTTTT^^",
  "T^^T^^TT^T..^.^^^TT^^",
  "^^T^T^.T.,,,...^^TTT^",
  "^^T^...........^^^^^T",
  "^^^.^,........\"...TTT",
  "^^^^..............T^^",
  "T^o..............^TT^",
  "^^^................T^",
  "^^^,..............T^^",
  "=====================",
  "T^o...............oT^",
  "^T................T^^",
  "TT.................T^",
  "TT^^.,.........,.^^TT",
  "^^^.T..,........^.^^T",
  "^^T^oT...,..,..^^^^T^",
  "^^^^^TT...,.....TTT^^",
  "^^TT^^^T^T^^o^^T^^^TT",
  "T^^TTTT^^^T^T^^^^^T^T",
  "^^^^T^TT^^^^^^^T^^^^^"
 ],
 "entities": [],
 "exits": [],
 "anchors": {
  "centre": [
   10,
   10,
   "n"
  ],
  "from-road": [
   10,
   12,
   "n"
  ],
  "party": [
   10,
   12,
   "n"
  ],
  "foes": [
   10,
   8,
   "s"
  ]
 },
 "arena": {
  "set": "snow-road",
  "sources": [
   "frost-road"
  ],
  "clear": 10,
  "round": 15
 }
};
