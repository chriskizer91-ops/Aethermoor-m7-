# Overlay: the sheet's outline (red) on my render's outline (cyan), both scaled so the ground and the tallest
# point line up. python3 outline.py PREFIX OUT.png
import sys, numpy as np
from PIL import Image, ImageFilter
pre, out = sys.argv[1], sys.argv[2]
sheet = np.asarray(Image.open('/home/user/Aethermoor-m7-/art-in/3d/sheets/sheet-briarmaw.webp').convert('RGB')).astype(int)
W = sheet.shape[1] // 3
def mask_sheet(a):
    bg = np.median(np.concatenate([a[:20].reshape(-1, 3), a[-20:].reshape(-1, 3)]), 0)
    return np.abs(a - bg).sum(2) > 40
def mask_rend(a):
    bg = a[5, 5]
    return np.abs(a - bg).sum(2) > 25
def norm(m, H=600):
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    m = m[y0:y1 + 1, x0:x1 + 1]
    s = H / (y1 - y0 + 1)
    im = Image.fromarray((m * 255).astype(np.uint8)).resize((max(1, int(m.shape[1] * s)), H))
    return np.asarray(im) > 127
cells = []
for i, v in enumerate(('front', 'side', 'back')):
    x0, x1 = [(0, 600), (600, 1530), (1560, 2172)][i]
    a = norm(mask_sheet(sheet[:, x0:x1]))
    b = norm(mask_rend(np.asarray(Image.open(f'{pre}-{v}.png').convert('RGB')).astype(int)))
    w = max(a.shape[1], b.shape[1]) + 40
    c = np.full((640, w, 3), 255, np.uint8)
    def edge(m):
        e = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES)
        return np.asarray(e) > 60
    for m, col, fill in ((a, (220, 40, 40), (255, 215, 215)), (b, (0, 150, 200), (200, 235, 250))):
        ox = (w - m.shape[1]) // 2; oy = 20
        reg = c[oy:oy + m.shape[0], ox:ox + m.shape[1]]
        reg[m] = (reg[m].astype(int) * np.array(fill) // 255).astype(np.uint8)
    for m, col in ((a, (220, 40, 40)), (b, (0, 120, 190))):
        ox = (w - m.shape[1]) // 2; oy = 20
        e = edge(m)
        reg = c[oy:oy + m.shape[0], ox:ox + m.shape[1]]; reg[e] = col
    for y in range(20, 620, 60): c[y, :] = (230, 230, 230)
    cells.append(c)
H = max(c.shape[0] for c in cells)
Image.fromarray(np.concatenate(cells, 1)).save(out)
