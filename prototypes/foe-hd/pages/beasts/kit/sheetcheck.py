# The sheet checks (session 6's compare.py and outline.py, for any foe):
#   python3 sheetcheck.py FOE PREFIX OUT_PREFIX
# FOE is the key (art-in/3d/sheets/sheet-FOE.webp); the three views are found as the sheet's three figures.
# Writes OUT_PREFIX-cmp.png (renders under the sheet's views) and OUT_PREFIX-out.png (the sheet's outline in red over
# the render's in blue, both scaled so the ground and the highest point line up).
import sys, numpy as np
from PIL import Image, ImageFilter
foe, pre, out = sys.argv[1], sys.argv[2], sys.argv[3]
SHEET = f'/home/user/Aethermoor-m7-/art-in/3d/sheets/sheet-{foe}.webp'
im = Image.open(SHEET).convert('RGB'); a = np.asarray(im).astype(int)
bg = np.median(np.concatenate([a[:20].reshape(-1, 3), a[-20:].reshape(-1, 3)]), 0)
mask = np.abs(a - bg).sum(2) > 40
cols = mask.sum(0) > 2
runs, s = [], None
for x, c in enumerate(cols):
    if c and s is None: s = x
    if not c and s is not None: runs.append((s, x)); s = None
if s is not None: runs.append((s, len(cols)))
runs = sorted(sorted(runs, key=lambda r: r[1] - r[0])[-3:])
assert len(runs) == 3, runs
def mask_rend(a):
    bg = a[5, 5]; return np.abs(a - bg).sum(2) > 25
def crop(m):
    ys, xs = np.nonzero(m); return m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
def norm(m, H=600):
    m = crop(m); s = H / m.shape[0]
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((max(1, int(m.shape[1] * s)), H))) > 127
cells, cmp_top, cmp_bot = [], [], []
for i, v in enumerate(('front', 'side', 'back')):
    x0, x1 = runs[i]
    sm = mask[:, x0:x1]
    r = np.asarray(Image.open(f'{pre}-{v}.png').convert('RGB')).astype(int)
    rm = mask_rend(r)
    A = norm(sm); B = norm(rm)
    w = max(A.shape[1], B.shape[1]) + 40
    c = np.full((640, w, 3), 255, np.uint8)
    for m, fill in ((A, (255, 215, 215)), (B, (200, 235, 250))):
        ox = (w - m.shape[1]) // 2; reg = c[20:20 + m.shape[0], ox:ox + m.shape[1]]
        reg[m] = (reg[m].astype(int) * np.array(fill) // 255).astype(np.uint8)
    for m, col in ((A, (220, 40, 40)), (B, (0, 120, 190))):
        ox = (w - m.shape[1]) // 2
        e = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES)) > 60
        reg = c[20:20 + m.shape[0], ox:ox + m.shape[1]]; reg[e] = col
    for y in range(20, 620, 60): c[y, :] = np.minimum(c[y, :], 230)
    iou = (A[:, :min(A.shape[1], B.shape[1])].sum())
    cells.append(c)
    # side by side: the sheet's figure and the render cropped to the same height
    ys, xs = np.nonzero(sm); sc = im.crop((x0 + xs.min(), ys.min(), x0 + xs.max() + 1, ys.max() + 1))
    ys, xs = np.nonzero(rm); rc = Image.fromarray(r.astype(np.uint8)).crop((xs.min() - 4, ys.min() - 4, xs.max() + 5, ys.max() + 5))
    H = 520
    cmp_top.append(sc.resize((int(sc.width * H / sc.height), H))); cmp_bot.append(rc.resize((int(rc.width * H / rc.height), H)))
Image.fromarray(np.concatenate(cells, 1)).save(f'{out}-out.png')
W = sum(max(t.width, b.width) for t, b in zip(cmp_top, cmp_bot)) + 40
img = Image.new('RGB', (W, 1060), (128, 122, 115)); x = 10
for t, b in zip(cmp_top, cmp_bot):
    cw = max(t.width, b.width); img.paste(t, (x + (cw - t.width) // 2, 5)); img.paste(b, (x + (cw - b.width) // 2, 535)); x += cw + 10
img.save(f'{out}-cmp.png')
print('wrote', f'{out}-out.png', f'{out}-cmp.png')
