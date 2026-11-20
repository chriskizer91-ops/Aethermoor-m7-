#!/usr/bin/env python3
"""Cut Chris's model sheets (art-in/3d/sheets/, read only) into painted standees: each sheet's three views (front, side,
back) with the plain background taken away, for creatures stood in 3D as camera-facing paintings (the HD-2D way).

  - the background: flood fill from the edges, every pixel within TOL (RGB distance) of the border's median colour;
    the edge of what's left is eroded 1 px and softened, so no grey fringe;
  - the views: split on empty columns (the widest gaps), then each trimmed to its own box; the three share one scale
    and stand on one ground line (the lowest foot of the three), so turning between them doesn't jump;
  - web copies: HEIGHT px tall WebP with alpha (web/<key>-front.webp ...), and pack.js with each view's size and where
    its feet are.

    python3 cut.py            # all sheets
    python3 cut.py thornhound briarmaw
"""
import base64, io, json, os, sys
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, '../../../art-in/3d/sheets'))
OUT = os.path.join(HERE, 'web')
TOL, HEIGHT, Q = 26, 400, 80


def mask_of(rgb):
    h, w, _ = rgb.shape
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    near = np.sqrt(((rgb.astype(np.float32) - bg) ** 2).sum(-1)) < TOL
    seen = np.zeros((h, w), bool); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; q.append((ny, nx))
    # background shut inside the creature (a tail curled into a loop): large patches very close to the border colour
    tight = np.sqrt(((rgb.astype(np.float32) - bg) ** 2).sum(-1)) < TOL * 0.55
    hole = tight & ~seen; lab = np.zeros((h, w), np.int32); n = 0
    for y0, x0 in zip(*np.nonzero(hole)):
        if lab[y0, x0]: continue
        n += 1; lab[y0, x0] = n; q = deque([(y0, x0)]); cells = [(y0, x0)]
        while q:
            y, x = q.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and hole[ny, nx] and not lab[ny, nx]: lab[ny, nx] = n; q.append((ny, nx)); cells.append((ny, nx))
        if len(cells) > h * w * 0.0015:
            ys, xs = zip(*cells); seen[list(ys), list(xs)] = True
    fg = ~seen
    # drop specks: keep only what's bigger than a few pixels (a crude open)
    m = Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))  # erode 1 px and soften
    return np.asarray(m), bg


def split(alpha, n=3):
    cols = (alpha > 128).sum(0) > 0
    runs, start = [], None
    for x, c in enumerate(cols):
        if c and start is None: start = x
        if not c and start is not None: runs.append([start, x]); start = None
    if start is not None: runs.append([start, len(cols)])
    # join runs until n are left, closing the narrowest gaps first (an antler tip or a tail can stand apart)
    while len(runs) > n:
        gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
        i = int(np.argmin(gaps)); runs[i] = [runs[i][0], runs[i + 1][1]]; del runs[i + 1]
    return runs


def cut(key):
    im = Image.open(os.path.join(SRC, f'sheet-{key}.webp')).convert('RGB')
    rgb = np.asarray(im)
    alpha, bg = mask_of(rgb)
    runs = split(alpha)
    if len(runs) != 3: raise RuntimeError(f'{key}: {len(runs)} views')
    boxes = []
    for x0, x1 in runs:
        rows = np.where((alpha[:, x0:x1] > 128).sum(1) > 0)[0]
        boxes.append((x0, rows[0], x1, rows[-1] + 1))
    top = min(b[1] for b in boxes); ground = max(b[3] for b in boxes)
    k = HEIGHT / (ground - top)
    rgba = np.dstack([rgb, alpha])
    views = {}
    for name, (x0, y0, x1, y1) in zip(['front', 'side', 'back'], boxes):
        pad = 4
        x0, x1 = max(0, x0 - pad), min(rgb.shape[1], x1 + pad)
        crop = Image.fromarray(rgba[top:ground, x0:x1], 'RGBA')
        w = max(8, round(crop.width * k)); crop = crop.resize((w, HEIGHT), Image.LANCZOS)
        # the background colour under soft edges would show as a fringe: pull edge colours toward the inside
        a = np.asarray(crop).astype(np.float32); al = a[..., 3:4] / 255
        b = io.BytesIO(); crop.save(b, 'WEBP', quality=Q, method=6, exact=False); data = b.getvalue()
        open(os.path.join(OUT, f'{key}-{name}.webp'), 'wb').write(data)
        views[name] = {'url': 'data:image/webp;base64,' + base64.b64encode(data).decode(), 'w': w, 'h': HEIGHT,
                       'cx': round(((x0 + x1) / 2 - x0) * k / w, 3)}
    return views, sum(len(base64.b64decode(v['url'].split(',')[1])) for v in views.values())


def main():
    os.makedirs(OUT, exist_ok=True)
    keys = sys.argv[1:] or sorted(f[6:-5] for f in os.listdir(SRC) if f.startswith('sheet-'))
    packf = os.path.join(HERE, 'pack.js'); pack = {}
    if os.path.exists(packf) and sys.argv[1:]:
        pack = json.loads(open(packf).read().split('export const STANDEES = ', 1)[1].rstrip().rstrip(';'))
    total = 0
    for key in keys:
        try: v, n = cut(key)
        except Exception as e: print('SKIP', e); continue
        pack[key] = v; total += n; print(f'{key}: {n // 1024} KB', ' '.join(f"{k}:{x['w']}" for k, x in v.items()))
    open(packf, 'w').write("// Made by cut.py from Chris's model sheets (art-in/3d/sheets/). Do not edit by hand.\nexport const STANDEES = " + json.dumps(pack, separators=(',', ':')) + ';\n')
    print(f'{len(keys)} sheets, {total // 1024} KB this run; pack.js {os.path.getsize(packf) // 1024} KB')


if __name__ == '__main__':
    main()
