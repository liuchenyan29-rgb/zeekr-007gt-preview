"""Normalize creator-provided CC BY OBJ rims; keep original tires in the viewer."""
from pathlib import Path
import json,struct,hashlib,math,shutil
root=Path(__file__).resolve().parents[1]/'resources/wheels/vossen'
sources={
 'vfs2':('vfs2/VFS-2/Vossen_VFS2.obj','671ea5f9079e4826a484e797f0b267b6'),
 'vfs4':('vfs4/Vossen VFS4.obj','2a078ce1d2b3463cab9bc3179432bf1c')}
for code,(file,uid) in sources.items():
 source=root/file;positions=[];normals=[];uvs=[];faces={};material='wheel'
 for line in source.open():
  a=line.split()
  if not a:continue
  if a[0]=='v':positions.append(tuple(map(float,a[1:4])))
  elif a[0]=='vn':normals.append(tuple(map(float,a[1:4])))
  elif a[0]=='vt':uvs.append(tuple(map(float,a[1:3])))
  elif a[0]=='usemtl':material=' '.join(a[1:])
  elif a[0]=='f':
   polygon=[tuple(int(v) if v else 0 for v in token.split('/')) for token in a[1:]]
   for i in range(1,len(polygon)-1):faces.setdefault(material,[]).append([polygon[0],polygon[i],polygon[i+1]])
 lo=[min(p[k] for p in positions) for k in range(3)];hi=[max(p[k] for p in positions) for k in range(3)];diameter=max(hi[0]-lo[0],hi[2]-lo[2]);center=[(lo[k]+hi[k])/2 for k in range(3)];depth=hi[1]-lo[1]
 parts=[];out=root/code;out.mkdir(exist_ok=True)
 materials=[]
 for mat,triangles in faces.items():
  idx=len(materials);definition={'name':mat,'color':'#bfc3c9' if code=='vfs4' else '#6b7078','metallic':.95,'smoothness':.8}
  if 'LOGO' in mat:definition.update(color='#ffffff',texture='cap.jpg',metallic=.25,smoothness=.65);shutil.copyfile(root/'vfs2/VFS-2/vossen cap.jpg',out/'cap.jpg')
  elif mat=='Material.001' or mat=='Material.005':definition.update(color='#181a1c',metallic=.3,smoothness=.55)
  materials.append(definition);lookup={};vertices=[];indices=[]
  def flush():
   if not indices:return
   index=len(parts);vfile=f'part-{index}.v.bin';ifile=f'part-{index}.i.bin'
   (out/vfile).write_bytes(struct.pack('<'+'f'*len(vertices),*vertices));(out/ifile).write_bytes(struct.pack('<'+'H'*len(indices),*indices))
   parts.append({'name':mat,'material':idx,'vertices':len(vertices)//8,'triangles':len(indices)//3,'vertexFile':vfile,'indexFile':ifile})
  for triangle in triangles:
   if len(lookup)+3>60000:flush();lookup={};vertices=[];indices=[]
   for token in triangle:
    if token not in lookup:
     pi,ti,ni=(token+(0,0,0))[:3];x,y,z=positions[pi-1 if pi>0 else pi];nx,ny,nz=normals[ni-1 if ni>0 else ni] if ni else (0,1,0);u,v=uvs[ti-1 if ti>0 else ti] if ti else (0,0)
     # Source axle Y -> viewer X. Keep front face at factory tire shoulder.
     point=((y-hi[1])/depth*.4+.2,-(z-center[2])/diameter,-(x-center[0])/diameter)
     raw=(ny*depth/.4,-nz*diameter,-nx*diameter);length=math.sqrt(sum(c*c for c in raw)) or 1;normal=tuple(c/length for c in raw);lookup[token]=len(vertices)//8;vertices.extend((*point,*normal,u,1-v))
    indices.append(lookup[token])
  flush()
 total=sum(p['triangles'] for p in parts);assert total==sum(len(v) for v in faces.values())
 metadata={'name':code.upper(),'author':'jonver87','source':'https://sketchfab.com/3d-models/'+uid,'license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','download':'Creator-provided MediaFire link in Sketchfab description','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'rimOnly':True,'triangles':total,'parts':parts,'materials':materials,'changes':'Transformed axle Y to X, normalized rim diameter, adapted axial depth, partitioned losslessly into 16-bit meshes, assigned display finishes. Original tire and brake assembly retained.'}
 (out/'model.json').write_text(json.dumps(metadata,indent=2));print(code,total,'triangles',len(parts),'parts',diameter,depth)
