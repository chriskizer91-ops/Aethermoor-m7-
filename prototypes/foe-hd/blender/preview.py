# Render the sculpt (or the light version) from the front, side and back, to set beside Chris's sheet.
#   blender -b -P preview.py -- build/high.npz OUT_PREFIX [skin.webp]
import sys, os, numpy as np, bpy
sys.path.insert(0, os.path.dirname(__file__))
import blib
argv = sys.argv[sys.argv.index('--') + 1:]
src, out = argv[0], argv[1]
skin = argv[2] if len(argv) > 2 else None
blib.clear()
d = np.load(src)
ob = blib.mesh_from('sculpt', d['V'], d['F'], d['C'], d['K'])
ob.data.materials.append(blib.vcol_material(skin=skin))
cam, key = blib.look_rig(width=3.0)
views = (os.environ.get('VIEWS') or 'front,side,back').split(',')
for v in views: blib.shoot(cam, key, v, f'{out}-{v}.png')
