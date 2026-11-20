# The outline check at the sheet's own scale (no stretching to fit): renders made with one render pixel to one sheet
# pixel (preview.py with WIDTH = RES * S, centred on the sheet's figure), laid over the sheet's figure.
#   python3 abscheck.py FOE PREFIX OUT.png CX_FRONT CX_SIDE CX_BACK CY_PX [RES]
# CX_*: the sheet column at the render's centre for each view; CY_PX: the sheet row at the render's centre.
# Red: the sheet's outline; blue: the render's. Pink: only the sheet; light blue: only the render.
import sys, numpy as np
from PIL import Image, ImageFilter
foe, pre, out = sys.argv[1:4]
cxs = [float(v) for v in sys.argv[4:7]]; cy = float(sys.argv[7]); RES = int(sys.argv[8]) if len(sys.argv) > 8 else 1000
im = Image.open(f'/home/user/Aethermoor-m7-/art-in/3d/sheets/sheet-{foe}.webp').convert('RGB'); a = np.asarray(im).astype(int)
bg = np.median(np.concatenate([a[:20].reshape(-1, 3), a[-20:].reshape(-1, 3)]), 0)
sm = np.abs(a - bg).sum(2) > 40
H, W = sm.shape
cells = []
for i, v in enumerate(('front', 'side', 'back')):
    r = np.asarray(Image.open(f'{pre}-{v}.png').convert('RGB')).astype(int)
    rm = np.abs(r - r[5, 5]).sum(2) > 25
    # the sheet's pixels under the render
    x0 = int(round(cxs[i] - RES / 2)); y0 = int(round(cy - RES / 2))
    A = np.zeros((RES, RES), bool)
    xs0, xs1 = max(0, x0), min(W, x0 + RES); ys0, ys1 = max(0, y0), min(H, y0 + RES)
    A[ys0 - y0:ys1 - y0, xs0 - x0:xs1 - x0] = sm[ys0:ys1, xs0:xs1]
    # keep only this view's figure: the sheet's columns between the gaps round cx
    if i == 0: A[:, int(cxs[1] - x0 - 470):] = A[:, int(cxs[1] - x0 - 470):] & False
    if i == 1:
        A[:, :max(0, int(cxs[0] - x0 + 175))] = False; A[:, min(RES, int(cxs[2] - x0 - 160)):] = False
    if i == 2: A[:, :int(cxs[1] - x0 + 480)] = False
    ys, xs = np.nonzero(A | rm); yb, ya = max(0, ys.min() - 10), ys.max() + 10; xb, xa = max(0, xs.min() - 10), xs.max() + 10
    A = A[yb:ya, xb:xa]; B = rm[yb:ya, xb:xa]
    c = np.full(A.shape + (3,), 255, np.uint8)
    c[A & ~B] = (255, 200, 200); c[B & ~A] = (190, 228, 250); c[A & B] = (205, 200, 215)
    for m, col in ((A, (220, 40, 40)), (B, (0, 110, 190))):
        e = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES)) > 60
        c[e] = col
    for y in range(0, c.shape[0], 50): c[y, :] = np.minimum(c[y, :], 225)
    iou = (A & B).sum() / max(1, (A | B).sum())
    cells.append((c, iou))
    print(v, 'overlap', round(float(iou), 3))
Hm = max(c.shape[0] for c, _ in cells)
row = np.concatenate([np.pad(c, ((0, Hm - c.shape[0]), (0, 8), (0, 0)), constant_values=255) for c, _ in cells], 1)
Image.fromarray(row).save(out)
