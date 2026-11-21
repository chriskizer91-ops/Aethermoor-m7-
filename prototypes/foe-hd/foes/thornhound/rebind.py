# The thornhound weighted again by part with the kit's bind (kit/rigs/bind.py, session 6), without baking again:
# reads build/bake/low.json/low.bin (pages/beasts/kit/bake.py), writes new skinIndex/skinWeight and drops the
# triangles bind cuts, then the page's light.* are packed again.
#   python3.12 rebind.py [KIT_DIR]      then  node <kit>/tools/stretch.mjs foes/thornhound
import sys, os, json, subprocess, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
KIT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '../../kit')
sys.path.insert(0, os.path.join(KIT, 'rigs')); sys.path.insert(0, HERE)
from bind import bind
import rig as RIG
B = os.path.join(HERE, 'build', 'bake')
meta = json.load(open(os.path.join(B, 'low.json'))); data = open(os.path.join(B, 'low.bin'), 'rb').read()
def arr(k):
    L = meta['layout'][k]; dt = np.uint32 if L['type'] == 'uint32' else np.float32
    a = np.frombuffer(data, dt, L['count'] * L['size'], L['offset'])
    return a.reshape(L['count'], L['size']) if L['size'] > 1 else a
pos3 = arr('position'); tris = arr('index0' if 'index0' in meta['layout'] else 'index').reshape(-1, 3).astype(np.int64)
P = np.column_stack([-pos3[:, 0], pos3[:, 2], pos3[:, 1]]).astype(np.float64)       # three.js -> sculpt
uk = np.load(os.path.join(B, 'uvkind.npz')); kind = np.zeros(len(P), np.int64)
kind[tris.ravel()] = np.repeat(uk['kind'].astype(np.int64), 3)
kind[kind == 4] = 8                  # each leaf moves as one piece with what it sits on (kit's rigid kinds)
mid = (P.min(0) + P.max(0)) / 2
J, W, _, keep = bind(RIG, P, kind, tris, 0.9, mid, lambda *a: print('[rebind]', *a))
out = {k: arr(k).copy() for k in meta['layout']}
out['skinIndex'] = J.astype(np.float32); out['skinWeight'] = W.astype(np.float32)
I = tris.astype(np.uint32).copy(); I[~keep] = I[~keep][:, :1]
out['index'] = I.reshape(-1); out['index0'] = tris.astype(np.uint32).reshape(-1)
layout, blob, o = {}, [], 0
for k_, a_ in out.items():
    b_ = np.ascontiguousarray(a_).tobytes()
    layout[k_] = {'offset': o, 'count': int(a_.shape[0]), 'size': int(a_.shape[1]) if a_.ndim > 1 else 1,
                  'type': 'uint32' if a_.dtype == np.uint32 else 'float32'}
    blob.append(b_); o += len(b_)
meta['layout'] = layout
from common import helpers_for
meta['helpers'] = helpers_for(RIG.BONES, getattr(RIG, 'HELPERS', None))
meta['bones'] = [{'name': n, 'parent': par, 'head': [round(float(v), 4) for v in (-hd[0], hd[2], hd[1])], 'tail': [round(float(v), 4) for v in (-tl[0], tl[2], tl[1])]} for n, par, hd, tl in RIG.BONES]
open(os.path.join(B, 'low.bin'), 'wb').write(b''.join(blob)); json.dump(meta, open(os.path.join(B, 'low.json'), 'w'))
print('[rebind] cut', int((~keep).sum()), 'triangles')
subprocess.run(['node', os.path.join(HERE, '../../pages/beasts/kit/pack.mjs'), B, '', os.path.join(HERE, 'assets')], check=True)
