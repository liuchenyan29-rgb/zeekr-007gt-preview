/* A standalone local viewer using the original LayaAir model assets. */
const $ = (id) => document.getElementById(id);
const state = { ...DesignLibrary.defaults, auto:false, yaw:0, pitch:.21, distance:9.2 };
const wheelTypes = ['C','B','A','E','F','G','PUBLIC','SIX','MESH','R3D','R3D_DARK','VFS2','VFS4'];
let scene,car,camera,shellRoot,interiorRoot,wheelNode,paintMaterials=[],ready=false,wheelSequence=0;
const pose={yaw:3*Math.PI/4,pitch:.21,distance:9.2};
const appearance={rgb:[.725,.745,.769],target:[.725,.745,.769],gloss:1,targetGloss:1};
let activeDrag=false,velocityYaw=0,velocityPitch=0,autoVelocity=0;
const cameraPosition=new Laya.Vector3(),cameraTarget=new Laya.Vector3(0,.65,0),cameraUp=new Laya.Vector3(0,1,0);

function wheelIcon(i,type){let spokes='';const count=type==='SIX'?6:type==='MESH'?20:type==='PUBLIC'?10:[5,10,6,5,8,12][i];for(let k=0;k<count;k++){const a=k*360/count;spokes+=`<path d="M20 20 L18 6 L22 6 Z" transform="rotate(${a} 20 20)" fill="${i===4?'#a28c65':'#8a908b'}"/>`;}return `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#333936"/><circle cx="20" cy="20" r="14" fill="#515752"/>${spokes}<circle cx="20" cy="20" r="4" fill="#c3c7c0"/><circle cx="20" cy="20" r="1.6" fill="#646b63"/></svg>`;}
async function loadPalette(){
  const response=await fetch('resources/official-paints.json');
  if(!response.ok)throw Error('官网车色色板未能加载');
  const data=await response.json();
  for(const {name,color,swatch,material} of data.colors){
    const b=document.createElement('button');b.type='button';b.className='swatch'+(color===state.color?' selected':'');
    b.style.setProperty('--color',color);b.title=name;b.setAttribute('aria-label',name);b.dataset.color=color;b.dataset.material=material;
    const icon=document.createElement('img');icon.src=swatch;icon.alt='';
    const label=document.createElement('span');label.textContent=name;b.append(icon,label);
    b.onclick=()=>setColor(color,name);$('swatches').append(b);
  }
}
wheelTypes.forEach((type,i)=>{if(['PUBLIC','SIX','MESH'].includes(type))return;const b=document.createElement('button');b.type='button';b.className='wheel'+(i===0?' selected':'');b.dataset.wheel=type;b.innerHTML=wheelIcon(i%6,type)+(WheelUpgrades.names[type]||`样式 ${String(i+1).padStart(2,'0')}`);b.onclick=()=>changeWheel(type);$('wheels').append(b);});
function editingConfig(){return typeof LocalPaint!=='undefined'&&LocalPaint.enabled&&LocalPaint.selected?LocalPaint.currentConfig():state;}
function updateLabels(){
  const config=editingConfig(),isLocal=typeof LocalPaint!=='undefined'&&LocalPaint.enabled&&LocalPaint.selected;
  const wheelLabel=WheelUpgrades.names[state.wheel]||'样式 '+String(wheelTypes.indexOf(state.wheel)+1).padStart(2,'0');
  const materialNames={gloss:'亮面',matte:'哑光',metal:'金属',carbon:'碳纤维',glass:'透明',hidden:'完全隐藏',original:'原始材质'};
  const finish=isLocal?materialNames[config.material]:(state.finish==='gloss'?'亮面':'哑光');
  $('summary').textContent=isLocal?`${LocalPaint.selected.label} / ${config.colorName} / ${finish}`:`${state.colorName} / ${finish} / ${wheelLabel}`;
  $('color-name').textContent=config.colorName;$('wheel-name').textContent=wheelLabel;
  $('color-picker').value=config.color;$('hex').value=config.color.toUpperCase();
  document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('selected',b.dataset.color===config.color));
  document.querySelectorAll('[data-finish]').forEach(b=>b.classList.toggle('selected',b.dataset.finish===(isLocal?config.material:state.finish)));
  document.querySelectorAll('.common-color').forEach(b=>{b.classList.toggle('selected',b.dataset.color===config.color);b.setAttribute('aria-pressed',String(b.dataset.color===config.color));});
  document.querySelectorAll('.wheel').forEach(b=>b.classList.toggle('selected',b.dataset.wheel===state.wheel));
}
function rgba(hex,scale=1){return new Laya.Color(parseInt(hex.slice(1,3),16)/255*scale,parseInt(hex.slice(3,5),16)/255*scale,parseInt(hex.slice(5,7),16)/255*scale,1);}
function setColor(color,name='自定义'){if(LocalPaint.enabled){LocalPaint.setColor(color.toLowerCase(),name);return;}state.color=color.toLowerCase();state.colorName=name;updateLabels();applyPaint();}
function applyPaint(){
  appearance.target=[1,3,5].map(offset=>parseInt(state.color.slice(offset,offset+2),16)/255);
  appearance.targetGloss=state.finish==='gloss'?1:0;
}
function updateAppearance(dt){
  const ease=1-Math.exp(-dt/115);
  appearance.rgb=appearance.rgb.map((v,i)=>v+(appearance.target[i]-v)*ease);
  appearance.gloss+=(appearance.targetGloss-appearance.gloss)*ease;
  const [r,g,b]=appearance.rgb,gloss=appearance.gloss;
  for(const material of paintMaterials){
    material.albedoColor=new Laya.Color(r,g,b,1);
    material.metallic=.12+.16*gloss;
    material.smoothness=.28+.64*gloss;
    material.clearCoat=.08+.77*gloss;
    material.clearCoatRoughness=.48-.41*gloss;
  }
}
function walk(node,fn){fn(node);for(let i=0;i<node.numChildren;i++)walk(node.getChildAt(i),fn);}
function renderCamera(){
  if(!camera)return;
  const host=$('canvas-host');
  const pitch=pose.pitch,distance=pose.distance*Math.max(1,1.2/(host.clientWidth/host.clientHeight));
  cameraPosition.setValue(Math.sin(pose.yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance+.65,Math.cos(pose.yaw)*Math.cos(pitch)*distance);
  camera.transform.position=cameraPosition;
  camera.transform.lookAt(cameraTarget,cameraUp);
}
function resetView(view='front'){
  const angle=view==='side'?Math.PI/2:view==='back'?Math.PI/4:3*Math.PI/4;
  state.yaw=pose.yaw+Math.atan2(Math.sin(angle-pose.yaw),Math.cos(angle-pose.yaw));
  state.pitch=.21;state.distance=9.2;velocityYaw=velocityPitch=0;
  state.auto=false;$('rotate').setAttribute('aria-pressed','false');
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===view));
}
async function changeWheel(type){const ticket=++wheelSequence;$('status').textContent='正在切换轮毂…';try{const prefab=await Laya.loader.load(`resources/car/cc1e/cc1efab/cc1e_Tire_${WheelUpgrades.names[type]?'C':type}.lh`);if(!prefab)throw Error('轮毂文件未能加载');if(ticket!==wheelSequence)return;const next=prefab.create();next.transform.localScale=shellRoot.transform.localScale.clone();car.addChild(next);if(WheelUpgrades.names[type]){try{await WheelUpgrades.build(next,type);}catch(error){next.destroy();throw error;}}if(ticket!==wheelSequence){next.destroy();return;}if(typeof LocalPaint!=='undefined')LocalPaint.unregisterWheels();const previousMeshes=Fitment.wheels.map(wheel=>wheel.mesh).filter(Boolean);if(wheelNode)wheelNode.destroy();for(const mesh of previousMeshes)mesh.destroy();wheelNode=next;Studio.prepareModel(next);Studio.updateGround(next);Fitment.registerWheels(next);if(typeof LocalPaint!=='undefined'&&LocalPaint.initialized)LocalPaint.registerRoot(next,'wheels/'+type);state.wheel=type;updateLabels();$('status').textContent='柔光棚实时渲染';}catch(e){$('status').textContent='轮毂加载失败，可重新选择';console.error(e);}}
$('color-picker').addEventListener('input',e=>setColor(e.target.value));$('hex').addEventListener('input',e=>{const value=e.target.value.trim();if(/^#[0-9a-f]{6}$/i.test(value))setColor(value);});$('hex').addEventListener('change',e=>{const v=e.target.value.trim();if(/^#[0-9a-f]{6}$/i.test(v))setColor(v);else updateLabels();});
document.querySelectorAll('[data-finish]').forEach(b=>b.onclick=()=>{if(LocalPaint.enabled){LocalPaint.setMaterial(b.dataset.finish);return;}state.finish=b.dataset.finish;updateLabels();applyPaint();});document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>resetView(b.dataset.view));$('reset').onclick=()=>resetView();$('rotate').onclick=()=>{state.auto=!state.auto;$('rotate').setAttribute('aria-pressed',String(state.auto));};
let applyingDesign=false;
function currentDesign(){return {color:state.color,colorName:state.colorName,finish:state.finish,wheel:state.wheel,rideHeight:state.rideHeight,etDelta:state.etDelta,rimInches:state.rimInches,parts:LocalPaint.serialize()};}
function renderDesignLibrary(records){
  $('design-count').textContent=String(records.length);
  $('design-list').replaceChildren();
  $('design-empty').hidden=records.length>0;
  for(const record of records){
    const button=document.createElement('button');button.type='button';button.className='saved-design';
    button.setAttribute('aria-label','应用搭配：'+record.name);
    const chip=document.createElement('i');chip.style.backgroundColor=record.design.color;
    const text=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small');
    name.textContent=record.name;
    const d=record.design;
    detail.textContent=`${d.colorName||'自定义'} · ${d.finish==='matte'?'哑光':'亮面'} · ${WheelUpgrades.names[d.wheel]||'样式 '+String(Math.max(0,wheelTypes.indexOf(d.wheel))+1).padStart(2,'0')} · 局部 ${Object.keys(d.parts||{}).length} 处`;
    text.append(name,detail);button.append(chip,text);button.onclick=()=>applyDesign(d,record.name);
    const card=document.createElement('div');card.className='design-card';
    const actions=document.createElement('div');actions.className='design-actions';
    const update=document.createElement('button');update.type='button';update.textContent='用当前配置更新';update.setAttribute('aria-label','更新搭配：'+record.name);
    update.onclick=()=>{
      if(applyingDesign)return;
      try{renderDesignLibrary(DesignLibrary.update(localStorage,record.id,currentDesign()));$('save-note').textContent='已用当前配置更新「'+record.name+'」';}
      catch{$('save-note').textContent='更新未成功，原搭配保持不变';}
    };
    const remove=document.createElement('button');remove.type='button';remove.textContent='删除';remove.className='delete-design';remove.setAttribute('aria-label','删除搭配：'+record.name);
    remove.onclick=()=>{
      if(applyingDesign)return;
      try{renderDesignLibrary(DesignLibrary.setDeleted(localStorage,record.id,true));$('save-note').textContent='已删除「'+record.name+'」，可在回收站恢复';}
      catch{$('save-note').textContent='删除未成功，请重试';}
    };
    actions.append(update,remove);card.append(button,actions);$('design-list').append(card);
  }
  const removed=DesignLibrary.trash(localStorage);$('design-trash-list').replaceChildren();$('design-trash').hidden=!removed.length;$('trash-count').textContent=String(removed.length);
  for(const record of removed){
    const row=document.createElement('div'),name=document.createElement('span'),restore=document.createElement('button');
    name.textContent=record.name;restore.type='button';restore.textContent='恢复';restore.setAttribute('aria-label','恢复搭配：'+record.name);
    restore.onclick=()=>{
      if(applyingDesign)return;
      try{renderDesignLibrary(DesignLibrary.setDeleted(localStorage,record.id,false));$('save-note').textContent='已恢复「'+record.name+'」';}
      catch{$('save-note').textContent='恢复未成功，请重试';}
    };
    row.append(name,restore);$('design-trash-list').append(row);
  }
}
async function applyDesign(design,name){
  if(applyingDesign||!ready)return;
  applyingDesign=true;$('controls').disabled=true;$('save').disabled=true;$('part-mode').disabled=true;
  try{
    LocalPaint.toggle(false);LocalPaint.select(null);LocalPaint.clearAll();
    state.color=design.color.toLowerCase();state.colorName=design.colorName||'自定义';state.finish=design.finish==='matte'?'matte':'gloss';applyPaint();
    const type=wheelTypes.includes(design.wheel)?design.wheel:'C';
    if(state.wheel!==type)await changeWheel(type);
    LocalPaint.restore(design.parts);
    state.rideHeight=Fitment.clamp(design.rideHeight,-80,60);state.etDelta=Fitment.clamp(design.etDelta,-40,40);state.rimInches=Fitment.clamp(design.rimInches??(design.wheelScale?19*design.wheelScale/100:19),18,22);
    updateFitmentLabels();updateLabels();$('save-note').textContent='已应用「'+name+'」；刷新仍显示默认配色';
  }finally{applyingDesign=false;$('controls').disabled=false;$('save').disabled=false;$('part-mode').disabled=false;}
}
$('default-design').onclick=()=>applyDesign(DesignLibrary.defaults,'默认配色');
$('save').onclick=()=>{
  if(applyingDesign)return;
  try{
    const records=DesignLibrary.add(localStorage,currentDesign(),$('design-name').value);
    renderDesignLibrary(records);$('design-name').value='';$('saved-designs').open=true;
    $('save-note').textContent='已新增「'+records.at(-1).name+'」，可在列表中选用';
  }catch{$('save-note').textContent='当前浏览器无法保存方案，已有搭配未覆盖';}
};

function updateFitmentLabels(){
  for(const [id,key] of [['ride-height','rideHeight'],['et-delta','etDelta']]){
    $(id).value=state[key];$(id+'-value').value=(state[key]>0?'+':'')+state[key]+' mm';
    $(id).setAttribute('aria-valuetext',$(id+'-value').value);
  }
  $('wheel-size').value=state.rimInches;$('wheel-size-value').value=state.rimInches+' 寸';
}
$('wheel-size').addEventListener('input',e=>{state.rimInches=Fitment.clamp(e.target.value,18,22);updateFitmentLabels();$('save-note').textContent='轮毂尺寸已调整，点击保存以保留';});
for(const [id,key,min,max] of [['ride-height','rideHeight',-80,60],['et-delta','etDelta',-40,40]]){
  $(id).addEventListener('input',e=>{state[key]=Fitment.clamp(e.target.value,min,max);updateFitmentLabels();$('save-note').textContent='姿态已调整，点击保存以保留';});
}
$('fitment-reset').onclick=()=>{state.rideHeight=state.etDelta=0;state.rimInches=19;updateFitmentLabels();$('save-note').textContent='姿态已恢复，点击保存以保留';};

function renderCommonColors(colors){
  $('common-colors').replaceChildren();$('common-empty').hidden=colors.length>0;
  for(const color of colors){
    const button=document.createElement('button');button.type='button';button.className='common-color';button.dataset.color=color.color;
    button.setAttribute('aria-label','常用颜色：'+color.name);button.title=color.name+' '+color.color.toUpperCase();
    const icon=document.createElement('i'),name=document.createElement('span');icon.style.backgroundColor=color.color;name.textContent=color.name;button.append(icon,name);
    button.onclick=()=>setColor(color.color,color.name);$('common-colors').append(button);
  }
  updateLabels();
}
$('add-common-color').onclick=()=>{
  const config=editingConfig();
  try{
    const before=CustomPalette.read(localStorage),colors=CustomPalette.add(localStorage,config.color,$('common-color-name').value);
    renderCommonColors(colors);$('common-color-name').value='';
    $('common-color-note').textContent=colors.length===before.length?'常用色已保存（相同色值不会重复添加）':'已添加，可用于全车或局部改色';
  }catch{$('common-color-note').textContent='当前浏览器无法保存常用色';}
};
async function boot(){
  await loadPalette();
  const host=$('canvas-host');Laya.Config.isAlpha=false;Laya.Config.useRetinalCanvas=true;Laya.Config3D.pixelRatio=Math.min(1,1.6/(window.devicePixelRatio||1));
  await Laya.init({designWidth:host.clientWidth,designHeight:host.clientHeight,scaleMode:'noscale',alignH:'left',alignV:'top'});
  const container=document.getElementById('layaContainer');if(container)host.appendChild(container);
  Laya.stage.bgColor='#ffffff';Laya.stage.scaleMode='full';Laya.stage.updateCanvasSize=()=>Laya.stage.setScreenSize(host.clientWidth*Laya.Browser.pixelRatio,host.clientHeight*Laya.Browser.pixelRatio);Laya.stage.updateCanvasSize();
  await Laya.loader.loadPackage('');
  scene=Laya.stage.addChild(new Laya.Scene3D());
  Studio.setup(scene);
  camera=scene.addChild(new Laya.Camera(0,.1,100));
  camera.clearColor=new Laya.Color(.95,.95,.95,1);camera.fieldOfView=34;camera.enableHDR=true;camera.msaa=true;
  $('load-detail').textContent='正在装配车身与内饰…';
  const prefabs=await Promise.all(['WG','INS'].map(s=>Laya.loader.load(`resources/car/cc1e/cc1efab/cc1e_${s}.lh`)));
  if(prefabs.some(p=>!p))throw Error('车身模型未能加载');
  car=scene.addChild(new Laya.Sprite3D('007GT'));shellRoot=prefabs[0].create();interiorRoot=prefabs[1].create();interiorRoot.transform.localScale=shellRoot.transform.localScale.clone();car.addChild(shellRoot);car.addChild(interiorRoot);
  Studio.prepareModel(car,paintMaterials);
  Fitment.init([shellRoot,interiorRoot]);
  resetView();renderCamera();ready=true;applyPaint();updateAppearance(1000);await changeWheel(state.wheel);
  await LocalPaint.init({host,camera,shell:shellRoot,interior:interiorRoot,wheels:wheelNode,wheelType:state.wheel,getGlobal:()=>state,onChange:updateLabels,stopRotation:()=>{state.auto=false;velocityYaw=velocityPitch=0;$('rotate').setAttribute('aria-pressed','false');}});

  updateFitmentLabels();
  try{renderCommonColors(CustomPalette.read(localStorage));}catch{$('common-color-note').textContent='常用色暂时无法读取';}
  try{renderDesignLibrary(DesignLibrary.read(localStorage));}catch{$('save-note').textContent='当前浏览器无法读取已保存搭配';}

  let last=performance.now(),sampleTime=0,sampleFrames=0;
  Laya.timer.frameLoop(1,null,()=>{
    const now=performance.now(),elapsed=now-last,dt=Math.min(elapsed,50);last=now;sampleTime+=elapsed;sampleFrames++;if(sampleFrames===120){document.documentElement.dataset.studioFps=(1000*sampleFrames/sampleTime).toFixed(1);sampleTime=0;sampleFrames=0;}
    const ease=1-Math.exp(-dt/85);
    autoVelocity+=((state.auto?.00010:0)-autoVelocity)*ease;
    if(!activeDrag){
      state.yaw+=(autoVelocity+velocityYaw)*dt;
      state.pitch=Math.max(.04,Math.min(.65,state.pitch+velocityPitch*dt));
      const decay=Math.exp(-dt/140);velocityYaw*=decay;velocityPitch*=decay;
    }
    pose.yaw+=(state.yaw-pose.yaw)*ease;
    pose.pitch+=(state.pitch-pose.pitch)*ease;
    pose.distance+=(state.distance-pose.distance)*ease;
    renderCamera();updateAppearance(dt);Fitment.tick(dt,state);LocalPaint.tick(now);
  });
  // Warm the remaining local assets so later wheel changes do not fetch on demand.
  Promise.allSettled(wheelTypes.filter(type=>!WheelUpgrades.names[type]).map(type=>Laya.loader.load(`resources/car/cc1e/cc1efab/cc1e_Tire_${type}.lh`)));
  const resize=()=>{Laya.stage.updateCanvasSize();renderCamera();};new ResizeObserver(resize).observe(host);resize();
  const pointers=new Map();let pinchDistance=0,lastMove=0;
  host.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;host.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});activeDrag=true;velocityYaw=velocityPitch=0;
    state.auto=false;$('rotate').setAttribute('aria-pressed','false');lastMove=performance.now();
    if(pointers.size===2){const p=[...pointers.values()];pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}
  });
  host.addEventListener('pointermove',e=>{
    const previous=pointers.get(e.pointerId);if(!previous)return;
    const dx=e.clientX-previous.x,dy=e.clientY-previous.y;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){
      const p=[...pointers.values()],distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
      if(pinchDistance>0)state.distance=Math.max(5.3,Math.min(12,state.distance*pinchDistance/distance));
      pinchDistance=distance;velocityYaw=velocityPitch=0;
    }else{
      const now=performance.now(),dt=Math.max(8,now-lastMove);lastMove=now;
      state.yaw-=dx*.005;state.pitch=Math.max(.04,Math.min(.65,state.pitch+dy*.0025));
      velocityYaw=Math.max(-.002,Math.min(.002,-dx*.005/dt));velocityPitch=Math.max(-.0008,Math.min(.0008,dy*.0025/dt));
    }
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('selected'));
  });
  const release=e=>{pointers.delete(e.pointerId);activeDrag=pointers.size>0;pinchDistance=0;if(performance.now()-lastMove>90)velocityYaw=velocityPitch=0;};
  host.addEventListener('pointerup',release);host.addEventListener('pointercancel',release);
  host.addEventListener('wheel',e=>{e.preventDefault();state.distance=Math.max(5.3,Math.min(12,state.distance+e.deltaY*.004));},{passive:false});
  window.preview={state,pose,scene,car,camera,paintMaterials,studio:Studio,localPaint:LocalPaint};
  $('controls').disabled=false;$('save').disabled=false;$('loading').hidden=true;
}
boot().catch(e=>{console.error(e);$('load-title').textContent='模型暂时未能显示';$('load-detail').textContent=e.message;$('retry').hidden=false;$('status').textContent='加载失败';});
