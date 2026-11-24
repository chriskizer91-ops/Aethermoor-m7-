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
  "set": "hollow-hall",
  "sources": [
   "hollow-hall"
  ],
  "clear": 10,
  "round": 15
 }
};
