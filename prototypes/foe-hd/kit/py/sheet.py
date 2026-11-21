# Check a foe's shape against its model sheet (the foe kit, November 20).
#   python3 kit/py/sheet.py foes/<key> LEVEL [--no-render]
# Renders the sculpt at LEVEL from the front, side and back (kit/blender/preview.py), then writes:
#   build/compare-LEVEL.png   the sheet's three views above the renders
#   build/outline-LEVEL.png   the sheet's outline (red) over the render's (blue), both scaled to the same height
# The sheet and its three crop boxes ([x0, x1] for front, side, back, in sheet pixels) come from foe.json.
import sys, os, json, subprocess, numpy as np
from PIL import Image, ImageFilter
foe = os.path.abspath(sys.argv[1]); LV = sys.argv[2]
cfg = json.load(open(os.path.join(foe, 'foe.json')))
here = os.path.dirname(os.path.abspath(__file__))
repo = os.path.abspath(os.path.join(here, '..', '..', '..', '..'))
if '--no-render' not in sys.argv:
    subprocess.run(['blender', '-b', '-P', os.path.join(here, '..', 'blender', 'preview.py'), '--', foe, LV, 'front,side,back'],
                   check=True, stdout=subprocess.DEVNULL)
sheet_img = Image.open(os.path.join(repo, cfg['sheet'])).convert('RGB')
sheet = np.asarray(sheet_img).astype(int)
crops = cfg['crops']
rend = {v: Image.open(os.path.join(foe, 'build', f'render-{LV}-{v}.png')).convert('RGB') for v in ('front', 'side', 'back')}

# 1. compare: the sheet's views above the renders
H = sheet.shape[0]
cells = [sheet_img.crop((a, 0, b, H)) for a, b in crops]
rr = [rend[v].resize((int(rend[v].width * H / rend[v].height), H)) for v in ('front', 'side', 'back')]
cell = max(max(c.width for c in cells), max(r.width for r in rr))
img = Image.new('RGB', (cell * 3, H * 2), (128, 128, 128))
for i in range(3):
    img.paste(cells[i], (i * cell + (cell - cells[i].width) // 2, 0)); img.paste(rr[i], (i * cell + (cell - rr[i].width) // 2, H))
img.resize((img.width * 2 // 3, img.height * 2 // 3)).save(os.path.join(foe, 'build', f'compare-{LV}.png'))

# 2. outline: silhouettes, both scaled to the same height
def mask_sheet(a):
    bg = np.median(np.concatenate([a[:20].reshape(-1, 3), a[-20:].reshape(-1, 3)]), 0)
    return np.abs(a - bg).sum(2) > 40
def mask_rend(a): return np.abs(a - a[5, 5]).sum(2) > 25
def norm(m, Hh=600):
    ys, xs = np.nonzero(m); m = m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    im = Image.fromarray((m * 255).astype(np.uint8)).resize((max(1, int(m.shape[1] * Hh / m.shape[0])), Hh))
    return np.asarray(im) > 127
out = []
for i, v in enumerate(('front', 'side', 'back')):
    a = norm(mask_sheet(sheet[:, crops[i][0]:crops[i][1]])); b = norm(mask_rend(np.asarray(rend[v]).astype(int)))
    w = max(a.shape[1], b.shape[1]) + 40; c = np.full((640, w, 3), 255, np.uint8)
    for m, fill in ((a, (255, 215, 215)), (b, (200, 235, 250))):
        ox = (w - m.shape[1]) // 2; reg = c[20:20 + m.shape[0], ox:ox + m.shape[1]]
        reg[m] = (reg[m].astype(int) * np.array(fill) // 255).astype(np.uint8)
    for m, col in ((a, (220, 40, 40)), (b, (0, 120, 190))):
        ox = (w - m.shape[1]) // 2; e = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES)) > 60
        c[20:20 + m.shape[0], ox:ox + m.shape[1]][e] = col
    for y in range(20, 620, 60): c[y, :] = np.minimum(c[y, :], 230)
    out.append(c)
Image.fromarray(np.concatenate(out, 1)).save(os.path.join(foe, 'build', f'outline-{LV}.png'))
print('wrote', os.path.join(foe, 'build', f'compare-{LV}.png'), 'and', f'outline-{LV}.png')

# 3. outline at the sheet's own scale (session 7's idea): the render scaled by metres, not stretched to fit, so a body
#    too long or too short shows. The sheet's scale: its figure's height in pixels over foe.json height. Feet aligned,
#    centred across. -> build/outline-abs-LEVEL.png (and how much they overlap, 1 is perfect)
view = cfg.get('view', {}); width_m = view.get('width', cfg.get('height', 1.7) * 1.8)
out = []
for i, v in enumerate(('front', 'side', 'back')):
    sm = mask_sheet(sheet[:, crops[i][0]:crops[i][1]]); ys, xs = np.nonzero(sm)
    sm = sm[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    ppm = sm.shape[0] / cfg.get('height', 1.7)                       # sheet pixels a metre
    r = np.asarray(rend[v]).astype(int); rm = mask_rend(r)
    rppm = r.shape[1] / width_m                                      # render pixels a metre
    ys, xs = np.nonzero(rm); rm = rm[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    k = ppm / rppm
    rm = np.asarray(Image.fromarray((rm * 255).astype(np.uint8)).resize((max(1, int(rm.shape[1] * k)), max(1, int(rm.shape[0] * k))))) > 127
    Hh = max(sm.shape[0], rm.shape[0]) + 40; w = max(sm.shape[1], rm.shape[1]) + 40
    c = np.full((Hh, w, 3), 255, np.uint8); A = np.zeros((Hh, w), bool); B = np.zeros((Hh, w), bool)
    A[Hh - 20 - sm.shape[0]:Hh - 20, (w - sm.shape[1]) // 2:(w - sm.shape[1]) // 2 + sm.shape[1]] = sm
    B[Hh - 20 - rm.shape[0]:Hh - 20, (w - rm.shape[1]) // 2:(w - rm.shape[1]) // 2 + rm.shape[1]] = rm
    c[A & ~B] = (255, 200, 200); c[B & ~A] = (190, 228, 250); c[A & B] = (205, 200, 215)
    for m, col in ((A, (220, 40, 40)), (B, (0, 110, 190))):
        c[np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES)) > 60] = col
    print(v, 'overlap at the sheet\'s scale', round(float((A & B).sum() / max(1, (A | B).sum())), 3))
    out.append(c)
Hm = max(c.shape[0] for c in out)
Image.fromarray(np.concatenate([np.pad(c, ((Hm - c.shape[0], 0), (0, 8), (0, 0)), constant_values=255) for c in out], 1)).save(
    os.path.join(foe, 'build', f'outline-abs-{LV}.png'))
