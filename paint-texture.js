/* Image wraps are restricted to the original factory-paint material slots.
   User files stay in the browser; only explicitly saved designs persist them. */
const PaintTexture = {
  defaults:Object.freeze({size:100,rotation:0,x:0,y:0,opacity:100}),
  config:null, texture:null, bases:[], ticket:0, busy:false, originY:0,

  normalize(config) {
    if(!config||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(config.data||'')||config.data.length>6000000)return null;
    const clamp=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
    return {data:config.data,name:String(config.name||'自定义贴图').slice(0,80),
      aspect:clamp(config.aspect,.05,20,1),size:clamp(config.size,20,300,100),
      rotation:clamp(config.rotation,-180,180,0),x:clamp(config.x,-100,100,0),
      y:clamp(config.y,-100,100,0),opacity:clamp(config.opacity,0,100,100)};
  },
  eligible(part,config) {
    return !!part?.base?._factoryPaint && !['carbon','glass','hidden'].includes(config?.material);
  },
  init(bases) {
    this.bases=bases;
    document.getElementById('paint-texture-file').addEventListener('change',event=>{
      const file=event.target.files[0];event.target.value='';if(file)this.upload(file);
    });
    document.getElementById('paint-texture-remove').onclick=()=>this.remove();
    document.getElementById('paint-texture-reset').onclick=()=>{
      if(!this.config)return;Object.assign(this.config,this.defaults);this.sync();this.updateUI();
    };
    for(const key of ['size','rotation','x','y','opacity']){
      document.getElementById('paint-texture-'+key).addEventListener('input',event=>{
        if(!this.config||this.busy)return;
        this.config=this.normalize({...this.config,[key]:event.target.value});
        this.sync();this.updateUI();
      });
    }
    this.updateUI();
  },
  materials() {
    const result=new Set(this.bases);
    if(typeof LocalPaint!=='undefined')for(const part of LocalPaint.parts.values()){
      if(part.edited&&this.eligible(part,LocalPaint.overrides.get(part.id)))result.add(part.edited);
    }
    return [...result];
  },
  prepare(material) {
    material.setShaderName('PaintTexturePBR');this.applyMaterial(material);
  },
  applyMaterial(material) {
    const active=!!(this.config&&this.texture),define=Laya.Shader3D.getDefineByName('PAINT_TEXTURE');
    if(active){
      material.addDefine(define);
      material.setTexture('u_PaintMap',this.texture);
      const c=this.config;
      material.setVector4('u_PaintTransform',new Laya.Vector4(c.size/100,c.rotation*Math.PI/180,c.x/100,c.y/100));
      material.setFloat('u_PaintAspect',c.aspect);
      material.setFloat('u_PaintOpacity',c.opacity/100);
      material.setVector3('u_PaintOrigin',new Laya.Vector3(0,this.originY,0));
    }else{
      material.removeDefine(define);material.setTexture('u_PaintMap',null);
    }
  },
  sync() {
    if(typeof LocalPaint!=='undefined')LocalPaint.setHover(null);
    for(const material of this.materials())this.applyMaterial(material);
    this.audit();
  },
  tick(height) {
    if(this.originY===height)return;this.originY=height;
    if(!this.texture)return;
    const origin=new Laya.Vector3(0,height,0);
    for(const material of this.materials())material.setVector3('u_PaintOrigin',origin);
  },
  audit() {
    // Visible DOM diagnostic used by regression checks; contains no image data.
    const parts=typeof LocalPaint==='undefined'?[]:[...LocalPaint.parts.values()];
    const mapped=parts.filter(part=>(part.edited||part.base).getTexture('u_PaintMap'));
    document.documentElement.dataset.paintTexture=JSON.stringify({active:!!this.texture,
      paintedSlots:mapped.length,nonPaintSlots:mapped.filter(part=>!part.base._factoryPaint).length,
      name:this.config?.name||'',size:this.config?.size,opacity:this.config?.opacity});
  },
  decode(data) {
    return new Promise((resolve,reject)=>{
      const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('图片无法读取，请换一张 PNG、JPG 或 WebP 图片'));image.src=data;
    });
  },
  async upload(file) {
    const ticket=++this.ticket;this.busy=true;this.updateUI('正在读取贴图…');
    let url;
    try{
      if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('请选择 PNG、JPG 或 WebP 图片');
      if(file.size>12*1024*1024)throw Error('图片过大，请使用 12 MB 以内的图片');
      url=URL.createObjectURL(file);const image=await this.decode(url);
      if(ticket!==this.ticket)return;
      if(image.naturalWidth*image.naturalHeight>32000000)throw Error('图片分辨率过大，请先缩小至 3200 万像素以内');
      const aspect=image.naturalWidth/image.naturalHeight;
      if(aspect<.05||aspect>20)throw Error('图片长宽比例过大，请先裁剪图片');
      // A power-of-two texture works with repeat sampling on WebGL 1 and 2.
      // The shader restores the original aspect ratio after this square encode.
      const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
      canvas.getContext('2d').drawImage(image,0,0,1024,1024);
      const data=canvas.toDataURL('image/webp',.9);
      const config=this.normalize({data,aspect,name:file.name,...this.defaults});
      if(!config)throw Error('贴图未能处理，请换一张较小的图片');
      this.install(canvas,config);
    }catch(error){if(ticket===this.ticket)this.updateUI(error.message);}
    finally{if(url)URL.revokeObjectURL(url);if(ticket===this.ticket){this.busy=false;this.updateUI();}}
  },
  install(image,config) {
    const next=new Laya.Texture2D(image.width,image.height,Laya.TextureFormat.R8G8B8A8,true,false,true);
    next.setImageData(image,false,false);next.wrapModeU=next.wrapModeV=Laya.WrapMode.Repeat;
    next.filterMode=Laya.FilterMode.Trilinear;next.anisoLevel=4;
    const previous=this.texture;this.texture=next;this.config=config;
    this.sync();previous?.destroy();this.updateUI('已应用，仅覆盖原车车漆区域');
  },
  async restore(saved) {
    const ticket=++this.ticket,config=this.normalize(saved);
    if(!config){this.remove();return;}
    this.busy=true;this.updateUI('正在恢复贴图…');
    try{
      const image=await this.decode(config.data);if(ticket!==this.ticket)return;
      if(image.width!==1024||image.height!==1024)throw Error('已保存的贴图尺寸无效');
      this.install(image,config);
    }catch(error){if(ticket===this.ticket){this.remove();this.updateUI('贴图恢复失败，请重新上传');}}
    finally{if(ticket===this.ticket){this.busy=false;this.updateUI();}}
  },
  remove() {
    ++this.ticket;this.busy=false;const previous=this.texture;
    this.config=null;this.texture=null;this.sync();previous?.destroy();
    this.updateUI('已移除贴图，保留当前车漆颜色');
  },
  serialize() {return this.config?{...this.config}:null;},
  updateUI(message) {
    const active=!!this.config,$=id=>document.getElementById(id);
    $('paint-texture-settings').hidden=!active;
    $('paint-texture-file').disabled=this.busy;
    $('paint-texture-remove').disabled=!active&&!this.busy;
    $('paint-texture-reset').disabled=this.busy;
    $('paint-texture-name').textContent=this.config?.name||'未添加';
    const preview=$('paint-texture-preview');preview.hidden=!active;
    if(active)preview.src=this.config.data;else preview.removeAttribute('src');
    for(const key of ['size','rotation','x','y','opacity']){
      const value=this.config?.[key]??this.defaults[key];
      $('paint-texture-'+key).value=value;$('paint-texture-'+key).disabled=this.busy;
      const text=value+(key==='size'?' cm':key==='rotation'?'°':'%');
      $('paint-texture-'+key+'-value').value=text;$('paint-texture-'+key).setAttribute('aria-valuetext',text);
    }
    if(message)$('paint-texture-note').textContent=message;
  }
};
