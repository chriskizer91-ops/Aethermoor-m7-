#!/bin/sh
# measure.sh (Places, step 4): every place on every page, on phone and on laptop detail (m7/probe.mjs), into .cache/measure/
mkdir -p .cache/measure
for p in places sunscorch ironspire gloomfen act-three; do
  ids=$(node -e "const s=require('fs').readFileSync('dist/m7-$p-512.artifact.html','utf8');console.log([...s.matchAll(/M7_PLACES = G\.M7_PLACES \|\| \{\}\)\['([\w-]+)'\]/g)].map(m=>m[1]).join(','))")
  NODE_PATH=$(npm root -g) timeout 3000 node m7/probe.mjs dist/m7-$p-512.html $ids --phone > .cache/measure/$p-phone.txt 2>&1
  NODE_PATH=$(npm root -g) timeout 3000 node m7/probe.mjs dist/m7-$p-512.html $ids > .cache/measure/$p-laptop.txt 2>&1
done
