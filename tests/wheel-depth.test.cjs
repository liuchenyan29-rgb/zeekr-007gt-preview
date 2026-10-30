const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={Laya:{},document:{documentElement:{dataset:{}}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('wheel-upgrades.js','utf8')+';this.upgrades=WheelUpgrades;',ctx);
class Mesh{constructor(v){this.v=v;this._vertexBuffer={vertexDeclaration:{vertexStride:32}};}clone(){return new Mesh(new Float32Array(this.v));}getVertices(){return this.v.buffer;}setVertices(b){this.v=new Float32Array(b);}calculateBounds(){}}
for(const code of ['vfs2','vfs4']){
 const root='resources/wheels/vossen/'+code+'/',meta=JSON.parse(fs.readFileSync(root+'model.json'));let closest=Infinity;
 for(const p of meta.parts){const b=fs.readFileSync(root+p.vertexFile),v=new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),out=ctx.upgrades.fitRimDepth(new Mesh(v),{width:.265751},19*.0254).v;
  for(let k=0;k<v.length;k+=8){assert.equal(out[k+1],v[k+1]);assert.equal(out[k+2],v[k+2]);assert.equal(out[k+6],v[k+6]);assert.equal(out[k+7],v[k+7]);assert(Math.abs(Math.hypot(out[k+3],out[k+4],out[k+5])-1)<1e-5);if(Math.hypot(v[k+1],v[k+2])<.4)closest=Math.min(closest,out[k]*(19*.0254));}
 }
 // Original caliper outer plane is <= .892389m; wheel axle is .821883m.
 assert(closest>.892389-.821883+.01,code+' spoke/hub clears factory caliper by at least 10mm');
 console.log('PASS:',code,'hub/spoke clearance',Math.round((closest-(.892389-.821883))*1000)+'mm; radial geometry, UVs and unit normals retained.');
}
