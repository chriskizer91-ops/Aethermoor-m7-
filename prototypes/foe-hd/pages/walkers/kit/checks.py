# The sheet checks for a walker (session 8): the renders under the sheet's three views, and the outlines over each other.
# Adapted from prototypes/foe-hd/blender/compare.py and outline.py (session 6), with the sheet and its crop boxes as
# arguments (the walker sheets are 1536 x 1024, three figures).
#   python3 checks.py SHEET X0:X1,X0:X1,X0:X1 PREFIX OUT_PREFIX     -> OUT_PREFIX-cmp.png, OUT_PREFIX-out.png
import sys, numpy as np
from PIL import Image, ImageFilter
sheet_path, boxes, pre, out = sys.argv[1:5]
boxes = [tuple(int(v) for v in b.split(':')) for b in boxes.split(',')]
sheet_im = Image.open(sheet_path).convert('RGB')
sheet = np.asarray(sheet_im).astype(int)
H = sheet.shape[0]
VIEWS = ('front', 'side', 'back')
def mask_sheet(a):
    bg = np.median(np.concatenate([a[:20].reshape(-1, 3), a[-20:].reshape(-1, 3)]), 0)
    return np.abs(a - bg).sum(2) > 40
def mask_rend(a):
    bg = a[3, 3]
    return np.abs(a - bg).sum(2) > 25
def bbox(m):
    ys, xs = np.nonzero(m); return ys.min(), ys.max(), xs.min(), xs.max()
# 1. side by side: the sheet's figure above, the render below, the same height
cells = []
for (x0, x1), v in zip(boxes, VIEWS):
    a = sheet[:, x0:x1]; y0, y1, xa, xb = bbox(mask_sheet(a))
    top = sheet_im.crop((x0 + xa - 10, y0 - 10, x0 + xb + 10, y1 + 10))
    r = Image.open(f'{pre}-{v}.png').convert('RGB'); ra = np.asarray(r).astype(int)
    ry0, ry1, rxa, rxb = bbox(mask_rend(ra))
    r = r.crop((rxa - 10, ry0 - 10, rxb + 10, ry1 + 10))
    h = 700
    top = top.resize((max(1, int(top.width * h / top.height)), h)); r = r.resize((max(1, int(r.width * h / r.height)), h))
    w = max(top.width, r.width)
    c = Image.new('RGB', (w + 20, h * 2 + 30), (128, 124, 120))
    c.paste(top, ((w + 20 - top.width) // 2, 10)); c.paste(r, ((w + 20 - r.width) // 2, h + 20))
    cells.append(c)
W = sum(c.width for c in cells); img = Image.new('RGB', (W, cells[0].height), (128, 124, 120)); x = 0
for c in cells: img.paste(c, (x, 0)); x += c.width
img.save(out + '-cmp.png')
# 2. outlines: the sheet's (red) over the render's (blue), both scaled so the ground and the top line up
def norm(m, Ht=600):
    y0, y1, x0, x1 = bbox(m); m = m[y0:y1 + 1, x0:x1 + 1]
    s = Ht / (y1 - y0 + 1)
    im = Image.fromarray((m * 255).astype(np.uint8)).resize((max(1, int(m.shape[1] * s)), Ht))
    return np.asarray(im) > 127
cells = []
for (x0, x1), v in zip(boxes, VIEWS):
    a = norm(mask_sheet(sheet[:, x0:x1]))
    b = norm(mask_rend(np.asarray(Image.open(f'{pre}-{v}.png').convert('RGB')).astype(int)))
    w = max(a.shape[1], b.shape[1]) + 40
    c = np.full((640, w, 3), 255, np.uint8)
    def edge(m):
        return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES)) > 60
    for m, fill in ((a, (255, 215, 215)), (b, (200, 235, 250))):
        ox = (w - m.shape[1]) // 2; reg = c[20:20 + m.shape[0], ox:ox + m.shape[1]]
        reg[m] = (reg[m].astype(int) * np.array(fill) // 255).astype(np.uint8)
    for m, col in ((a, (220, 40, 40)), (b, (0, 120, 190))):
        ox = (w - m.shape[1]) // 2; reg = c[20:20 + m.shape[0], ox:ox + m.shape[1]]; reg[edge(m)] = col
    for y in range(20, 620, 60): c[y, :] = np.minimum(c[y, :], 230)
    cells.append(c)
Image.fromarray(np.concatenate(cells, 1)).save(out + '-out.png')
print('wrote', out + '-cmp.png', out + '-out.png')
