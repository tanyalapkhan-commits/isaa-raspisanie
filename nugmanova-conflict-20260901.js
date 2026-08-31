(function(){
'use strict';
if(typeof DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const normRoom=v=>N(v).replace(/^ауд(?:итория)?\.?\s*/,'').replace(/\s+/g,'');
function roomsOf(r){return S(r&&r.room_hint).split(/\s*,\s*/).map(normRoom).filter(Boolean);}
function roomBusy(room,day,time,ignore){
  const rr=normRoom(room);
  return DATA.some(x=>x!==ignore&&x&&x.day===day&&x.time===time&&roomsOf(x).includes(rr));
}
function same202(r,code){
  return N(r&&r.group).split(/[;,]/).map(x=>x.trim()).includes(N(code));
}

// В последовательных правках 28–31.08 этот конфликт уже был устранён:
// Н.К. Нугманова, ОВЯ 2 курса, прежний Вт14:40 -> Вт16:20, ауд.151,
// именно из-за общей «Истории арабских стран» у арабистов 2 курса в Вт14:40.
// Поздняя раскладка языковых подгрупп случайно вернула старый час. Восстанавливаем
// ранее согласованное бесконфликтное решение, не меняя остальные часы преподавателя.
const row=DATA.find(r=>r&&N(r.teacher)==='нугманова нодра камиловна'&&S(r.course).trim()==='2 бакалавриат'&&r.day==='Вт'&&r.time==='14:40'&&N(r.discipline).includes('основной восточный язык')&&same202(r,'202_1/3'));
if(row){
  row.day='Вт';
  row.time='16:20';
  const preferred=['151','229','240','327','433','160','149'];
  row.room_hint=preferred.find(room=>!roomBusy(room,'Вт','16:20',row))||'';
  row.quality='01.09.2026: восстановлена ранее согласованная последовательная правка: ОВЯ Н.К. Нугмановой для 202_1/3 перенесён Вт14:40 → Вт16:20 из-за общей «Истории арабских стран» у арабистов 2 курса в Вт14:40. В предыдущей бесконфликтной версии использовалась ауд.151; при загрузке сохраняется она, если свободна, иначе первая свободная из проверенного пула.';
}

if(typeof PUBLIC_DATA!=='undefined'){
  const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
  PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
}
if(typeof roomIndex==='object'&&typeof PUBLIC_DATA!=='undefined'){
  Object.keys(roomIndex).forEach(k=>delete roomIndex[k]);
  PUBLIC_DATA.forEach(r=>{
    if(!r||!r.day||!r.time||r.day==='уточняется'||r.time==='уточняется') return;
    let room='';
    if(typeof singleRoom==='function') room=singleRoom(r.room_hint)||'';
    else if(r.room_hint&&!S(r.room_hint).includes(',')) room=S(r.room_hint).trim();
    if(!room) return;
    const key=r.day+'|'+r.time+'|'+room;
    (roomIndex[key]||(roomIndex[key]=[])).push({teacher:r.teacher,group:r.group,discipline:r.discipline});
  });
}
try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
try{if(typeof showEmpty==='function')showEmpty();}catch(e){}
})();
