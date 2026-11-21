# Copied from session 6 (prototypes/foe-hd/tools/export_sculpt.py) for the beasts until the shared kit is on the hub branch.
# The sculpt for the page's laptop view: three.js coordinates, positions as 16-bit, colours as 8-bit.
#   python3.12 tools/export_sculpt.py build/high-N.npz OUT_PREFIX
import sys, json, numpy as np
d = np.load(sys.argv[1]); out = sys.argv[2]
V = d['V']; P = np.column_stack([-V[:, 0], V[:, 2], V[:, 1]]).astype(np.float32)
lo, hi = P.min(0), P.max(0)
q = np.round((P - lo) / (hi - lo) * 65535).astype(np.uint16)
q4 = np.zeros((len(q), 4), np.uint16); q4[:, :3] = q
C = np.zeros((len(V), 4), np.uint8); C[:, :3] = np.clip(d['C'] * 255, 0, 255); C[:, 3] = d['K']
F = d['F'].astype(np.uint32)[:, [0, 2, 1]]      # x was mirrored: keep the faces outward
open(out + '.bin', 'wb').write(q4.tobytes() + C.tobytes() + F.tobytes())
json.dump({'vertices': int(len(V)), 'triangles': int(len(F)), 'lo': lo.tolist(), 'hi': hi.tolist()}, open(out + '.json', 'w'))
print('sculpt', len(F), 'triangles')
