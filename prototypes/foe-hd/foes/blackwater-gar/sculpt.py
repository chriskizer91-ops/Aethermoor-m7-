# The blackwater-gar, rabble of the Gloomfen (One Foe's lane, November 23). python3.12 kit/py/sculpt.py foes/blackwater-gar <L>
#
# From Chris's sheet (art-in/3d/sheets/sheet-blackwater-gar.webp): a long armoured fish, 1.3 m, swimming just above
# the ground in its ripple: green diamond plates in rows, a pale belly, a long narrow snout full of needle teeth, a
# yellow eye, a sawtooth crest down its back, fins and a fanned tail with orange spots. Built by fish.py (Old Jaws is
# the same fish, bigger). x right, y forward, z up.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fish import build_fish, DEFAULTS
C = dict(DEFAULTS)
def build(K):
    M, _ = build_fish(K, C)
    return M
