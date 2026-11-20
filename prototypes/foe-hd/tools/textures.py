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
for res in (2048,):
    save(col.resize((res, res), Image.LANCZOS), f'color-{res}.webp', 88)
    save(nrm.resize((res, res), Image.LANCZOS), f'normal-{res}.webp', 90)
save(ao.resize((1024, 1024), Image.LANCZOS).convert('RGB'), 'ao-1024.webp', 85)
save(emit.resize((256, 256), Image.LANCZOS), 'emit-256.webp', 85)
