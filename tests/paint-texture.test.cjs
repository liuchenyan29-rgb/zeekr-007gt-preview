const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map();
const document={documentElement:{dataset:{}},getElementById(id){
  if(!elements.has(id))elements.set(id,{value:'',setAttribute(){},removeAttribute(){},addEventListener(){}});
  return elements.get(id);
}};
class Material{
  constructor(paint=false){this._factoryPaint=paint;this.textures={};this.defines=new Set();this.shader={name:'PBR'};this.smoothness=.92;}
  setShaderName(name){this.shader.name=name;}
  addDefine(d){this.defines.add(d);}removeDefine(d){this.defines.delete(d);}
  setTexture(n,t){this.textures[n]=t;}getTexture(n){return this.textures[n];}
  setVector4(n,v){this[n]=v;}setVector3(n,v){this[n]=v;}setFloat(n,v){this[n]=v;}
}
const textures=[];
class Texture{
  constructor(w,h){this.width=w;this.height=h;textures.push(this);}
  setImageData(){}destroy(){this.destroyed=true;}
}
class Vector3{constructor(x,y,z){Object.assign(this,{x,y,z});}}
class Vector4{constructor(x,y,z,w){Object.assign(this,{x,y,z,w});}}
const local={parts:new Map(),overrides:new Map(),setHover(){}};
const context={document,LocalPaint:local,Laya:{Shader3D:{getDefineByName:n=>n},Vector3,Vector4,Texture2D:Texture,TextureFormat:{R8G8B8A8:1},WrapMode:{Repeat:0},FilterMode:{Trilinear:2}}};
vm.createContext(context);vm.runInContext(fs.readFileSync('paint-texture.js','utf8')+';this.subject=PaintTexture;',context);
const paint=context.subject,data='data:image/png;base64,aGVsbG8=';
const config=paint.normalize({data,name:'test.png',aspect:2,size:150,rotation:30,x:25,y:-50,opacity:70});
assert.equal(paint.normalize({data:'https://example.com/image.png'}),null);
assert.equal(paint.normalize({data:'data:image/svg+xml;base64,aGVsbG8='}),null);
assert.equal(paint.normalize({data:'data:image/png;base64,!!'}),null);
assert.equal(paint.normalize({data,size:999}).size,300);
assert.equal(paint.normalize({data,opacity:-3}).opacity,0);
const body=new Material(true),hood={base:body,edited:null},glass={base:new Material(),edited:new Material()},tire={base:new Material(),edited:null},trim={base:new Material(),edited:new Material()};
for(const [id,p] of Object.entries({hood,glass,tire,trim})){p.id=id;local.parts.set(id,p);}
paint.init([body]);paint.prepare(body);
assert(!body.defines.has('PAINT_TEXTURE'));assert.equal(paint.serialize(),null);
assert(!paint.eligible(glass,{material:'gloss'}));assert(!paint.eligible(trim,{material:'metal'}));
assert(paint.eligible(hood,{material:'gloss'}));assert(!paint.eligible(hood,{material:'hidden'}));
assert(!paint.eligible(hood,{material:'carbon'}));assert(!paint.eligible(hood,{material:'glass'}));
paint.install({width:1024,height:1024},config);
assert(body.defines.has('PAINT_TEXTURE'));assert.equal(body.getTexture('u_PaintMap'),textures[0]);
assert.equal(body.u_PaintOpacity,.7);assert.equal(body.u_PaintTransform.x,1.5);assert.equal(body.u_PaintAspect,2);
assert.equal(body.smoothness,.92); // PBR finish survives texture changes.
for(const p of [glass,tire,trim])assert(!p.base.getTexture('u_PaintMap')&&!p.edited?.getTexture('u_PaintMap'));
let audit=JSON.parse(document.documentElement.dataset.paintTexture);assert.equal(audit.nonPaintSlots,0);assert.equal(audit.paintedSlots,1);
hood.edited=new Material();local.overrides.set('hood',{material:'matte'});paint.prepare(hood.edited);
assert.equal(hood.edited.getTexture('u_PaintMap'),textures[0]);
paint.tick(.06);assert.equal(body.u_PaintOrigin.y,.06);assert.equal(hood.edited.u_PaintOrigin.y,.06);
const saved=paint.serialize();saved.opacity=25;assert.equal(paint.config.opacity,70);
paint.install({width:1024,height:1024},{...config,opacity:25});
assert(textures[0].destroyed);assert.equal(hood.edited.getTexture('u_PaintMap'),textures[1]);
paint.remove();assert(textures[1].destroyed);assert.equal(paint.serialize(),null);
assert(!body.defines.has('PAINT_TEXTURE'));assert(!hood.edited.defines.has('PAINT_TEXTURE'));
assert.equal(body.getTexture('u_PaintMap'),null);assert.equal(hood.edited.getTexture('u_PaintMap'),null);

(async()=>{
  paint.decode=async()=>({width:1024,height:1024});
  await paint.restore(saved);assert.equal(paint.config.opacity,25);assert.equal(paint.config.size,150);
  assert.equal(body.getTexture('u_PaintMap'),textures[2]);
  await paint.restore(undefined);assert.equal(paint.serialize(),null);assert(textures[2].destroyed);
  // Removing an in-flight restore prevents a stale image from reappearing.
  let resolve;paint.decode=()=>new Promise(r=>resolve=r);
  const pending=paint.restore(saved);paint.remove();resolve({width:1024,height:1024});await pending;
  assert.equal(paint.serialize(),null);assert.equal(textures.length,3);assert.equal(paint.busy,false);

  const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('design-library.js','utf8')+';this.library=DesignLibrary;',ctx);
  const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
  const design={...ctx.library.defaults,paintTexture:saved};
  const records=ctx.library.add(storage,design,'贴图测试');design.paintTexture.size=80;
  assert.equal(records[0].design.paintTexture.size,150);
  assert.equal(ctx.library.read(storage)[0].design.paintTexture.opacity,25);
  assert.equal(ctx.library.defaults.paintTexture,undefined);
  const app=fs.readFileSync('app.js','utf8');assert(app.includes('await PaintTexture.restore(design.paintTexture)'));
  const shader=fs.readFileSync('paint-texture-shader.js','utf8');
  assert(shader.includes('"ShadowCaster"'));assert(shader.includes('"DepthNormal"'));
  assert(shader.includes('pattern.a * u_PaintOpacity'));assert(!shader.includes('inputs.alpha = pattern'));
  console.log('PASS: factory-paint whitelist, glass/trim/tire isolation, local material priorities, transparent overlay without geometry alpha, PBR preservation, transforms anchored to suspension, resource replacement/removal, saved config copy/restore, stale-load cancellation and default startup.');
})().catch(error=>{console.error(error);process.exitCode=1;});
