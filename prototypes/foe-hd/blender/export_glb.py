# The full-detail sculpt as a standard asset: a .glb with its colours (and kind of part as a second attribute),
# then compressed with meshopt (this Blender has no Draco):
#   blender -b -P export_glb.py -- build/high-3.npz build/sculpt-raw.glb
#   npx gltf-transform meshopt build/sculpt-raw.glb assets/briarmaw-sculpt.glb --level high
# Opens in three.js (GLTFLoader with MeshoptDecoder) and glTF viewers; for Blender, use the raw one or rebuild it.
import sys, os, numpy as np, bpy
sys.path.insert(0, os.path.dirname(__file__))
import blib
argv = sys.argv[sys.argv.index('--') + 1:]
blib.clear()
d = np.load(argv[0])
ob = blib.mesh_from('briarmaw_sculpt', d['V'], d['F'], d['C'], None)
me = ob.data
me.color_attributes.active_color = me.color_attributes['col']
m = bpy.data.materials.new('briarmaw_sculpt'); m.use_nodes = True
vc = m.node_tree.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'col'
m.node_tree.links.new(vc.outputs['Color'], m.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.82
me.materials.append(m)
ob.select_set(True); bpy.context.view_layer.objects.active = ob
bpy.ops.export_scene.gltf(filepath=argv[1], export_format='GLB', use_selection=True, export_colors=True,
                          export_normals=True, export_texcoords=False)
print('glb', os.path.getsize(argv[1]) // 1024, 'KB', len(d['F']), 'triangles')
