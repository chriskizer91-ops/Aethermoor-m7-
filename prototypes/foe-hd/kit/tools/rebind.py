# Weight a foe's light model again, by part (kit/rigs/bind.py), without baking its pictures again; then pack it.
#
#   python3.12 kit/tools/rebind.py foes/<key>       (needs build/bake/low.json and low.bin from kit/blender/bake.py)
#   node kit/tools/stretch.mjs foes/<key>           (then check it)
#
# Use it after changing a foe's rig.py (bones, part, BANDS). A bake from before November 21 kept no kinds; they are
# found again from the light level the bake was made from (build/high-<level>.npz).
import sys, os, json, importlib.util, subprocess, numpy as np
from scipy.spatial import cKDTree
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(KIT, 'rigs'))
from bind import bind

FOE = sys.argv[1].rstrip('/')
cfg = json.load(open(os.path.join(FOE, 'foe.json')))
B = os.path.join(FOE, 'build', 'bake')
meta = json.load(open(os.path.join(B, 'low.json')))
data = open(os.path.join(B, 'low.bin'), 'rb').read()
def arr(k):
    L = meta['layout'][k]; dt = np.uint32 if L['type'] == 'uint32' else np.float32
    a = np.frombuffer(data, dt, L['count'] * L['size'], L['offset'])
    return a.reshape(L['count'], L['size']) if L['size'] > 1 else a
pos3 = arr('position')
# the bake's own triangles (kept as index0 the first time, so a cut can be undone by the next rebind)
tris = arr('index0' if 'index0' in meta['layout'] else 'index').reshape(-1, 3).astype(np.int64)
P = np.column_stack([-pos3[:, 0], pos3[:, 2], pos3[:, 1]]).astype(np.float64)     # three.js -> sculpt
if 'kind' in meta['layout']:
    kind = arr('kind').astype(np.int64)
else:
    s = np.load(os.path.join(FOE, 'build', f"high-{cfg['light']['level']}.npz"))
    near = s['K'][cKDTree(s['V']).query(P)[1]].astype(np.int64)
    # each piece of the light mesh is all one kind (the kinds were reduced apart): its most common nearest kind
    q = np.round(P / 1e-5).astype(np.int64); _, wid = np.unique(q, axis=0, return_inverse=True); wid = wid.ravel()
    E = wid[np.concatenate([tris[:, [0, 1]], tris[:, [1, 2]]])]
    nw = wid.max() + 1
    _, comp = connected_components(coo_matrix((np.ones(len(E)), (E[:, 0], E[:, 1])), shape=(nw, nw)), directed=False)
    comp = comp[wid]
    kind = near.copy()
    for c in np.unique(comp):
        m = comp == c; kind[m] = np.bincount(near[m]).argmax()
spec = importlib.util.spec_from_file_location('foe_rig', os.path.join(FOE, cfg.get('rig', 'rig.py')))
RIG = importlib.util.module_from_spec(spec); spec.loader.exec_module(RIG)
# the bones again from rig.py (sculpt -> three.js: (-x, z, y)), so moving a joint needs no bake
meta['bones'] = [{'name': n, 'parent': par, 'head': [round(float(v), 4) for v in (-hd[0], hd[2], hd[1])],
                  'tail': [round(float(v), 4) for v in (-tl[0], tl[2], tl[1])]} for n, par, hd, tl in RIG.BONES]
mid = (np.array(cfg['bounds'][0]) + np.array(cfg['bounds'][1])) / 2
J, W, _, keep = bind(RIG, P, kind, tris, float(cfg.get('height', 1.7)), mid, lambda *a: print('[rebind]', *a))
# write the whole file again: every array as it was, the weights new, the cut triangles drawing nothing (the index
# keeps its length; a cut one repeats a point), and the kinds and the bake's own triangles kept for the next rebind
out = {k: arr(k).copy() for k in meta['layout']}
out['skinIndex'] = J.astype(np.float32); out['skinWeight'] = W.astype(np.float32)
I = tris.astype(np.uint32).copy(); I[~keep] = I[~keep][:, :1]
out['index'] = I; out['kind'] = kind.astype(np.float32); out['index0'] = tris.astype(np.uint32)
layout, blob, o = {}, [], 0
for k_, a_ in out.items():
    b_ = np.ascontiguousarray(a_).tobytes()
    layout[k_] = {'offset': o, 'count': int(a_.shape[0]), 'size': int(a_.shape[1]) if a_.ndim > 1 else 1,
                  'type': 'uint32' if a_.dtype == np.uint32 else 'float32'}
    blob.append(b_); o += len(b_)
meta['layout'] = layout
meta['split'] = bool(getattr(RIG, 'SPLIT', None))     # a cut mouth: the page draws both sides
open(os.path.join(B, 'low.bin'), 'wb').write(b''.join(blob))
json.dump(meta, open(os.path.join(B, 'low.json'), 'w'))
subprocess.run(['node', os.path.join(KIT, 'tools', 'pack.mjs'), FOE], check=True)
