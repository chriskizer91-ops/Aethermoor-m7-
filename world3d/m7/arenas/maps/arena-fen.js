// arena-fen.js: the The Fen arena (made by m7/arenas/make.mjs from m7/arenas/sets.mjs: do not edit by hand)
export default {
 "id": "arena-fen",
 "name": "The Fen",
 "region": "gloomfen",
 "biome": "bog",
 "dark": false,
 "w": 21,
 "h": 21,
 "rows": [
  "t~TTTTT~tTTTT~TT~~T~T",
  "~TT~T~t~~~tT~T~tTTTT~",
  "TTTtT~~.~~~TtTTTT~T~T",
  "~t~TTt~~.\"....o~TT~~T",
  "T~~t~......\".....~TT~",
  "TTT~o.,.\"\"\"..\"..~~TTT",
  "TTTt,..,.........~~~~",
  "T~...............tttt",
  "Tt..m...........mm.tT",
  "t~o\".m..........\"m.TT",
  "=====================",
  "TT~..m..........,.~tt",
  "T~................oTT",
  "TTtT...........\".ttT~",
  "~tTt.........m..m.~Tt",
  "TTTtt..........m~~~TT",
  "~TTTT~.........toTTTT",
  "t~T~~....\"...tot~TT~T",
  "TTTtT~t~T.~.ToTT~~tt~",
  "tTTT~TTT~T~Tt~TTtTt~t",
  "TTT~TTt~~ttTTTtTTTTTT"
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
  "set": "fen",
  "sources": [
   "lanternfen",
   "willowmurk"
  ],
  "clear": 10,
  "round": 15
 }
};
