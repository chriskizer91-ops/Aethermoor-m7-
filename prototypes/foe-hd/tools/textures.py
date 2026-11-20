# The bakes into the page's pictures (WebP), and the painted cut-out from Chris's sheet.
#   python3 tools/textures.py BAKE_DIR ASSETS_DIR
import sys, os, numpy as np
from PIL import Image
bake, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
def save(im, name, q):
    p = os.path.join(out, name); im.save(p, 'WEBP', quality=q, method=6); print(name, os.path.getsize(p) // 1024, 'KB')
col = Image.open(os.path.join(bake, 'color.png')).convert('RGB')
nrm = Image.open(os.path.join(bake, 'normal.png')).convert('RGB')
ao = Image.open(os.path.join(bake, 'ao.png')).convert('L')
emit = Image.open(os.path.join(bake, 'emit.png')).convert('RGB')
for res in (2048, 1024):
    save(col.resize((res, res), Image.LANCZOS), f'color-{res}.webp', 88)
    save(nrm.resize((res, res), Image.LANCZOS), f'normal-{res}.webp', 90)
save(ao.resize((1024, 1024), Image.LANCZOS).convert('RGB'), 'ao-1024.webp', 85)
save(emit.resize((256, 256), Image.LANCZOS), 'emit-256.webp', 85)
# the painted cut-out: the sheet's three views, its grey ground taken away
sheet = np.asarray(Image.open('/home/user/Aethermoor-m7-/art-in/3d/sheets/sheet-briarmaw.webp').convert('RGB')).astype(np.float32)
bg = np.median(np.concatenate([sheet[:20].reshape(-1, 3), sheet[-20:].reshape(-1, 3)]), 0)
d = np.abs(sheet - bg).sum(2)
alpha = np.clip((d - 18) / 30, 0, 1)
for name, (x0, x1) in zip(('front', 'side', 'back'), [(0, 600), (600, 1530), (1560, 2172)]):
    a = alpha[:, x0:x1]; ys, xs = np.nonzero(a > 0.5)
    y0, y1, xa, xb = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([sheet[y0:y1, x0 + xa:x0 + xb], a[y0:y1, xa:xb] * 255]).astype(np.uint8)
    save(Image.fromarray(rgba, 'RGBA'), f'cut-{name}.webp', 86)
