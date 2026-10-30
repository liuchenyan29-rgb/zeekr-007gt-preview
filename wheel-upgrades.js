/* A CC0 imported wheel and two original classic-style adaptations. */
const WheelUpgrades={
  names:{VFS2:'VFS2 · 细辐',VFS4:'VFS4 · 内凹',R3D:'精细多辐 · 亮银',R3D_DARK:'精细多辐 · 钛灰',PUBLIC:'双五辐 · CC0',SIX:'经典六辐',MESH:'交叉网格'},
  cache:null,
  async imported(){
    if(!this.cache)this.cache=(async()=>{
      const [v,i,texture,metal]=await Promise.all([fetch('resources/wheels/alloy.vertices.bin?v=2').then(r=>{if(!r.ok)throw Error('轮毂顶点加载失败');return r.arrayBuffer();}),fetch('resources/wheels/alloy.indices.bin?v=2').then(r=>{if(!r.ok)throw Error('轮毂索引加载失败');return r.arrayBuffer();}),Laya.loader.load({url:'resources/wheels/alloy-color.jpg?v=3',type:Laya.Loader.TEXTURE2D,constructParams:[0,0,Laya.TextureFormat.R8G8B8A8,true,false,true]}),Laya.loader.load({url:'resources/wheels/alloy-metal-gloss.png?v=3',type:Laya.Loader.TEXTURE2D,constructParams:[0,0,Laya.TextureFormat.R8G8B8A8,true,false,false]})]);
      const mesh=Laya.PrimitiveMesh._createMesh(Laya.VertexMesh.getVertexDeclaration('POSITION,NORMAL,UV'),new Float32Array(v),this.rimOnly(new Float32Array(v),new Uint16Array(i)));
      const material=this.material('#d6d7d9');material.albedoColor=new Laya.Color(1,1,1,1);material.albedoTexture=texture;material.metallicGlossTexture=metal;material.metallic=1;material.smoothness=1;
      return {mesh,material};
    })().catch(error=>{this.cache=null;throw error;});
    return this.cache;
  },
  detailedCache:null,
  async detailed(){
    if(!this.detailedCache)this.detailedCache=(async()=>{
      const response=await fetch('resources/wheels/r3d/model.json?v=3');if(!response.ok)throw Error('精细轮毂清单加载失败');const data=await response.json();
      const materials=await Promise.all(data.materials.map(async def=>{
        const m=new Laya.PBRStandardMaterial();m.name='R3D wheel material';
        m.albedoColor=new Laya.Color(...def.factor.slice(0,3).map(v=>Laya.Color.linearToGammaSpace(v)),def.factor[3]);m.metallic=def.metallic;m.smoothness=1-def.roughness;m.cull=Laya.RenderState.CULL_NONE;
        const load=(file,sRGB)=>Laya.loader.load({url:'resources/wheels/r3d/'+file,type:Laya.Loader.TEXTURE2D,constructParams:[0,0,Laya.TextureFormat.R8G8B8A8,true,false,sRGB]});
        if(def.color)m.albedoTexture=await load(def.color,true);
        if(def.metalGloss){m.metallicGlossTexture=await load(def.metalGloss,false);m.smoothness=1-def.roughness;}
        return m;
      }));
      materials[3].albedoTexture=null;materials[3].albedoColor=new Laya.Color(.78,.80,.83,1);materials[3].metallic=.95;materials[3].smoothness=.78;materials[3].clearCoatEnable=true;materials[3].clearCoat=.3;materials[3].clearCoatRoughness=.12;
      const parts=[];for(const part of data.parts){
        const [v,i]=await Promise.all([fetch('resources/wheels/r3d/'+part.vertexFile+'?v=3').then(r=>r.arrayBuffer()),fetch('resources/wheels/r3d/'+part.indexFile).then(r=>r.arrayBuffer())]);
        parts.push({name:part.name,material:part.material,mesh:Laya.PrimitiveMesh._createMesh(Laya.VertexMesh.getVertexDeclaration('POSITION,NORMAL,UV'),new Float32Array(v),new Uint16Array(i))});
      }return {data,materials,parts};
    })().catch(error=>{this.detailedCache=null;throw error;});
    return this.detailedCache;
  },
  async buildDetailed(root,type){
    const model=await this.detailed(),anchors=this.anchors(root);
    const hide=node=>{const r=node.getComponent(Laya.MeshRenderer);if(r&&!r.sharedMaterials.some(m=>m?.url?.includes('/tire.lmat')))r.enabled=false;for(let i=0;i<node.numChildren;i++)hide(node.getChildAt(i));};hide(root);
    const materials=model.materials.map((m,i)=>{
      if(i!==3||type!=='R3D_DARK')return m;
      const result=m.clone();result.albedoColor=new Laya.Color(.35,.37,.39,1);result.smoothness=.72;return result;
    });
    for(const anchor of anchors)for(const part of model.parts.filter(part=>['RIM','RIM2','LOGO'].includes(part.name))){
      const node=root.addChild(new Laya.MeshSprite3D(part.mesh,'Tire precision '+part.name));node.meshRenderer.sharedMaterial=materials[part.material];node._aftermarketRim=true;node._rimFraction=model.data.rimFraction;
      node.transform.position=anchor.center;const scale=anchor.diameter/root.transform.localScale.x;node.transform.localScale=new Laya.Vector3(scale,scale,scale);
      if(anchor.side<0)node.transform.localRotationEuler=new Laya.Vector3(0,180,0);
    }
    return root;
  },
  rimOnly(vertices,indices){
    const result=[];
    for(let i=0;i<indices.length;i+=3){const tri=Array.from(indices.slice(i,i+3));if(tri.every(index=>Math.hypot(vertices[index*8+1],vertices[index*8+2])<.385))result.push(...tri);}
    return new Uint16Array(result);
  },
  vossenCache:new Map(),
  async buildVossen(root,type){
    const code=type.toLowerCase(),anchors=this.anchors(root);
    if(!this.vossenCache.has(type))this.vossenCache.set(type,(async()=>{
      const response=await fetch('resources/wheels/vossen/'+code+'/model.json');if(!response.ok)throw Error('轮圈资源清单加载失败');const data=await response.json(),materials=[];
      for(const def of data.materials){
        const material=this.material(def.color);material.metallic=def.metallic;material.smoothness=def.smoothness;material.clearCoatEnable=true;material.clearCoat=.35;material.clearCoatRoughness=.1;
        if(def.texture){material.albedoColor=new Laya.Color(1,1,1,1);material.albedoTexture=await Laya.loader.load({url:'resources/wheels/vossen/'+code+'/'+def.texture,type:Laya.Loader.TEXTURE2D,constructParams:[0,0,Laya.TextureFormat.R8G8B8A8,true,false,true]});}
        materials.push(material);
      }
      const parts=[];
      for(const part of data.parts){
        const [v,i]=await Promise.all([fetch('resources/wheels/vossen/'+code+'/'+part.vertexFile).then(r=>{if(!r.ok)throw Error('轮圈顶点未能加载');return r.arrayBuffer();}),fetch('resources/wheels/vossen/'+code+'/'+part.indexFile).then(r=>{if(!r.ok)throw Error('轮圈索引未能加载');return r.arrayBuffer();})]);
        parts.push({material:part.material,mesh:Laya.PrimitiveMesh._createMesh(Laya.VertexMesh.getVertexDeclaration('POSITION,NORMAL,UV'),new Float32Array(v),new Uint16Array(i))});
      }
      return {parts,materials};
    })().catch(error=>{this.vossenCache.delete(type);throw error;}));
    const model=await this.vossenCache.get(type);
    const hide=node=>{const r=node.getComponent(Laya.MeshRenderer);if(r&&!r.sharedMaterials.some(m=>m?.url?.includes('/tire.lmat')))r.enabled=false;for(let i=0;i<node.numChildren;i++)hide(node.getChildAt(i));};hide(root);
    for(const anchor of anchors)for(const part of model.parts){
      const node=root.addChild(new Laya.MeshSprite3D(this.fitRimDepth(part.mesh,anchor,19*.0254),'Tire rim '+type));node.meshRenderer.sharedMaterial=model.materials[part.material];node._aftermarketRim=true;node._rimFraction=19*.0254/(2*anchor.diameter);node._ownsSourceMesh=true;
      node.transform.position=anchor.center;const scale=19*.0254/root.transform.localScale.x;node.transform.localScale=new Laya.Vector3(scale,scale,scale);
      if(anchor.side<0)node.transform.localRotationEuler=new Laya.Vector3(0,180,0);
    }
    return root;
  },
  fitRimDepth(source,anchor,diameter){
    const mesh=source.clone(),v=new Float32Array(mesh.getVertices()),stride=mesh._vertexBuffer.vertexDeclaration.vertexStride/4;
    const front=anchor.width/2-.004,hub=front-.024,back=-anchor.width/2+.012;
    for(let k=0;k<v.length;k+=stride){
      const x=v[k],slope=x>=0?(front-hub)/.2:(hub-back)/.2;
      v[k]=(hub+x*slope)/diameter;
      const nx=v[k+3]*diameter/slope,ny=v[k+4],nz=v[k+5],length=Math.hypot(nx,ny,nz)||1;v[k+3]=nx===0&&ny===0&&nz===0?1:nx/length;v[k+4]=ny/length;v[k+5]=nz/length;
    }
    mesh.setVertices(v.buffer);mesh.calculateBounds();return mesh;
  },
  material(hex){const m=new Laya.PBRStandardMaterial();m.albedoColor=new Laya.Color(...[1,3,5].map(k=>parseInt(hex.slice(k,k+2),16)/255),1);m.metallic=.88;m.smoothness=.78;m.cull=Laya.RenderState.CULL_NONE;return m;},
  anchors(root){
    const out=[];
    const visit=node=>{const r=node.getComponent(Laya.MeshRenderer);if(r&&r.sharedMaterials.some(m=>m?.url?.includes('/tire.lmat'))){const a=r.bounds.getMin(),b=r.bounds.getMax();const center=new Laya.Vector3((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2),mesh=node.getComponent(Laya.MeshFilter).sharedMesh,v=new Float32Array(mesh.getVertices()),stride=mesh._vertexBuffer.vertexDeclaration.vertexStride/4,e=node.transform.worldMatrix.elements;let bead=Infinity;
      for(let k=0;k<v.length;k+=stride){const x=v[k],y=v[k+1],z=v[k+2],wy=e[1]*x+e[5]*y+e[9]*z+e[13],wz=e[2]*x+e[6]*y+e[10]*z+e[14];bead=Math.min(bead,Math.hypot(wy-center.y,wz-center.z));}
      node._tireBead=bead;node._wheelCenter=center;out.push({center,bead,width:b.x-a.x,diameter:b.y-a.y,side:a.x+b.x<0?-1:1});}for(let i=0;i<node.numChildren;i++)visit(node.getChildAt(i));};visit(root);
    document.documentElement.dataset.wheelAnchors=JSON.stringify(out);if(out.length!==4)throw Error('原厂四轮定位未能识别');return out;
  },
  geometry(type){
    const vertices=[],indices=[];
    const quad=(a,b,c,d)=>{const u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1,start=vertices.length/8;for(const p of [a,b,c,d])vertices.push(...p,...n.map(x=>x/l),0,0);indices.push(start,start+1,start+2,start,start+2,start+3);};
    const point=(x,r,a)=>[x,r*Math.cos(a),r*Math.sin(a)];
    const torus=(x,r,t)=>{for(let a=0;a<96;a++)for(let b=0;b<8;b++){const p=(i,j)=>point(x+t*Math.sin(j*Math.PI/4),r+t*Math.cos(j*Math.PI/4),i*Math.PI/48);quad(p(a,b),p(a+1,b),p(a+1,b+1),p(a,b+1));}};
    torus(.145,.34,.012);torus(-.11,.34,.01);torus(.14,.07,.01);
    // Barrel connects both lips without filling the open spoke face.
    for(let i=0;i<96;i++){const a=i*Math.PI/48,b=(i+1)*Math.PI/48;quad(point(-.11,.335,a),point(.145,.335,a),point(.145,.335,b),point(-.11,.335,b));}
    const count=type==='SIX'?6:20,width=type==='SIX'?.034:.010;
    for(let i=0;i<count;i++){
      const a=i*Math.PI*2/count,twist=type==='SIX'?0:(i%2?.20:-.20),inner=point(.105,.073,a+twist),outer=point(.145,.331,a-twist),side=[0,-Math.sin(a)*width/2,Math.cos(a)*width/2];
      const p=[inner.map((x,k)=>x+side[k]),outer.map((x,k)=>x+side[k]),outer.map((x,k)=>x-side[k]),inner.map((x,k)=>x-side[k])],back=p.map(v=>[v[0]-.025,v[1],v[2]]);
      quad(...p);quad(back[3],back[2],back[1],back[0]);for(let k=0;k<4;k++)quad(p[k],back[k],back[(k+1)%4],p[(k+1)%4]);
    }
    for(let i=0;i<64;i++){const a=i*Math.PI/32,b=(i+1)*Math.PI/32;quad(point(.135,0,a),point(.135,.065,a),point(.135,.065,b),point(.135,0,b));}
    return Laya.PrimitiveMesh._createMesh(Laya.VertexMesh.getVertexDeclaration('POSITION,NORMAL,UV'),new Float32Array(vertices),new Uint16Array(indices));
  },
  async build(root,type){
    if(type==='VFS2'||type==='VFS4')return this.buildVossen(root,type);
    if(type==='R3D'||type==='R3D_DARK')return this.buildDetailed(root,type);
    const anchors=this.anchors(root),imported=type==='PUBLIC'?await this.imported():null;
    const visit=node=>{const r=node.getComponent(Laya.MeshRenderer);if(r&&!r.sharedMaterials.some(m=>m?.url?.includes('/tire.lmat')))r.enabled=false;for(let i=0;i<node.numChildren;i++)visit(node.getChildAt(i));};visit(root);
    const mesh=imported?.mesh||this.geometry(type),material=imported?.material||this.material(type==='SIX'?'#9d8052':'#c8cbd0');
    for(const anchor of anchors){
      const node=root.addChild(new Laya.MeshSprite3D(mesh,'Tire upgrade '+type));node.meshRenderer.sharedMaterial=material;node._aftermarketRim=true;node._rimFraction=type==='PUBLIC'?.2286/.637708:.34;
      node.transform.position=anchor.center;node.transform.localScale=new Laya.Vector3(...[0,1,2].map(()=>anchor.diameter/root.transform.localScale.x));
      if(anchor.side<0)node.transform.localRotationEuler=new Laya.Vector3(0,180,0);
    }
    return root;
  }
};
