#!/usr/bin/env python3
"""Web copies of Chris's 16 creature skins (art-in/3d/skins/, read only), made the same way as the heroes' gear
textures (../../hero-3d/textures/make.py: seamless, big blotches softened, grey, tinted in code by each creature's own
colours), at 384 px. Writes web/*.webp and pack.js (names "beast-<skin>").

    python3 make.py
"""
import base64, importlib.util, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('gear', os.path.join(HERE, '../../hero-3d/textures/make.py'))
gear = importlib.util.module_from_spec(spec); spec.loader.exec_module(gear)
gear.SRC = os.path.normpath(os.path.join(HERE, '../../../art-in/3d/skins'))
gear.SIZE = 384
gear.STD.update({'skin': 0.13})
gear.KEEP |= {'skin-riveted-iron', 'skin-moth-wing', 'skin-fish-scale', 'skin-feathers'}
OUT = os.path.join(HERE, 'web'); os.makedirs(OUT, exist_ok=True)
pack, total = {}, 0
for f in sorted(os.listdir(gear.SRC)):
    if not f.endswith('.webp'): continue
    n = f[:-5]; img = gear.grain(n); data = gear.webp(img, 76)
    name = 'beast-' + n[5:]
    pack[name] = {'url': 'data:image/webp;base64,' + base64.b64encode(data).decode(), 'mean': round(gear.lin_mean(img), 4)}
    open(os.path.join(OUT, name + '.webp'), 'wb').write(data); total += len(data)
open(os.path.join(HERE, 'pack.js'), 'w').write('// Made by make.py from Chris\'s creature skins (art-in/3d/skins/). Do not edit by hand.\nexport const SKINS = ' + json.dumps(pack, separators=(',', ':')) + ';\n')
print(f'{len(pack)} skins: {total / 1024:.0f} KB')
