# A close look at part of the sculpt: blender -b -P closeup.py -- HIGH.npz OUT.png cx cy cz width view
import sys, os, numpy as np, bpy
sys.path.insert(0, os.path.dirname(__file__))
import blib
a = sys.argv[sys.argv.index('--') + 1:]
blib.clear(); d = np.load(a[0])
ob = blib.mesh_from('s', d['V'], d['F'], d['C'], d['K'], d['M'] if 'M' in d else None)
ob.data.materials.append(blib.vcol_material(per_vertex_mat='M' in d))
cx, cy, cz, w = map(float, a[2:6])
cam, key = blib.look_rig(width=w, res=(600, 600)); bpy.context.scene.cycles.samples = 24
# sculpt -> blender: x and y flip
blib.shoot(cam, key, a[6] if len(a) > 6 else 'front', a[1], ctr=(-cx, -cy, cz))
