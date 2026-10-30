const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
class Material {
  constructor(){this.shader={name:'PBR'};this.name='Studio car paint';this.colors={};}
  getTexture(){return null;}
  getColor(key){return this.colors[key];}
  setColor(key,value){this.colors[key]=value;}
  setFloat(){} addDefine(){}
  clone(){return new Material();}
  destroy(){this.destroyed=true;}
}
const elements=new Map();
const document={documentElement:{dataset:{}},getElementById(id){
  if(!elements.has(id))elements.set(id,{style:{},children:[],classList:{toggle(){}},setAttribute(){},replaceChildren(){this.children=[];},append(child){this.children.push(child);}});
  return elements.get(id);
},createElement:()=>({setAttribute(){}}),querySelectorAll:()=>[],body:{classList:{toggle(){}}}};
const context={document,Laya:{PBRStandardMaterial:Material,Color:class{constructor(r,g,b,a){Object.assign(this,{r,g,b,a});}},PBRRenderMode:{Fade:2,Cutout:1},Shader3D:{getDefineByName:x=>x}}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'local-paint.js'),'utf8')+'\nthis.subject=LocalPaint;',context);
const paint=context.subject;
paint.host={style:{}};paint.getGlobal=()=>({color:'#647b66',finish:'gloss'});paint.onChange=()=>{};
function part(id,number){
  const base=new Material();
  const result={id,number,node:{name:id},renderer:{sharedMaterials:[base]},slot:0,base,edited:null,label:String(number)};
  paint.parts.set(id,result);return result;
}
const originalIds=['shell/0/0/0/35#0','shell/0/0/0/13#0','shell/0/0/0/14#0'];
originalIds.forEach((id,i)=>part(id,[41,14,15][i]));paint.buildGroups();
const data=JSON.parse(fs.readFileSync(path.join(root,'resources/parts/044.json'),'utf8'));
const children=[];
for(const definition of data.groups){
  const members=definition.members.map(member=>part(data.partId+'/'+definition.code+'/island-'+member.island,definition.code));
  children.push(...members);
  if(definition.paired){
    const group={id:'group/'+definition.code,label:definition.name,members};
    paint.groups.push(group);members.forEach(member=>member.group=group);
  }
}
paint.splits.set(data.partId,children);
const untouched=part('shell/0/0/0/38#1',45);
const pair=paint.groups.find(group=>group.id==='group/044-09').members;
const center=children.find(member=>member.number==='044-01');
paint.selected=pair[0];paint.setColor('#e2e0d6','white');paint.setMaterial('matte');
assert.ok(pair.every(member=>paint.overrides.get(member.id).color==='#e2e0d6'&&member.edited.smoothness===.23));
assert.equal(center.edited,null);assert.equal(untouched.edited,null);
paint.selected=center;paint.setColor('#d66a38','orange');
assert.ok(pair.every(member=>paint.overrides.get(member.id).color==='#e2e0d6'));
paint.selected=pair[1];paint.resetSelected();assert.ok(pair.every(member=>!member.edited));assert.ok(center.edited);
paint.selected=null;paint.setHover(pair[0]);assert.equal(paint.highlights.length,2);
const highlights=[...paint.highlights];paint.setHover(pair[1]);assert.equal(paint.highlights[0],highlights[0]);
paint.setHover(null);assert.ok(highlights.every(item=>item.material.destroyed));assert.ok(center.edited);
paint.clearAll();
const legacy={color:'#647b66',colorName:'green',material:'gloss',finish:'gloss'};
paint.restore({[data.partId]:legacy});
assert.equal(paint.overrides.size,21);assert.ok(children.every(member=>paint.overrides.get(member.id).color===legacy.color));
paint.initialized=true;paint.updateUI();assert.equal(elements.get('part-count').textContent,'已改 13 处');
const saved=JSON.parse(JSON.stringify(paint.serialize()));assert.equal(saved[data.partId],undefined);
paint.clearAll();paint.restore(saved);assert.equal(paint.overrides.size,21);
paint.clearAll();const specific={color:'#84718e',colorName:'purple',material:'matte',finish:'matte'};
paint.restore({[data.partId]:legacy,[pair[1].id]:specific});
assert.ok(pair.every(member=>paint.overrides.get(member.id).color===specific.color));
assert.equal(paint.overrides.get(center.id).color,legacy.color);
paint.selected=pair[0];paint.resetSelected();assert.equal(paint.overrides.size,19);
paint.selected=paint.parts.get(originalIds[1]);paint.setColor('#ffffff','white');
assert.ok(originalIds.every(id=>paint.overrides.get(id).color==='#ffffff'));
assert.equal(paint.overrides.get(center.id).color,legacy.color);assert.equal(untouched.edited,null);
console.log('PASS: independent 044 regions, paired hover/colour/material/reset, save roundtrip, legacy migration, specific-setting precedence, counts, 045 isolation and 041/014/015 compatibility.');

// Cross-region groups must replace their previous pair groups, not overlap them.
paint.clearAll();
const numericIds={83:'shell/0/4/6#0',92:'shell/0/5/2#0',16:'shell/0/0/0/15#0',27:'shell/0/0/0/22#0',17:'shell/0/0/0/16#0',71:'shell/0/3/10#0',49:'shell/0/2/1#0',40:'shell/0/0/0/34#0',13:'shell/0/0/0/12#0',118:'shell/0/7/8#1'};
for(const [number,id] of Object.entries(numericIds))part(id,Number(number));
const rear=JSON.parse(fs.readFileSync(path.join(root,'resources/parts/113.json'),'utf8'));
const rearChildren=[];
for(const definition of rear.groups){
  const members=definition.members.map(member=>part(rear.partId+'/'+definition.code+'/island-'+member.island,definition.code));
  rearChildren.push(...members);
  if(definition.paired){
    const group={id:'group/'+definition.code,label:definition.name,members};
    paint.groups.push(group);members.forEach(member=>member.group=group);
  }
}
paint.splits.set(rear.partId,rearChildren);
const rearLower=JSON.parse(fs.readFileSync(path.join(root,'resources/parts/027.json'),'utf8'));
const rearLowerChildren=[];
paint.parts.delete(rearLower.partId);
for(const definition of rearLower.groups){
  const members=definition.members.map(member=>part(rearLower.partId+'/'+definition.code+'/island-'+member.island,definition.code));
  rearLowerChildren.push(...members);
  if(definition.paired){const group={id:'group/'+definition.code,members};paint.groups.push(group);members.forEach(member=>member.group=group);}
}
paint.splits.set(rearLower.partId,rearLowerChildren);
paint.buildRequestedGroups();
const first=paint.groups.find(group=>group.id==='group/G02');
const second=paint.groups.find(group=>group.id==='group/G03');
assert.equal(first.members.length,8);assert.equal(second.members.length,7);
assert.ok(!paint.groups.some(group=>['group/044-08','group/044-12'].includes(group.id)));
assert.ok(first.members.every(member=>member.group===first));
paint.selected=paint.parts.get(numericIds[83]);paint.setColor('#ffffff','white');paint.setMaterial('metal');
assert.ok(first.members.every(member=>member.edited.metallic===.95&&paint.overrides.get(member.id).color==='#ffffff'));
assert.ok(second.members.every(member=>!member.edited));assert.ok(rearChildren.every(member=>!member.edited));
paint.selected=second.members[2];paint.setColor('#1a5aaf','blue');
assert.ok(second.members.every(member=>paint.overrides.get(member.id).color==='#1a5aaf'));
paint.selected=first.members.at(-1);paint.resetSelected();assert.ok(first.members.every(member=>!member.edited));assert.ok(second.members.every(member=>member.edited));
paint.clearAll();paint.restore({[rear.partId]:legacy});
assert.equal(paint.overrides.size,16);assert.ok(rearChildren.every(member=>paint.overrides.get(member.id).color===legacy.color));
paint.updateUI();assert.equal(elements.get('part-count').textContent,'已改 10 处');
const rearCenter=rearChildren.find(member=>!member.group);
const rearPair=paint.groups.find(group=>group.id==='group/G04').members;
paint.selected=rearCenter;paint.setColor('#d66a38','orange');paint.selected=rearPair[1];paint.setColor('#84718e','purple');
assert.ok(rearPair.every(member=>paint.overrides.get(member.id).color==='#84718e'));
assert.equal(paint.overrides.get(rearCenter.id).color,'#d66a38');
const rearSaved=JSON.parse(JSON.stringify(paint.serialize()));paint.clearAll();paint.restore(rearSaved);
assert.ok(rearPair.every(member=>paint.overrides.get(member.id).color==='#84718e'));
assert.equal(paint.overrides.get(rearCenter.id).color,'#d66a38');
paint.clearAll();paint.restore({[numericIds[83]]:legacy,[numericIds[16]]:specific});
assert.ok(first.members.every(member=>paint.overrides.get(member.id).color===legacy.color));
assert.ok(second.members.every(member=>!member.edited));
assert.ok(paint.groups.find(group=>group.code==='G06').members.every(member=>paint.overrides.get(member.id).color===specific.color));
assert.ok(rearChildren.every(member=>!member.edited));
console.log('PASS: both requested merge groups, retained symmetry, replaced old groups, cross-group isolation, 113 independent regions and save migration.');

paint.clearAll();
const compactGroups=paint.groups.filter(group=>/^G\d\d$/.test(group.code||''));
assert.deepEqual(Array.from(compactGroups,group=>group.code).sort(),['G01','G02','G03','G04','G05','G06']);
assert.ok(compactGroups.every(group=>group.label==='组件组 · '+group.code));
assert.deepEqual(Array.from(first.members,member=>member.number).filter(n=>typeof n==='number'),[83,92,71,49]);
const windowGroup=paint.groups.find(group=>group.code==='G04');
const spoilerGroup=paint.groups.find(group=>group.code==='G05');
assert.equal(windowGroup.members.length,4);assert.equal(spoilerGroup.members.length,3);
assert.deepEqual(Array.from(spoilerGroup.members,member=>member.number),[40,13,118]);
assert.ok(!paint.groups.some(group=>['group/044-06','group/113-03'].includes(group.id)));
paint.selected=windowGroup.members[0];paint.setColor('#9bb3cc','冰湖蓝');
assert.ok(windowGroup.members.every(member=>paint.overrides.get(member.id).color==='#9bb3cc'));
assert.ok(spoilerGroup.members.every(member=>!member.edited));
paint.selected=spoilerGroup.members[2];paint.setColor('#1f1a2a','暗夜紫');paint.setMaterial('matte');
assert.ok(spoilerGroup.members.every(member=>member.edited.smoothness===.23));
const compactSaved=JSON.parse(JSON.stringify(paint.serialize()));paint.clearAll();paint.restore(compactSaved);
assert.ok(windowGroup.members.every(member=>paint.overrides.get(member.id).color==='#9bb3cc'));
assert.ok(spoilerGroup.members.every(member=>paint.overrides.get(member.id).color==='#1f1a2a'));
const paints=JSON.parse(fs.readFileSync(path.join(root,'resources/official-paints.json'),'utf8'));
assert.equal(paints.colors.length,9);assert.equal(new Set(paints.colors.map(p=>p.name)).size,9);
assert.equal(paints.colors.find(p=>p.name==='冰湖蓝').material,'car_paint_lan2');
for(const preset of paints.colors){
  const rgb='#'+preset.pigment.slice(0,3).map(value=>Math.round(value*255).toString(16).padStart(2,'0')).join('');
  assert.equal(preset.color,rgb);
  const png=fs.readFileSync(path.join(root,preset.swatch));assert.equal(png.subarray(1,4).toString(),'PNG');
}
console.log('PASS: G01–G05 short labels, expanded G02 symmetry, G04/G05 merge isolation and persistence, and nine locally available official paint presets including Ice Lake Blue.');

paint.clearAll();paint.enabled=true;paint.selected=first.members[0];paint.setMaterial('hidden');
assert.ok(first.members.every(member=>paint.isHidden(member)&&member.edited.renderMode===1&&member.edited.albedoColor.a===0&&member.edited.alphaTestValue===.5));
assert.ok(second.members.every(member=>!paint.isHidden(member)));
assert.equal(elements.get('hidden-part-list').children.length,1);
paint.selected=center;elements.get('hidden-part-list').children[0].onclick();
assert.equal(paint.selected.group,first);
paint.selected=null;paint.setHover(first.members[0]);assert.equal(paint.highlights.length,0);paint.setHover(null);
const hiddenSaved=JSON.parse(JSON.stringify(paint.serialize()));paint.clearAll();paint.restore(hiddenSaved);
assert.ok(first.members.every(member=>paint.isHidden(member)));
paint.selected=first.members[1];paint.setMaterial('gloss');assert.ok(first.members.every(member=>!paint.isHidden(member)&&member.edited.albedoColor.a===1));
paint.setMaterial('hidden');paint.resetSelected();assert.ok(first.members.every(member=>!paint.isHidden(member)&&member.renderer.sharedMaterials[member.slot]===member.base));
paint.selected=center;paint.setMaterial('hidden');assert.ok(paint.isHidden(center));assert.ok(first.members.every(member=>!paint.isHidden(member)));
paint.clearAll();assert.ok([...paint.parts.values()].every(member=>!paint.isHidden(member)));
assert.equal(elements.get('hidden-parts').hidden,true);
console.log('PASS: complete hiding, grouped hide/restore, hidden-part reselection, no hover reveal, persistence, material switching and unrelated-slot isolation.');

paint.clearAll();
const lowerGroup=paint.groups.find(group=>group.code==='G06');
assert.equal(lowerGroup.members.length,2);
assert.ok(lowerGroup.members.some(member=>member.number==='027-01'));
assert.ok(!second.members.some(member=>member.number==='027-01'||member.number===16));
paint.selected=lowerGroup.members[0];paint.setColor('#d66a38','orange');paint.setMaterial('hidden');
assert.ok(lowerGroup.members.every(member=>paint.isHidden(member)));
assert.ok(second.members.every(member=>!member.edited));
paint.selected=second.members[0];paint.setColor('#9bb3cc','blue');
const lowerSaved=JSON.parse(JSON.stringify(paint.serialize()));paint.clearAll();paint.restore(lowerSaved);
assert.ok(lowerGroup.members.every(member=>paint.isHidden(member)));
assert.ok(second.members.every(member=>paint.overrides.get(member.id).color==='#9bb3cc'));
paint.selected=lowerGroup.members[1];paint.resetSelected();
assert.ok(lowerGroup.members.every(member=>!member.edited));assert.ok(second.members.every(member=>member.edited));
paint.clearAll();paint.restore({[numericIds[16]]:legacy,[numericIds[27]]:legacy,[numericIds[17]]:legacy});
assert.ok([...lowerGroup.members,...second.members].every(member=>paint.overrides.get(member.id).color===legacy.color));
console.log('PASS: G06 rear lower bumper isolation from G03, grouped hide/reset, independent save roundtrip and legacy G03 migration.');
