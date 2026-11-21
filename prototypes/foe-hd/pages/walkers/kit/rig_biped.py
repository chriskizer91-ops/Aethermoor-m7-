# A biped rig for the walkers (session 8): bones from a foe's joints, and weights by distance to each bone with the
# rules a biped needs (each limb only takes what is on its own side and level; the head takes all above the neck).
# A foe's rig.py builds BONES with biped_bones(J) and uses weights_biped(P, kind, BONES, J).
import numpy as np

def biped_bones(J):
    """J: joints in sculpt coordinates: hips, spine, chest, neck, head, head_top, and per side ('r' +x, 'l' -x)
    shoulder, elbow, wrist, hand_tip, hip, knee, ankle, toe"""
    B = [('hips', None, J['hips'], J['spine']), ('spine', 'hips', J['spine'], J['chest']),
         ('chest', 'spine', J['chest'], J['neck']), ('neck', 'chest', J['neck'], J['head']),
         ('head', 'neck', J['head'], J['head_top'])]
    for n in ('r', 'l'):
        B += [(f'{n}_upper', 'chest', J[n + '_shoulder'], J[n + '_elbow']), (f'{n}_fore', f'{n}_upper', J[n + '_elbow'], J[n + '_wrist']),
              (f'{n}_hand', f'{n}_fore', J[n + '_wrist'], J[n + '_hand_tip'])]
    for n in ('r', 'l'):
        B += [(f'{n}_thigh', 'hips', J[n + '_hip'], J[n + '_knee']), (f'{n}_shin', f'{n}_thigh', J[n + '_knee'], J[n + '_ankle']),
              (f'{n}_foot', f'{n}_shin', J[n + '_ankle'], J[n + '_toe'])]
    return B

def seg_dist(P, a, b):
    a = np.asarray(a, np.float32); b = np.asarray(b, np.float32); ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)

def weights_biped(P, kind, BONES, J, arm_inner=None, leg_top=None, head_z=None, arm_reach=None):
    """arm_inner: |x| inside which the arms take nothing (the trunk's half-width at the shoulders);
    leg_top: height above which the legs take nothing; head_z: height above which the head takes everything"""
    x, z = P[:, 0], P[:, 2]
    BIG = 5.0
    D = np.stack([seg_dist(P, b[2], b[3]) for b in BONES], 1)
    for i, (n, par, hd, tl) in enumerate(BONES):
        side = 1 if n.startswith('r_') else -1 if n.startswith('l_') else 0
        if not side: continue
        D[:, i] += np.where(np.sign(x + 1e-6) != side, BIG, 0)
        if n[2:] in ('upper', 'fore', 'hand'):
            if arm_inner is not None: D[:, i] += np.where((np.abs(x) < arm_inner) & (z > J['hips'][2] + 0.1), BIG, 0)
            if n.endswith('upper'): D[:, i] *= np.where(z > J[n[0] + '_shoulder'][2] - 0.03, 1.5, 1.0)
            if arm_reach is not None:
                s_ = n[0]
                near = np.minimum.reduce([seg_dist(P, J[s_ + '_shoulder'], J[s_ + '_elbow']), seg_dist(P, J[s_ + '_elbow'], J[s_ + '_wrist']),
                                          seg_dist(P, J[s_ + '_wrist'], J[s_ + '_hand_tip'])])
                D[:, i] += np.where(near > arm_reach, BIG, 0)
        else:
            if leg_top is not None: D[:, i] += np.where(z > leg_top, BIG, 0)
            if n.endswith('thigh'): D[:, i] *= np.where(z > J[n[0] + '_hip'][2] - 0.05, 1.5, 1.0)
    if head_z is not None:
        ih = [b[0] for b in BONES].index('head')
        D[:, ih] = np.where(z > head_z, 0.0, D[:, ih] + np.where(z < head_z - 0.08, BIG, 0))
    W = 1.0 / np.maximum(D, 0.015) ** 4
    top = np.argsort(-W, 1)[:, :4]
    Wt = np.take_along_axis(W, top, 1); Wt /= Wt.sum(1, keepdims=True)
    return top.astype(np.uint16), Wt.astype(np.float32)

# ---- for weights by part (bind.py, session 6): the gating a biped needs ---------------------------------------------
def gate(D, P, idx, arm_x, leg_z, names=None):
    """each limb only on its own side; arms only beyond arm_x from the middle; legs only below leg_z"""
    x, z = P[:, 0], P[:, 2]
    for n, i in idx.items():
        side = 1 if n.startswith('r_') else -1 if n.startswith('l_') else 0
        if not side: continue
        D[:, i] += np.where(np.sign(x + 1e-6) != side, 1000.0, 0.0)
        if n[2:] in ('upper', 'fore', 'hand'): D[:, i] += np.where(np.abs(x) < arm_x, 1000.0, 0.0)
        if n[2:] in ('thigh', 'shin', 'foot'): D[:, i] += np.where(z > leg_z, 1000.0, 0.0)
    return D
def nearest(P, BONES, idx, names):
    """the nearest of the named bones to each point"""
    D = np.stack([seg_dist(P, BONES[idx[n]][2], BONES[idx[n]][3]) for n in names], 1)
    return np.array([idx[names[k]] for k in np.argmin(D, 1)])
