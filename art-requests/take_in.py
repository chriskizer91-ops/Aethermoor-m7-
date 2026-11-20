#!/usr/bin/env python3
"""take_in.py: files the pictures Chris sends back (zips of the cards on aethermoor-art-requests.html) into the repo.

    python3 -I art-requests/take_in.py <zip or folder> ...

Each picture is checked against the cards (its file name must be a card's), opened to make sure it is a real picture,
and kept in art-in/3d/<section>/ as WebP at quality 92 (Chris keeps his PNGs; these are for building from). A second
try named like `metal-steel-2.png` is kept beside the first. Anything that isn't on a card is reported and left out.
Then art-requests/RECEIVED.md is written: what has come in, section by section, and what is still to come.
A zip is read without unpacking it to disk, and only pictures directly named like the cards are read from it.
"""
import io, json, os, re, sys, zipfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'art-in', '3d')
sys.path.insert(0, HERE)
import build_requests as BR  # noqa: E402  (its main() only runs when it is run itself)

Image.MAX_IMAGE_PIXELS = 64_000_000


def cards():
    """every card's file name -> (section folder, section title)"""
    out = {}
    for s, name, used, prompt in BR.gear_rows():
        out[name] = ('gear', 'A. The heroes\' gear')
    for n, *_ in BR.CREATURE_SKINS:
        out[n] = ('skins', 'B. The creatures\' skins')
    data = json.load(open(os.path.join(HERE, 'refs', 'creatures', 'data.json')))
    for k, v in data.items():
        if v['kind'] == 'humanoid':
            continue
        big = v['tier'] in ('champion', 'relic-bearer')
        out[f'sheet-{k}.png'] = ('sheets', 'C. Model sheets: the Champions and Relic-Bearers' if big else 'D. Model sheets: the other beasts')
    for region, items in BR.WORLD:
        for n, _ in items:
            out[n] = ('world', 'E. The world')
    return out


def stem(name):
    return re.sub(r'\.(png|jpe?g|webp)$', '', name, flags=re.I)


def take(name, data, CARDS, report):
    base = os.path.basename(name)
    m = re.match(r'^(.*?)(-\d+)?\.(png|jpe?g|webp)$', base, re.I)
    if not m:
        return
    card = next((c for c in CARDS if stem(c) == m.group(1)), None)
    if not card:
        report['unknown'].append(base)
        return
    try:
        im = Image.open(io.BytesIO(data)); im.load()
    except Exception as e:  # not a picture, or a broken one
        report['broken'].append(f'{base} ({e})')
        return
    folder = os.path.join(OUT, CARDS[card][0]); os.makedirs(folder, exist_ok=True)
    keep = im if im.mode in ('RGB', 'RGBA') else im.convert('RGBA' if 'A' in im.mode else 'RGB')
    dest = os.path.join(folder, m.group(1) + (m.group(2) or '') + '.webp')
    keep.save(dest, 'WEBP', quality=92, method=6)
    report['kept'].append((base, im.size))


def received(CARDS):
    have = set()
    for sec in ('gear', 'skins', 'sheets', 'world'):
        d = os.path.join(OUT, sec)
        if os.path.isdir(d):
            have |= {re.sub(r'-\d+$', '', f[:-5]) for f in os.listdir(d) if f.endswith('.webp')}
    by = {}
    for c, (sec, title) in CARDS.items():
        by.setdefault(title, ([], []))[0 if stem(c) in have else 1].append(c)
    lines = ['# What has come in', '', 'Written by `take_in.py` each time a zip is filed. The pictures are in `art-in/3d/`.', '']
    total_in = sum(len(a) for a, _ in by.values()); total = len(CARDS)
    lines.append(f'**{total_in} of {total}** pictures are in.')
    lines.append('')
    for title in sorted(by):
        got, miss = by[title]
        lines.append(f'## {title}: {len(got)} of {len(got) + len(miss)}')
        lines.append('')
        if miss:
            lines.append('Still to come: ' + ', '.join(f'`{c}`' for c in sorted(miss)))
        else:
            lines.append('All in.')
        lines.append('')
    open(os.path.join(HERE, 'RECEIVED.md'), 'w', encoding='utf-8').write('\n'.join(lines))
    return total_in, total


def main(paths):
    CARDS = cards()
    report = {'kept': [], 'unknown': [], 'broken': []}
    for p in paths:
        if os.path.isdir(p):
            for f in sorted(os.listdir(p)):
                fp = os.path.join(p, f)
                if os.path.isfile(fp):
                    take(f, open(fp, 'rb').read(), CARDS, report)
        else:
            with zipfile.ZipFile(p) as z:
                for i in z.infolist():
                    if i.is_dir() or os.path.basename(i.filename).startswith('.') or i.file_size > 80_000_000:
                        continue
                    take(i.filename, z.read(i), CARDS, report)
    n, total = received(CARDS)
    print(f"kept {len(report['kept'])}; not on a card: {report['unknown'] or 'none'}; broken: {report['broken'] or 'none'}")
    print(f'{n} of {total} pictures are in (art-requests/RECEIVED.md)')


if __name__ == '__main__':
    main(sys.argv[1:])
