# paint.py (Places, step 6): an arena's painting, from a job on stdin (m7/arenas/make.mjs). Each arena tile is copied from
# a tile of the same kind in one of the source places' paintings (32 px a tile), preferring tiles whose neighbours are
# the same kind (the middle of a lawn, not its edge), pasted a little larger than a tile with a soft edge so the
# patches blend. job.alias maps a kind to another when no source has it (e.g. a cliff painted as rock).
import sys, json, random
from PIL import Image, ImageFilter

job = json.load(sys.stdin)
T = 32; N = job['N']; rows = job['rows']; rnd = random.Random(job['seed'])
srcs = []
for s in job['sources']:
    im = Image.open(s['paint']).convert('RGB')
    if im.size != (s['w'] * T, s['h'] * T): im = im.resize((s['w'] * T, s['h'] * T), Image.LANCZOS)
    srcs.append((s, im))
# every source tile by kind: deep (all 8 neighbours alike) and any
deep, anyk = {}, {}
for si, (s, im) in enumerate(srcs):
    R = s['rows']
    for j in range(s['h']):
        for i in range(s['w']):
            c = R[j][i]
            anyk.setdefault(c, []).append((si, i, j))
            if 0 < i < s['w'] - 1 and 0 < j < s['h'] - 1 and all(R[j + b][i + a] == c for a in (-1, 0, 1) for b in (-1, 0, 1)):
                deep.setdefault(c, []).append((si, i, j))
alias = job.get('alias', {})
def source_for(c):
    for k in [c, alias.get(c)] + list(alias.get('*', '')):
        if k and (deep.get(k) or anyk.get(k)): return rnd.choice(deep.get(k) or anyk.get(k))
    k = max(anyk, key=lambda q: len(anyk[q])); return rnd.choice(deep.get(k) or anyk[k])
M = 10   # soft margin, px
mask = Image.new('L', (T + 2 * M, T + 2 * M), 0); mask.paste(255, (M // 2, M // 2, T + M + M // 2, T + M + M // 2)); mask = mask.filter(ImageFilter.GaussianBlur(M / 2.5))
out = Image.new('RGB', (N * T, N * T))
# first pass hard (no gaps), second pass soft on top in a shuffled order
cells = [(i, j) for j in range(N) for i in range(N)]
picks = {(i, j): source_for(rows[j][i]) for (i, j) in cells}
for (i, j) in cells:
    si, a, b = picks[(i, j)]; out.paste(srcs[si][1].crop((a * T, b * T, a * T + T, b * T + T)), (i * T, j * T))
rnd.shuffle(cells)
for (i, j) in cells:
    si, a, b = picks[(i, j)]; im = srcs[si][1]
    box = (a * T - M, b * T - M, a * T + T + M, b * T + T + M)
    if box[0] < 0 or box[1] < 0 or box[2] > im.width or box[3] > im.height: continue
    out.paste(im.crop(box), (i * T - M, j * T - M), mask)
out.save(job['out'], quality=88, method=6)
