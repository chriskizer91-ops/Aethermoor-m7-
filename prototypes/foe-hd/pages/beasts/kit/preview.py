# Render a sculpt (or the light version) from the front, side and back, to set beside Chris's sheet
# (session 6's preview.py, with the frame size and centre as arguments).
#   blender -b -P preview.py -- HIGH.npz OUT_PREFIX WIDTH CENTRE_Z [VIEWS]
import sys, os, numpy as np, bpy
sys.path.insert(0, os.path.dirname(__file__))
import blib
argv = sys.argv[sys.argv.index('--') + 1:]
src, out, width, cz = argv[0], argv[1], float(argv[2]), float(argv[3])
views = (argv[4] if len(argv) > 4 else 'front,side,back').split(',')
blib.clear()
d = np.load(src)
ob = blib.mesh_from('sculpt', d['V'], d['F'], d['C'], d['K'])
ob.data.materials.append(blib.vcol_material())
cam, key = blib.look_rig(width=width, res=(int(os.environ.get('RES', 700)), int(os.environ.get('RES', 700))))
cy = float(os.environ.get('CY', 0))
for v in views: blib.shoot(cam, key, v, f'{out}-{v}.png', ctr=(0, cy, cz))
