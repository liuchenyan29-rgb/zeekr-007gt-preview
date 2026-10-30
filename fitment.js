/* Suspension/ET offsets in mm; rim diameter in inches, fixed tire exterior. */
const Fitment={
  height:0,et:0,rimInches:19,bodies:[],wheels:[],
  clamp(value,min,max){return Math.max(min,Math.min(max,Number.isFinite(Number(value))?Number(value):0));},
  remapRadius(r,inner,outer,target){
    if(r<=inner)return r*target/inner;
    if(r>=outer)return r;
    return target+(r-inner)*(outer-target)/(outer-inner);
  },
  init(roots){this.bodies=roots.map(node=>({node,base:node.transform.position.clone()}));},
  registerWheels(root){
    this.wheels=[];
    const visit=node=>{
      const renderer=node.getComponent(Laya.MeshRenderer);
      if(renderer&&renderer.enabled!==false){
        const min=renderer.bounds.getMin(),max=renderer.bounds.getMax();
        this.wheels.push({node,base:node.transform.position.clone(),renderer,min:{x:min.x,y:min.y,z:min.z},max:{x:max.x,y:max.y,z:max.z},side:(min.x+max.x)<0?-1:1});
      }
      for(let i=0;i<node.numChildren;i++)visit(node.getChildAt(i));
    };visit(root);
    const groups=new Map();
    for(const wheel of this.wheels){const key=wheel.side+':'+((wheel.min.z+wheel.max.z)>0?'rear':'front');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(wheel);}
    for(const members of groups.values()){
      const lo={},hi={};for(const axis of ['x','y','z']){lo[axis]=Math.min(...members.map(w=>w.min[axis]));hi[axis]=Math.max(...members.map(w=>w.max[axis]));}
      const center={x:(lo.x+hi.x)/2,y:(lo.y+hi.y)/2,z:(lo.z+hi.z)/2},outer=(hi.y-lo.y)/2;
      for(const wheel of members){
        Object.assign(wheel,{center,outer,inner:wheel.node._rimFraction?2*outer*wheel.node._rimFraction:19*.0254/2});
        const filter=wheel.node.getComponent(Laya.MeshFilter);
        if(!filter?.sharedMesh)continue;
        const source=filter.sharedMesh,mesh=source.clone();filter.sharedMesh=mesh;wheel.mesh=mesh;if(wheel.node._ownsSourceMesh){source.destroy();wheel.node._ownsSourceMesh=false;}
        wheel.original=new Float32Array(mesh.getVertices());wheel.working=new Float32Array(wheel.original);wheel.stride=mesh._vertexBuffer.vertexDeclaration.vertexStride/4;
        const matrix=wheel.node.transform.worldMatrix.clone(),inverse=matrix.clone();matrix.invert(inverse);wheel.inverse=inverse.elements;
        wheel.world=new Float32Array(mesh.vertexCount*3);
        const e=matrix.elements,v=wheel.original;
        for(let i=0,k=0;i<v.length;i+=wheel.stride,k+=3){const x=v[i],y=v[i+1],z=v[i+2];wheel.world[k]=e[0]*x+e[4]*y+e[8]*z+e[12];wheel.world[k+1]=e[1]*x+e[5]*y+e[9]*z+e[13];wheel.world[k+2]=e[2]*x+e[6]*y+e[10]*z+e[14];}
        if(wheel.node._tireBead){wheel.inner=wheel.node._tireBead;wheel.lipOffset=wheel.inner-19*.0254/2;}
      }
      const rims=members.filter(w=>w.node._aftermarketRim&&w.world);
      let rimRadius=0;for(const w of rims)for(let k=0;k<w.world.length;k+=3)rimRadius=Math.max(rimRadius,Math.hypot(w.world[k+1]-center.y,w.world[k+2]-center.z));
      for(const w of rims){w.inner=rimRadius;w.rimOnly=true;w.lipOffset=(members.find(m=>m.node._tireBead)?.node._tireBead??19*.0254/2)-19*.0254/2+.002;
      }
    }
    this.appliedRim=null;this.apply();
  },
  deformRims(){
    if(this.appliedRim===this.rimInches)return;
    for(const wheel of this.wheels){
      if(!wheel.mesh)continue;
      const {world,original,stride,center,inner,outer,inverse:e}=wheel,target=Math.min(this.rimInches*.0254/2+(wheel.lipOffset||0),outer*.92),v=wheel.working;
      for(let i=0,k=0;i<v.length;i+=stride,k+=3){
        const wx=world[k],dy=world[k+1]-center.y,dz=world[k+2]-center.z,r=Math.hypot(dy,dz),scale=r>1e-8?(wheel.rimOnly?r*target/inner:this.remapRadius(r,inner,outer,target))/r:1,y=center.y+dy*scale,z=center.z+dz*scale;
        v[i]=e[0]*wx+e[4]*y+e[8]*z+e[12];v[i+1]=e[1]*wx+e[5]*y+e[9]*z+e[13];v[i+2]=e[2]*wx+e[6]*y+e[10]*z+e[14];
      }
      wheel.mesh.setVertices(v.buffer);wheel.mesh.calculateBounds();
      if(typeof LocalPaint!=='undefined')LocalPaint.geometry.delete(wheel.mesh);
    }
    this.appliedRim=this.rimInches;
    document.documentElement.dataset.rimFit=JSON.stringify(this.wheels.filter(w=>w.node._tireBead||w.rimOnly).map(w=>({side:w.side,tire:!!w.node._tireBead,radius:Math.min(this.rimInches*.0254/2+(w.lipOffset||0),w.outer*.92),outer:w.outer})));
  },
  apply(){
    for(const {node,base} of this.bodies){const p=base.clone();p.y+=this.height/1000;node.transform.position=p;}
    for(const {node,base,side} of this.wheels){const p=base.clone();p.x-=side*this.et/1000;node.transform.position=p;}
    this.deformRims();
    document.documentElement.dataset.fitment=JSON.stringify({heightMm:this.height,etDeltaMm:this.et,rimInches:this.rimInches,tireOuterDiameterFixed:true,wheelRegions:this.wheels.length});
  },
  tick(dt,target){
    const size=this.clamp(target.rimInches??19,18,22);
    if(this.height===target.rideHeight&&this.et===target.etDelta&&this.rimInches===size)return;
    const ease=1-Math.exp(-dt/90);
    this.height+=(target.rideHeight-this.height)*ease;this.et+=(target.etDelta-this.et)*ease;this.rimInches=size;
    if(Math.abs(target.rideHeight-this.height)<.01)this.height=target.rideHeight;
    if(Math.abs(target.etDelta-this.et)<.01)this.et=target.etDelta;
    if(Math.abs(size-this.rimInches)<.01)this.rimInches=size;
    this.apply();
  }
};
