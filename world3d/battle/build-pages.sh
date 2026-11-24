#!/usr/bin/env bash
# Every fight page, built lean (November 24): run from world3d/. Each row: out | FIGHT_HD | FIGHT_STANDEES | places | world
# texture px. Every page must stay under 16,000,000 bytes (a claude.ai page's limit): the size is printed after each.
cd "$(dirname "$0")/.."
P=(
"m7-fight|briarmaw,briarling,glowcap,rotwarden,sapwight,thornhound|thornhound,briarling,briarmaw|thornhollow,briarmaw-den,heartroot-1,heartroot-2|768"
"fight-act1a|briarmaw,briarling,glowcap,rotstag,oldsnag,thornhound|none|thornhollow,keep-hall,hearth-road,thornway,briarmaw-den|640"
"fight-act1b|boglurcher,mirelord,rotwarden,sapwight,briarling,glowcap,thornhound,rotgrub|none|mossfall,mosswatch-1,mosswatch-2,hindwood,fawnrest,eldergrove,heartroot-1,heartroot-2|576"
"fight-events|marsh-light|sand-wyrm,kharzul,blackwater-gar,blackwater-leviathan|dust-trail,deep-shaft-2,glass-flats,miragewell,highfold,frostmere-below,rotbridge,lanternfen,mothers-hollow,tidal-flats,worldforge|512"
"fight-act2|willow-wight,grandfather-willow,glass-scorpion,glass-matriarch,sand-skink,kharzul|none|scorchgate-vaults,harrows-forge,frostmere-below,tidal-flats,mothers-hollow,willowmurk,dust-trail,deep-shaft-2|448"
"fight-sunscorch|glass-scorpion,glass-matriarch,sand-skink,sand-wyrm,kharzul|none|scorchgate,scorchgate-vaults,glass-flats,sun-road,dust-trail,miragewell,deep-shaft-1,deep-shaft-2|640"
"fight-ironspire-a|rime-wolf,rockling,peak-troll|none|rockslide-pass,frost-road,frostmere,frostmere-below,highfold|704"
"fight-ironspire-b|mother-anvil,peak-troll,old-horn,rockling|none|ironhold,ironhold-deeps,iron-stair,harrows-forge|768"
"fight-act3|unmade|none|hollow-hall,ash-stair,chained-deep,worldforge|768"
"fight-gloomfen|marsh-light,blackwater-gar,old-jaws,blackwater-leviathan,mire-leech|none|lanternfen,rotbridge,drowned-belfry,blackwater-reach,tidal-flats,misthollow,mothers-hollow|576"
)
for row in "${P[@]}"; do IFS='|' read out hd st pl tex <<< "$row"
  o=""; [ "$out" != "m7-fight" ] && o="--out=$out"
  # each page carries the arena sets its places fight in (Places' table, world3d/m7/arenas/table.js), unless ARENA=0
  [ "${ARENA:-1}" != 0 ] && pl="$pl,$(node -e "import('./m7/arenas/table.js').then(({ARENA_SET:T})=>console.log([...new Set(process.argv[1].split(',').map((p)=>T['m7-'+p]).filter(Boolean))].join(',')))" "$pl")"
  FIGHT_HD=$hd FIGHT_STANDEES=$st node build.mjs --page=m7-fight $o --places=$pl --tex=$tex --herotex=256 --entry=fight.js --plugin=battle/swap.mjs --lean > /dev/null 2>&1
  f=dist/$out-$tex.artifact.html; echo "$out $tex $(stat -c %s $f 2>/dev/null)"
done
