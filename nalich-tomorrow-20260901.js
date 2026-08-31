(function(){
'use strict';
if(typeof DATA==='undefined') return;

const name='Налич Мария Сергеевна';
const norm=v=>(v==null?'':String(v)).toLowerCase().replace(/ё/g,'е').trim();
const isNalich=r=>r&&norm(r.teacher)===norm(name);
const isArabic=r=>r&&(norm(r.extra).includes('араб')||norm(r.discipline).includes('араб'));
const isOva=r=>r&&(norm(r.discipline).includes('основной восточный язык')||norm(r.discipline)==='арабский язык'||norm(r.discipline)==='овя');

// Последнее прямое сообщение М.С. Налич на 01.09.2026:
// завтра ей нужны ровно две пары — 9:00 и 10:40. Порядок групп для неё не принципиален.
// Историки идут на 9:00, политологи — на 10:40.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(!isNalich(r)||r.course!=='4 бакалавриат'||r.day!=='Вт'||!isArabic(r)||!isOva(r)) continue;
  if(r.time==='9:00'||r.time==='10:40') DATA.splice(i,1);
}

DATA.push({
  group:'23Б/И402-арабский/7',
  course:'4 бакалавриат',
  direction:'История',
  day:'Вт',
  time:'9:00',
  discipline:'Основной восточный язык (по изучаемому языку)',
  extra:'арабский',
  teacher:name,
  room_hint:'240',
  quality:'01.09.2026: оперативная расстановка на вторник по прямому сообщению М.С. Налич.'
});
DATA.push({
  group:'23Б/П402-арабский/7',
  course:'4 бакалавриат',
  direction:'Политология',
  day:'Вт',
  time:'10:40',
  discipline:'Основной восточный язык (по изучаемому языку)',
  extra:'арабский',
  teacher:name,
  room_hint:'406',
  quality:'01.09.2026: оперативная расстановка на вторник по прямому сообщению М.С. Налич.'
});

if(typeof PUBLIC_DATA!=='undefined'){
  const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
  PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
}
if(typeof roomIndex!=='undefined'&&typeof PUBLIC_DATA!=='undefined'){
  Object.keys(roomIndex).forEach(k=>delete roomIndex[k]);
  PUBLIC_DATA.forEach(r=>{
    if(!r||!r.day||!r.time||r.day==='уточняется') return;
    let room='';
    if(typeof singleRoom==='function') room=singleRoom(r.room_hint)||'';
    else if(r.room_hint&&!String(r.room_hint).includes(',')) room=String(r.room_hint).trim();
    if(!room) return;
    const key=r.day+'|'+r.time+'|'+room;
    (roomIndex[key]||(roomIndex[key]=[])).push({teacher:r.teacher,group:r.group,discipline:r.discipline});
  });
}
try{if(typeof buildGroupItems==='function') buildGroupItems();}catch(e){}
})();
