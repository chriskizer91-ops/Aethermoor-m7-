# Mesh pieces for the parts that sit on a sculpted body: tubes, horns (thorns, claws, tusks, teeth), and the Mesh that
# gathers everything with a colour and a kind per vertex (the foe kit, from Briarmaw, November 20).
#
# Kinds (they decide the bake runs and the rig): 0 body or coat, 1 cloth or skin layer, 2 thorn or spike, 3 vine or
# rope, 4 plate or band, 5 tusk or tooth, 6 claw or nail, 7 eye or glow, 8 other rigid piece. Kinds 2, 5, 6, 7, 8 move
# rigidly with the bone they grow from.
import numpy as np

class Mesh:
    def __init__(s): s.V, s.F, s.C, s.K = [], [], [], []; s.n = 0
    def add(s, V, F, col, kind):
        V = np.asarray(V, np.float32); F = np.asarray(F, np.int64)
        col = np.broadcast_to(np.asarray(col, np.float32), (len(V), 3))
        s.V.append(V); s.F.append(F + s.n); s.C.append(col); s.K.append(np.full(len(V), kind, np.uint8)); s.n += len(V)
    def arrays(s):
        return (np.concatenate(s.V), np.concatenate(s.F).astype(np.int32), np.concatenate(s.C), np.concatenate(s.K))

def frames(pts):
    """parallel-transport frames along a polyline: tangent, normal, binormal"""
    t = np.gradient(pts, axis=0); t /= np.linalg.norm(t, axis=1, keepdims=True)
    n = np.cross(t[0], [0, 0, 1.0])
    if np.linalg.norm(n) < 1e-3: n = np.cross(t[0], [1.0, 0, 0])
    n /= np.linalg.norm(n); N = [n]
    for i in range(1, len(pts)):
        n = N[-1] - t[i] * (N[-1] @ t[i]); n /= np.linalg.norm(n); N.append(n)
    N = np.array(N); return t, N, np.cross(t, N)

def tube(pts, radii, sides=10, ridges=0, ridge_amp=0.0):
    """a closed tube along pts with a radius at each point; ridges fluted lengthwise"""
    pts = np.asarray(pts, np.float64); m = len(pts)
    t, N, B = frames(pts)
    ang = np.linspace(0, 2 * np.pi, sides, endpoint=False)
    rr = 1 + (ridge_amp * np.cos(ridges * ang) if ridges else 0 * ang)
    V = np.concatenate([pts[i] + (np.cos(ang)[:, None] * N[i] + np.sin(ang)[:, None] * B[i]) * (radii[i] * rr)[:, None] for i in range(m)])
    i = np.arange(m - 1)[:, None]; j = np.arange(sides)[None]
    a = i * sides + j; b = i * sides + (j + 1) % sides; c = a + sides; d = b + sides
    F = np.concatenate([np.stack([a, b, d], -1).reshape(-1, 3), np.stack([a, d, c], -1).reshape(-1, 3)])
    V = np.vstack([V, pts[0], pts[-1]]); s0, s1 = len(V) - 2, len(V) - 1
    jj = np.arange(sides)
    caps = np.concatenate([np.stack([np.full(sides, s0), (jj + 1) % sides, jj], 1),
                           np.stack([np.full(sides, s1), (m - 1) * sides + jj, (m - 1) * sides + (jj + 1) % sides], 1)])
    return V, np.vstack([F, caps])

def horn(base, d, length, r0, bend=None, amt=0.3, seg=12, sides=12, ridges=0, ridge_amp=0.0, tipR=0.0015, power=0.9):
    """a curved cone from base along d, curling toward bend by amt (thorns, claws, tusks, teeth)"""
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    bend = np.asarray(bend if bend is not None else [0, 0, -1], float)
    bend = bend - d * (bend @ d); bn = np.linalg.norm(bend); bend = bend / bn if bn > 1e-6 else bend
    u = np.linspace(0, 1, seg)
    pts = np.array([base + d * length * x + bend * length * amt * x * x for x in u])
    return tube(pts, r0 * (1 - u) ** power + tipR, sides, ridges=ridges, ridge_amp=ridge_amp)

def ellipsoid(c, r, nt=12, npp=20, rot=None):
    """a closed ellipsoid mesh (eyes, knobs); rot a 3x3 matrix"""
    th, ph = np.meshgrid(np.linspace(0, np.pi, nt), np.linspace(0, 2 * np.pi, npp, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3) * np.asarray(r)
    if rot is not None: sp = sp @ np.asarray(rot).T
    F = []
    for i in range(nt - 1):
        for j in range(npp):
            a = i * npp + j; b = i * npp + (j + 1) % npp
            F += [(a, a + npp, b + npp), (a, b + npp, b)]
    return np.asarray(c) + sp, np.array(F)

def sample_surface(V, F, n, rng):
    """n points spread evenly over a triangle mesh"""
    a = V[F[:, 1]] - V[F[:, 0]]; b = V[F[:, 2]] - V[F[:, 0]]
    area = 0.5 * np.linalg.norm(np.cross(a, b), axis=1)
    idx = rng.choice(len(F), n, p=area / area.sum())
    r1, r2 = rng.random(n), rng.random(n); s = np.sqrt(r1)
    return V[F[idx, 0]] * (1 - s)[:, None] + V[F[idx, 1]] * (s * (1 - r2))[:, None] + V[F[idx, 2]] * (s * r2)[:, None]

def resample(pts, n=90):
    """n points evenly along a polyline"""
    pts = np.asarray(pts, float)
    L_ = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    ss = np.linspace(0, L_[-1], n)
    return np.stack([np.interp(ss, L_, pts[:, i]) for i in range(3)], 1)

def lay(project, f, pts, r):
    """lay a path onto the surface of f, standing r off it, smoothed"""
    Pp, Nn = project(np.asarray(pts, np.float32), f)
    Pp = Pp + Nn * (r * 0.9)
    for _ in range(3): Pp[1:-1] = (Pp[:-2] + 2 * Pp[1:-1] + Pp[2:]) / 4
    return Pp
