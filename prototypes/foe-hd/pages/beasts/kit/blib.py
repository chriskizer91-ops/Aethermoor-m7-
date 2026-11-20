# Shared Blender helpers for the Briarmaw scripts: load a numpy mesh, materials, cameras and lights for the checks.
import bpy, numpy as np, math, os
from mathutils import Vector

def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def mesh_from(name, V, F, C=None, K=None):
    """a mesh object from numpy arrays; sculpt coordinates (y forward) are turned to face Blender's -Y"""
    V = np.asarray(V, np.float32).copy(); V[:, 0] *= -1; V[:, 1] *= -1   # turn 180 degrees about Z: nose to -Y
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(V)); me.vertices.foreach_set('co', V.ravel())
    F = np.asarray(F, np.int32)
    me.loops.add(len(F) * 3); me.loops.foreach_set('vertex_index', F.ravel())
    me.polygons.add(len(F)); me.polygons.foreach_set('loop_start', np.arange(0, len(F) * 3, 3, dtype=np.int32))
    me.polygons.foreach_set('loop_total', np.full(len(F), 3, np.int32))
    me.update(calc_edges=True); me.validate(clean_customdata=False)
    if C is not None:
        a = me.color_attributes.new('col', 'FLOAT_COLOR', 'POINT')
        c4 = np.ones((len(V), 4), np.float32); c4[:, :3] = np.asarray(C) ** 2.2   # sRGB -> linear
        a.data.foreach_set('color', c4.ravel())
    if K is not None:
        a = me.attributes.new('kind', 'INT', 'POINT'); a.data.foreach_set('value', np.asarray(K, np.int32))
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    me.polygons.foreach_set('use_smooth', np.ones(len(F), bool))
    return ob

def vcol_material(name='sculpt', skin=None, skin_mix=0.35, rough=0.75):
    """vertex colour (times a box-projected skin for fine grain); eyes glow (kind 7)"""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links
    bsdf = N['Principled BSDF']; bsdf.inputs['Roughness'].default_value = rough
    attr = N.new('ShaderNodeVertexColor'); attr.layer_name = 'col'
    col = attr.outputs['Color']
    if skin:
        tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (2.2, 2.2, 2.2)
        img = N.new('ShaderNodeTexImage'); img.image = bpy.data.images.load(skin); img.projection = 'BOX'; img.projection_blend = 0.3
        L.new(tc.outputs['Object'], mp.inputs['Vector']); L.new(mp.outputs['Vector'], img.inputs['Vector'])
        bw = N.new('ShaderNodeRGBToBW'); L.new(img.outputs['Color'], bw.inputs['Color'])
        # the skin's light and dark, centred on 1, so it adds grain without changing the hue
        mm = N.new('ShaderNodeMath'); mm.operation = 'MULTIPLY_ADD'; mm.inputs[1].default_value = 2.4 * skin_mix; mm.inputs[2].default_value = 1 - 0.45 * 2.4 * skin_mix
        L.new(bw.outputs['Val'], mm.inputs[0])
        mul = N.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1
        L.new(col, mul.inputs[6]); L.new(mm.outputs['Value'], mul.inputs[7])
        col = mul.outputs[2]
    L.new(col, bsdf.inputs['Base Color'])
    # glow for the eyes: kind == 7
    ka = N.new('ShaderNodeAttribute'); ka.attribute_name = 'kind'
    eq = N.new('ShaderNodeMath'); eq.operation = 'COMPARE'; eq.inputs[1].default_value = 7; eq.inputs[2].default_value = 0.5
    L.new(ka.outputs['Fac'], eq.inputs[0])
    L.new(attr.outputs['Color'], bsdf.inputs['Emission Color'])
    em = N.new('ShaderNodeMath'); em.operation = 'MULTIPLY'; em.inputs[1].default_value = float(os.environ.get("GLOW", 6.0))
    L.new(eq.outputs['Value'], em.inputs[0]); L.new(em.outputs['Value'], bsdf.inputs['Emission Strength'])
    return m

def look_rig(width=3.2, res=(700, 620), bg=(0.53, 0.52, 0.5)):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.use_denoising = False
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.film_transparent = False
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (*bg, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.55
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = width
    key = bpy.data.objects.new('key', bpy.data.lights.new('key', 'SUN')); sc.collection.objects.link(key)
    key.data.energy = 3.2; key.data.angle = 0.2; key.rotation_euler = (math.radians(50), 0, math.radians(30))
    fill = bpy.data.objects.new('fill', bpy.data.lights.new('fill', 'SUN')); sc.collection.objects.link(fill)
    fill.data.energy = 0.8; fill.rotation_euler = (math.radians(60), 0, math.radians(-150))
    return cam, key

def shoot(cam, key, view, path, ctr=(0, 0, 0.78), dist=8):
    """front: we face his nose (he faces -Y); side: his left, nose to the right of the picture; back"""
    cx, cy, cz = ctr
    if view == 'front': cam.location = (cx, cy - dist, cz); cam.rotation_euler = (math.radians(90), 0, 0)
    elif view == 'side': cam.location = (cx - dist, cy, cz); cam.rotation_euler = (math.radians(90), 0, math.radians(-90))
    elif view == 'back': cam.location = (cx, cy + dist, cz); cam.rotation_euler = (math.radians(90), 0, math.radians(180))
    elif view == 'three': cam.location = (cx + dist * 0.62, cy - dist * 0.7, cz + dist * 0.3); cam.rotation_euler = (math.radians(74), 0, math.radians(42))
    # light from over the camera's left shoulder
    key.rotation_euler = (math.radians(55), 0, cam.rotation_euler[2] - math.radians(35))
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
