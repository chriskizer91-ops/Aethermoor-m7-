# A foe's bakes into its page pictures (WebP). The foe kit, November 20.
#   python3 kit/tools/textures.py foes/<key>
#   -> foes/<key>/assets/color-<res>.webp, normal-<res>.webp (bake.res, and bake.phone for phones), ao-1024.webp,
#      emit-256.webp
import sys, os, json
from PIL import Image
foe = os.path.abspath(sys.argv[1]); cfg = json.load(open(os.path.join(foe, 'foe.json')))
bake, out = os.path.join(foe, 'build', 'bake'), os.path.join(foe, 'assets')
os.makedirs(out, exist_ok=True)
def save(im, name, q):
    p = os.path.join(out, name); im.save(p, 'WEBP', quality=q, method=6); print(name, os.path.getsize(p) // 1024, 'KB')
col = Image.open(os.path.join(bake, 'color.png')).convert('RGB')
nrm = Image.open(os.path.join(bake, 'normal.png')).convert('RGB')
ao = Image.open(os.path.join(bake, 'ao.png')).convert('L')
emit = Image.open(os.path.join(bake, 'emit.png')).convert('RGB')
b = cfg.get('bake', {})
for res in sorted({b.get('res', 2048), b.get('phone', 1024)}, reverse=True):
    save(col.resize((res, res), Image.LANCZOS), f'color-{res}.webp', 88)
    save(nrm.resize((res, res), Image.LANCZOS), f'normal-{res}.webp', 90)
save(ao.resize((1024, 1024), Image.LANCZOS).convert('RGB'), 'ao-1024.webp', 85)
save(emit.resize((256, 256), Image.LANCZOS), 'emit-256.webp', 85)
# ORM (glTF's order): R the shading in the folds, G roughness, B metalness, when the sculpt gave them (session 8)
if os.path.exists(os.path.join(bake, 'mat.png')):
    m = Image.open(os.path.join(bake, 'mat.png')).convert('RGB').resize((1024, 1024), Image.LANCZOS)
    r_, g_, _ = m.split()
    save(Image.merge('RGB', (ao.resize((1024, 1024), Image.LANCZOS), r_, g_)), 'orm-1024.webp', 88)
