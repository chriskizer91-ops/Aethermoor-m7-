# Cloth folds for robed foes (the wraiths, the drowned, the Rime-Abbot...): heights to subtract from a robe's
# signed distance, so the folds are real shapes (the foe kit, November 20).
#
#   d = robe_sdf(P) - robe_folds(P, axis=(0, 0), top=1.4, bottom=0.0, folds=11, amp=0.03, LV=K.LV)
#   d = d - drape(P, along=(0, 0, -1), across=(1, 0, 0), every=0.09, amp=0.012)       # a hanging sleeve or banner
import numpy as np
from sdf import vnoise, sstep

def robe_folds(P, axis=(0, 0), top=1.4, bottom=0.0, folds=11, amp=0.03, seed=0.0, LV=1):
    """vertical folds round a robe hanging from top to bottom about the vertical axis at (x, y); deeper toward the hem,
    wandering a little; at level 2+ smaller creases between them"""
    x, y, z = P[:, 0] - axis[0], P[:, 1] - axis[1], P[:, 2]
    th = np.arctan2(y, x)
    k = sstep(top, bottom, z)                                    # 0 at the top, 1 at the hem
    wander = 0.6 * (vnoise(P * [1, 1, 0.4] + seed, 2.5) - 0.5)
    f = np.abs(np.sin(th * folds / 2 + wander + seed))           # ridges, rounded
    h = amp * (0.25 + 0.75 * k) * (1 - f) ** 1.5
    if LV >= 2: h = h + amp * 0.25 * k * (1 - np.abs(np.sin(th * folds * 1.5 + 2 * wander))) ** 2
    if LV >= 3: h = h + 0.002 * (vnoise(P + seed, 60.0) - 0.5)
    return h

def drape(P, along=(0, 0, -1), across=(1, 0, 0), every=0.09, amp=0.012, seed=0.0):
    """parallel folds running along a direction (a sleeve, a banner, a hanging rag)"""
    a = P @ np.asarray(across, float)
    w = 0.5 * (vnoise(P + seed, 3.0) - 0.5)
    return amp * (1 - np.abs(np.sin(np.pi * a / every + w))) ** 1.5
