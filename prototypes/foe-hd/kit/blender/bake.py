# The light model, baked from a foe's sculpt (the foe kit, from Briarmaw, November 20).
#
#   blender -b -P kit/blender/bake.py -- foes/<key> [RES]     (reads foes/<key>/foe.json and rig.py)
#
# 1. The light mesh: the foe's light level (same shape, its parts built light), the coat (kinds 0-1) reduced to
#    foe.json light.coat triangles (other kinds as built, or light.kinds {kind: triangles}).
# 2. UVs by Smart UV Project.
# 3. Cycles bakes from the sculpt in two runs into the same pictures: the coat with a long reach, the parts against the
#    sculpt's parts only with a short reach (bake.reach), so thin pieces never pick up a neighbour. Surface (tangent-
#    space normal map), shading in the folds (ambient occlusion), colour (diffuse colour) and glow (emission, kind 7).
#    This Blender has no denoiser: denoising stays off, or every bake cancels.
# 4. The rig from rig.py (BONES, and weigh, rigid, part, BANDS; templates in kit/rigs/), weighted BY PART
#    (kit/rigs/bind.py): each point follows its own part's bone, blended only in a narrow band at its joints; rigid
#    kinds (2, 5, 6, 7, 8) move as one with one bone. Then run kit/tools/stretch.mjs (no edge may grow past 1.3x).
# 5. Written for three.js (+Z forward, Y up): build/bake/low.json and low.bin, and the bakes as PNGs.
import sys, os, math, json, importlib.util, numpy as np, bpy
sys.path.insert(0, os.path.dirname(__file__))
import blib
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

argv = sys.argv[sys.argv.index('--') + 1:]
FOE = os.path.abspath(argv[0])
cfg = json.load(open(os.path.join(FOE, 'foe.json')))
HIGH = os.path.join(FOE, 'build', f"high-{cfg['sculpt']['level']}.npz")
SHAPE = os.path.join(FOE, 'build', f"high-{cfg['light']['level']}.npz")
OUT = os.path.join(FOE, 'build', 'bake')
RES = int(argv[1]) if len(argv) > 1 else cfg.get('bake', {}).get('res', 2048)
REACH = cfg.get('bake', {}).get('reach', {'coat': [0.07, 0.2], 'parts': [0.02, 0.05]})
os.makedirs(OUT, exist_ok=True)
def log(*a): print('[bake]', *a, flush=True)
# the rig: the foe's rig.py gives BONES, and may give weigh(D, P, idx) and rigid(kind, P, idx)
spec = importlib.util.spec_from_file_location('foe_rig', os.path.join(FOE, cfg.get('rig', 'rig.py')))
RIG = importlib.util.module_from_spec(spec); spec.loader.exec_module(RIG)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'rigs'))
from bind import bind

blib.clear()
sc = bpy.context.scene

# ---- 1. the light mesh -----------------------------------------------------------------------------------------
# the coat is reduced; the parts come already light (sculpt.py level 0) and keep their shape
TARGET = {k: 10**9 for k in range(9)}; TARGET[0] = cfg['light']['coat']
TARGET.update({int(k): v for k, v in cfg['light'].get('kinds', {}).items()})
s = np.load(SHAPE)
V0, F0, K0 = s['V'], s['F'], s['K']
fk = K0[F0[:, 0]]
parts = []
for k, tgt in TARGET.items():
    sel = F0[fk == k]
    if not len(sel): continue
    used, inv = np.unique(sel, return_inverse=True)
    ob = blib.mesh_from(f'k{k}', V0[used], inv.reshape(-1, 3))
    n = len(sel)
    if tgt < n:
        m = ob.modifiers.new('dec', 'DECIMATE'); m.decimate_type = 'COLLAPSE'; m.ratio = tgt / n
        m.use_collapse_triangulate = True
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    me.calc_loop_triangles()
    Vk = np.empty(len(me.vertices) * 3, np.float32); me.vertices.foreach_get('co', Vk); Vk = Vk.reshape(-1, 3)
    Fk = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get('vertices', Fk); Fk = Fk.reshape(-1, 3)
    parts.append((k, Vk, Fk))
    bpy.data.objects.remove(ob)
    log('kind', k, n, '->', len(Fk))
# back to sculpt coordinates (mesh_from turned him to face -Y)
VL, FL, KL, off = [], [], [], 0
for k, Vk, Fk in parts:
    Vs = Vk.copy(); Vs[:, 0] *= -1; Vs[:, 1] *= -1
    VL.append(Vs); FL.append(Fk + off); KL.append(np.full(len(Vs), k, np.uint8)); off += len(Vs)
VL = np.concatenate(VL); FL = np.concatenate(FL); KL = np.concatenate(KL)
log('light mesh', len(FL), 'triangles', len(VL), 'vertices')
lo = blib.mesh_from('briarmaw_light', VL, FL)

# ---- 2. UVs ----------------------------------------------------------------------------------------------------
bpy.context.view_layer.objects.active = lo
for o in bpy.context.scene.objects: o.select_set(o == lo)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(62), island_margin=0.0015, area_weight=0.0, scale_to_bounds=True)
# each kind's share of the picture (foe.json uv_scale {kind: factor}; session 7: small leaves would take most of it)
UVS = {int(k): v for k, v in cfg.get('uv_scale', {}).items()}
if UVS:
    bpy.ops.object.mode_set(mode='OBJECT')
    me_ = lo.data; nl_ = len(me_.loops)
    lv_ = np.empty(nl_, np.int32); me_.loops.foreach_get('vertex_index', lv_)
    uv_ = np.empty(nl_ * 2, np.float32); me_.uv_layers.active.data.foreach_get('uv', uv_); uv_ = uv_.reshape(-1, 2)
    f_ = np.array([UVS.get(k, 1.0) for k in range(256)], np.float32)[KL[lv_]]
    me_.uv_layers.active.data.foreach_set('uv', (uv_ * f_[:, None]).ravel())
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.pack_islands(margin=0.002, rotate=True)
bpy.ops.object.mode_set(mode='OBJECT')
log('uvs done')

# ---- 3. the bake -----------------------------------------------------------------------------------------------
# Two runs into the same pictures: the coat (light coat <- sculpt coat, a long reach for the tufts' height) and the
# parts (light parts <- sculpt parts, a short reach, so a thin vine never picks up the coat or a thorn beside it).
h = np.load(HIGH)
hk = h['K'][h['F'][:, 0]]
def sub(name, keep):
    F = h['F'][keep]; used, inv = np.unique(F, return_inverse=True)
    ob = blib.mesh_from(name, h['V'][used], inv.reshape(-1, 3), h['C'][used], h['K'][used])
    if 'R' in h:      # roughness and metalness per vertex, for the ORM picture (session 8)
        a = ob.data.color_attributes.new('mat', 'FLOAT_COLOR', 'POINT')
        c4 = np.ones((len(used), 4), np.float32); c4[:, 0] = h['R'][used, 0]; c4[:, 1] = h['R'][used, 1]; c4[:, 2] = 0
        a.data.foreach_set('color', c4.ravel())
    ob.data.materials.append(smat); return ob
smat = blib.vcol_material('sculpt_mat', rough=0.8)
hi_coat, hi_parts = sub('sculpt_coat', hk <= 1), sub('sculpt_parts', hk > 1)
log('sculpt', len(h['F']), 'triangles')

mat = bpy.data.materials.new('light'); mat.use_nodes = True; lo.data.materials.append(mat)
tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
mat.node_tree.nodes.active = tex
# the light mesh split the same way (same UVs, same material and pictures)
import bmesh
def lo_part(name, keep_kinds):
    ob = lo.copy(); ob.data = lo.data.copy(); ob.name = name; sc.collection.objects.link(ob)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    kv = KL   # kind per vertex, in the light mesh's own vertex order
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if kv[f.verts[0].index] not in keep_kinds], context='FACES')
    bm.to_mesh(ob.data); bm.free(); return ob
lo_coat, lo_parts = lo_part('light_coat', {0, 1}), lo_part('light_parts', {2, 3, 4, 5, 6, 7, 8})
lo.hide_render = True

sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.cycles.use_denoising = False   # this Blender has no denoiser, and asking for one cancels every bake
w = bpy.data.worlds.new('w'); sc.world = w; w.light_settings.distance = 0.35
# the eyes glow at strength 1 while baking (the page sets the brightness), so the colour isn't clipped to white
for n in smat.node_tree.nodes:
    if n.type == 'MATH' and n.operation == 'MULTIPLY': n.inputs[1].default_value = 1.0

RUNS = [(lo_coat, hi_coat, *REACH['coat']), (lo_parts, hi_parts, *REACH['parts'])]
# Each run is baked into a picture of its own and the two are put together by an exact mask of the parts' UV islands:
# baking both into one picture lets each run's padding paint over the other's islands (specks of glow or black).
from PIL import Image as PImage, ImageDraw
def uv_mask(ob, res, kinds=None):
    me_ = ob.data; me_.calc_loop_triangles()
    uvl = np.empty(len(me_.loops) * 2, np.float32); me_.uv_layers.active.data.foreach_get('uv', uvl); uvl = uvl.reshape(-1, 2)
    lt = np.empty(len(me_.loop_triangles) * 3, np.int32); me_.loop_triangles.foreach_get('loops', lt); lt = lt.reshape(-1, 3)
    if kinds is not None:      # only triangles of these kinds (the joined light mesh, KL per vertex)
        lvx = np.empty(len(me_.loops), np.int32); me_.loops.foreach_get('vertex_index', lvx)
        lt = lt[np.isin(KL[lvx[lt[:, 0]]], list(kinds))]
    m = PImage.new('L', (res, res), 0); dr = ImageDraw.Draw(m)
    for tri in uvl[lt]:
        dr.polygon([(float(u * res), float((1 - v) * res)) for u, v in tri], fill=255)
    return np.asarray(m) > 127                      # top row first, as PNGs are
MASK = {}
def bake(name, btype, samples=1, colorspace='sRGB', res=RES, **kw):
    sc.cycles.samples = samples
    out = []
    for i, (l, hh, cage, reach) in enumerate(RUNS):
        img = bpy.data.images.new(f'{name}_{i}', res, res, alpha=False)
        img.colorspace_settings.name = colorspace
        tex.image = img
        for o in sc.objects: o.select_set(o in (l, hh))
        bpy.context.view_layer.objects.active = l
        bpy.ops.object.bake(type=btype, use_selected_to_active=True, cage_extrusion=cage, max_ray_distance=reach,
                            margin=6, use_clear=True, **kw)
        px = np.empty(res * res * 4, np.float32); img.pixels.foreach_get(px)
        out.append(np.flipud(px.reshape(res, res, 4)[:, :, :3]))          # Blender's rows run bottom-up
    if res not in MASK: MASK[res] = uv_mask(lo_parts, res)
    comb = np.where(MASK[res][:, :, None], out[1], out[0])
    if colorspace == 'sRGB' and btype in ('DIFFUSE', 'EMIT'):
        pass                                          # Blender hands these back already as sRGB values for a byte image
    PImage.fromarray(np.clip(comb * 255 + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(OUT, f'{name}.png'))
    log(name, 'mean', comb.mean((0, 1)).round(3), 'max', comb.max((0, 1)).round(3))

bake('normal', 'NORMAL', 1, 'Non-Color', normal_space='TANGENT')
bake('color', 'DIFFUSE', 1, pass_filter={'COLOR'})
bake('emit', 'EMIT', 1, res=512)
bake('ao', 'AO', int(os.environ.get('AO_SAMPLES', cfg.get('bake', {}).get('ao', 48))), 'Non-Color')
if 'R' in h:
    # roughness (R) and metalness (G) of the sculpt's 'mat' colour, baked as emission (session 8's ORM pass)
    mm = bpy.data.materials.new('mat_emit'); mm.use_nodes = True
    N_ = mm.node_tree.nodes; L_ = mm.node_tree.links
    for n_ in list(N_): N_.remove(n_)
    va = N_.new('ShaderNodeVertexColor'); va.layer_name = 'mat'
    em_ = N_.new('ShaderNodeEmission'); out_ = N_.new('ShaderNodeOutputMaterial')
    L_.new(va.outputs['Color'], em_.inputs['Color']); L_.new(em_.outputs['Emission'], out_.inputs['Surface'])
    for o in (hi_coat, hi_parts): o.data.materials[0] = mm
    bake('mat', 'EMIT', 1, 'Non-Color')
# flat kinds (foe.json flat [kinds]: stacked leaves, petals): their islands get a flat surface and light, even shading,
# because cage rays hit their neighbours (session 7)
FLAT = cfg.get('flat', [])
if FLAT:
    fm = uv_mask(lo, RES, FLAT)
    fm = np.asarray(PImage.fromarray((fm * 255).astype(np.uint8)).filter(__import__('PIL.ImageFilter', fromlist=['x']).MaxFilter(7))) > 0
    nimg = np.asarray(PImage.open(os.path.join(OUT, 'normal.png')).convert('RGB')).copy(); nimg[fm] = (128, 128, 255)
    PImage.fromarray(nimg).save(os.path.join(OUT, 'normal.png'))
    aimg = np.asarray(PImage.open(os.path.join(OUT, 'ao.png')).convert('RGB')).astype(np.float32); aimg[fm] = 150 + 0.4 * aimg[fm]
    PImage.fromarray(np.clip(aimg, 0, 255).astype(np.uint8)).save(os.path.join(OUT, 'ao.png'))

# ---- 4. the rig ------------------------------------------------------------------------------------------------
BONES = RIG.BONES
names = [b[0] for b in BONES]
idx = {n: i for i, n in enumerate(names)}

# read the light mesh back per corner (UV seams split vertices), in sculpt coordinates
me = lo.data
me.calc_normals_split()
me.calc_tangents(uvmap=me.uv_layers.active.name)
nl = len(me.loops)
lv = np.empty(nl, np.int32); me.loops.foreach_get('vertex_index', lv)
ln = np.empty(nl * 3, np.float32); me.loops.foreach_get('normal', ln); ln = ln.reshape(-1, 3)
lt = np.empty(nl * 3, np.float32); me.loops.foreach_get('tangent', lt); lt = lt.reshape(-1, 3)
ls = np.empty(nl, np.float32); me.loops.foreach_get('bitangent_sign', ls)
uv = np.empty(nl * 2, np.float32); me.uv_layers.active.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
co = np.empty(len(me.vertices) * 3, np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
# unique (vertex, uv, normal)
key = np.column_stack([lv.astype(np.float64), np.round(uv * 65536), np.round(ln * 1000)])
_, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
inv = inv.ravel()
vi = lv[first]
pos_b = co[vi]; nrm_b = ln[first]; tan_b = lt[first]; sgn = ls[first]; uvs = uv[first]
tris = inv.reshape(-1, 3)           # every polygon is a triangle (made so above)
# sculpt coordinates for the rig, three.js coordinates for the page: three = (Bx, Bz, -By)
pos_s = pos_b.copy(); pos_s[:, 0] *= -1; pos_s[:, 1] *= -1
def to3(A): return np.column_stack([A[:, 0], A[:, 2], -A[:, 1]]).astype(np.float32)
kind = KL[vi]
# weights by part (kit/rigs/bind.py): each point follows its own part, blended only in a narrow band at its joints
J, W, _, keep = bind(RIG, pos_s, kind, tris, float(cfg.get('height', 1.7)),
               (np.array(cfg['bounds'][0]) + np.array(cfg['bounds'][1])) / 2, log)
tris0 = tris.copy()                 # the cut triangles (where limbs touch) draw nothing; index0 keeps them for rebind
tris = tris.copy(); tris[~keep] = tris[~keep][:, :1]

bones = []
for n, par, hd, tl in BONES:
    hd3 = to3(np.array([[-hd[0], -hd[1], hd[2]]], np.float32))[0]   # sculpt -> blender -> three
    tl3 = to3(np.array([[-tl[0], -tl[1], tl[2]]], np.float32))[0]
    bones.append({'name': n, 'parent': par, 'head': [round(float(x), 4) for x in hd3], 'tail': [round(float(x), 4) for x in tl3]})

arrays = {
    'position': to3(pos_b), 'normal': to3(nrm_b),
    'tangent': np.column_stack([to3(tan_b), sgn]).astype(np.float32),
    'uv': np.column_stack([uvs[:, 0], 1 - uvs[:, 1]]).astype(np.float32),   # three flips v for images
    'skinIndex': J.astype(np.float32), 'skinWeight': W, 'index': tris.astype(np.uint32),
    'kind': kind.astype(np.float32), 'index0': tris0.astype(np.uint32),      # kept so kit/tools/rebind.py can weight it again without baking
}
layout, blob, o = {}, [], 0
for k_, a in arrays.items():
    b = a.tobytes(); layout[k_] = {'offset': o, 'count': int(a.shape[0]), 'size': int(a.shape[1]) if a.ndim > 1 else 1,
                                    'type': 'uint32' if a.dtype == np.uint32 else 'float32'}
    blob.append(b); o += len(b)
open(os.path.join(OUT, 'low.bin'), 'wb').write(b''.join(blob))
json.dump({'layout': layout, 'bones': bones, 'triangles': int(len(tris)), 'vertices': int(len(pos_b)),
           'sculptTriangles': int(len(h['F'])), 'key': cfg['key'], 'plan': cfg.get('plan'), 'height': cfg.get('height')}, open(os.path.join(OUT, 'low.json'), 'w'), indent=1)
log('wrote light version:', len(tris), 'triangles,', len(pos_b), 'vertices')
