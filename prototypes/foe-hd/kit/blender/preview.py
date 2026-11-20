# Renders of a foe's sculpt from the front, side, back (and three-quarter, and a close look at the head), to set
# beside its sheet. The foe kit, November 20.
#   blender -b -P kit/blender/preview.py -- foes/<key> LEVEL [views]      views: front,side,back,three,head
#   -> foes/<key>/build/render-LEVEL-<view>.png
# front: we face it (it faces -Y in Blender); side: its left, nose to the right of the picture, as the sheets draw it.
import sys, os, json, numpy as np, bpy
sys.path.insert(0, os.path.dirname(__file__))
import blib
argv = sys.argv[sys.argv.index('--') + 1:]
FOE = os.path.abspath(argv[0]); LV = argv[1]
views = (argv[2] if len(argv) > 2 else 'front,side,back').split(',')
cfg = json.load(open(os.path.join(FOE, 'foe.json')))
blib.clear()
d = np.load(os.path.join(FOE, 'build', f'high-{LV}.npz'))
ob = blib.mesh_from('sculpt', d['V'], d['F'], d['C'], d['K'])
ob.data.materials.append(blib.vcol_material())
view = cfg.get('view', {})
cx, cy, cz = view.get('center', [0, 0, cfg.get('height', 1.7) / 2])
cam, key = blib.look_rig(width=view.get('width', cfg.get('height', 1.7) * 1.8))
for v in views:
    out = os.path.join(FOE, 'build', f'render-{LV}-{v}.png')
    if v == 'head':
        hx, hy, hz = view.get('head', [0, 0, cfg.get('height', 1.7)])
        cam.data.ortho_scale = view.get('headWidth', 1.0)
        blib.shoot(cam, key, 'three', out, ctr=(-hx, -hy, hz))      # sculpt -> Blender: x and y turned round
        cam.data.ortho_scale = view.get('width', cfg.get('height', 1.7) * 1.8)
    else:
        blib.shoot(cam, key, v, out, ctr=(-cx, -cy, cz))
