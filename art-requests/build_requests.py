#!/usr/bin/env python3
"""build_requests.py: writes art-requests/aethermoor-art-requests.html, one self-contained page with every picture
Chris is asked to make for the 3D game: how to make and send them, then each request with its prompt (a Copy button),
its file name, its reference pictures (Save buttons) and a colour palette.

    python3 art-requests/build_requests.py

Reads: art-requests/texture-pack-gear.md (the gear's textures), art-requests/refs/creatures/ (each foe's sprite, its 3D
model and data.json, made from the Bestiary), art-requests/refs/shots/ (screenshots of the 3D work so far).
"""
import base64, html, json, os, re
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REFS = os.path.join(HERE, 'refs')
OUT = os.path.join(HERE, 'aethermoor-art-requests.html')

STYLE_TEX = ('Seamless tileable texture, square, seen straight on with flat even lighting and no cast shadows, no '
             'perspective, evenly busy across the whole frame with no focal point, edges that wrap. Hand-painted stylized '
             'fantasy, rich and crafted like a high-end storybook JRPG, fine detail that still reads from a distance.')
STYLE_SHEET = ('Character model sheet for a 3D modeller: the same creature shown three times side by side at the same '
               'size, front view, side view (facing right) and back view, standing on nothing, on a plain flat warm-grey '
               'background, even studio light, no shadows on the background, no text, no frames. Hand-painted stylized '
               'fantasy in the style of a storybook JRPG, clear readable shapes, its colours as in the attached sprite.')


def data_url(path, mime=None):
    mime = mime or ('image/png' if path.endswith('.png') else 'image/jpeg')
    return f'data:{mime};base64,' + base64.b64encode(open(path, 'rb').read()).decode()


def palette(path):
    """five colours from a sprite: dark, body, light, a second colour, and its brightest glow"""
    im = Image.open(path).convert('RGBA')
    px = [p[:3] for p in im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata() if p[3] > 200] or [(128, 128, 128)]
    lum = lambda c: c[0] * .3 + c[1] * .59 + c[2] * .11
    sat = lambda c: (max(c) - min(c)) / (max(c) + 1)
    px.sort(key=lum)
    def avg(a, b):
        L = px[int(len(px) * a):max(int(len(px) * a) + 1, int(len(px) * b))]
        return tuple(int(sum(c[k] for c in L) / len(L)) for k in range(3))
    out = [avg(.05, .25), avg(.3, .7), avg(.78, .97)]
    import colorsys
    bins = {}
    for c in px:
        if sat(c) > .25 and lum(c) > 40:
            h = int(colorsys.rgb_to_hsv(*[v / 255 for v in c])[0] * 12) % 12
            bins.setdefault(h, []).append(c)
    if bins:
        h, L = max(bins.items(), key=lambda kv: len(kv[1]))
        out.append(tuple(int(sum(c[k] for c in L) / len(L)) for k in range(3)))
    glow = max(px, key=lambda c: sat(c) * lum(c) if lum(c) > 150 else 0)
    if lum(glow) > 150 and sat(glow) > .4:
        out.append(glow)
    return ['#%02x%02x%02x' % c for c in out]


def gear_rows():
    md = open(os.path.join(HERE, 'texture-pack-gear.md'), encoding='utf-8').read()
    rows, section = [], None
    for line in md.splitlines():
        m = re.match(r'## \d+\. (.+?) \(', line)
        if m:
            section = m.group(1)
        m = re.match(r'\| `([^`]+)` \| ([^|]+) \| (.+) \|$', line)
        if m:
            name, used, prompt = m.groups()
            prompt = prompt.strip().replace(' + style', '')
            if 'flat face texture' not in prompt and 'face texture laid flat' not in prompt and section != 'Their looks':
                prompt += ' ' + STYLE_TEX
            elif name.startswith(('hair', 'skin')):
                prompt += ' ' + STYLE_TEX
            rows.append((section, name, used.strip(), prompt))
    return rows


CREATURE_SKINS = [
    ('skin-thorn-hide.png', 'Briarmaw, the thornhounds, the briarlings', 'Dark green-brown beast hide grown through with brambles: short thorns and small leaves sprouting from the skin, burrs matted in.', ['#2c3020', '#4a5232', '#7c8a4a', '#9a6a3a']),
    ('skin-wolf-fur.png', 'rime wolves, thornhounds', 'Short dense grey wolf fur combed one way, frost caught in the tips.', ['#3a3e48', '#6a7080', '#b4bccb', '#e8f0ff']),
    ('skin-boar-hide.png', 'Old Snag', 'Coarse bristly boar hide, dark brown, with scars and patches of moss.', ['#2a1e16', '#5a4030', '#8a6a4a', '#5a7a3a']),
    ('skin-glass-shell.png', 'the glass scorpions, Kharzul', 'Cloudy amber glass shell in overlapping plates, sand-scoured, warm light inside it.', ['#5a3a12', '#c88a3a', '#f4d48a', '#fff4c8']),
    ('skin-frog.png', 'Gorrow the Mire-King, the boglurchers', 'Wet green frog skin with darker spots, warts and a sheen of slime.', ['#1e3a1a', '#3a6a2a', '#7aa04a', '#d8c86a']),
    ('skin-bark-sap.png', 'sapwights, the Rotwarden, the willow-wights', 'Old dark bark with black sap oozing in the cracks and moss in the hollows.', ['#1a140e', '#3a2a1a', '#5e4a30', '#3a5a2a']),
    ('skin-mossy-stone.png', 'peak-trolls, rocklings, Old Horn', 'Grey-green stone like a mossed boulder, lichen spots and cracks.', ['#2a2e28', '#56604e', '#8a947a', '#5a7a3a']),
    ('skin-riveted-iron.png', 'iron sentinels, the Sentinel-Captain, the Ashen Warden', 'Dark dwarven iron plates held by rows of round rivets, soot and wear on the edges.', ['#1e2028', '#464a58', '#8a90a0', '#c8862a']),
    ('skin-ember-slag.png', 'forgeborn, the Bellows, cinder-thralls, Mother Anvil', 'Black cooled slag cracked all over, molten orange glowing in the cracks.', ['#141010', '#3a2a24', '#ff8a2a', '#ffd06a']),
    ('skin-rotted-robe.png', 'rime-wraiths, the Rime-Abbot, the drowned', 'Old monk\'s robe cloth, grey-blue, rotted and frayed, wet, with frost and water stains.', ['#1e262e', '#3e4e5e', '#7a8c9c', '#c8e0f0']),
    ('skin-river-weed.png', 'the drowned of Misthollow', 'Tangled dark green river weed hanging in strands, wet.', ['#0e1e18', '#1e3a2a', '#3a6a4a', '#7aa07a']),
    ('skin-feathers.png', 'the Thunder-Roc', 'Overlapping dark slate-blue feathers with paler edges, storm-grey.', ['#141824', '#2e3a5a', '#5a6a9a', '#e8e8ff']),
    ('skin-moth-wing.png', 'the Gloamwing, lamp-moths', 'Soft moth wing scales, pale dusty cream with brown eye-spots and fine veins.', ['#4a3e30', '#9a8a70', '#e0d4b8', '#6a4a2a']),
    ('skin-fish-scale.png', 'blackwater gars, Old Jaws, the Leviathan', 'Armoured fish scales, dark olive-green and black, slick and wet.', ['#0e1610', '#2a3a28', '#5a7a4a', '#a8c08a']),
    ('skin-leech-grub.png', 'mire leeches, rotgrubs', 'Soft ringed grub skin, pale and glistening, faint darker bands.', ['#5a4a3a', '#a89070', '#e0d0b0', '#8a6a4a']),
    ('skin-mushroom-cap.png', 'glowcaps', 'The top of a toadstool cap, rosy brown with pale glowing spots.', ['#4a2a2a', '#9a5a50', '#d8a090', '#f4f0a0']),
]

WORLD = [
    ('Hearthstone Keep', [
        ('keep_wall_hearthstone.png', 'The Keep\'s great walls: big pale grey-gold dressed stone blocks, weathered, with warm hearth-light stains.'),
        ('keep_floor_flags.png', 'The Keep\'s hall floor: worn flagstones, warm grey, with old carved hearth-sun marks in a few.'),
        ('keep_banner_red.png', 'A red wool banner cloth with a gold embroidered hearth-flame, seen flat (repeats across).'),
        ('keep_roof_slate.png', 'Dark blue-grey slate roof tiles in rows, mossy at the edges.'),
    ]),
    ('The Sunscorch (the eastern desert)', [
        ('sun_sandstone_wall.png', 'Desert town walls of sun-baked sandstone blocks, red-gold, wind-scoured.'),
        ('sun_adobe_plaster.png', 'Cracked adobe plaster wall, pale ochre, with patches where the mud bricks show.'),
        ('sun_sand_ground.png', 'Desert sand with fine wind ripples and scattered pebbles.'),
        ('sun_glass_flats.png', 'Ground of fused desert glass: cracked, glossy, amber and green, like a frozen lake of glass.'),
        ('sun_awning_canvas.png', 'Faded striped desert awning cloth, terracotta and cream.'),
    ]),
    ('The Ironspire (the northern mountains)', [
        ('iron_dwarf_stone.png', 'Dwarven hall stone: dark granite blocks cut perfectly square with geometric carved bands.'),
        ('iron_snow_ground.png', 'Packed snow on a mountain path with footprints and scattered grit.'),
        ('iron_ice_lake.png', 'Frozen lake ice seen from above, blue-white with cracks and trapped bubbles.'),
        ('iron_forge_brick.png', 'Forge firebrick: dark red bricks blackened with soot, warm glow in the joints.'),
    ]),
    ('The Gloomfen (the southern marsh)', [
        ('gloom_boardwalk_old.png', 'An old marsh boardwalk seen from above: grey rotting planks, some missing, moss and fungus.'),
        ('gloom_bog_water.png', 'Still black bog water with duckweed and fallen leaves on its surface.'),
        ('gloom_stilt_wood.png', 'Swollen dark timber of stilt houses, green with algae near the waterline.'),
    ]),
    ('Gaps in the borrowed Verdant Wilds', [
        ('shared_bough_birch.webp', 'A spray of silver birch leaves on thin twigs, for a tree\'s canopy, on a transparent background if possible.'),
        ('shared_bough_fir_snow.webp', 'A fir bough heavy with snow, for a snowy tree\'s canopy, on a transparent background if possible.'),
        ('shared_stone_wall_frosted_b.webp', 'Rough stone wall with frost in every joint and a dusting of snow on the ledges.'),
    ]),
]


def card(name, used, prompt, refs=(), swatches=(), optional=False, note=''):
    rid = re.sub(r'[^a-z0-9]', '-', name.lower())
    ref_html = ''.join(f'<figure><img src="{u}" alt="{html.escape(cap)}"><figcaption>{html.escape(cap)}<a class="save" download="ref-{rid}-{i}.{"png" if u.startswith("data:image/png") else "jpg"}" href="{u}">Save</a></figcaption></figure>' for i, (u, cap) in enumerate(refs))
    sw = ''.join(f'<span class="sw" style="background:{c}" title="{c}"></span><code>{c}</code>' for c in swatches)
    return f'''<article class="card{' opt' if optional else ''}" id="{rid}">
<header><b class="file">{html.escape(name)}</b>{'<span class="tag">optional</span>' if optional else ''}<label><input type="checkbox" class="done"> made</label></header>
<p class="used">For: {html.escape(used)}</p>{f'<p class="note">{html.escape(note)}</p>' if note else ''}
{f'<div class="refs">{ref_html}</div>' if ref_html else ''}{f'<div class="pal">{sw}</div>' if sw else ''}
<div class="prompt"><p>{html.escape(prompt)}</p><button class="copy" type="button">Copy the prompt</button></div>
</article>'''


def main():
    parts, counts = [], {}
    shots = {f: data_url(os.path.join(REFS, 'shots', f)) for f in sorted(os.listdir(os.path.join(REFS, 'shots')))}
    data = json.load(open(os.path.join(REFS, 'creatures', 'data.json')))
    cref = lambda k: [(data_url(os.path.join(REFS, 'creatures', f'{k}-sprite.png')), 'the game\'s sprite'), (data_url(os.path.join(REFS, 'creatures', f'{k}-3d.jpg')), 'its 3D model so far')]

    # A. the gear
    sec = []
    rows = gear_rows()
    for i, (s, name, used, prompt) in enumerate(rows):
        refs = [(shots['weapons-sheet.jpg'], 'the weapons in 3D so far')] if s in ('Metals', 'Mail and scale') and i % 4 == 0 else []
        sec.append(card(name, used, prompt, refs, optional=s == 'Their looks'))
    counts['A'] = len(rows)
    parts.append(('A', 'The heroes\' gear: textures for weapons, armour and their looks', f'''Seamless squares of material the code wraps round every item: one "oak" covers every wooden haft. Start with the metals, mail and leather.
<div class="refs wide"><figure><img src="{shots['gear-room-wren.jpg']}" alt=""><figcaption>The Gear Room now: every surface is made by code<a class="save" download="ref-gear-room.jpg" href="{shots['gear-room-wren.jpg']}">Save</a></figcaption></figure><figure><img src="{shots['gear-room-party.jpg']}" alt=""><figcaption>The party<a class="save" download="ref-party.jpg" href="{shots['gear-room-party.jpg']}">Save</a></figcaption></figure></div>''', sec))

    # B. creature skins
    sec = [card(n, u, d + ' ' + STYLE_TEX, swatches=p) for n, u, d, p in CREATURE_SKINS]
    counts['B'] = len(sec)
    parts.append(('B', 'The creatures\' skins', f'''Seamless squares again: the hides, shells, robes and scales the 3D creatures are made of. Each one serves several creatures.
<div class="refs wide"><figure><img src="{shots['beast-sprites.jpg']}" alt=""><figcaption>The beasts as the game draws them<a class="save" download="ref-beasts.jpg" href="{shots['beast-sprites.jpg']}">Save</a></figcaption></figure></div>''', sec))

    # C. model sheets for the Champions and Relic-Bearers; D. the rest, optional
    order = {'champion': 0, 'relic-bearer': 1, 'veteran': 2, 'rabble': 3}
    beasts = sorted([k for k, v in data.items() if v['kind'] != 'humanoid'], key=lambda k: (order.get(data[k]['tier'], 9), k))
    secC, secD = [], []
    for k in beasts:
        v = data[k]
        desc = v['text'] or f"{v['name']}, a {v['tier'].replace('-', ' ')} of Aethermoor, as in the sprite attached."
        relic = f" It carries {v['relic']}, clearly visible." if v['relic'] else ''
        prompt = (f"{v['name']}: {desc}{relic} Match the attached pixel sprite: its shape, its parts and its colours, "
                  f"but drawn as a detailed painted creature. {STYLE_SHEET}")
        c = card(f'sheet-{k}.png', f"{v['name']} ({v['tier'].replace('-', ' ')})", prompt, cref(k), palette(os.path.join(REFS, 'creatures', f'{k}-sprite.png')),
                 optional=v['tier'] in ('veteran', 'rabble'), note='Attach the sprite (Save it first), and paste the prompt.')
        (secC if v['tier'] in ('champion', 'relic-bearer') else secD).append(c)
    counts['C'], counts['D'] = len(secC), len(secD)
    parts.append(('C', 'Model sheets: the Champions and Relic-Bearers', 'Front, side and back of each big creature, so the 3D models can be shaped to match. Attach the game\'s sprite to each prompt. The 3D model so far is there to show what needs fixing.', secC))
    parts.append(('D', 'Model sheets: the other beasts (optional)', 'The same for the rabble and veterans, when there is time.', secD))

    # E. the world
    sec = []
    for region, items in WORLD:
        for n, d in items:
            sec.append(card(n, region, d + ' ' + STYLE_TEX, refs=[(shots['town-square.jpg'], 'the borrowed town: the style to match')] if n == items[0][0] else []))
    counts['E'] = len(sec)
    parts.append(('E', 'The world: textures for the places still to build', f'''The Verdant Wilds already wear your textures (borrowed from Coven of the Moon Faire). These are for the Keep and the other three regions, in the same painted style.
<div class="refs wide"><figure><img src="{shots['world-walk.jpg']}" alt=""><figcaption>Walking the Wilds now<a class="save" download="ref-world.jpg" href="{shots['world-walk.jpg']}">Save</a></figcaption></figure><figure><img src="{shots['world-continent.jpg']}" alt=""><figcaption>The whole continent<a class="save" download="ref-continent.jpg" href="{shots['world-continent.jpg']}">Save</a></figcaption></figure></div>''', sec))

    total = sum(counts.values())
    must = counts['A'] - 6 + counts['B'] + counts['C'] + counts['E']
    toc = ''.join(f'<li><a href="#sec-{k}">{k}. {html.escape(t)}</a> <small>({len(s)})</small></li>' for k, t, _, s in parts)
    body = ''.join(f'<section id="sec-{k}"><h2>{k}. {html.escape(t)}</h2><div class="intro">{intro}</div><div class="cards">{"".join(s)}</div></section>' for k, t, intro, s in parts)
    page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aethermoor art requests</title><style>
:root{{color-scheme:dark;--ink:#0b0910;--soot:#120e0c;--soot2:#1b1511;--seam:#3f3229;--parch:#ecdfc3;--ash:#a8977f;--hot:#ffcb66}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--soot);color:var(--parch);font:16px/1.5 Georgia,serif}}
main{{max-width:1100px;margin:0 auto;padding:16px}}h1{{font-size:30px;margin:8px 0}}h2{{font-size:24px;margin:36px 0 6px;border-bottom:1px solid var(--seam);padding-bottom:6px}}
.how{{background:var(--soot2);padding:14px 18px;box-shadow:0 0 0 2px var(--ink),0 0 0 4px var(--seam);margin:12px 4px}}.how li{{margin:4px 0}}
.cards{{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}}
.card{{background:var(--soot2);padding:12px;box-shadow:0 0 0 2px var(--ink),0 0 0 3px var(--seam)}}.card.opt{{opacity:.85}}
.card header{{display:flex;gap:8px;align-items:center;flex-wrap:wrap}}.file{{font:700 15px ui-monospace,Menlo,monospace;color:var(--hot);word-break:break-all;flex:1}}
.tag{{font:12px system-ui;background:#3a2e24;padding:2px 8px;border-radius:9px}}label{{font:13px system-ui;color:var(--ash);display:flex;gap:4px;align-items:center}}
.used,.note{{font:14px system-ui;color:var(--ash);margin:6px 0}}.refs{{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}}.refs figure{{margin:0;flex:1 1 130px}}
.refs img{{width:100%;max-height:180px;object-fit:contain;background:#0d0a09;image-rendering:auto;display:block}}.refs.wide figure{{flex:1 1 300px}}.refs.wide img{{max-height:320px}}
figcaption{{font:12px system-ui;color:var(--ash);display:flex;justify-content:space-between;gap:6px;align-items:center;margin-top:2px}}
.save,.copy{{font:600 13px system-ui;color:#231306;background:linear-gradient(#ffd27a,#e8902e);border:0;border-radius:6px;padding:8px 12px;min-height:36px;text-decoration:none;cursor:pointer;display:inline-flex;align-items:center}}
.pal{{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;margin:6px 0;font:12px ui-monospace,monospace;color:var(--ash)}}.sw{{width:22px;height:22px;border-radius:4px;box-shadow:0 0 0 1px #000}}
.prompt{{background:#0f0c0a;padding:10px;border-left:3px solid var(--hot)}}.prompt p{{margin:0 0 8px;font:14px/1.45 system-ui}}
small{{color:var(--ash)}}.intro{{color:var(--parch);margin-bottom:10px}}
</style></head><body><main>
<h1>Aethermoor: the pictures to make</h1>
<p>Everything the 3D game asks for, in one page: <b>{total} pictures</b> ({must} wanted, the rest optional). Made {html.escape('November 20, 2026')}.</p>
<div class="how"><b>How to make them</b><ol>
<li>Open ChatGPT (or your image maker). For each card: tap <b>Copy the prompt</b> and paste it.</li>
<li>Where a card has pictures, tap <b>Save</b> under the one it says, and attach it to the message with the prompt (the creature sheets need the game's sprite attached; the screenshots are just to show the style).</li>
<li>Make two or three tries; keep the best. For textures: check it repeats with no seam and no blotch that stands out.</li>
<li>Save it with <b>exactly the file name on the card</b> (orange). A second good try: add <code>-2</code> (<code>metal-steel-2.png</code>). Square, 1024 × 1024 or bigger, for textures; any size for the sheets.</li>
<li>Tick <b>made</b> on the card if you like, to keep your place (it's only on this screen).</li></ol>
<b>How to send them back</b><ol><li>Put the pictures in one folder (or one folder per section), <b>zip it</b> and send the zip. That's quickest: no need to make an HTML file.</li>
<li>Send them in batches if that's easier. The order that helps most: A (metals, mail, leather), then C (the Champions), then B, then E. D is optional.</li></ol></div>
<ul>{toc}</ul>{body}
<script>
document.addEventListener('click', e => {{ const b = e.target.closest('.copy'); if (!b) return; const t = b.previousElementSibling.textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => {{ b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy the prompt', 1500); }}).catch(() => {{ const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected: copy it'; }}); }});
try {{ const K = 'aeth-art-made', done = JSON.parse(localStorage.getItem(K) || '{{}}'); document.querySelectorAll('.card').forEach(c => {{ const box = c.querySelector('.done'); box.checked = !!done[c.id]; box.addEventListener('change', () => {{ done[c.id] = box.checked; try {{ localStorage.setItem(K, JSON.stringify(done)); }} catch (e) {{}} }}); }}); }} catch (e) {{}}
</script></main></body></html>'''
    open(OUT, 'w', encoding='utf-8').write(page)
    print(f'wrote {OUT} ({os.path.getsize(OUT) / 1048576:.1f} MB): ' + ', '.join(f'{k} {v}' for k, v in counts.items()) + f'; {total} in all, {must} wanted')


if __name__ == '__main__':
    main()
