# Kharzul's rig: the lane's scorpion rig (pages/desert-deep/py/scorpion_rig.py) from its sculpt's measurements.
import os, sys
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(here, '..', '..', 'pages', 'desert-deep', 'py')); sys.path.insert(0, here)
from sculpt import SPEC
from scorpion_rig import make
BONES, weigh, rigid, part = make(SPEC)
TRUNK = ('body', 'head')
SMOOTH = 2
