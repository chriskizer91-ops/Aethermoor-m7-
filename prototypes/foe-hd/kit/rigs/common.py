# Shared by the rig templates: distances from points to bones, and turning distances into four weights a vertex.
import numpy as np

def seg_dist(P, a, b):
    a = np.asarray(a, np.float32); b = np.asarray(b, np.float32); ab = b - a
    t = np.clip(((P - a) @ ab) / max(float(ab @ ab), 1e-9), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)

def distances(BONES, P):
    return np.stack([seg_dist(P, b[2], b[3]) for b in BONES], 1)

def four(D):
    """the four nearest bones, weighted by inverse distance to the fourth power"""
    W = 1.0 / np.maximum(D, 0.02) ** 4
    top = np.argsort(-W, 1)[:, :4]
    Wt = np.take_along_axis(W, top, 1); Wt /= Wt.sum(1, keepdims=True)
    return top.astype(np.uint16), Wt.astype(np.float32)
