const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class V{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}clone(){return new V(this.x,this.y,this.z);}}
const context={Laya:{MeshRenderer:class{}},document:{documentElement:{dataset:{}}}};
vm.createContext(context);vm.runInContext(fs.readFileSync('fitment.js','utf8')+';this.fit=Fitment;',context);
const fit=context.fit;
const body={transform:{position:new V(0,.1,0)}},interior={transform:{position:new V(0,.2,0)}};
const wheel=(x,z)=>({transform:{position:new V(x,.4,z)},numChildren:0,getComponent(){return {bounds:{getMin:()=>new V(x-.1,0,z),getMax:()=>new V(x+.1,1,z)}};}});
const wheels=[wheel(-.9,1.7),wheel(.9,1.7),wheel(-.9,-1.2),wheel(.9,-1.2)];
const root={numChildren:4,getComponent(){return null;},getChildAt(i){return wheels[i];}};
fit.init([body,interior]);fit.registerWheels(root);
for(let i=0;i<100;i++)fit.tick(50,{rideHeight:-80,etDelta:-40});
assert.equal(body.transform.position.y,.1-.08);assert.equal(interior.transform.position.y,.2-.08);
for(const w of wheels){assert(Math.abs(Math.abs(w.transform.position.x)-.94)<1e-12);assert.equal(w.transform.position.y,.4);}
fit.apply();assert(Math.abs(wheels[0].transform.position.x+.94)<1e-12); // no cumulative drift
for(let i=0;i<100;i++)fit.tick(50,{rideHeight:60,etDelta:40});
assert.equal(body.transform.position.y,.16);assert(Math.abs(wheels[0].transform.position.x+.86)<1e-12);
for(let i=0;i<100;i++)fit.tick(50,{rideHeight:0,etDelta:0});
assert.equal(body.transform.position.y,.1);assert.equal(wheels[0].transform.position.x,-.9);
assert.equal(fit.clamp(undefined,-80,60),0);assert.equal(fit.clamp(-1000,-80,60),-80);
// Offsetting individual mesh leaves must not move a child a second time.
for(const type of ['A','B','C','E','F','G']){
 let count=0;
 function check(n){if((n._$comp||[]).some(c=>c._$type==='MeshRenderer')){assert.equal((n._$child||[]).length,0,type+' renderer is a leaf');count++;}for(const child of n._$child||[])check(child);}
 check(JSON.parse(fs.readFileSync('resources/car/cc1e/cc1efab/cc1e_Tire_'+type+'.lh')));assert(count>0);
}
console.log('PASS: suspension moves body/interior only, ET symmetric direction and distance, no drift, reset, input bounds and all six wheel hierarchies.');
// Real vertex deformation keeps the tread circumference fixed while changing the bead/rim.
context.Laya.MeshFilter=class{};
class Matrix{constructor(e){this.elements=e||[1,0,0,0,0,1,0,0,0,0,1,0,.9,.4,1.7,1];}clone(){return new Matrix([...this.elements]);}invert(out){out.elements=[1,0,0,0,0,1,0,0,0,0,1,0,-.9,-.4,-1.7,1];}}
const buffer=new Float32Array([0,.36,0,0,1,0,0,0, 0,-.36,0,0,-1,0,0,0, 0,.2413,0,0,1,0,0,0, 0,.30,0,0,1,0,0,0]);
class Mesh{constructor(v=buffer){this.v=new Float32Array(v);this.vertexCount=4;this._vertexBuffer={vertexDeclaration:{vertexStride:32}};}clone(){return new Mesh(this.v);}getVertices(){return this.v.buffer;}setVertices(b){this.v=new Float32Array(b);}calculateBounds(){}}
const filter={sharedMesh:new Mesh()},renderer={enabled:true,bounds:{getMin:()=>new V(.8,.04,1.34),getMax:()=>new V(1,.76,2.06)}};
const node={numChildren:0,transform:{position:new V(.9,.4,1.7),worldMatrix:new Matrix()},getComponent(type){return type===context.Laya.MeshFilter?filter:renderer;}};
fit.registerWheels(node);fit.rimInches=18;fit.apply();
assert(Math.abs(filter.sharedMesh.v[1]-.36)<1e-7);assert(Math.abs(filter.sharedMesh.v[9]+.36)<1e-7);assert(Math.abs(filter.sharedMesh.v[17]-.2286)<1e-6);
fit.rimInches=22;fit.apply();assert(Math.abs(filter.sharedMesh.v[17]-.2794)<1e-6);assert(Math.abs(filter.sharedMesh.v[1]-.36)<1e-7);
assert.equal(body.transform.position.y,.1);assert.equal(node.transform.position.y,.4);
fit.rimInches=19;fit.apply();assert(Math.abs(filter.sharedMesh.v[17]-.2413)<1e-6);assert(Math.abs(filter.sharedMesh.v[25]-.30)<1e-6);
assert.equal(filter.sharedMesh.v[3],0);assert.equal(filter.sharedMesh.v[4],1); // normal/UV attributes retained
console.log('PASS: 18–22 inch rim deformation, invariant tire outer diameter/axle/body height, thinner sidewall, roundtrip without drift and retained vertex attributes.');
// Imported rims must meet the measured OEM bead, not an assumed nominal radius.
const makeFitNode=(r,tire)=>{
 const data=new Float32Array([0,.3654,0,0,1,0,0,0,0,-.3654,0,0,1,0,0,0,0,r,0,0,1,0,0,0,0,-r,0,0,1,0,0,0]);
 const f={sharedMesh:new Mesh(data)};
 return {numChildren:0,_tireBead:tire?r:undefined,_aftermarketRim:!tire,transform:{position:new V(.9,.4,1.7),worldMatrix:new Matrix()},getComponent(type){return type===context.Laya.MeshFilter?f:{enabled:true,bounds:{getMin:()=>new V(.76,.0346,1.3346),getMax:()=>new V(1.04,.7654,2.0654)}};},filter:f};
};
const tire=makeFitNode(.259027,true),rim=makeFitNode(.2413,false);
// Rim-only mesh should not contain the tire outer circumference.
rim.filter.sharedMesh=new Mesh(new Float32Array([0,.2413,0,0,1,0,0,0,0,-.2413,0,0,1,0,0,0,0,.1,0,0,1,0,0,0,0,-.1,0,0,1,0,0,0]));
fit.registerWheels({numChildren:2,getComponent(){return null;},getChildAt(i){return [tire,rim][i];}});
for(const inches of [18,19,22,19]){fit.rimInches=inches;fit.apply();const bead=tire.filter.sharedMesh.v[17],lip=rim.filter.sharedMesh.v[1];assert(Math.abs(lip-bead-.002)<1e-6);assert(Math.abs(tire.filter.sharedMesh.v[1]-.3654)<1e-6);}
console.log('PASS: measured OEM bead calibration, 2mm lip overlap at 18/19/22 inches, retained tread diameter and repeatable resizing.');
