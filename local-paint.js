/* Mesh/submesh picking and isolated material overrides; no physics service is
   required. Ray tests use the same world transforms as the rendered model. */
const LocalPaint = {
  initialized:false, enabled:false, selected:null, hovered:null,
  entries:[], parts:new Map(), overrides:new Map(), geometry:new WeakMap(),
  groups:[], highlights:[], splits:new Map(),
  pointer:null, down:null, pointerIds:new Set(), nextPick:0, carbon:null,

  async init({host,camera,shell,interior,wheels,wheelType,getGlobal,onChange,stopRotation}) {
    Object.assign(this,{host,camera,getGlobal,onChange,stopRotation});
    this.ray=new Laya.Ray(new Laya.Vector3(),new Laya.Vector3());
    this.localRay=new Laya.Ray(new Laya.Vector3(),new Laya.Vector3());
    this.initialized=true;
    this.registerRoot(shell,'shell');this.registerRoot(interior,'interior');
    this.registerRoot(wheels,'wheels/'+wheelType);
    document.documentElement.dataset.componentCatalog=JSON.stringify([...this.parts.values()].map(part=>({number:part.number,id:part.id,node:part.node.name,mesh:part.mesh.url,slot:part.slot,label:part.label})));
    this.buildGroups();
    await this.splitComponent('044');
    await this.splitComponent('113');
    await this.splitComponent('027');
    this.buildRequestedGroups();
    document.getElementById('part-mode').disabled=false;
    document.getElementById('part-mode').onclick=()=>this.toggle();
    document.getElementById('part-reset').onclick=()=>this.resetSelected();
    document.getElementById('part-clear').onclick=()=>this.clearAll();
    document.querySelectorAll('[data-local-material]').forEach(button=>button.onclick=()=>this.setMaterial(button.dataset.localMaterial));
    host.addEventListener('pointermove',event=>{
      if(!this.enabled)return;
      const rect=host.getBoundingClientRect();
      this.pointer={x:event.clientX-rect.left,y:event.clientY-rect.top};
      if(this.down&&Math.hypot(event.clientX-this.down.x,event.clientY-this.down.y)>5)this.down.moved=true;
    });
    host.addEventListener('pointerdown',event=>{if(!this.enabled)return;this.pointerIds.add(event.pointerId);if(this.pointerIds.size===1)this.down={x:event.clientX,y:event.clientY,moved:false,multi:false};else if(this.down)this.down.multi=true;});
    host.addEventListener('pointerup',event=>{
      if(this.enabled&&this.down&&!this.down.moved&&!this.down.multi){
        const rect=host.getBoundingClientRect();
        this.select(this.pick(event.clientX-rect.left,event.clientY-rect.top));
      }
      this.pointerIds.delete(event.pointerId);this.down=null;
    });
    host.addEventListener('pointerleave',()=>{this.pointer=null;this.setHover(null);});
    host.addEventListener('pointercancel',event=>{this.pointerIds.delete(event.pointerId);this.down=null;});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&this.enabled)this.toggle(false);});
    this.updateUI();
  },

  label(node,mesh,material,index) {
    let path='';for(let n=node;n&&n.name!=='007GT';n=n.parent)path=n.name+'/'+path;
    const url=mesh.url||'';
    const matUrl=material.url||'';
    let name;
    if(/Mirror_LF/.test(path))name='左后视镜';
    else if(/Mirror_RF/.test(path))name='右后视镜';
    else if(/Door_LF/.test(path))name='左前车门';
    else if(/Door_RF/.test(path))name='右前车门';
    else if(/Door_LB/.test(path))name='左后车门';
    else if(/Door_RB/.test(path))name='右后车门';
    else if(/Hood/.test(path))name='前机盖';
    else if(/Trunk/.test(path))name='后尾门';
    else if(/Tire/.test(path))name=/tire\.lmat/.test(matUrl)?'轮胎':/kaqian/.test(matUrl)?'制动卡钳':'轮毂';
    else if(/glass_top/.test(matUrl))name='全景天幕';
    else if(/glass_qian/.test(matUrl))name='前挡风玻璃';
    else if(/glass_hou/.test(matUrl))name='后挡风玻璃';
    else if(/BUMPER_FRONT/.test(url))name='前保险杠';
    else if(/BUMPER_REAR/.test(url))name='后保险杠';
    else if(/FENDER/.test(url))name='翼子板';
    else if(/RAIL|ROOF/.test(url))name='车顶组件';
    else if(/BODY_SIDE/.test(url))name='车身侧围';
    else if(/SILL/.test(url))name='侧裙';
    else if(/light_WG|deng/.test(path+matUrl))name='灯组组件';
    else if(/INS/.test(path))name='内饰组件';
    else name='车身组件';
    return name+' · '+String(index).padStart(3,'0');
  },

  registerRoot(root,prefix) {
    if(!root)return;
    const visit=(node,path)=>{
      const renderer=node.getComponent(Laya.MeshRenderer);
      const mesh=node.getComponent(Laya.MeshFilter)?.sharedMesh;
      if(renderer&&mesh&&renderer.enabled&&node.activeInHierarchy){
        const inverse=new Laya.Matrix4x4();node.transform.worldMatrix.invert(inverse);
        const min=renderer.bounds.getMin(),max=renderer.bounds.getMax();
        const entry={node,renderer,mesh,inverse,min:[min.x,min.y,min.z],max:[max.x,max.y,max.z],parts:[]};
        const materials=renderer.sharedMaterials;
        for(let slot=0;slot<Math.min(materials.length,mesh.subMeshCount);slot++){
          const base=materials[slot];
          if(!base||base.getColor('u_AlbedoColor')?.a<.02)continue;
          const id=prefix+'/'+path+'#'+slot;
          const number=this.parts.size+1;
          const part={id,node,renderer,mesh,slot,base,edited:null,number,label:this.label(node,mesh,base,number)};
          entry.parts.push(part);this.parts.set(id,part);
          if(this.overrides.has(id))this.applyPart(part,this.overrides.get(id));
        }
        if(entry.parts.length)this.entries.push(entry);
      }
      for(let i=0;i<node.numChildren;i++)visit(node.getChildAt(i),path+'/'+i);
    };
    visit(root,'0');this.updateUI();
  },

  buildGroups() {
    // Stable mesh/slot IDs for the existing UI components 041, 014 and 015.
    // Keep each mesh intact so picking, geometry transforms and saved IDs work.
    const ids=['shell/0/0/0/35#0','shell/0/0/0/13#0','shell/0/0/0/14#0'];
    const members=ids.map(id=>this.parts.get(id));
    if(members.some(part=>!part))return;
    const group={id:'group/G01',code:'G01',label:'组件组 · G01',hint:'前后包围及侧裙联动调整',members};
    this.groups.push(group);
    for(const part of members){part.group=group;part.originalLabel=part.label;part.label=group.label;}
    document.documentElement.dataset.paintGroup=JSON.stringify(members.map(part=>({number:part.number,node:part.node.name,id:part.id})));
  },

  async splitComponent(code) {
    const response=await fetch('resources/parts/'+code+'.json');
    if(!response.ok)throw Error(code+' 组件分区数据未能加载');
    const data=await response.json(),source=this.parts.get(data.partId);
    if(!source||source.mesh.vertexCount!==data.vertexCount||source.mesh.getSubMesh(source.slot).indexCount!==data.indexCount)throw Error(code+' 分区与模型不匹配');
    const entry=this.entries.find(item=>item.parts.includes(source));
    const oldParts=[...entry.parts],oldMaterials=source.renderer.sharedMaterials;
    const records=data.groups.flatMap(group=>group.members.map(member=>({group,member,indices:member.indices})));
    // Retain every other material slot, e.g. the original 045 light detail.
    for(let slot=0;slot<source.mesh.subMeshCount;slot++)if(slot!==source.slot){
      records.push({part:oldParts.find(part=>part.slot===slot),base:oldMaterials[slot],indices:source.mesh.getSubMesh(slot).getIndices()});
    }
    const original=Array.from(source.mesh.getSubMesh(source.slot).getIndices());
    const triangles=indices=>{
      const result=[];for(let i=0;i<indices.length;i+=3)result.push(indices.slice(i,i+3).join(','));
      return result.sort().join(';');
    };
    if(triangles(original)!==triangles(records.filter(record=>record.member).flatMap(record=>record.indices)))throw Error(code+' 分区未完整覆盖原始网格');
    // Clone the complete vertex buffer: positions, normals and both UV sets
    // remain bit-for-bit unchanged. Only triangle/material ranges are separated.
    const mesh=source.mesh.clone();
    const before=new Uint8Array(source.mesh.getVertices()),after=new Uint8Array(mesh.getVertices());
    if(before.length!==after.length||!before.every((value,index)=>value===after[index]))throw Error(code+' 拆分时顶点属性发生变化');
    mesh.name=code+' independent regions';
    mesh.setIndices(new Uint16Array(records.flatMap(record=>Array.from(record.indices))));
    for(const sub of mesh._subMeshes)sub.destroy();
    let start=0;
    const subMeshes=records.map(record=>{
      const sub=new Laya.SubMesh(mesh);
      sub._vertexBuffer=mesh._vertexBuffer;sub._indexBuffer=mesh._indexBuffer;
      sub._setIndexRange(start,record.indices.length,mesh.indexFormat);
      sub._subIndexBufferStart=[start];sub._subIndexBufferCount=[record.indices.length];sub._boneIndicesList=[new Uint16Array(0)];
      start+=record.indices.length;return sub;
    });
    mesh._setSubMeshes(subMeshes);mesh.calculateBounds();
    source.node.getComponent(Laya.MeshFilter).sharedMesh=mesh;
    source.renderer.sharedMaterials=records.map(record=>record.member?source.base:record.base);
    entry.mesh=mesh;entry.parts=[];
    this.parts.delete(source.id);
    const children=[];
    records.forEach((record,slot)=>{
      if(record.member){
        const id=source.id+'/'+record.group.code+'/island-'+record.member.island;
        const label=record.group.code+' · '+record.group.name+(record.group.paired?'（左右）':'');
        const part={...source,id,mesh,slot,number:record.group.code,base:source.base,edited:null,label,group:null,hint:'只调整 '+record.group.code+' 区域；其他 '+code+' 饰件保持独立'};
        children.push(part);entry.parts.push(part);this.parts.set(id,part);
        record.part=part;
      }else if(record.part){
        Object.assign(record.part,{mesh,slot});entry.parts.push(record.part);
      }
    });
    for(const definition of data.groups)if(definition.paired){
      const members=records.filter(record=>record.group===definition).map(record=>record.part);
      const group={id:'group/'+definition.code,label:members[0].label,hint:'左右对称部件同步调整；其他 '+code+' 区域保持独立',members};
      this.groups.push(group);for(const part of members)part.group=group;
    }
    this.splits.set(source.id,children);
    const config=this.overrides.get(source.id);
    if(config){this.overrides.delete(source.id);for(const part of children)this.applyPart(part,config);}
    source.edited?.destroy();
    document.documentElement.dataset['split'+code]=JSON.stringify({pieces:children.length,groups:data.groups.length,paired:data.groups.filter(group=>group.paired).length,triangles:original.length/3,verticesPreserved:true});
  },

  members(part) { return part?(part.group?.members||[part]):[]; },
  sameGroup(a,b) { return a===b||!!(a&&b&&a.group&&a.group===b.group); },
  isHidden(part) { return this.overrides.get(part.id)?.material==='hidden'; },

  mergeGroup(id,label,hint,targets) {
    if(targets.some(part=>!part))throw Error('组件组成员未找到：'+label);
    const members=[...new Set(targets.flatMap(part=>this.members(part)))];
    const previous=new Set(members.map(part=>part.group).filter(Boolean));
    this.groups=this.groups.filter(group=>!previous.has(group));
    const group={id,code:id.split('/').pop(),label,hint,members};this.groups.push(group);
    for(const part of members){part.originalLabel??=part.label;part.group=group;part.label=label;}
    return group;
  },

  buildRequestedGroups() {
    const region=code=>[...this.parts.values()].find(part=>part.number===code);
    const first=this.mergeGroup('group/G02','组件组 · G02',
      '车身下沿饰件左右联动调整',
      [region('044-08'),this.parts.get('shell/0/4/6#0'),this.parts.get('shell/0/5/2#0'),region('044-12'),this.parts.get('shell/0/3/10#0'),this.parts.get('shell/0/2/1#0')]);
    const second=this.mergeGroup('group/G03','组件组 · G03',
      '车窗及其余原 G03 饰件联动调整；后包围下饰件已独立为 G06',
      [this.parts.get('shell/0/0/0/16#0'),...[...this.parts.values()].filter(part=>String(part.number).startsWith('027-')&&part.number!=='027-01')]);
    const third=this.mergeGroup('group/G04','组件组 · G04','侧窗与尾门对应饰件同步调整',
      [region('044-06'),region('113-03')]);
    const fourth=this.mergeGroup('group/G05','组件组 · G05','侧围、尾翼和尾门饰件同步调整',
      ['shell/0/0/0/34#0','shell/0/0/0/12#0','shell/0/7/8#1'].map(id=>this.parts.get(id)));
    const lower=this.mergeGroup('group/G06','组件组 · G06','后保险杠下方饰件独立调整',
      [this.parts.get('shell/0/0/0/15#0'),region('027-01')]);
    document.documentElement.dataset.requestedGroups=JSON.stringify([this.groups.find(group=>group.code==='G01'),first,second,third,fourth,lower].map(group=>({code:group.code,label:group.label,members:group.members.map(part=>({id:part.id,number:part.number,node:part.node.name}))})));
  },

  unregisterWheels() {
    if(!this.initialized)return;
    if(this.hovered?.id.startsWith('wheels/'))this.setHover(null);
    if(this.selected?.id.startsWith('wheels/'))this.selected=null;
    this.entries=this.entries.filter(entry=>!entry.parts[0]?.id.startsWith('wheels/'));
    for(const [id] of this.parts)if(id.startsWith('wheels/'))this.parts.delete(id);
    this.updateUI();
  },

  toggle(value=!this.enabled) {
    this.enabled=value;this.setHover(null);this.pointer=null;
    if(value)this.stopRotation();
    this.updateUI();this.onChange();
  },

  updateUI() {
    if(!this.initialized)return;
    const element=id=>document.getElementById(id);
    element('part-mode').setAttribute('aria-checked',String(this.enabled));
    element('part-info').hidden=!this.enabled;
    element('local-materials').hidden=!this.enabled;
    element('part-selected').textContent=this.selected?.label||'点击车身，选择一个部件';
    element('part-hint').textContent=this.selected?.group?.hint||this.selected?.hint||(this.selected?'只调整已选部件；拖动仍可旋转车辆':'悬停高亮 · 点击锁定 · 然后选择颜色和材质');
    const changedCount=new Set([...this.overrides.keys()].map(id=>this.parts.get(id)?.group?.id||id)).size;
    element('part-count').textContent=changedCount?'已改 '+changedCount+' 处':'尚未局部改色';
    element('part-reset').textContent=this.selected?.group?'恢复此组件组':'恢复此部件';
    element('part-reset').disabled=!this.members(this.selected).some(part=>this.overrides.has(part.id));
    element('part-clear').disabled=!this.overrides.size;
    document.body.classList.toggle('local-editing',this.enabled);
    document.body.classList.toggle('local-waiting',this.enabled&&!this.selected);
    element('color-section-label').textContent=this.enabled?'部件颜色':'车身颜色';
    element('finish-section-label').textContent=this.enabled?'部件材质':'车漆质感';
    const type=this.currentConfig()?.material;
    document.querySelectorAll('[data-local-material]').forEach(button=>button.classList.toggle('selected',button.dataset.localMaterial===type));
    const hidden=new Map();
    for(const part of this.parts.values())if(this.isHidden(part))hidden.set(part.group?.id||part.id,part);
    element('hidden-parts').hidden=!this.enabled||!hidden.size;
    const list=element('hidden-part-list');list.replaceChildren();
    for(const part of hidden.values()){
      const button=document.createElement('button');button.type='button';button.textContent=part.group?.code||part.label;
      button.setAttribute('aria-label','选择已隐藏的'+part.label);button.onclick=()=>this.select(part);list.append(button);
    }
    this.host.style.cursor=this.enabled?'crosshair':'grab';
  },

  currentConfig() {
    if(!this.selected)return null;
    if(this.overrides.has(this.selected.id))return this.overrides.get(this.selected.id);
    const part=this.selected;
    if(part.base.name==='Studio car paint')return {...this.getGlobal(),material:this.getGlobal().finish};
    const color=part.base.getColor('Pigment_Color')||part.base.getColor('u_AlbedoColor')||new Laya.Color(.5,.5,.5,1);
    const hex='#'+[color.r,color.g,color.b].map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('');
    return {color:hex,colorName:'原始部件色',finish:'gloss',material:'original'};
  },

  setColor(color,colorName='自定义') {
    if(!this.selected)return;
    const config={...this.currentConfig(),color,colorName};
    if(config.material==='original')config.material='gloss';
    this.apply(this.selected,config);this.onChange();
  },

  setMaterial(material) {
    if(!this.selected)return;
    const config={...this.currentConfig(),material,finish:material==='matte'?'matte':'gloss'};
    this.apply(this.selected,config);this.onChange();
  },

  createCarbon() {
    if(this.carbon)return this.carbon;
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#414449';ctx.fillRect(0,0,128,128);
    for(let y=0;y<128;y+=16)for(let x=0;x<128;x+=16){
      const horizontal=((x+y)/16)%2===0;
      for(let i=0;i<8;i++){
        ctx.strokeStyle=i%2?'#6d7075':'#303338';ctx.lineWidth=1;
        ctx.beginPath();if(horizontal){ctx.moveTo(x,y+i*2);ctx.lineTo(x+16,y+i*2+3);}else{ctx.moveTo(x+i*2,y);ctx.lineTo(x+i*2+3,y+16);}ctx.stroke();
      }
    }
    const texture=new Laya.Texture2D(128,128,Laya.TextureFormat.R8G8B8A8,true,false,true);
    texture.setImageData(canvas,false,false);this.carbon=texture;return texture;
  },

  apply(part,config,notify=true) {
    this.setHover(null);
    for(const member of this.members(part))this.applyPart(member,config);
    if(notify)this.updateUI();
  },

  applyPart(part,config) {
    const material=new Laya.PBRStandardMaterial();material.name='Local '+part.id;
    const channels=[1,3,5].map(offset=>parseInt(config.color.slice(offset,offset+2),16)/255);
    material.albedoColor=new Laya.Color(...channels,config.material==='glass'?.45:1);
    material.metallic=config.material==='metal'?.95:.18;
    material.smoothness=config.material==='matte'?.23:config.material==='gloss'?.92:.72;
    material.clearCoatEnable=true;material.clearCoat=config.material==='matte'?.05:config.material==='gloss'?.85:.45;
    material.clearCoatRoughness=config.material==='matte'?.5:config.material==='gloss'?.07:.24;
    const ao=part.base.getTexture('Occlusion_Map')||part.base.getTexture('u_OcclusionTexture');
    if(ao){material.occlusionTexture=ao;material.occlusionTextureStrength=.65;}
    if(config.material==='carbon'){
      material.albedoTexture=this.createCarbon();material.tilingOffset=new Laya.Vector4(8,8,0,0);
      material.albedoColor=new Laya.Color(channels[0]*.65,channels[1]*.65,channels[2]*.65,1);
      material.metallic=.2;material.smoothness=.67;
    }
    if(config.material==='glass'){material.renderMode=Laya.PBRRenderMode.Fade;material.metallic=0;material.smoothness=.95;}
    if(config.material==='hidden'){
      // Alpha-test discard applies to colour, depth and shadow passes. Keep
      // other slots on the same mesh visible, without glass/specular remnants.
      material.renderMode=Laya.PBRRenderMode.Cutout;material.alphaTestValue=.5;
      material.albedoColor=new Laya.Color(0,0,0,0);
    }
    const materials=part.renderer.sharedMaterials;materials[part.slot]=material;part.renderer.sharedMaterials=materials;
    if(part.edited)part.edited.destroy();part.edited=material;
    this.overrides.set(part.id,{color:config.color,colorName:config.colorName,finish:config.finish,material:config.material});
  },

  resetSelected() {
    if(!this.selected)return;this.setHover(null);
    for(const part of this.members(this.selected)){
      const materials=part.renderer.sharedMaterials;materials[part.slot]=part.base;part.renderer.sharedMaterials=materials;
      part.edited?.destroy();part.edited=null;this.overrides.delete(part.id);
    }
    this.updateUI();this.onChange();
  },

  clearAll() {
    this.setHover(null);
    for(const part of this.parts.values())if(part.edited){const materials=part.renderer.sharedMaterials;materials[part.slot]=part.base;part.renderer.sharedMaterials=materials;part.edited.destroy();part.edited=null;}
    this.overrides.clear();this.updateUI();this.onChange();
  },

  select(part) {
    this.setHover(null);this.selected=part;this.updateUI();this.onChange();
  },

  setHover(part) {
    if(this.sameGroup(part,this.hovered))return;
    for(const {part:old,material} of this.highlights){
      const materials=old.renderer.sharedMaterials;
      materials[old.slot]=old.edited||old.base;old.renderer.sharedMaterials=materials;
      material.destroy();
    }
    this.highlights=[];
    this.hovered=part;
    if(part&&!this.sameGroup(part,this.selected))for(const member of this.members(part)){
      if(this.isHidden(member))continue;
      const material=(member.edited||member.base).clone();
      if(material.shader.name==='carpaintURP')material.setColor('Emissive',new Laya.Color(.02,.32,.27,1));
      else if(material.shader.name==='PBR'){
        material.addDefine(Laya.Shader3D.getDefineByName('EMISSION'));
        material.setColor('u_EmissionColor',new Laya.Color(.02,.42,.34,1));material.setFloat('u_EmissionIntensity',1);
      }else material.setColor('u_AlbedoColor',new Laya.Color(.2,.8,.65,1));
      const materials=member.renderer.sharedMaterials;materials[member.slot]=material;member.renderer.sharedMaterials=materials;
      this.highlights.push({part:member,material});
    }
    document.getElementById('part-tooltip').hidden=!part;
  },

  tick(now) {
    if(!this.enabled||!this.pointer||now<this.nextPick||this.down?.moved)return;
    this.nextPick=now+40;
    const part=this.pick(this.pointer.x,this.pointer.y);this.setHover(part);
    if(part){
      const tooltip=document.getElementById('part-tooltip');
      tooltip.textContent=(this.sameGroup(part,this.selected)?'已选中：':'点击选择：')+part.label;
      tooltip.style.left=Math.min(this.host.clientWidth-210,Math.max(10,this.pointer.x+14))+'px';
      tooltip.style.top=Math.max(10,this.pointer.y-34)+'px';
    }
  },

  boxDistance(ray,min,max) {
    const origin=[ray.origin.x,ray.origin.y,ray.origin.z],direction=[ray.direction.x,ray.direction.y,ray.direction.z];
    let near=0,far=Infinity;
    for(let axis=0;axis<3;axis++){
      if(Math.abs(direction[axis])<1e-10){if(origin[axis]<min[axis]||origin[axis]>max[axis])return Infinity;continue;}
      let a=(min[axis]-origin[axis])/direction[axis],b=(max[axis]-origin[axis])/direction[axis];
      if(a>b)[a,b]=[b,a];near=Math.max(near,a);far=Math.min(far,b);if(near>far)return Infinity;
    }
    return near;
  },

  pick(x,y) {
    const px=x*Laya.stage.width/this.host.clientWidth,py=y*Laya.stage.height/this.host.clientHeight;
    this.camera.viewportPointToRay(new Laya.Vector2(px,py),this.ray);
    for(const entry of this.entries){entry.node.transform.worldMatrix.invert(entry.inverse);const lo=entry.renderer.bounds.getMin(),hi=entry.renderer.bounds.getMax();entry.min=[lo.x,lo.y,lo.z];entry.max=[hi.x,hi.y,hi.z];}
    const candidates=this.entries.map(entry=>({entry,distance:this.boxDistance(this.ray,entry.min,entry.max)})).filter(candidate=>Number.isFinite(candidate.distance)).sort((a,b)=>a.distance-b.distance);
    let closest=Infinity,hit=null;
    for(const {entry,distance} of candidates){
      if(distance>closest)break;
      if(!entry.node.activeInHierarchy||!entry.renderer.enabled)continue;
      let geometry=this.geometry.get(entry.mesh);
      if(!geometry){
        try{const positions=[];entry.mesh.getPositions(positions);geometry={positions,indices:new Map()};this.geometry.set(entry.mesh,geometry);}
        catch(error){console.warn('Part picking unavailable for mesh',entry.mesh.url,error);continue;}
      }
      Laya.Vector3.transformCoordinate(this.ray.origin,entry.inverse,this.localRay.origin);
      const matrix=entry.inverse.elements,direction=this.ray.direction;this.localRay.direction.setValue(matrix[0]*direction.x+matrix[4]*direction.y+matrix[8]*direction.z,matrix[1]*direction.x+matrix[5]*direction.y+matrix[9]*direction.z,matrix[2]*direction.x+matrix[6]*direction.y+matrix[10]*direction.z);
      for(const part of entry.parts){
        if(this.isHidden(part))continue;
        let indices=geometry.indices.get(part.slot);
        if(!indices){indices=entry.mesh.getSubMesh(part.slot).getIndices();geometry.indices.set(part.slot,indices);}
        for(let index=0;index<indices.length;index+=3){
          const t=Laya.Picker.rayIntersectsTriangle(this.localRay,geometry.positions[indices[index]],geometry.positions[indices[index+1]],geometry.positions[indices[index+2]]);
          if(Number.isFinite(t)&&t<closest){closest=t;hit=part;}
        }
      }
    }
    return hit;
  },

  serialize(){return Object.fromEntries(this.overrides);},
  restore(saved){
    const valid=new Map(Object.entries(saved||{}).filter(([,config])=>/^#[0-9a-f]{6}$/i.test(config?.color)&&['gloss','matte','metal','carbon','glass','hidden'].includes(config.material)));
    for(const [oldId,children] of this.splits){
      const config=valid.get(oldId);
      if(config){
        for(const part of children)if(!valid.has(part.id)){
          const specific=this.members(part).map(member=>valid.get(member.id)).find(Boolean);
          valid.set(part.id,specific||config);
        }
        valid.delete(oldId);
      }
    }
    for(const [id,config] of valid){
      this.overrides.set(id,config);const part=this.parts.get(id);if(part&&!part.group)this.apply(part,config,false);
    }
    // Older designs may contain only one member, or different member colours.
    // Resolve once in each group's declared member order, then restore it.
    for(const group of this.groups){
      const config=group.members.map(part=>this.overrides.get(part.id)).find(Boolean);
      if(config)this.apply(group.members[0],config,false);
    }
    this.updateUI();
  }
};
