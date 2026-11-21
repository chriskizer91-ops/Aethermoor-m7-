# The light version of a walker, baked from its sculpt (session 8). Adapted from prototypes/foe-hd/blender/bake.py
# (session 6, Briarmaw): the per-part reduction, Smart UV Project, the Cycles bakes and the export are his; added here:
# a roughness/metalness bake (the walkers wear plate and gold), and the rig read from the foe's own rig.py.
#
#   blender -b -P bake.py -- HIGH.npz SHAPE.npz OUT_DIR RES FOE_DIR TARGETS
#   TARGETS: kind=triangles,... e.g. 0=34000,3=9000,2=1600,8=1400,4=1500
#
# Writes OUT_DIR/low.json + low.bin (three.js: +Z forward, Y up; bones, skin weights) and the bakes as PNGs:
# normal (tangent space), color (diffuse colour), ao, mat (R roughness, G metalness), emit (glow, if any).
import sys, os, math, json, importlib, numpy as np, bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blib
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

argv = sys.argv[sys.argv.index('--') + 1:]
HIGH, SHAPE, OUT, RES, FOE = argv[0], argv[1], argv[2], int(argv[3]), argv[4]
TARGET = {int(k): int(v) for k, v in (kv.split('=') for kv in argv[5].split(','))}
sys.path.insert(0, os.path.abspath(FOE)); rig = importlib.import_module('rig')   # the foe's own bones and weights
os.makedirs(OUT, exist_ok=True)
def log(*a): print('[bake]', *a, flush=True)
blib.clear()
sc = bpy.context.scene

# ---- 1. the light mesh: each kind of part brought down on its own -----------------------------------------------
s = np.load(SHAPE)
V0, F0, K0 = s['V'], s['F'], s['K']
fk = K0[F0[:, 0]]
parts = []
for k in np.unique(fk):
    tgt = TARGET.get(int(k), 1000)
    sel = F0[fk == k]
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
    parts.append((int(k), Vk, Fk))
    bpy.data.objects.remove(ob)
    log('kind', k, n, '->', len(Fk))
VL, FL, KL, off = [], [], [], 0
for k, Vk, Fk in parts:
    Vs = Vk.copy(); Vs[:, 0] *= -1; Vs[:, 1] *= -1           # back to sculpt coordinates
    VL.append(Vs); FL.append(Fk + off); KL.append(np.full(len(Vs), k, np.uint8)); off += len(Vs)
VL = np.concatenate(VL); FL = np.concatenate(FL); KL = np.concatenate(KL)
log('light mesh', len(FL), 'triangles', len(VL), 'vertices')
lo = blib.mesh_from('light', VL, FL)

# ---- 2. UVs ----------------------------------------------------------------------------------------------------
bpy.context.view_layer.objects.active = lo
for o in sc.objects: o.select_set(o == lo)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(62), island_margin=0.0015, area_weight=0.0, scale_to_bounds=True)
bpy.ops.uv.pack_islands(margin=0.002, rotate=True)
bpy.ops.object.mode_set(mode='OBJECT')
log('uvs done')

# ---- 3. the bakes ----------------------------------------------------------------------------------------------
h = np.load(HIGH)
hi = blib.mesh_from('sculpt', h['V'], h['F'], h['C'], h['K'], h['M'])
look = blib.vcol_material('sculpt_mat', rough=0.8)
# the material pass: emission = (roughness, metalness, 0) from the vertex attribute
mm = bpy.data.materials.new('matpass'); mm.use_nodes = True
N = mm.node_tree.nodes; L = mm.node_tree.links
for n_ in list(N): N.remove(n_)
va = N.new('ShaderNodeVertexColor'); va.layer_name = 'mat'
em = N.new('ShaderNodeEmission'); out = N.new('ShaderNodeOutputMaterial')
L.new(va.outputs['Color'], em.inputs['Color']); L.new(em.outputs['Emission'], out.inputs['Surface'])
hi.data.materials.append(look)
log('sculpt', len(h['F']), 'triangles')

mat = bpy.data.materials.new('light'); mat.use_nodes = True; lo.data.materials.append(mat)
tex = mat.node_tree.nodes.new('ShaderNodeTexImage'); mat.node_tree.nodes.active = tex
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.cycles.use_denoising = False   # this Blender has no denoiser, and asking for one cancels every bake
w = bpy.data.worlds.new('w'); sc.world = w; w.light_settings.distance = 0.3
for o in sc.objects: o.select_set(o in (hi, lo))
bpy.context.view_layer.objects.active = lo
CAGE = float(os.environ.get('CAGE', 0.03)); RAY = float(os.environ.get('RAY', 0.09))
def bake(name, btype, samples=1, colorspace='sRGB', res=RES, **kw):
    img = bpy.data.images.new(name, res, res, alpha=False)
    img.colorspace_settings.name = colorspace
    tex.image = img
    sc.cycles.samples = samples
    bpy.ops.object.bake(type=btype, use_selected_to_active=True, cage_extrusion=CAGE, max_ray_distance=RAY,
                        margin=8, use_clear=True, **kw)
    img.filepath_raw = os.path.join(OUT, f'{name}.png'); img.file_format = 'PNG'; img.save()
    log('baked', name)
bake('normal', 'NORMAL', 1, 'Non-Color', normal_space='TANGENT')
bake('color', 'DIFFUSE', 1, pass_filter={'COLOR'})
bake('ao', 'AO', int(os.environ.get('AO_SAMPLES', 48)), 'Non-Color')
if int(os.environ.get('GLOW', 0)):
    bake('emit', 'EMIT', 1, res=RES // 4)          # the eyes and other glowing parts (kinds 7 and 9)
hi.data.materials[0] = mm
bake('mat', 'EMIT', 1, 'Non-Color', res=RES // 2)

# ---- 4. the rig ------------------------------------------------------------------------------------------------
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
key = np.column_stack([lv.astype(np.float64), np.round(uv * 65536), np.round(ln * 1000)])
_, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
inv = inv.ravel()
vi = lv[first]
pos_b = co[vi]; nrm_b = ln[first]; tan_b = lt[first]; sgn = ls[first]; uvs = uv[first]
tris = inv.reshape(-1, 3)
pos_s = pos_b.copy(); pos_s[:, 0] *= -1; pos_s[:, 1] *= -1
def to3(A): return np.column_stack([A[:, 0], A[:, 2], -A[:, 1]]).astype(np.float32)
kind = KL[vi]
J, W = rig.weights_at(pos_s, kind)
# rigid parts: each piece of these kinds moves as one with its bone
for k, bone in rig.RIGID.items():
    m = kind == k
    J[m] = np.array([rig.IDX[bone], 0, 0, 0], np.uint16); W[m] = np.array([1, 0, 0, 0], np.float32)
bones = []
for n, par, hd, tl in rig.BONES:
    hd3 = to3(np.array([[-hd[0], -hd[1], hd[2]]], np.float32))[0]
    tl3 = to3(np.array([[-tl[0], -tl[1], tl[2]]], np.float32))[0]
    bones.append({'name': n, 'parent': par, 'head': [round(float(x), 4) for x in hd3], 'tail': [round(float(x), 4) for x in tl3]})
arrays = {
    'position': to3(pos_b), 'normal': to3(nrm_b),
    'tangent': np.column_stack([to3(tan_b), sgn]).astype(np.float32),
    'uv': np.column_stack([uvs[:, 0], 1 - uvs[:, 1]]).astype(np.float32),
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
