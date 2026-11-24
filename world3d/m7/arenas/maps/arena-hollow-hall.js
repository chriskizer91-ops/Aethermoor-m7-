// arena-hollow-hall.js: the The Hollow Hall arena (made by m7/arenas/make.mjs from m7/arenas/sets.mjs: do not edit by hand)
export default {
 "id": "arena-hollow-hall",
 "name": "The Hollow Hall",
 "region": "below",
 "biome": "council",
 "dark": false,
 "w": 21,
 "h": 21,
 "rows": [
  "#####################",
  "#####################",
  "#########:#*#Y#######",
  "#####::#::,::#YY#####",
  "####:Y::::k::::#Y####",
  "####*:,:::::::::#*###",
  "###:::::::::::::kY###",
  "####,::::::::::::#Y##",
  "##::kk::::::::::::###",
  "##*:::::::::::::::Y##",
  "##::::::::::::::::###",
  "###::::::::::::::kY##",
  "##::,,::::::::::::###",
  "##:::::::::::::::Y*##",
  "####k::::::::::::####",
  "####*:::::::::::#####",
  "####YY::,:::,::Y#####",
  "#######Y:,,::Y#######",
  "#######::###Y:#######",
  "#####################",
  "#####################"
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
  "set": "hollow-hall",
  "sources": [
   "hollow-hall"
  ],
  "clear": 10,
  "round": 15
 }
};
