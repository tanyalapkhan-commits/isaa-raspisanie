(function(){
'use strict';
if(typeof DATA==='undefined') return;
const N=v=>(v==null?'':String(v)).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
DATA.forEach(r=>{
  if(!r) return;
  if(N(r.teacher)==='каимова анна сергеевна' && r.course==='2 магистратура' && r.day==='Вт' && r.time==='13:00' && N(r.discipline).includes('научно-исследовательский семинар')){
    r.group='25М/И205 (китайский)/3; 25М/П205 (китайский)/3';
    r.direction='История + Политология';
    r.extra='китайский';
  }
});
if(typeof PUBLIC_DATA!=='undefined'){
  const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
  PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
}
try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
})();
