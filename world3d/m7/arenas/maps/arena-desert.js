// arena-desert.js: the The Desert Sands arena (made by m7/arenas/make.mjs from m7/arenas/sets.mjs: do not edit by hand)
export default {
 "id": "arena-desert",
 "name": "The Desert Sands",
 "region": "sunscorch",
 "biome": "desert",
 "dark": false,
 "w": 21,
 "h": 21,
 "rows": [
  "^^^^^o^^^^^^^^^^o^^^^",
  "^^o^^^^^^^^o^o^^o^^^^",
  "^^^^^^^To^^..o^^^^^^o",
  "^^^^^T.^...,.o.o^o^^^",
  "o^^^^^.........oo^^^^",
  "^^o.o.,.........^o^^^",
  "^^^...............^^^",
  "^^T^.............T^^^",
  "^^o...............^^^",
  "^^T................oo",
  "=====================",
  "^^o............,...^^",
  "^^..,...........,.^o^",
  "^^^...,.........,oo^o",
  "o^^.,.............^^^",
  "^^^^......,.....^o^^^",
  "o^^^o^..,.,.....T^^^^",
  "o^^^ooTT.,...o..^^^^^",
  "o^^^o^^.T.^.To^^^^^o^",
  "o^^o^^^^^^^^^^oo^^^^^",
  "^^^o^^^^^^o^^^o^^^^^o"
 ],
 "entities": [],
 "exits": [],
 "anchors": {
  "from-road": [
   10,
   13,
   "n"
  ],
  "party": [
   10,
   13,
   "n"
  ],
  "foes": [
   10,
   7,
   "s"
  ]
 },
 "arena": {
  "set": "desert",
  "sources": [
   "sun-road"
  ],
  "clear": 10,
  "round": 15
 }
};
