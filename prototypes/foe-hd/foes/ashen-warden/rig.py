# The Ashen Warden's rig: a knight's skeleton (hips, spine, chest, neck, head; each arm upper, fore, hand; each leg
# thigh, shin, foot; the cape's lower half), its moves kit/js/moves/warden.js. Sculpt coordinates (layout.py).
# Every plate is a piece of its own (kit/py/armour.py, build/pieces.json) and goes whole to its bone: nothing stretches.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'kit', 'py'))
from layout import BONES
from armour import pieces_part
TRUNK = ('hips', 'spine', 'chest')

def part(P, kind, idx, piece):
    return pieces_part(HERE, P, idx, piece)
