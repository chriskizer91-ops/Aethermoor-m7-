# The light version of a foe, baked from its sculpt: session 6's Briarmaw bake (prototypes/foe-hd/blender/bake.py),
# with the budgets and the rig taken from the foe's own rig.py (TARGET, BONES, weights_at, rigid_root) so any beast
# can use it (Foes: beasts, session 7).
#
#   blender -b -P bake.py -- HIGH.npz SHAPE.npz OUT_DIR RES RIG.py
#
# 1. The light mesh: the pass-1 shape (same tufts, same thorns), each kind of part brought down on its own (the coat
#    to about 36,000 triangles, thorns, vines and claws to a few thousand each), so it lands near 50,000 in all.
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
import importlib.util
spec = importlib.util.spec_from_file_location('rig', argv[4]); rig = importlib.util.module_from_spec(spec); spec.loader.exec_module(rig)
os.makedirs(OUT, exist_ok=True)
def log(*a): print('[bake]', *a, flush=True)

blib.clear()
sc = bpy.context.scene

# ---- 1. the light mesh -----------------------------------------------------------------------------------------
TARGET = rig.TARGET
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
lo = blib.mesh_from('light', VL, FL)

# ---- 2. UVs ----------------------------------------------------------------------------------------------------
bpy.context.view_layer.objects.active = lo
for o in bpy.context.scene.objects: o.select_set(o == lo)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(62), island_margin=0.0015, area_weight=0.0, scale_to_bounds=True)
# the body gets the most of the picture: each kind's islands scaled by the foe's UV_SCALE before packing (small leaves
# and petals would otherwise take most of it)
UVS = getattr(rig, 'UV_SCALE', {})
if UVS:
    bpy.ops.object.mode_set(mode='OBJECT')
    me_ = lo.data; nl_ = len(me_.loops)
    lv_ = np.empty(nl_, np.int32); me_.loops.foreach_get('vertex_index', lv_)
    uv_ = np.empty(nl_ * 2, np.float32); me_.uv_layers.active.data.foreach_get('uv', uv_); uv_ = uv_.reshape(-1, 2)
    f_ = np.array([UVS.get(int(k), 1.0) for k in range(256)], np.float32)[KL[lv_]]
    me_.uv_layers.active.data.foreach_set('uv', (uv_ * f_[:, None]).ravel())
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.pack_islands(margin=0.002, rotate=True)
bpy.ops.object.mode_set(mode='OBJECT')
log('uvs done')

# ---- 3. the bake -----------------------------------------------------------------------------------------------
h = np.load(HIGH)
hi = blib.mesh_from('sculpt', h['V'], h['F'], h['C'], h['K'])
hi.data.materials.append(blib.vcol_material('sculpt_mat', rough=0.8))
log('sculpt', len(h['F']), 'triangles')

mat = bpy.data.materials.new('light'); mat.use_nodes = True; lo.data.materials.append(mat)
tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
mat.node_tree.nodes.active = tex
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.cycles.use_denoising = False   # this Blender has no denoiser, and asking for one cancels every bake
w = bpy.data.worlds.new('w'); sc.world = w; w.light_settings.distance = getattr(rig, 'AO_DIST', 0.35)
bk = sc.render.bake
CAGE, RAY = getattr(rig, 'CAGE', 0.04), getattr(rig, 'RAY', 0.12)
bk.use_selected_to_active = True; bk.cage_extrusion = CAGE; bk.max_ray_distance = RAY; bk.margin = 6
for o in sc.objects: o.select_set(o in (hi, lo))
bpy.context.view_layer.objects.active = lo

def bake(name, btype, samples=1, colorspace='sRGB', res=RES, **kw):
    img = bpy.data.images.new(name, res, res, alpha=False)
    img.colorspace_settings.name = colorspace
    tex.image = img
    sc.cycles.samples = samples
    bpy.ops.object.bake(type=btype, use_selected_to_active=True, cage_extrusion=CAGE, max_ray_distance=RAY,
                        margin=6, use_clear=True, **kw)
    px = np.empty(res * res * 4, np.float32); img.pixels.foreach_get(px); px = px.reshape(-1, 4)
    log(name, 'mean', px[:, :3].mean(0).round(3), 'min', px[:, :3].min(0).round(3), 'max', px[:, :3].max(0).round(3))
    img.filepath_raw = os.path.join(OUT, f'{name}.png'); img.file_format = 'PNG'; img.save()
    log('baked', name)

bake('normal', 'NORMAL', 1, 'Non-Color', normal_space='TANGENT')
bake('color', 'DIFFUSE', 1, pass_filter={'COLOR'})
bake('emit', 'EMIT', 1, res=512)
bake('ao', 'AO', int(os.environ.get('AO_SAMPLES', 48)), 'Non-Color')

# ---- 4. the rig (the foe's rig.py: BONES as (name, parent, head, tail) in sculpt coordinates, weights_at(P) ->
# (four bone indices, four weights) a vertex, rigid_root(P, kind) -> the point a rigid part hangs from, or a bone name)
BONES = rig.BONES
names = [b[0] for b in BONES]
idx = {n: i for i, n in enumerate(names)}
weights_at = rig.weights_at

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
for c in np.unique(comp_v[np.isin(kind, rig.RIGID)]):
    m = comp_v == c
    P = pos_s[m]
    root = rig.rigid_root(P, int(kind[m][0]))
    if isinstance(root, str):
        jr = np.array([[idx[root], 0, 0, 0]], np.uint16); wr = np.array([[1, 0, 0, 0]], np.float32)
    else:
        jr, wr = weights_at(np.asarray(root, np.float32)[None])
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
# each triangle's corners in the picture and its kind, so textures.py can fix up the small parts' islands
np.savez_compressed(os.path.join(OUT, 'uvkind.npz'), uv=uvs[tris].astype(np.float32), kind=kind[tris[:, 0]].astype(np.uint8))
json.dump({'layout': layout, 'bones': bones, 'triangles': int(len(tris)), 'vertices': int(len(pos_b)),
           'sculptTriangles': int(len(h['F']))}, open(os.path.join(OUT, 'low.json'), 'w'), indent=1)
log('wrote light version:', len(tris), 'triangles,', len(pos_b), 'vertices')
