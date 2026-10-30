"""Convert Grab3D CC0 OBJ to a normalized Laya mesh buffer, retaining UVs/normals."""
from pathlib import Path
import json,struct,hashlib
from PIL import Image,ImageOps
root=Path(__file__).resolve().parents[1]/'resources/wheels'
src=root/'public/alloy';positions=[];uvs=[];normals=[];vertices=[];indices=[];lookup={}
for line in (src/'alloy-wheel.obj').read_text().splitlines():
 a=line.split()
 if not a:continue
 if a[0]=='v':positions.append(tuple(map(float,a[1:4])))
 if a[0]=='vt':uvs.append(tuple(map(float,a[1:3])))
 if a[0]=='vn':normals.append(tuple(map(float,a[1:4])))
 if a[0]=='f':
  face=[]
  for token in a[1:]:
   if token not in lookup:
    vi,ti,ni=map(int,token.split('/'));x,y,z=positions[vi-1];nx,ny,nz=normals[ni-1];u,v=uvs[ti-1]
    # Rotate +90 degrees about Y: the visible face points along +X.
    vertices.extend([z/.637708,(y-.318854)/.637708,-x/.637708,nz,ny,-nx,u,1-v]);lookup[token]=len(lookup)
   face.append(lookup[token])
  for i in range(1,len(face)-1):indices.extend([face[0],face[i],face[i+1]])
assert len(lookup)<65536 and max(indices)<len(lookup)
(root/'alloy.vertices.bin').write_bytes(struct.pack('<'+'f'*len(vertices),*vertices))
(root/'alloy.indices.bin').write_bytes(struct.pack('<'+'H'*len(indices),*indices))
Image.open(src/'alloy-wheel_body_basecolor.jpg').resize((1024,1024)).save(root/'alloy-color.jpg',quality=92)
m=Image.open(src/'alloy-wheel_body_metallic-alloy-wheel_body_roughness_metallic.jpg').convert('L').resize((1024,1024))
r=ImageOps.invert(Image.open(src/'alloy-wheel_body_metallic-alloy-wheel_body_roughness_roughness.jpg').convert('L').resize((1024,1024)))
Image.merge('RGBA',(m,m,m,r)).save(root/'alloy-metal-gloss.png')
metadata={'source':'https://grab3d.com/models/vehicles/alloy-wheel/','creator':'Grab3D','license':'CC0-1.0','vertices':len(lookup),'triangles':len(indices)//3,'sourceSha256':hashlib.sha256((src/'alloy-wheel.obj').read_bytes()).hexdigest(),'changes':'Normalized and rotated OBJ to X-axis wheel; resized texture and packed metallic/smoothness. Procedural classic rims are separately authored in wheel-upgrades.js.'}
(root/'source.json').write_text(json.dumps(metadata,indent=2))
print(metadata)
