# The willow-wight, veteran of Willowmurk (One Foe's lane, November 21). python3.12 kit/py/sculpt.py foes/willow-wight <L>
#
# From Chris's sheet (art-in/3d/sheets/sheet-willow-wight.webp; 761 px = 1.8 m): a willow walking on splayed root feet,
# its trunk ridged and grooved, a scowling face under the crown (eyes 1.28 m up, 0.07 m either side, glowing yellow-
# green, weeping), two branch arms (its right hanging to a clawed hand, its left reaching out and forward with
# bluebells hanging from the hand), and a crown of willow fronds 1.16 m across hanging to half a metre, parted over the
# face. Built by tree.py (shared with Grandfather Willow); its numbers are tree.py's defaults.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tree import build_tree

def build(K):
    return build_tree(K, {})
