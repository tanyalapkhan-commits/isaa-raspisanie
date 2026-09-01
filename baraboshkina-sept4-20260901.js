(function(){
'use strict';
if(typeof DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/[«»"']/g,'').replace(/\s+/g,' ').trim();
const T='барабошкина анастасия валерьевна';
const GROUP='23б/э409-китайский/7';
const normRoom=v=>N(v).replace(/^ауд(?:итория)?\.?\s*/,'').replace(/\s+/g,'');
const roomsOf=r=>S(r&&r.room_hint).split(/\s*,\s*/).map(normRoom).filter(Boolean);
const isOva=r=>r&&(N(r.discipline).includes('основной восточный язык')||/^овя\b/.test(N(r.discipline))||N(r.discipline)==='китайский язык');
function roomBusy(room,day,time,ignore){
  const rr=normRoom(room);
  return DATA.some(r=>r&&r!==ignore&&r.day===day&&r.time===time&&roomsOf(r).includes(rr));
}
function groupBusy(code,day,time,ignore){
  const c=N(code);
  return DATA.some(r=>r&&r!==ignore&&r.day===day&&r.time===time&&N(r.group).includes(c));
}
function removeRow(r){const i=DATA.indexOf(r);if(i>=0)DATA.splice(i,1);}

// Новая прямая корректировка кафедры экономики и экономической географии:
// убрать у А.В. Барабошкиной две понедельничные пары китайского языка.
DATA.filter(r=>r&&N(r.teacher)===T&&r.day==='Пн'&&isOva(r)).forEach(removeRow);

// 4 курс: «Экономика изучаемой страны (Китай)» обычно стоит Ср10:40.
// Только занятие 02.09.2026 переносится на Пт 04.09.2026 13:00.
const row=DATA.find(r=>r&&N(r.teacher)===T&&S(r.course).trim()==='4 бакалавриат'&&N(r.group).includes(GROUP)&&N(r.discipline)==='экономика изучаемой страны (китай)');
if(row){
  const now=new Date();
  const cutoff=new Date(2026,8,5,0,0,0,0); // после 04.09 автоматически возвращаем обычный Ср10:40
  if(now<cutoff){
    const day='Пт', time='13:00';
    // Используем только аудитории с подтверждённым оборудованием для презентаций:
    // 427К — электронная доска; 229/236 — компьютерные классы.
    const techRooms=['427К','229','236'];
    let room='';
    if(!groupBusy('23Б/Э409-китайский/7',day,time,row)) room=techRooms.find(x=>!roomBusy(x,day,time,row))||'';
    row.day=day;
    row.time=time;
    row.room_hint=room;
    row.extra='разово 04.09.2026 вместо 02.09.2026; далее — по обычному расписанию Ср 10:40';
    row.quality='01.09.2026: прямая корректировка кафедры экономики и экономической географии — занятие 4 курса «Экономика изучаемой страны (Китай)» разово перенесено со 02.09 на 04.09, Пт13:00. Аудитория выбирается только из подтверждённых помещений с техникой для презентации (427К/229/236) и только если свободна. После 04.09 публичная карточка автоматически возвращается к обычному Ср10:40.';
  }else{
    row.day='Ср';
    row.time='10:40';
    row.room_hint='228';
    row.extra='';
  }
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
