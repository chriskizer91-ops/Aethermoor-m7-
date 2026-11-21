# grid.py (Places, step 5): a place's painting with its tile grid and numbers on, to read where the small things stand
#   python3 -I m7/grid.py <id> <tilesW> <tilesH> [scale] [x0 y0 x1 y1 tiles]  -> .cache/grid/<id>[-part].jpg
import sys, os
from PIL import Image, ImageDraw, ImageFont
here = os.path.dirname(os.path.abspath(__file__))
pid, tw, th = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
sc = float(sys.argv[4]) if len(sys.argv) > 4 else 1.5
im = Image.open(os.path.join(here, '..', 'coven', 'art', 'm7', pid + '.webp')).convert('RGB')
cw, ch = im.width / tw, im.height / th
box = [int(v) for v in sys.argv[5:9]] if len(sys.argv) > 8 else [0, 0, tw, th]
im = im.crop((int(box[0] * cw), int(box[1] * ch), int(box[2] * cw), int(box[3] * ch)))
im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
g = ImageDraw.Draw(im); cw, ch = cw * sc, ch * sc
try: f = ImageFont.truetype('DejaVuSans-Bold.ttf', max(9, int(cw / 3.2)))
except Exception: f = ImageFont.load_default()
for i in range(box[2] - box[0] + 1):
    g.line([(i * cw, 0), (i * cw, im.height)], fill=(255, 255, 255), width=1)
for j in range(box[3] - box[1] + 1):
    g.line([(0, j * ch), (im.width, j * ch)], fill=(255, 255, 255), width=1)
for j in range(box[3] - box[1]):
    for i in range(box[2] - box[0]):
        if (i + box[0]) % 2 == 0 and (j + box[1]) % 2 == 0:
            t = f'{i + box[0]},{j + box[1]}'; x, y = i * cw + 2, j * ch + 1
            g.text((x + 1, y + 1), t, fill=(0, 0, 0), font=f); g.text((x, y), t, fill=(255, 255, 80), font=f)
os.makedirs('.cache/grid', exist_ok=True)
out = f'.cache/grid/{pid}' + ('' if len(sys.argv) <= 8 else '-' + '-'.join(sys.argv[5:9])) + '.jpg'
im.save(out, quality=82); print(out, im.size)
