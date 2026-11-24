# iron-sentinel's rig: a stocky knight's skeleton (foes/iron-sentinel/sentinel.py layout(captain=False)), its moves
# kit/js/moves/sentinel.js. Every plate is a piece of its own (build/pieces.json) and goes whole to its bone.
import os, sys, importlib.util
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'kit', 'py'))
from armour import pieces_part
_spec = importlib.util.spec_from_file_location('sentinel_body', os.path.join(HERE, '..', 'iron-sentinel', 'sentinel.py'))
sentinel = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(sentinel)
J, BONES = sentinel.layout(captain=False)
TRUNK = ('hips', 'spine', 'chest')

def part(P, kind, idx, piece):
    return pieces_part(HERE, P, idx, piece)
