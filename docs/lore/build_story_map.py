#!/usr/bin/env python3
"""build_story_map.py: writes docs/lore/aethermoor-story-map.html, M7's story placed on Chris's atlas of Aethermoor.

    python3 docs/lore/build_story_map.py

Reads docs/lore/places.json (the places, their story and their 3D bodies) and docs/lore/atlas-2048.webp (Chris's
nine-region atlas, from envoi-on-the-longest-night reference/art/world-map/day/Aethermoor-Nine-Region-Atlas.webp, shrunk).
"""
import base64, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'places.json'), encoding='utf-8'))
atlas = 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(HERE, 'atlas-2048.webp'), 'rb').read()).decode()
page = open(os.path.join(HERE, 'story-map.tpl.html'), encoding='utf-8').read()
page = page.replace('/*DATA*/', json.dumps(D, ensure_ascii=False)).replace('ATLAS_URL', atlas)
out = os.path.join(HERE, 'aethermoor-story-map.html')
open(out, 'w', encoding='utf-8').write(page)
print(f'wrote {out} ({os.path.getsize(out) / 1048576:.1f} MB, {len(D["places"])} places)')
