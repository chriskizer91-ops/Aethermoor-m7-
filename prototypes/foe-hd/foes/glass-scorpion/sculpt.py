# The glass-scorpion, veteran of the Sunscorch (Places' desert-and-deep lane, November 21).
#   python3.12 kit/py/sculpt.py foes/glass-scorpion <level>
# From Chris's sheet (art-in/3d/sheets/sheet-glass-scorpion.webp): a scorpion the size of a dog, 0.6 m to the top of
# its tail, its shell gone to clouded pale-gold glass, amber at the edges of every plate, dark amber joints. Measured
# off the side view in sheet pixels (ground 628, the tail's top 58); the shared builder makes it
# (pages/desert-deep/py/scorpion.py). x its right, y forward, z up.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'pages', 'desert-deep', 'py'))
from scorpion import build_scorpion

S = 0.6 / 570.0
SPEC = dict(
    S=S, MID=1000, GROUND=628, k=1.0, width=0.14, style='glass', seed=5,
    glass=[0.90, 0.68, 0.32], amber=[0.62, 0.36, 0.09], joint=[0.32, 0.17, 0.05], tip=[0.45, 0.23, 0.06],
    # the back's plates, tail to front: (sheet x of the middle, middle height, half height px, half width m, half length px)
    plates=[(800, 425, 62, 0.09, 44), (850, 418, 78, 0.115, 46), (905, 412, 86, 0.13, 46), (960, 410, 88, 0.135, 46),
            (1015, 413, 84, 0.132, 46), (1070, 420, 76, 0.125, 46), (1125, 428, 66, 0.115, 44)],
    carapace=[(1135, 434), (1262, 446), 0.105, 0.036],          # from, to, half width m, half height m
    eyes=(1222, 395), eye_x=0.022,
    tail=[(775, 392), (733, 282), (744, 178), (832, 96), (945, 86), (1003, 94)],
    tail_r=[46, 50, 46, 40, 28],
    sting=(1027, 160),
    arm=[(1215, 452, 0.07), (1262, 485, 0.16), (1300, 452, 0.19)], arm_r=[24, 25, 23],
    palm=[(1280, 458, 0.195), (1440, 452, 0.2), 44, 56],      # from, to (x), half width px, half height px
    finger_fixed=[(1420, 482, 0.2), (1512, 418, 0.2), 28], finger_moving=[(1415, 424, 0.205), (1495, 388, 0.205), 25],
    # legs: hip, knee (raised, out), ankle, tip on the ground: (sheet x, sheet y, x m)
    legs=[((850, 478, 0.075), (812, 452, 0.2), (760, 540, 0.25), (726, 628, 0.27)),
          ((940, 488, 0.085), (915, 455, 0.22), (885, 545, 0.27), (872, 628, 0.29)),
          ((1030, 488, 0.085), (1028, 455, 0.22), (1020, 545, 0.27), (1015, 628, 0.29)),
          ((1110, 480, 0.075), (1150, 452, 0.2), (1200, 545, 0.25), (1228, 628, 0.27))],
    leg_r=[20, 18, 15, 11],
)

def build(K): return build_scorpion(K, SPEC)
