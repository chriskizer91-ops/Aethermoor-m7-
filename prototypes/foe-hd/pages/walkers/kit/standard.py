# A walker's assets in the foe kit's standard form too (session 8; hub's ask, November 21), beside its own:
#   foes/<key>/assets/color-<res>.webp, normal-<res>.webp (full and phone sizes), ao-1024.webp, orm-1024.webp,
#   emit-256.webp, and light.json (with key, plan 'walker', height) for the full light model; foes/<key>/foe.json.
#   python3 standard.py FOE_DIR KEY NAME HEIGHT RES PHONE RANK [GLOW]
import sys, os, json
from PIL import Image
foe, key, name, height, res, phone, rank = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6]), sys.argv[7]
glow = sys.argv[8] if len(sys.argv) > 8 else None
bake, out = os.path.join(foe, 'build', 'bake'), os.path.join(foe, 'assets')
def save(im, n, q): p = os.path.join(out, n); im.save(p, 'WEBP', quality=q, method=6); print(n, os.path.getsize(p) // 1024, 'KB')
col = Image.open(os.path.join(bake, 'color.png')).convert('RGB'); nrm = Image.open(os.path.join(bake, 'normal.png')).convert('RGB')
for r in sorted({res, phone}, reverse=True):
    save(col.resize((r, r), Image.LANCZOS), f'color-{r}.webp', 86); save(nrm.resize((r, r), Image.LANCZOS), f'normal-{r}.webp', 88)
ao = Image.open(os.path.join(bake, 'ao.png')).convert('L').resize((1024, 1024), Image.LANCZOS)
save(ao.convert('RGB'), 'ao-1024.webp', 85)
m = Image.open(os.path.join(bake, 'mat.png')).convert('RGB').resize((1024, 1024), Image.LANCZOS); r_, g_, _ = m.split()
save(Image.merge('RGB', (ao, r_, g_)), 'orm-1024.webp', 88)
ep = os.path.join(bake, 'emit.png')
save(Image.open(ep).convert('RGB').resize((256, 256), Image.LANCZOS) if os.path.exists(ep) else Image.new('RGB', (256, 256)), 'emit-256.webp', 85)
lj = os.path.join(out, 'light.json'); meta = json.load(open(lj))
meta.update({'key': key, 'plan': 'walker', 'height': height}); json.dump(meta, open(lj, 'w'))
cfg = {'key': key, 'name': name, 'plan': 'walker', 'rank': rank, 'height': height,
       'moves': 'pages/walkers/foes.js', 'bake': {'res': res, 'phone': phone}, 'rig': 'rig.py',
       'note': "a walker (session 8): its moves are pages/walkers/foes.js FOES[key] (walker.js movesFor); its own page assets are color.webp, orm.webp and phone/"}
if glow: cfg.update({'glow': glow, 'glowIntensity': 0.9})
json.dump(cfg, open(os.path.join(foe, 'foe.json'), 'w'), indent=1)
print('foe.json, light.json: plan walker')
