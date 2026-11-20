# Render the sculpt (or the light version) from the front, side and back, to set beside Chris's sheet.
# Copied from prototypes/foe-hd/blender/preview.py (session 6); per-vertex roughness and metal, a sky for the metal.
#   blender -b -P preview.py -- build/high.npz OUT_PREFIX
import sys, os, numpy as np, bpy
sys.path.insert(0, os.path.dirname(__file__))
import blib
argv = sys.argv[sys.argv.index('--') + 1:]
src, out = argv[0], argv[1]
blib.clear()
d = np.load(src)
ob = blib.mesh_from('sculpt', d['V'], d['F'], d['C'], d['K'], d['M'] if 'M' in d else None)
ob.data.materials.append(blib.vcol_material(per_vertex_mat='M' in d))
H = float(d['V'][:, 2].max())
cam, key = blib.look_rig(width=H * 1.08, res=(int(os.environ.get('RW', 520)), int(os.environ.get('RH', 760))))
bpy.context.scene.cycles.samples = int(os.environ.get('SAMPLES', 32))
views = (os.environ.get('VIEWS') or 'front,side,back').split(',')
for v in views: blib.shoot(cam, key, v, f'{out}-{v}.png', ctr=(0, 0, H / 2))
