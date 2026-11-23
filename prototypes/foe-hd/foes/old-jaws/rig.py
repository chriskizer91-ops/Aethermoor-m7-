# Old Jaws's rig: the blackwater-gar's (its fish plan and parts), for his size; his ropes, the tooth on its cord and his
# bubbles move with his head and body. (Both his sculpt and the gar's rig are loaded by their paths: a plain import
# of "sculpt" would find the gar's.)
import os, sys, importlib.util
here = os.path.dirname(os.path.abspath(__file__))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
sys.path.insert(0, os.path.join(here, '..', 'blackwater-gar'))
_gar = _load('gar_rig', os.path.join(here, '..', 'blackwater-gar', 'rig.py'))
C = _load('old_jaws_sculpt', os.path.join(here, 'sculpt.py')).C
BONES, part, mask, BANDS = _gar.make(C)
TRUNK, SMOOTH = _gar.TRUNK, 16
WELD_SAME_KIND = True
