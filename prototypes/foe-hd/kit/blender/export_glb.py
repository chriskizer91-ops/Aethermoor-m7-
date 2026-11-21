# A foe's full-detail sculpt as a standard asset (the foe kit, November 20): a .glb with its colours, then compressed
# with meshopt (this Blender has no Draco). Chris: each sculpt is kept as an asset he can look at.
#   blender -b -P kit/blender/export_glb.py -- foes/<key>                     -> foes/<key>/build/sculpt-raw.glb
#   npx gltf-transform meshopt foes/<key>/build/sculpt-raw.glb foes/<key>/assets/<key>-sculpt.glb --level high
# (kit/make.sh does both.) Opens in three.js (GLTFLoader with MeshoptDecoder) and glTF viewers.
import sys, os, numpy as np, bpy
sys.path.insert(0, os.path.dirname(__file__))
import blib
argv = sys.argv[sys.argv.index('--') + 1:]
import json
FOE = os.path.abspath(argv[0]); cfg = json.load(open(os.path.join(FOE, 'foe.json')))
OUTF = os.path.join(FOE, 'build', 'sculpt-raw.glb')
blib.clear()
d = np.load(os.path.join(FOE, 'build', f"high-{cfg['sculpt']['level']}.npz"))
ob = blib.mesh_from(cfg['key'] + '_sculpt', d['V'], d['F'], d['C'], None)
me = ob.data
me.color_attributes.active_color = me.color_attributes['col']
m = bpy.data.materials.new(cfg['key'] + '_sculpt'); m.use_nodes = True
vc = m.node_tree.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'col'
m.node_tree.links.new(vc.outputs['Color'], m.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.82
me.materials.append(m)
ob.select_set(True); bpy.context.view_layer.objects.active = ob
bpy.ops.export_scene.gltf(filepath=OUTF, export_format='GLB', use_selection=True, export_colors=True,
                          export_normals=True, export_texcoords=False)
print('glb', os.path.getsize(OUTF) // 1024, 'KB', len(d['F']), 'triangles')
