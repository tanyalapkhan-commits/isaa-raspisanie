(function(){
'use strict';
if(typeof DATA==='undefined') return;

const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const TEACHER='Магдалинская Юлия Васильевна';
const isTeacher=r=>r&&N(r.teacher)===N(TEACHER);
const isOva=r=>r&&N(r.discipline).includes('основной восточный язык');
const normRoom=v=>N(v).replace(/^ауд(?:итория)?\.?\s*/,'').replace(/\s+/g,'');
const roomsOf=r=>S(r&&r.room_hint).split(/\s*,\s*/).map(normRoom).filter(Boolean);

function roomBusy(room,day,time,ignore){
  const rr=normRoom(room);
  return DATA.some(x=>x!==ignore&&x&&x.day===day&&x.time===time&&roomsOf(x).includes(rr));
}
function pickRoom(row,day,time,preferred){
  const candidates=[...(preferred||[]),'317','414','152','433','303','416','418','410','432','313 кит.'];
  const seen=new Set();
  for(const room of candidates){
    const k=normRoom(room);
    if(!k||seen.has(k)) continue;
    seen.add(k);
    if(!roomBusy(room,day,time,row)) return room;
  }
  return '';
}

// 1) 2 курс, студенты из Китая: Пн16:20 -> Вт16:20.
// Сначала освобождаем понедельник 16:20 для 23Б/Э409.
const china2=DATA.find(r=>isTeacher(r)&&r.course==='2 бакалавриат'&&isOva(r)&&N(r.group).includes('студенты из китая')&&r.day==='Пн'&&r.time==='16:20');
if(china2){
  china2.day='Вт';
  china2.time='16:20';
  china2.room_hint=pickRoom(china2,'Вт','16:20',['317'])||china2.room_hint;
  china2.quality='01.09.2026: прямая корректировка кафедры китайской филологии — группа 2 курса студентов из Китая перенесена Пн16:20 → Вт16:20 из-за занятости преподавателя по основному месту работы.';
}

// 2) 23Б/Э409: Пн13:00 -> Пн16:20.
// Время освободилось после предыдущего согласованного переноса другого занятия этой группы.
const econ4=DATA.find(r=>isTeacher(r)&&r.course==='4 бакалавриат'&&isOva(r)&&/^23Б\/Э409/i.test(S(r.group))&&r.day==='Пн'&&r.time==='13:00');
if(econ4){
  econ4.day='Пн';
  econ4.time='16:20';
  econ4.room_hint=pickRoom(econ4,'Пн','16:20',['317'])||econ4.room_hint;
  econ4.quality='01.09.2026: прямая корректировка кафедры китайской филологии — 23Б/Э409 перенесена Пн13:00 → Пн16:20; слот освобождён предыдущим согласованным переносом.';
}

// 3) 23Б/П409: Пн14:40 -> Пн18:00.
const pol4=DATA.find(r=>isTeacher(r)&&r.course==='4 бакалавриат'&&isOva(r)&&/^23Б\/П409/i.test(S(r.group))&&r.day==='Пн'&&r.time==='14:40');
if(pol4){
  pol4.day='Пн';
  pol4.time='18:00';
  pol4.room_hint=pickRoom(pol4,'Пн','18:00',['414'])||pol4.room_hint;
  pol4.quality='01.09.2026: прямая корректировка кафедры китайской филологии — 23Б/П409 перенесена Пн14:40 → Пн18:00 из-за занятости преподавателя по основному месту работы.';
}

// Синхронизация публичной базы и индекса аудиторий.
if(typeof PUBLIC_DATA!=='undefined'){
  const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
  PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
}
if(typeof roomIndex==='object'&&typeof PUBLIC_DATA!=='undefined'){
  Object.keys(roomIndex).forEach(k=>delete roomIndex[k]);
  PUBLIC_DATA.forEach(r=>{
    if(!r||!r.day||!r.time||r.day==='уточняется') return;
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
