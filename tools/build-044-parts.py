import struct,json,math,argparse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description='Build disconnected model regions without changing vertex attributes')
parser.add_argument('--part',choices=['044','113','027'],default='044')
part_code=parser.parse_args().part
source_mesh,source_node,source_id={
 '044':('8898069198_260_8411_SILL_MOULDING_1_8898110689_260_8411_52ba4ed.lm','WG_054','shell/0/0/0/38#0'),
 '027':('Mesh.038.lm','WG_06','shell/0/0/0/22#0'),
 '113':('surface_3908946.lm','trunk_016','shell/0/7/4#0'),
}[part_code]
p=ROOT/'resources/car/cc1e/cc1efab/cc1e_WG'/source_mesh
b=p.read_bytes();pos=0
def read(fmt):
 global pos
 v=struct.unpack_from('<'+fmt,b,pos);pos+=struct.calcsize('<'+fmt);return v[0] if len(v)==1 else v
def utf():
 global pos
 n=read('H');s=b[pos:pos+n].decode();pos+=n;return s
version=utf();offset,size=read('II');blocks=[read('II') for _ in range(read('H'))];so,sc=read('IH');pos=offset+so;strings=[utf() for _ in range(sc)]
pos=blocks[0][0];print(version,strings,blocks)
read('H');read('H');vbcount=read('h');start,count,flag=read('IIH');print('VB',start,count,strings[flag]);ibstart,iblength=read('II');print('IB',ibstart,iblength)
assert version=='LAYAMODEL:0501' and vbcount==1 and strings[flag] in ('POSITION,NORMAL,UV,UV1','POSITION,NORMAL,UV')
stride=sum({'POSITION':3,'NORMAL':3,'UV':2,'UV1':2}[name] for name in strings[flag].split(','))
verts=[struct.unpack_from('<'+str(stride)+'f',b,offset+start+i*stride*4) for i in range(count)];indices=list(struct.unpack_from('<'+'H'*(iblength//2),b,offset+ibstart))
subs=[]
for bs,bl in blocks[1:]:
 pos=bs;read('H');read('h');first,n=read('II');subs.append(indices[first:first+n])
print('SUBS',list(map(len,subs)))
scene=json.loads((ROOT/'resources/car/cc1e/cc1efab/cc1e_WG.lh').read_text())
def transform(v,t):
 s=t.get('localScale',{});r=t.get('localRotation',{});p=t.get('localPosition',{})
 x,y,z=[v[i]*s.get(k,1) for i,k in enumerate('xyz')];qx,qy,qz,qw=[r.get(k,1 if k=='w' else 0) for k in 'xyzw']
 tx,ty,tz=2*(qy*z-qz*y),2*(qz*x-qx*z),2*(qx*y-qy*x)
 return (x+qw*tx+qy*tz-qz*ty+p.get('x',0),y+qw*ty+qz*tx-qx*tz+p.get('y',0),z+qw*tz+qx*ty-qy*tx+p.get('z',0))
chain=[]
def find(o,parents=[]):
 if o.get('name')==source_node:return parents+[o.get('transform',{})]
 for c in o.get('_$child',[]):
  v=find(c,parents+[o.get('transform',{})])
  if v:return v
chain=find(scene)
world=[]
for v in verts:
 w=v[:3]
 for t in chain[::-1]:w=transform(w,t)
 world.append(w)
parent=list(range(count))
def root(i):
 while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
 return i
def union(a,b):parent[root(b)]=root(a)
weld={}
for i,v in enumerate(verts):
 k=tuple(round(c/0.001) for c in v[:3])
 if k in weld:union(weld[k],i)
 else:weld[k]=i
for i in range(0,len(subs[0]),3):
 a,c,d=subs[0][i:i+3];union(a,c);union(a,d)
components={}
for i in range(0,len(subs[0]),3):
 tri=subs[0][i:i+3];components.setdefault(root(tri[0]),[]).extend(tri)
components=sorted(components.values(),key=lambda c:-len(c))
for n,c in enumerate(components):
 points=[world[i] for i in set(c)];lo=[min(v[k] for v in points) for k in range(3)];hi=[max(v[k] for v in points) for k in range(3)];center=[sum(v[k] for v in points)/len(points) for k in range(3)]
 print(n,'tri',len(c)//3,'lo',list(map(lambda x:round(x,4),lo)),'hi',list(map(lambda x:round(x,4),hi)),'center',list(map(lambda x:round(x,4),center)))
# Pair disconnected islands by reflected world-space bounds. UV seams are
# welded only for connectivity analysis; the exported vertex data is untouched.
def bounds(c):
 points=[world[i] for i in set(c)]
 return [[min(v[k] for v in points) for k in range(3)],[max(v[k] for v in points) for k in range(3)]]
def mirror_error(a,b):
 alo,ahi=bounds(a);blo,bhi=bounds(b)
 return max(abs(alo[0]+bhi[0]),abs(ahi[0]+blo[0]),*[abs(alo[k]-blo[k]) for k in (1,2)],*[abs(ahi[k]-bhi[k]) for k in (1,2)])
labels=['前部下方饰件','车顶中部饰件','前部两侧饰件','前侧小饰件','前部中央饰件','侧窗上沿饰件','车顶小饰件','后部两侧饰件','前部上层饰条','前部下层饰条','车侧立柱饰件','车侧下沿饰件','前部中央小饰件']
groups=[];seen=set()
for i,c in enumerate(components):
 if i in seen:continue
 lo,hi=bounds(c);members=[i]
 if lo[0]>.01 or hi[0]<-.01:
  candidates=[j for j,d in enumerate(components) if j not in seen and j!=i and len(d)==len(c) and mirror_error(c,d)<.004]
  if len(candidates)==1:members.append(candidates[0])
  elif part_code=='044':raise ValueError(f'Cannot uniquely pair island {i}: {candidates}')
 seen.update(members)
 groups.append({'code':f'{part_code}-{len(groups)+1:02}','name':labels[len(groups)] if part_code=='044' else ('后包围下饰件' if len(groups)==0 else f'车窗饰件 {len(groups):02}') if part_code=='027' else f'尾门饰件 {len(groups)+1:02}','paired':len(members)==2,'members':[{'island':j,'indices':components[j],'bounds':bounds(components[j])} for j in members]})
if part_code=='044':assert len(groups)==13 and sum(g['paired'] for g in groups)==8
assert sorted(tuple(subs[0][i:i+3]) for i in range(0,len(subs[0]),3))==sorted(tuple(m['indices'][i:i+3]) for g in groups for m in g['members'] for i in range(0,len(m['indices']),3))
for group in groups:
 if not group['paired']:continue
 left_points,right_points=([world[i] for i in set(m['indices'])] for m in group['members'])
 def mirror_distance(p,q):return math.dist((-p[0],p[1],p[2]),q)
 error=max(max(min(mirror_distance(p,q) for q in right_points) for p in left_points),max(min(mirror_distance(p,q) for q in left_points) for p in right_points))
 assert error<.004
 group['mirrorSurfaceErrorWorld']=error
import hashlib
manifest={'version':1,'sourceMesh':str(p.relative_to(ROOT)),'sourceSha256':hashlib.sha256(b).hexdigest(),'partId':source_id,'vertexCount':count,'indexCount':len(subs[0]),'weldToleranceLocal':.001,'mirrorToleranceWorld':.004,'groups':groups}
out=ROOT/'resources/parts'/f'{part_code}.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
print('Wrote',out.relative_to(ROOT),out.stat().st_size,'bytes;',len(groups),'groups; all',len(subs[0])//3,'triangles preserved')
