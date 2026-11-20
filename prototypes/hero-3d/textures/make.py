#!/usr/bin/env python3
"""Web copies of Chris's gear textures for the 3D heroes (art-in/3d/gear/, read only).

Each material picture becomes a small grey "grain" picture: the hero code tints it with the item's own colour from the
game's palettes (art/forge.js MAT), so a gold sword and a voidiron one still differ. Steps, per picture:
  - made seamless (the edges blended with a half-shifted copy, so the tile repeats without a line);
  - long grain turned to run up and down (oak, bogwood, brushed steel), the way the hero code lays it along hafts and blades;
  - the big blotches softened (they would show as a pattern when the tile repeats);
  - the contrast set per kind (metal subtle, mail and wicker strong);
  - saved at 512 px (WebP).
The four faces stay in colour (512 px). Writes web/*.webp and pack.js (the pictures as data URLs, with each one's
average brightness, so the tint keeps the palette's own brightness).

    python3 make.py            # from anywhere
"""
import base64, io, json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, '../../../art-in/3d/gear'))
OUT = os.path.join(HERE, 'web')
SIZE = 512

ROTATE = {'wood-oak', 'wood-bogwood', 'metal-steel'}
# target spread of brightness (0..1 sRGB) per kind; patterns keep theirs
STD = {'metal': 0.075, 'mail': 0.2, 'leather': 0.11, 'cloth': 0.11, 'wood': 0.13, 'stone': 0.13, 'bone': 0.09,
       'hide': 0.12, 'horn': 0.13, 'skin': 0.04, 'hair': 0.14}
KEEP = {'cloth-brocade', 'cloth-embroidery-band', 'metal-filigree', 'metal-hearth-sun', 'metal-engraved-steel',
        'metal-etched-runes', 'leather-tooled', 'leather-stitched', 'wood-wicker', 'wood-planks', 'mail-brigandine',
        'leather-wrap'}
PATTERN_STD = 0.16
FACES = ['face-wren', 'face-pip', 'face-bryn', 'face-alondra']


def blur_wrap(a, sigma):
    """Gaussian blur that wraps round the edges (the picture is a tile)."""
    h, w = a.shape
    fy = np.fft.fftfreq(h)[:, None]; fx = np.fft.fftfreq(w)[None, :]
    k = np.exp(-2 * (np.pi ** 2) * (sigma ** 2) * (fx ** 2 + fy ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * k))


def seamless(a, band=0.12):
    """Blend each edge with the half-shifted picture, whose middle joins up across the tile's edges."""
    h, w = a.shape[:2]
    rolled = np.roll(np.roll(a, h // 2, axis=0), w // 2, axis=1)
    def ramp(n):
        d = np.minimum(np.arange(n), n - 1 - np.arange(n)) / (n * band)
        t = np.clip(d, 0, 1); return t * t * (3 - 2 * t)
    wy = ramp(h)[:, None]; wx = ramp(w)[None, :]
    m = np.minimum(wy, wx)
    if a.ndim == 3: m = m[..., None]
    return a * m + rolled * (1 - m)


def kind_of(name):
    return name.split('-')[0]


def grain(name):
    im = Image.open(os.path.join(SRC, name + '.webp'))
    if im.mode == 'RGBA':  # hair strands on a clear ground: lay them on their own middle tone
        rgba = np.asarray(im, dtype=np.float64) / 255
        al = rgba[..., 3:4]; mid = (rgba[..., :3] * al).sum((0, 1)) / max(al.sum(), 1)
        rgb = rgba[..., :3] * al + mid * (1 - al)
    else:
        rgb = np.asarray(im.convert('RGB'), dtype=np.float64) / 255
    L = rgb @ np.array([0.299, 0.587, 0.114])
    if name in ROTATE: L = np.rot90(L)
    L = seamless(L)
    mean = L.mean()
    # soften the big blotches (they would repeat as a pattern), keeping a little of them
    lo = blur_wrap(L, L.shape[0] / 10)
    L = L - (lo - mean) * (0.45 if name in KEEP else 0.75)
    target = PATTERN_STD if name in KEEP else STD.get(kind_of(name), 0.12)
    L = mean + (L - mean) * (target / max(L.std(), 1e-6))
    # sit the picture round a bright middle so the tint (colour / average) never has to push far
    centre = 0.62
    L = np.clip(L - mean + centre, 0, 1)
    img = Image.fromarray((L * 255 + 0.5).astype(np.uint8), 'L').resize((SIZE, SIZE), Image.LANCZOS)
    return img


def lin_mean(img):
    a = np.asarray(img, dtype=np.float64) / 255
    lin = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    return float(lin.mean())


def face(name):
    im = Image.open(os.path.join(SRC, name + '.webp')).convert('RGB').resize((SIZE, SIZE), Image.LANCZOS)
    a = np.asarray(im, dtype=np.float64)
    # the plain skin round the face: the chin row and the lower corners, where the pictures are bare skin
    patch = np.concatenate([a[int(SIZE * .9):int(SIZE * .97), int(SIZE * .25):int(SIZE * .75)].reshape(-1, 3),
                            a[int(SIZE * .75):int(SIZE * .95), int(SIZE * .03):int(SIZE * .12)].reshape(-1, 3),
                            a[int(SIZE * .75):int(SIZE * .95), int(SIZE * .88):int(SIZE * .97)].reshape(-1, 3)])
    skin = [int(v) for v in np.median(patch, axis=0)]
    return im, skin


def webp(img, q):
    b = io.BytesIO(); img.save(b, 'WEBP', quality=q, method=6); return b.getvalue()


def main():
    os.makedirs(OUT, exist_ok=True)
    pack, faces, total = {}, {}, 0
    names = sorted(f[:-5] for f in os.listdir(SRC) if f.endswith('.webp'))
    for n in names:
        if n in FACES:
            img, skin = face(n); data = webp(img, 84)
            faces[n[5:]] = {'url': 'data:image/webp;base64,' + base64.b64encode(data).decode(), 'skin': skin}
        else:
            img = grain(n); data = webp(img, 78)
            pack[n] = {'url': 'data:image/webp;base64,' + base64.b64encode(data).decode(), 'mean': round(lin_mean(img), 4)}
        open(os.path.join(OUT, n + '.webp'), 'wb').write(data)
        total += len(data)
    js = ('// Made by make.py from Chris\'s gear textures (art-in/3d/gear/): grey grain pictures tinted in code by each\n'
          '// item\'s own palette (mean: average linear brightness), and the four faces in colour (skin: the bare skin round them).\n'
          '// Do not edit by hand: run python3 make.py.\n'
          'export const PACK = ' + json.dumps(pack, separators=(',', ':')) + ';\n'
          'export const FACES = ' + json.dumps(faces, separators=(',', ':')) + ';\n')
    open(os.path.join(HERE, 'pack.js'), 'w').write(js)
    print(f'{len(pack)} grains + {len(faces)} faces: {total / 1024:.0f} KB of WebP, pack.js {len(js) / 1024:.0f} KB')


if __name__ == '__main__':
    main()
