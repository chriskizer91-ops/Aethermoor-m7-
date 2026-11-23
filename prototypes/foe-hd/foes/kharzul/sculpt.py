# Kharzul the Glass Scorpion, Champion of the Sunscorch's Glass Heart (Places' desert-and-deep lane, November 23).
#   python3.12 kit/py/sculpt.py foes/kharzul <level>
# From Chris's sheet (art-in/3d/sheets/sheet-kharzul.webp): a scorpion of living glass 1.5 m to the top of its tail,
# faceted pale gold, gold rings at every joint; over its back the Glass Carapace (a relic: blue glass plates); and
# instead of a sting, Cinderfang (a relic): a scimitar lodged in its tail for three hundred years, hanging from a gold
# ring at the tail's end, its blade dark glass with a molten edge that glows. Measured off the side view in sheet pixels
# (ground 726, the tail's top 126); the lane's shared builder makes it (pages/desert-deep/py/scorpion.py).
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'pages', 'desert-deep', 'py'))
from scorpion import build_scorpion

S = 1.5 / 600.0
SPEC = dict(
    S=S, MID=900, GROUND=726, k=2.2, width=0.31, style='crystal', seed=13,
    glass=[0.90, 0.71, 0.40], amber=[0.66, 0.44, 0.17], joint=[0.86, 0.62, 0.2], tip=[0.62, 0.40, 0.14], gold=[0.95, 0.70, 0.25],
    back=[[0.62, 0.82, 0.88], [0.32, 0.56, 0.66]],      # the Glass Carapace
    plates=[(632, 515, 70, 0.25, 28), (690, 508, 82, 0.29, 30), (752, 504, 88, 0.31, 32), (818, 504, 88, 0.31, 32),
            (885, 508, 84, 0.3, 32), (950, 515, 74, 0.27, 30), (1005, 524, 62, 0.22, 26)],
    carapace=[(1005, 545), (1080, 556), 0.2, 0.06],
    eyes=(1058, 530), eye_x=0.05,
    tail=[(600, 545), (560, 445), (548, 345), (560, 240), (630, 178), (705, 160), (765, 165), (808, 195)],
    tail_r=[52, 55, 57, 52, 44, 38, 30],
    sting=(1029, 509),                               # (the rig's sting bone runs to Cinderfang's tip)
    blade=dict(ring=(830, 195, 24), hilt=(812, 268), tip=(1029, 509), width=44, bow=46,
               steel=[0.16, 0.09, 0.07], glow=[1.0, 0.45, 0.08]),
    arm=[(1030, 562, 0.2), (1052, 598, 0.32), (1078, 556, 0.36)], arm_r=[34, 36, 33],
    palm=[(1062, 552, 0.36), (1218, 548, 0.37), 60, 58],
    finger_fixed=[(1200, 575, 0.37), (1295, 560, 0.37), 31], finger_moving=[(1195, 525, 0.375), (1288, 508, 0.375), 28],
    legs=[((640, 588, 0.18), (610, 552, 0.42), (598, 650, 0.52), (593, 726, 0.56)),
          ((720, 596, 0.2), (705, 555, 0.46), (697, 650, 0.56), (693, 726, 0.6)),
          ((830, 596, 0.2), (830, 555, 0.46), (827, 650, 0.56), (825, 726, 0.6)),
          ((905, 588, 0.18), (935, 552, 0.42), (958, 650, 0.52), (964, 726, 0.56))],
    leg_r=[32, 29, 24, 16],
)

def build(K): return build_scorpion(K, SPEC)
