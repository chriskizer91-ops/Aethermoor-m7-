# The bakes into the page's pictures (WebP), and the sheet comparison image (session 6's tools/textures.py, for any foe).
#   python3 textures.py BAKE_DIR ASSETS_DIR CMP.png [EMIT=0|1]
import sys, os
from PIL import Image
bake, out, cmp = sys.argv[1:4]
emit = len(sys.argv) > 4 and sys.argv[4] == '1'
os.makedirs(out, exist_ok=True)
def save(im, name, q):
    p = os.path.join(out, name); im.save(p, 'WEBP', quality=q, method=6); print(name, os.path.getsize(p) // 1024, 'KB')
col = Image.open(os.path.join(bake, 'color.png')).convert('RGB')
nrm = Image.open(os.path.join(bake, 'normal.png')).convert('RGB')
ao = Image.open(os.path.join(bake, 'ao.png')).convert('L')
# small stacked parts (leaves, petals: kinds in FLAT=...) bake badly from a cage (the rays hit their neighbours): their
# islands get a flat surface and a light, even shading instead
FLAT = [int(k) for k in os.environ.get('FLAT', '').split(',') if k]
if FLAT and os.path.exists(os.path.join(bake, 'uvkind.npz')):
    import numpy as np
    from PIL import ImageDraw
    d = np.load(os.path.join(bake, 'uvkind.npz')); W = nrm.width
    mask = Image.new('L', nrm.size, 0); dr = ImageDraw.Draw(mask)
    for t in d['uv'][np.isin(d['kind'], FLAT)]:
        dr.polygon([(float(u) * W, (1 - float(v)) * W) for u, v in t], fill=255)
    from PIL import ImageFilter
    mask = mask.filter(ImageFilter.MaxFilter(7))
    nrm.paste((128, 128, 255), (0, 0), mask)
    aol = np.asarray(ao).astype(np.float32); m = np.asarray(mask) > 0
    aol[m] = 150 + 0.4 * aol[m]; ao = Image.fromarray(np.clip(aol, 0, 255).astype(np.uint8))
save(col.resize((1024, 1024), Image.LANCZOS), 'color-1024.webp', 86)
save(nrm.resize((1024, 1024), Image.LANCZOS), 'normal-1024.webp', 88)
save(ao.resize((512, 512), Image.LANCZOS).convert('RGB'), 'ao-512.webp', 82)
if emit: save(Image.open(os.path.join(bake, 'emit.png')).convert('RGB').resize((256, 256), Image.LANCZOS), 'emit-256.webp', 85)
c = Image.open(cmp).convert('RGB'); w = 1100
save(c.resize((w, int(c.height * w / c.width)), Image.LANCZOS), 'cmp.webp', 78)
