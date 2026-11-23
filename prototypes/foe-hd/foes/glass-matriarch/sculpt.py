# The Glass Matriarch, the Aqueduct's lair boss (the glass-scorpion's 'matriarch' variant; Places' desert-and-deep lane,
# November 21).   python3.12 kit/py/sculpt.py foes/glass-matriarch <level>
# From Chris's sheet (art-in/3d/sheets/sheet-glass-matriarch.webp): a scorpion 1.0 m to the top of her tail, her shell
# grown into faceted crystal plates, a row of gold crystals standing out of her back (the tallest over her middle),
# copper-brown claw tips, sting and feet. Measured off the side view in sheet pixels (ground 678, the tail's top 43);
# the lane's shared builder makes her (pages/desert-deep/py/scorpion.py, style 'crystal').
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'pages', 'desert-deep', 'py'))
from scorpion import build_scorpion

S = 1.0 / 635.0
SPEC = dict(
    S=S, MID=1000, GROUND=678, k=1.6, width=0.27, style='crystal', seed=9,
    glass=[0.87, 0.63, 0.30], amber=[0.60, 0.36, 0.12], joint=[0.42, 0.25, 0.1], tip=[0.45, 0.24, 0.13], spike=[1.0, 0.70, 0.16],
    plates=[(770, 452, 85, 0.17, 44), (840, 442, 100, 0.22, 44), (915, 434, 110, 0.25, 44), (990, 431, 112, 0.26, 44),
            (1065, 436, 108, 0.25, 44), (1135, 446, 98, 0.23, 42), (1195, 456, 85, 0.2, 40)],
    carapace=[(1185, 452), (1300, 458), 0.18, 0.06],
    eyes=(1268, 418), eye_x=0.036,
    tail=[(712, 385), (662, 251), (715, 128), (831, 78), (923, 62), (985, 72)],
    tail_r=[62, 62, 58, 50, 34],
    sting=(1038, 151),
    arm=[(1240, 455, 0.12), (1275, 495, 0.26), (1305, 440, 0.3)], arm_r=[32, 34, 32],
    palm=[(1300, 420, 0.31), (1472, 410, 0.32), 56, 66],
    finger_fixed=[(1462, 442, 0.32), (1533, 368, 0.32), 27], finger_moving=[(1452, 372, 0.325), (1520, 338, 0.325), 25],
    legs=[((830, 525, 0.13), (790, 478, 0.38), (745, 590, 0.5), (727, 678, 0.54)),
          ((915, 535, 0.15), (895, 482, 0.42), (880, 590, 0.54), (877, 678, 0.58)),
          ((1080, 535, 0.15), (1098, 482, 0.42), (1110, 590, 0.54), (1115, 678, 0.58)),
          ((1160, 525, 0.13), (1200, 478, 0.38), (1240, 590, 0.5), (1252, 678, 0.54))],
    leg_r=[30, 27, 22, 15],
    # the crystals on her back: (sheet x, base height, x across in m, height px): a row down the middle, smaller either side
    spikes=[(785, 386, 0, 69), (835, 370, 0, 93), (912, 353, 0, 78), (982, 349, 0, 138), (1052, 355, 0, 84), (1103, 366, 0, 66),
            (1140, 375, 0, 51), (1165, 384, 0, 36),
            (860, 412, 0.15, 51), (960, 400, 0.17, 63), (1060, 405, 0.16, 51), (860, 412, -0.15, 51), (960, 400, -0.17, 63), (1060, 405, -0.16, 51)],
)

def build(K): return build_scorpion(K, SPEC)
