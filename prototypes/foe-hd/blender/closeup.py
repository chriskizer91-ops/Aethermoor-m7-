# Close views of the head (front and three-quarter) to set beside the sheet's face.
#   blender -b -P closeup.py -- build/high-1.npz OUT_PREFIX
import sys, os, numpy as np, bpy, math
sys.path.insert(0, os.path.dirname(__file__))
import blib
argv = sys.argv[sys.argv.index('--') + 1:]
blib.clear()
d = np.load(argv[0])
ob = blib.mesh_from('sculpt', d['V'], d['F'], d['C'], d['K'])
ob.data.materials.append(blib.vcol_material())
cam, key = blib.look_rig(width=1.0, res=(600, 560))
for v in ('front', 'side', 'three'):
    blib.shoot(cam, key, v, f'{argv[1]}-head-{v}.png', ctr=(0, -0.95, 1.02))
