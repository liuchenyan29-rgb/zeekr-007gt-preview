const CustomPalette={
  key:'007gt-common-colors',
  read(storage){
    const value=JSON.parse(storage.getItem(this.key)||'[]');
    if(!Array.isArray(value))throw Error('Invalid palette');
    return value.filter(item=>/^#[0-9a-f]{6}$/i.test(item?.color)&&typeof item.name==='string');
  },
  add(storage,color,name){
    if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Invalid colour');
    const colors=this.read(storage),hex=color.toLowerCase();
    const existing=colors.find(item=>item.color.toLowerCase()===hex);
    if(existing){if((name||'').trim()){existing.name=name.trim().slice(0,24);storage.setItem(this.key,JSON.stringify(colors));}return colors;}
    colors.push({color:hex,name:(name||'').trim().slice(0,24)||hex.toUpperCase()});
    storage.setItem(this.key,JSON.stringify(colors));return colors;
  }
};
