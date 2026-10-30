const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('design-library.js','utf8')+';this.library=DesignLibrary;',context);
const library=context.library;
const data=new Map(),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
const old={color:'#647b66',colorName:'green',finish:'matte',wheel:'G',rideHeight:-45,etDelta:-20,parts:{hood:{color:'#ff0000',material:'hidden'}}};
storage.setItem('007gt-design',JSON.stringify(old));
let entries=library.read(storage);assert.equal(entries.length,1);assert.equal(entries[0].id,'legacy-design');
assert.equal(library.read(storage).length,1);assert.equal(library.defaults.color,'#cdcfd4');assert.equal(library.defaults.rideHeight,0);
entries=library.add(storage,old,'  我的搭配  ');assert.equal(entries.length,2);assert.equal(entries[1].name,'我的搭配');
old.parts.hood.color='#ffffff';assert.equal(entries[1].design.parts.hood.color,'#ff0000');
entries=library.add(storage,{...old,color:'#9bb3cc'},'');assert.equal(entries.length,3);assert.equal(entries[2].name,'搭配 03');
assert.equal(new Set(entries.map(entry=>entry.id)).size,3);
assert.equal(JSON.parse(storage.getItem('007gt-design')).parts.hood.color,'#ff0000');
assert.equal(JSON.parse(storage.getItem(library.key))[0].design.color,'#647b66');
// A failed write cannot replace an existing library.
const previous=storage.getItem(library.key),blocked={getItem:storage.getItem,setItem(){throw Error('QuotaExceeded');}};
assert.throws(()=>library.add(blocked,old,'blocked'));assert.equal(storage.getItem(library.key),previous);
// The boot path only lists saved records; it never applies their colours.
const app=fs.readFileSync('app.js','utf8');assert(!app.includes("localStorage.getItem('007gt-design')"));
assert(app.includes('const state = { ...DesignLibrary.defaults,'));
assert(app.includes('renderDesignLibrary(DesignLibrary.read(localStorage))'));
console.log('PASS: one-time legacy migration, append-only saves, distinct names/IDs, complete deep-copied design, failed-write isolation and fresh default startup.');
const target=entries[1].id,otherBefore=JSON.stringify(entries[0]),updated={...old,color:'#222222',parts:{panel:{color:'#aabbcc',material:'carbon'}},rideHeight:42,etDelta:19,rimInches:22};
entries=library.update(storage,target,updated);
assert.equal(entries.length,3);assert.equal(entries[1].id,target);assert.equal(entries[1].name,'我的搭配');assert.equal(entries[1].design.rideHeight,42);assert.equal(entries[1].design.etDelta,19);assert.equal(entries[1].design.rimInches,22);assert.equal(entries[1].design.parts.panel.material,'carbon');assert.equal(JSON.stringify(entries[0]),otherBefore);
updated.parts.panel.color='#000000';assert.equal(library.read(storage)[1].design.parts.panel.color,'#aabbcc');
entries=library.setDeleted(storage,target,true);assert.equal(entries.length,2);assert.equal(library.trash(storage).length,1);
const deletedBefore=storage.getItem(library.key);assert.throws(()=>library.update(storage,target,old));assert.equal(storage.getItem(library.key),deletedBefore);
library.add(storage,old,'new while deleted');assert.equal(library.trash(storage).length,1);
entries=library.setDeleted(storage,target,false);assert.equal(entries.length,4);assert.equal(entries.find(entry=>entry.id===target).design.color,'#222222');assert.equal(library.trash(storage).length,0);
const beforeFailure=storage.getItem(library.key);assert.throws(()=>library.update(blocked,target,old));assert.throws(()=>library.setDeleted(blocked,target,true));assert.equal(storage.getItem(library.key),beforeFailure);
for(const entry of library.read(storage))library.setDeleted(storage,entry.id,true);
assert.equal(library.read(storage).length,0);assert.equal(library.read(storage).length,0);assert.equal(library.trash(storage).length,4); // legacy scheme is not imported again
console.log('PASS: targeted full updates, stable names/IDs, unrelated designs unchanged, recoverable deletion, restore after reload/add, failed mutation isolation and no legacy re-import.');
