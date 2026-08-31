(function(){
'use strict';
if(typeof DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const has=(v,s)=>N(v).includes(N(s));
const by=(r,s)=>r&&has(r.teacher,s);
const ova=r=>r&&(has(r.discipline,'основной восточный язык')||N(r.discipline)==='овя'||has(r.discipline,'арабский язык'));

// Аганина Г.Р. — Вт 13:00 это «Теория ОВЯ», не ОВЯ.
DATA.forEach(r=>{
  if(by(r,'Аганина')&&r.day==='Вт'&&r.time==='13:00') r.discipline='Теория ОВЯ';
});

// Налич Т.С. — удалить ложный спецкурс Вт 16:20.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(by(r,'Налич Татьяна')&&r.day==='Вт'&&r.time==='16:20'&&has(r.discipline,'спец')) DATA.splice(i,1);
}

// Налич Т.С. — ОВЯ 2 курса не должен стоять Вт 9:00; перенос в Пн 10:40.
DATA.forEach(r=>{
  if(by(r,'Налич Татьяна')&&r.course==='2 бакалавриат'&&ova(r)&&r.day==='Вт'&&r.time==='9:00'){
    r.day='Пн'; r.time='10:40';
    if(!r.room_hint) r.room_hint='';
  }
});

// Сводная литература 4 курса у Т.С. и М.С. Налич — Пн 13:00, совместное чтение.
DATA.forEach(r=>{
  if((by(r,'Налич Татьяна')||by(r,'Налич Мария'))&&r.course==='4 бакалавриат'&&has(r.discipline,'литератур')){
    // Не трогаем отдельные явно помеченные занятия, если они не являются сводной литературой.
    const g=N(r.group), d=N(r.discipline);
    if(g.includes('араб')||d.includes('араб')||has(r.extra,'араб')){
      r.day='Пн'; r.time='13:00';
    }
  }
});

// Нугманова Н.К. — только Вт/Ср/Пт, не ранее 10:40. В актуальном своде утверждена схема 3+2+3.
const nug=DATA.filter(r=>by(r,'Нугманова')&&r.course==='2 бакалавриат'&&ova(r));
if(nug.length){
  const slots=[['Вт','10:40'],['Вт','13:00'],['Вт','14:40'],['Ср','10:40'],['Ср','13:00'],['Пт','10:40'],['Пт','13:00'],['Пт','14:40']];
  // Перестраиваем только если число фактических строк совпадает с подтверждёнными 8 парами.
  if(nug.length===8){
    nug.forEach((r,i)=>{r.day=slots[i][0];r.time=slots[i][1];});
  }
}

// Савватеева Т.С. — 3 курс: Ср 10:40/13:00; Пт 9:00/10:40.
const sav3=DATA.filter(r=>by(r,'Савватеева')&&r.course==='3 бакалавриат'&&ova(r));
if(sav3.length===4){
  const slots=[['Ср','10:40'],['Ср','13:00'],['Пт','9:00'],['Пт','10:40']];
  sav3.forEach((r,i)=>{r.day=slots[i][0];r.time=slots[i][1]; if(!r.room_hint) r.room_hint='327';});
}

// Горячева Н.А. — магистратура ЭР-102 только две субботние пары: 10:40 и 13:00.
const gMaster=DATA.filter(r=>by(r,'Горячева')&&r.course==='2 магистратура'&&(N(r.group).includes('эр102')||N(r.group).includes('эр-102')||N(r.group).includes('102'))&&has(r.discipline,'араб'));
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(gMaster.includes(r)&&r.day==='Сб'&&!['10:40','13:00'].includes(r.time)) DATA.splice(i,1);
}
if(gMaster.length>=2){
  gMaster[0].day='Сб'; gMaster[0].time='10:40';
  gMaster[1].day='Сб'; gMaster[1].time='13:00';
}

// Горячева Н.А. — 2 бакалавриат: Вт/Ср/Чт, 3+3+2, как в актуальном своде.
const gB=DATA.filter(r=>by(r,'Горячева')&&r.course==='2 бакалавриат'&&ova(r));
if(gB.length===8){
  const slots=[['Вт','9:00'],['Вт','10:40'],['Вт','13:00'],['Ср','9:00'],['Ср','10:40'],['Ср','13:00'],['Чт','10:40'],['Чт','13:00']];
  gB.forEach((r,i)=>{r.day=slots[i][0];r.time=slots[i][1];});
}

// Гайнутдинова А.Р. — подтверждённые 4 пары: Чт9, Чт10:40, Пт9, Сб9. Спецкурс магистратуры не трогаем.
const gain=DATA.filter(r=>by(r,'Гайнутдинова')&&r.course==='2 бакалавриат'&&ova(r));
if(gain.length===4){
  const slots=[['Чт','9:00'],['Чт','10:40'],['Пт','9:00'],['Сб','9:00']];
  gain.forEach((r,i)=>{r.day=slots[i][0];r.time=slots[i][1]; if(!r.room_hint) r.room_hint='177';});
}

// Акинина О.Г. — актуальная база уже содержит 4 пары в 2 рабочих дня.
// Не размножаем их по академическим И/П/Ф/Э группам и не меняем безопасные слоты без необходимости.

// Последнее прямое сообщение М.С. Налич о двух парах на 01.09 имеет приоритет
// и применяется отдельным более поздним hotfix nalich-tomorrow-20260901.js.

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
    else if(r.room_hint&&!S(r.room_hint).includes(',')) room=S(r.room_hint).trim();
    if(!room) return;
    const key=r.day+'|'+r.time+'|'+room;
    (roomIndex[key]||(roomIndex[key]=[])).push({teacher:r.teacher,group:r.group,discipline:r.discipline});
  });
}
try{if(typeof buildGroupItems==='function') buildGroupItems();}catch(e){}
})();
