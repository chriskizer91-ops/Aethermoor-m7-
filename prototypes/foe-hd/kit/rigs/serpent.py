# Rig template: a serpent or grub (rotgrub, the Sand Wyrm, mire-leech, the Leviathan). A chain of segments along its
# spine from the tail to the head, plus a jaw. Sculpt coordinates (x right, y forward, z up).
#   from serpent import make
#   BONES, weigh, rigid = make(spine=[tail_tip, ..., neck, head_back], head=(a, b), jaw=(a, b) or None, jaw_region=None)
# Bones: seg0 (the tail end) ... segN, head, jaw. kit/js/moves/serpent.js waves them.
import numpy as np

def make(spine, head, jaw=None, jaw_region=None):
    B, prev = [], None
    for i in range(len(spine) - 1):
        B.append((f'seg{i}', prev, tuple(spine[i]), tuple(spine[i + 1]))); prev = f'seg{i}'
    # the chain grows from the head end so the head can lead: re-root it at the last segment
    B = [(n, None if i == len(B) - 1 else B[i + 1][0], a, b) for i, (n, _, a, b) in enumerate(B)]
    B.append(('head', B[-1][0], *head))
    if jaw: B.append(('jaw', 'head', *jaw))
    def weigh(D, P, idx):
        if jaw: D[:, idx['jaw']] += 10
        if jaw and jaw_region is not None: D[jaw_region(P), idx['jaw']] = 0.0
        return D
    def rigid(kind, P, idx): return None
    return B, weigh, rigid
