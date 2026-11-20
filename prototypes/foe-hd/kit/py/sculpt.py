# Run a foe's sculpt at one level of detail (the foe kit, November 20).
#   python3.12 kit/py/sculpt.py foes/<key> LEVEL       -> foes/<key>/build/high-LEVEL.npz (V, F, colour C, kind K)
#
# Levels: 0 the light model's shape (its parts built light), 1 shape (~100k), 2 form, 3 detail (the sculpt kept as an
# asset; Chris: aim at 500,000 to 1,000,000 triangles, more only where the detail needs it), 4 finer still if needed.
# The foe's sculpt.py defines build(K) and returns a K.Mesh. K carries the kit and this level's settings.
import sys, os, json, time, types, importlib.util
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sdf, geom, coat

foe = os.path.abspath(sys.argv[1]); LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
cfg = json.load(open(os.path.join(foe, 'foe.json')))
T0 = time.time()
def log(*a): print(f'[{time.time() - T0:6.1f}s]', *a, flush=True)
vox = {0: 0.021, 1: 0.021, 2: 0.012, 3: 0.0078, 4: 0.0049}
vox.update({int(k): v for k, v in cfg.get('voxel', {}).items()})
K = types.SimpleNamespace(
    np=np, sdf=sdf, geom=geom, Coat=coat.Coat, Mesh=geom.Mesh, log=log, cfg=cfg, LV=LV, VOX=vox[LV],
    SIDES={0: 5, 1: 6, 2: 10, 3: 16, 4: 22}[LV], SEG={0: 4, 1: 6, 2: 10, 3: 14, 4: 20}[LV],
    lo=tuple(cfg['bounds'][0]), hi=tuple(cfg['bounds'][1]))
spec = importlib.util.spec_from_file_location('foe_sculpt', os.path.join(foe, 'sculpt.py'))
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
M = mod.build(K)
V, F, C, Kd = M.arrays()
counts = {int(k): int(np.sum(Kd[F[:, 0]] == k)) for k in np.unique(Kd)}
log(f'{cfg["key"]} level {LV}: {len(F)} triangles, {len(V)} vertices, by kind {counts}')
os.makedirs(os.path.join(foe, 'build'), exist_ok=True)
np.savez_compressed(os.path.join(foe, 'build', f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=Kd)
log('saved')
