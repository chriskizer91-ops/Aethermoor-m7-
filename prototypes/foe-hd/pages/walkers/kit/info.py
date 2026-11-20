# A foe's numbers and check pictures for the gallery (session 8): python3 info.py SHAPE.npz FINAL.npz PASS ASSETS_DIR
import sys, json, numpy as np
from PIL import Image
shape, final, pas, out = sys.argv[1:5]
res = int(sys.argv[5]) if len(sys.argv) > 5 else 2048
s = np.load(shape); f = np.load(final)
json.dump({'shapeTriangles': int(len(s['F'])), 'sculptTriangles': int(len(f['F'])), 'pass': int(pas), 'res': res}, open(f'{out}/info.json', 'w'))
b = shape.rsplit('/', 1)[0]
for src, dst in ((f'{b}/final-cmp.png', 'cmp.webp'), (f'{b}/shape-out.png', 'outline.webp')):
    im = Image.open(src).convert('RGB'); im = im.resize((1100, int(im.height * 1100 / im.width)), Image.LANCZOS)
    im.save(f'{out}/{dst}', 'WEBP', quality=80)
