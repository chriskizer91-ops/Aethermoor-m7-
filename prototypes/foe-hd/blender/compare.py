# Put renders under the matching thirds of Chris's sheet: python3 compare.py PREFIX OUT.png
import sys
from PIL import Image
pre, out = sys.argv[1], sys.argv[2]
sheet = Image.open('/home/user/Aethermoor-m7-/art-in/3d/sheets/sheet-briarmaw.webp').convert('RGB')
W, H = sheet.size; w3 = W // 3
crops = [sheet.crop((a, 0, b, H)) for a, b in [(0, 600), (600, 1530), (1560, 2172)]]
rend = [Image.open(f'{pre}-{v}.png').convert('RGB') for v in ('front', 'side', 'back')]
th = H
rend = [r.resize((int(r.width * th / r.height), th)) for r in rend]
cw = max(c.width for c in crops); rw = max(r.width for r in rend)
cell = max(cw, rw)
img = Image.new('RGB', (cell * 3, H * 2), (128, 128, 128))
for i in range(3):
    img.paste(crops[i], (i * cell + (cell - crops[i].width) // 2, 0))
    img.paste(rend[i], (i * cell + (cell - rend[i].width) // 2, H))
img = img.resize((img.width * 2 // 3, img.height * 2 // 3))
img.save(out)
