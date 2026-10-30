/* Saved designs never become the startup defaults. */
const DesignLibrary={
  key:'007gt-design-library',
  defaults:Object.freeze({color:'#cdcfd4',colorName:'冰川银',finish:'gloss',wheel:'C',rideHeight:0,etDelta:0,rimInches:19}),
  valid(design){return !!design&&/^#[0-9a-f]{6}$/i.test(design.color);},
  all(storage){
    const raw=storage.getItem(this.key);
    if(raw!==null){
      const records=JSON.parse(raw);
      if(!Array.isArray(records))throw Error('Invalid design library');
      return records.filter(record=>typeof record.id==='string'&&typeof record.name==='string'&&this.valid(record.design));
    }
    // Preserve the former single saved scheme as a selectable entry, once.
    const old=storage.getItem('007gt-design');
    if(old){
      let design;try{design=JSON.parse(old);}catch{return [];}
      if(this.valid(design)){
        const records=[{id:'legacy-design',name:'之前保存的搭配',design}];
        storage.setItem(this.key,JSON.stringify(records));return records;
      }
    }
    return [];
  },
  read(storage){return this.all(storage).filter(record=>!record.deleted);},
  trash(storage){return this.all(storage).filter(record=>record.deleted);},
  update(storage,id,design){
    if(!this.valid(design))throw Error('Invalid design');
    const records=this.all(storage),record=records.find(record=>record.id===id&&!record.deleted);
    if(!record)throw Error('Design not found');
    record.design=JSON.parse(JSON.stringify(design));storage.setItem(this.key,JSON.stringify(records));return this.read(storage);
  },
  setDeleted(storage,id,deleted){
    const records=this.all(storage),record=records.find(record=>record.id===id);
    if(!record)throw Error('Design not found');
    record.deleted=deleted;storage.setItem(this.key,JSON.stringify(records));return this.read(storage);
  },
  add(storage,design,name){
    if(!this.valid(design))throw Error('Invalid design');
    const records=this.all(storage);
    const record={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),name:(name||'').trim().slice(0,40)||'搭配 '+String(records.filter(record=>!record.deleted).length+1).padStart(2,'0'),design:JSON.parse(JSON.stringify(design))};
    records.push(record);storage.setItem(this.key,JSON.stringify(records));return this.read(storage);
  }
};
