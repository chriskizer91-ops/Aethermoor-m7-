# The Unsmith's rig: the biped skeleton and his cloak's lower half (sculpt.py J), its moves kit/js/moves/unsmith.js. Every slab (and the glowing slab
# under it) is a piece of its own (build/pieces.json) and goes whole to its bone: nothing stretches.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'kit', 'py'))
from armour import pieces_part, humanoid_bones
import importlib.util
_spec = importlib.util.spec_from_file_location('unsmith_sculpt', os.path.join(HERE, 'sculpt.py'))
_m = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_m)
BONES = _m.BONES
TRUNK = ('hips', 'spine', 'chest')

def part(P, kind, idx, piece):
    return pieces_part(HERE, P, idx, piece)
