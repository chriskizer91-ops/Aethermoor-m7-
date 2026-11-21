# A walker's bakes into the page's pictures (WebP). Adapted from prototypes/foe-hd/tools/textures.py (session 6):
# colour and surface (normal) at RES, and one "ORM" picture (R shading in the folds, G roughness, B metalness) at half
# that, which three.js reads for its ao, roughness and metalness maps all at once.
#   python3 textures.py BAKE_DIR ASSETS_DIR RES
import sys, os, numpy as np
from PIL import Image
bake, out, res = sys.argv[1], sys.argv[2], int(sys.argv[3])
Q = int(sys.argv[4]) if len(sys.argv) > 4 else 0      # lower the quality by this much (phone copies)
os.makedirs(out, exist_ok=True)
def save(im, name, q):
    p = os.path.join(out, name); im.save(p, 'WEBP', quality=q, method=6); print(name, os.path.getsize(p) // 1024, 'KB')
col = Image.open(os.path.join(bake, 'color.png')).convert('RGB')
nrm = Image.open(os.path.join(bake, 'normal.png')).convert('RGB')
h = res // 2
ao = np.asarray(Image.open(os.path.join(bake, 'ao.png')).convert('L').resize((h, h), Image.LANCZOS))
mt = np.asarray(Image.open(os.path.join(bake, 'mat.png')).convert('RGB').resize((h, h), Image.LANCZOS))
save(col.resize((res, res), Image.LANCZOS), 'color.webp', 86 - Q)
save(nrm.resize((res, res), Image.LANCZOS), 'normal.webp', 88 - Q)
save(Image.fromarray(np.dstack([ao, mt[..., 0], mt[..., 1]]).astype(np.uint8)), 'orm.webp', 88 - Q)
if os.path.exists(os.path.join(bake, 'emit.png')):
    em = Image.open(os.path.join(bake, 'emit.png')).convert('RGB')
    save(em.resize((max(256, res // 4),) * 2, Image.LANCZOS), 'emit.webp', 85)
elif os.path.exists(os.path.join(out, 'emit.webp')): os.remove(os.path.join(out, 'emit.webp'))
