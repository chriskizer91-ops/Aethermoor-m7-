#!/bin/sh
# pages.sh (Places): builds every page this job publishes, into dist/ (run from world3d/)
set -e
ACT1=keep,keep-hall,hearth-road,thornhollow,thornway,briarmaw-den,mossfall,mosswatch-1,mosswatch-2,hindwood,fawnrest,eldergrove,heartroot-1,heartroot-2
SUN=sun-road,sandspire,dust-trail,dusthaven,deep-shaft-1,deep-shaft-2,glass-flats,miragewell,scorchgate,scorchgate-vaults
IRON=old-bridge,drystone-lea,plankford,shrinewood,silverfall,last-camp,rockslide-pass,peaks-veil,highfold,iron-stair,ironhold,ironhold-deeps,harrows-forge,stormwatch,frost-road,frostmere,frostmere-below
GLOOM=murkway,willowmurk,rotbridge,bogmire,lanternfen,mothers-hollow,long-boardwalk,misthollow,drowned-belfry,blackwater-reach,tidal-flats,causeway
A3=keep-hall,keep-gallery,keep-gallery-2,keep-gallery-3,hollow-hall,ash-stair,chained-deep,worldforge
node build.mjs --page=m7-places --places=$ACT1 --tex=768
node build.mjs --page=m7-places --places=$SUN --name=Sunscorch --out=m7-sunscorch --tex=512
node build.mjs --page=m7-places --places=$IRON --name=Ironspire --out=m7-ironspire --tex=512 --paint=0.75
node build.mjs --page=m7-places --places=$GLOOM --name=Gloomfen --out=m7-gloomfen --tex=512 --paint=0.75
node build.mjs --page=m7-places --places=$A3 --name="Act Three" --out=m7-act-three --tex=512
node build.mjs --page=m7-atlas --out=m7-atlas --herotex=256
