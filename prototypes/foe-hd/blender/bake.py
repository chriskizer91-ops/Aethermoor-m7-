# The light version of Briarmaw, baked from the sculpt (One Foe, November 20).
#
#   blender -b -P bake.py -- HIGH.npz SHAPE.npz OUT_DIR [RES]
#
# 1. The light mesh: sculpt.py's level 0 (same tufts, same thorns, the parts built light), the coat reduced to
#    about 29,500 triangles, so it lands near 50,000 in all.
# 2. UVs by Smart UV Project.
# 3. Cycles bakes from the sculpt onto it, selected-to-active: the surface (tangent-space normal map), the shading in
#    the folds (ambient occlusion), his colour (diffuse colour only) and the glow of his eyes (emission).
# 4. The rig: 19 bones (hips, spine, chest, neck, head, jaw, tail, three in each leg) and four weights a vertex;
#    thorns, tusks, teeth, claws and eyes move rigidly with what they grow from.
# 5. Written for three.js (+Z forward, Y up): OUT_DIR/low.json (layout, bones) and low.bin (float32 arrays), and the
#    bakes as PNGs (pack.mjs turns them into the page's assets).
import sys, os, math, json, numpy as np, bpy
sys.path.insert(0, os.path.dirname(__file__))
import blib
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

argv = sys.argv[sys.argv.index('--') + 1:]
HIGH, SHAPE, OUT = argv[0], argv[1], argv[2]
RES = int(argv[3]) if len(argv) > 3 else 2048
os.makedirs(OUT, exist_ok=True)
def log(*a): print('[bake]', *a, flush=True)

blib.clear()
sc = bpy.context.scene

# ---- 1. the light mesh -----------------------------------------------------------------------------------------
# the coat is reduced; the parts come already light (sculpt.py level 0) and keep their shape
TARGET = {0: 29500, 2: 10**9, 3: 10**9, 4: 10**9, 5: 10**9, 6: 10**9, 7: 10**9}
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
    ob.data.materials.append(smat); return ob
smat = blib.vcol_material('sculpt_mat', rough=0.8)
hi_coat, hi_parts = sub('sculpt_coat', hk == 0), sub('sculpt_parts', hk != 0)
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
lo_coat, lo_parts = lo_part('light_coat', {0}), lo_part('light_parts', {2, 3, 4, 5, 6, 7})
lo.hide_render = True

sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.cycles.use_denoising = False   # this Blender has no denoiser, and asking for one cancels every bake
w = bpy.data.worlds.new('w'); sc.world = w; w.light_settings.distance = 0.35
# the eyes glow at strength 1 while baking (the page sets the brightness), so the colour isn't clipped to white
for n in smat.node_tree.nodes:
    if n.type == 'MATH' and n.operation == 'MULTIPLY': n.inputs[1].default_value = 1.0

RUNS = [(lo_coat, hi_coat, 0.07, 0.2), (lo_parts, hi_parts, 0.02, 0.05)]
def bake(name, btype, samples=1, colorspace='sRGB', res=RES, **kw):
    img = bpy.data.images.new(name, res, res, alpha=False)
    img.colorspace_settings.name = colorspace
    tex.image = img
    sc.cycles.samples = samples
    for i, (l, hh, cage, reach) in enumerate(RUNS):
        for o in sc.objects: o.select_set(o in (l, hh))
        bpy.context.view_layer.objects.active = l
        bpy.ops.object.bake(type=btype, use_selected_to_active=True, cage_extrusion=cage, max_ray_distance=reach,
                            margin=6, use_clear=(i == 0), **kw)
    px = np.empty(res * res * 4, np.float32); img.pixels.foreach_get(px); px = px.reshape(-1, 4)
    log(name, 'mean', px[:, :3].mean(0).round(3), 'max', px[:, :3].max(0).round(3))
    img.filepath_raw = os.path.join(OUT, f'{name}.png'); img.file_format = 'PNG'; img.save()

bake('normal', 'NORMAL', 1, 'Non-Color', normal_space='TANGENT')
bake('color', 'DIFFUSE', 1, pass_filter={'COLOR'})
bake('emit', 'EMIT', 1, res=512)
bake('ao', 'AO', int(os.environ.get('AO_SAMPLES', 48)), 'Non-Color')

# ---- 4. the rig ------------------------------------------------------------------------------------------------
# joints in sculpt coordinates (x right, y forward, z up); each bone runs from its head to its tail
LEG = {
    'fl': [(0.44, 0.40, 0.86), (0.46, 0.36, 0.38), (0.47, 0.42, 0.10)],
    'fr': [(-0.44, 0.40, 0.86), (-0.46, 0.36, 0.38), (-0.47, 0.42, 0.10)],
    'bl': [(0.42, -0.72, 0.80), (0.44, -0.78, 0.36), (0.45, -0.72, 0.10)],
    'br': [(-0.42, -0.72, 0.80), (-0.44, -0.78, 0.36), (-0.45, -0.72, 0.10)],
}
BONES = [  # name, parent, head, tail
    ('hips', None, (0, -0.55, 0.92), (0, -0.05, 0.98)),
    ('spine', 'hips', (0, -0.05, 0.98), (0, 0.32, 1.0)),
    ('chest', 'spine', (0, 0.32, 1.0), (0, 0.60, 1.05)),
    ('neck', 'chest', (0, 0.60, 1.05), (0, 0.78, 1.08)),
    ('head', 'neck', (0, 0.78, 1.08), (0, 1.18, 1.0)),
    ('jaw', 'head', (0, 0.84, 0.90), (0, 1.08, 0.86)),
    ('tail', 'hips', (0, -0.98, 0.98), (0, -1.32, 0.34)),
]
for k, (a, b, c) in LEG.items():
    par = 'chest' if k[0] == 'f' else 'hips'
    BONES += [(f'{k}_upper', par, a, b), (f'{k}_lower', f'{k}_upper', b, c),
              (f'{k}_paw', f'{k}_lower', c, (c[0], c[1] + 0.22, 0.04))]
names = [b[0] for b in BONES]
idx = {n: i for i, n in enumerate(names)}

def seg_dist(P, a, b):
    a = np.asarray(a, np.float32); b = np.asarray(b, np.float32); ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)

def weights_at(P):
    D = np.stack([seg_dist(P, b[2], b[3]) for b in BONES], 1)
    z = P[:, 2]
    for i, b in enumerate(BONES):
        n = b[0]
        if '_' in n:   # legs: only what is low and near the leg; the flanks stay with the body
            D[:, i] *= np.where(z > 0.78, 2.2, np.where(z > 0.6, 1.4, 1.0))
            side = np.sign(b[2][0])
            D[:, i] += np.where(np.sign(P[:, 0]) != side, 1.0, 0.0)
            front = n[0] == 'f'
            D[:, i] += np.where((P[:, 1] > -0.1) != front, 1.0, 0.0)
        if n == 'jaw': D[:, i] += 10
        if n == 'tail': D[:, i] *= np.where(P[:, 1] < -0.95, 0.7, 2.0)
    # the jaw: below the grin, at the front of the face
    jaw = (P[:, 1] > 0.86) & (P[:, 2] < 0.885 + 0.4 * P[:, 0] ** 2) & (P[:, 2] > 0.66) & (np.abs(P[:, 0]) < 0.32)
    D[jaw, idx['jaw']] = 0.0
    W = 1.0 / np.maximum(D, 0.02) ** 4
    top = np.argsort(-W, 1)[:, :4]
    Wt = np.take_along_axis(W, top, 1); Wt /= Wt.sum(1, keepdims=True)
    return top.astype(np.uint16), Wt.astype(np.float32)

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
J, W = weights_at(pos_s)
# rigid parts: each thorn, tusk, tooth, claw and eye moves as one, with the weights where it meets the body
ncomp, comp = connected_components(coo_matrix((np.ones(len(FL) * 3), (np.repeat(FL[:, 0], 3), FL[:, [0, 1, 2]].ravel())),
                                              shape=(len(VL), len(VL))), directed=False)
comp_v = comp[vi]
for c in np.unique(comp_v[np.isin(kind, [2, 5, 6, 7])]):
    m = comp_v == c
    P = pos_s[m]
    # its root: the end nearest the body's middle line
    ctr = np.array([0, np.clip(P[:, 1].mean(), -1.0, 0.9), 0.85])
    r = np.argmin(np.linalg.norm(P - ctr, axis=1))
    jr, wr = weights_at(P[r:r + 1])
    if kind[m][0] == 5 and P[:, 2].min() < 0.75:      # the tusks grow from the jaw
        jr = np.array([[idx['jaw'], 0, 0, 0]], np.uint16); wr = np.array([[1, 0, 0, 0]], np.float32)
    J[m] = jr; W[m] = wr

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
}
layout, blob, o = {}, [], 0
for k_, a in arrays.items():
    b = a.tobytes(); layout[k_] = {'offset': o, 'count': int(a.shape[0]), 'size': int(a.shape[1]) if a.ndim > 1 else 1,
                                    'type': 'uint32' if a.dtype == np.uint32 else 'float32'}
    blob.append(b); o += len(b)
open(os.path.join(OUT, 'low.bin'), 'wb').write(b''.join(blob))
json.dump({'layout': layout, 'bones': bones, 'triangles': int(len(tris)), 'vertices': int(len(pos_b)),
           'sculptTriangles': int(len(h['F']))}, open(os.path.join(OUT, 'low.json'), 'w'), indent=1)
log('wrote light version:', len(tris), 'triangles,', len(pos_b), 'vertices')
