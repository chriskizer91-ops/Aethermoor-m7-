# mark.py (Places, step 5): draw a dressing list back onto its painting, to check every thing sits where the painting has it
#   python3 -I m7/mark.py <id> <tilesW> <tilesH> <list.json> [scale]   (list.json: { "<id>": [[kind, x, y, ...], ...] })
#   -> .cache/grid/<id>-marked.jpg
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
here = os.path.dirname(os.path.abspath(__file__))
pid, tw, th, lf = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
sc = float(sys.argv[5]) if len(sys.argv) > 5 else 1.5
items = json.load(open(lf)).get(pid, [])
im = Image.open(os.path.join(here, '..', 'coven', 'art', 'm7', pid + '.webp')).convert('RGB')
im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
cw, ch = im.width / tw, im.height / th
g = ImageDraw.Draw(im)
try: f = ImageFont.truetype('DejaVuSans-Bold.ttf', max(10, int(cw / 3.6)))
except Exception: f = ImageFont.load_default()
for e in items:
    k = e[0]
    if k in ('fence', 'pickets'):
        g.line([(e[1] * cw, e[2] * ch), (e[3] * cw, e[4] * ch)], fill=(255, 60, 200), width=3)
        x, y = e[1] * cw, e[2] * ch
    else:
        x, y = e[1] * cw, e[2] * ch
        g.ellipse([x - 5, y - 5, x + 5, y + 5], outline=(255, 60, 200), width=3)
    g.text((x + 7, y - 7), k, fill=(0, 0, 0), font=f, stroke_width=2, stroke_fill=(255, 255, 255))
os.makedirs('.cache/grid', exist_ok=True)
out = f'.cache/grid/{pid}-marked.jpg'; im.save(out, quality=82); print(out, im.size, len(items), 'things')
