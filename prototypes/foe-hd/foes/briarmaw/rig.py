# Briarmaw's rig: the kit's four-legged template with his joints (19 bones). Sculpt coordinates.
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'kit', 'rigs'))
from quad import make

LEGS = {
    'fl': [(0.44, 0.40, 0.86), (0.46, 0.36, 0.38), (0.47, 0.42, 0.10)],
    'fr': [(-0.44, 0.40, 0.86), (-0.46, 0.36, 0.38), (-0.47, 0.42, 0.10)],
    'bl': [(0.42, -0.72, 0.80), (0.44, -0.78, 0.36), (0.45, -0.72, 0.10)],
    'br': [(-0.42, -0.72, 0.80), (-0.44, -0.78, 0.36), (-0.45, -0.72, 0.10)],
}
BONES, weigh, rigid = make(
    legs=LEGS,
    hips=((0, -0.55, 0.92), (0, -0.05, 0.98)), spine=((0, -0.05, 0.98), (0, 0.32, 1.0)),
    chest=((0, 0.32, 1.0), (0, 0.60, 1.05)), neck=((0, 0.60, 1.05), (0, 0.78, 1.08)),
    head=((0, 0.78, 1.08), (0, 1.18, 1.0)), jaw=((0, 0.84, 0.90), (0, 1.08, 0.86)),
    tail=((0, -0.98, 0.98), (0, -1.32, 0.34)), tail_from=-0.95, leg_top=(0.6, 0.78),
    # the jaw: below the grin, at the front of the face; the tusks grow from it
    jaw_region=lambda P: (P[:, 1] > 0.86) & (P[:, 2] < 0.885 + 0.4 * P[:, 0] ** 2) & (P[:, 2] > 0.66) & (abs(P[:, 0]) < 0.32),
    jaw_parts=lambda kind, P: kind == 5 and P[:, 2].min() < 0.75)
