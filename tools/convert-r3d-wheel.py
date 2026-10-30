"""Convert the publicly downloaded R3D high-poly glTF without simplifying its geometry."""
from pathlib import Path
import json,struct,hashlib,io
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]/'resources/wheels/r3d'
p=root/'original/high-poly wheel/model/R50.glb';b=p.read_bytes();length=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+length]);offset=20+length;binlen=struct.unpack_from('<I',b,offset)[0];binary=b[offset+8:offset+8+binlen]
def acc(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];dtype={5126:'<f4',5123:'<u2',5125:'<u4'}[a['componentType']];width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];start=v.get('byteOffset',0)+a.get('byteOffset',0)
 return np.ndarray((a['count'],width),dtype=dtype,buffer=binary,offset=start,strides=(v.get('byteStride',np.dtype(dtype).itemsize*width),np.dtype(dtype).itemsize)).copy()
def rotation(q):
 x,y,z,w=q
 return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def apply(v,R):return np.stack([sum(v[:,k]*R[j,k] for k in range(3)) for j in range(3)],axis=1)
straight=rotation(g['nodes'][2]['rotation']).T
primitives=[]
for node in g['nodes']:
 R=rotation(node.get('rotation',[0,0,0,1]));scale=np.array(node.get('scale',[1,1,1]));tr=np.array(node.get('translation',[0,0,0]));
 for primitive in g['meshes'][node['mesh']]['primitives']:
  attr=primitive['attributes'];pos=apply(apply(acc(attr['POSITION'])*scale,R)+tr,straight)
  norm=apply(apply(acc(attr['NORMAL'])/scale,R),straight);norm/=np.maximum(np.linalg.norm(norm,axis=1)[:,None],1e-12)
  uv=acc(attr['TEXCOORD_0']);uv[:,1]=1-uv[:,1]
  primitives.append({'name':node['name'],'material':primitive['material'],'pos':pos,'norm':norm,'uv':uv,'indices':acc(primitive['indices']).ravel()})
tire=next(p for p in primitives if p['name']=='THREADS')['pos'];lo=tire.min(axis=0);hi=tire.max(axis=0);center=(lo+hi)/2;diameter=max(hi[1]-lo[1],hi[2]-lo[2]);rim=next(p for p in primitives if p['name']=='RIM')['pos'];rimfraction=np.min(np.linalg.norm((tire-center)[:,1:3],axis=1))/diameter
materials=[]
for i,mat in enumerate(g['materials']):
 mr=mat.get('pbrMetallicRoughness',{});entry={'factor':mr.get('baseColorFactor',[1,1,1,1]),'metallic':mr.get('metallicFactor',1),'roughness':mr.get('roughnessFactor',1)}
 for field,key in [('baseColorTexture','color'),('metallicRoughnessTexture','metalGloss')]:
  if field not in mr:continue
  image=g['images'][g['textures'][mr[field]['index']]['source']];view=g['bufferViews'][image['bufferView']];im=Image.open(io.BytesIO(binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']])).convert('RGBA')
  if key=='color':filename=f'mat-{i}-color.png';im.save(root/filename)
  else:
   r,rough,metal,a=im.split();smooth=rough.point(lambda x:255-x);filename=f'mat-{i}-metal-gloss.png';Image.merge('RGBA',(metal,metal,metal,smooth)).save(root/filename)
  entry[key]=filename
 materials.append(entry)
parts=[]
for primitive in primitives:
 assert np.isfinite(primitive['pos']).all() and np.isfinite(primitive['norm']).all()
 aligned=(primitive['pos']-center)/diameter;normal=primitive['norm'].copy()
 source=np.concatenate([aligned,normal,primitive['uv']],axis=1).astype('<f4');triangles=primitive['indices'].reshape(-1,3);lookup={};vertices=[];indices=[]
 def flush():
  if not indices:return
  n=len(parts);v=np.array(vertices,dtype='<f4');idx=np.array(indices,dtype='<u2');v.tofile(root/f'part-{n}.vertices.bin');idx.tofile(root/f'part-{n}.indices.bin');parts.append({'name':primitive['name'],'material':primitive['material'],'vertices':len(vertices),'triangles':len(indices)//3,'vertexFile':f'part-{n}.vertices.bin','indexFile':f'part-{n}.indices.bin'})
 for tri in triangles:
  if len(lookup)+3>60000:flush();lookup={};vertices=[];indices=[]
  for original in tri:
   original=int(original)
   if original not in lookup:lookup[original]=len(vertices);vertices.append(source[original])
   indices.append(lookup[original])
 flush()
metadata={'author':'R3Dstudios','source':'https://r3dstudios.itch.io/r3d-multi-spoke-wheel-free-3d-game-asset-glb','usage':'Public free download; author describes rendering/showcase/modding use. No CC license stated. Local preview; retain attribution.','sha256':hashlib.sha256(b).hexdigest(),'rimFraction':float(rimfraction),'parts':parts,'materials':materials,'triangles':sum(p['triangles'] for p in parts),'changes':'Applied node transforms, straightened wheel axis, normalized tire diameter; lossless partition into 16-bit index buffers; converted PBR maps. No geometry decimation.'}
(root/'model.json').write_text(json.dumps(metadata,indent=2));print('Triangles',metadata['triangles'],'parts',len(parts),'rimFraction',rimfraction,'original bounds',lo,hi)
