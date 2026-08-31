(function(){
'use strict';
if(typeof DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const MAP={
 'горячева николь андреевна':{
  'Вт|9:00':'202_1/3','Ср|9:00':'202_1/3',
  'Вт|10:40':'202_2/3','Ср|10:40':'202_2/3',
  'Вт|13:00':'202_3/3','Чт|10:40':'202_3/3',
  'Ср|13:00':'202_4/3','Чт|13:00':'202_4/3'
 },
 'нугманова нодра камиловна':{
  'Вт|10:40':'202_4/3','Вт|13:00':'202_2/3','Вт|14:40':'202_1/3',
  'Ср|10:40':'202_3/3','Ср|13:00':'202_3/3',
  'Пт|10:40':'202_2/3','Пт|13:00':'202_4/3','Пт|14:40':'202_1/3'
 },
 'гайнутдинова аделя равилевна':{
  'Чт|9:00':'202_1/3','Чт|10:40':'202_2/3','Пт|9:00':'202_3/3','Сб|9:00':'202_4/3'
 },
 'налич татьяна сергеевна':{
  'Пн|9:00':'202_1/3','Пн|10:40':'202_2/3','Ср|9:00':'202_4/3','Чт|9:00':'202_3/3'
 },
 'налич мария сергеевна':{
  'Пн|9:00':'202_2/3','Пн|10:40':'202_1/3'
 }
};
function isArabicOva(r){
 if(!r||r.course!=='2 бакалавриат') return false;
 const d=N(r.discipline), e=N(r.extra), g=N(r.group);
 return (d.includes('основной восточный язык')||d==='овя'||d==='арабский язык')&&(e.includes('араб')||d.includes('араб')||g.includes('араб')||g.includes('202_'));
}
DATA.forEach(r=>{
 if(!isArabicOva(r)) return;
 const m=MAP[N(r.teacher)]; if(!m) return;
 const group=m[r.day+'|'+r.time]; if(!group) return;
 r.group=group;
 r.direction='ОВЯ (арабский, языковая группа '+group+')';
});

// Проверка: одна языковая группа не может одновременно быть у двух преподавателей.
const collisions=[]; const seen={};
DATA.filter(isArabicOva).forEach(r=>{
 const g=S(r.group).trim(); if(!/^202_[1-4]\/3$/.test(g)) return;
 const k=r.day+'|'+r.time+'|'+g;
 if(seen[k]&&seen[k]!==r.teacher) collisions.push(k); else seen[k]=r.teacher;
});
// При неожиданной коллизии не публикуем ложное назначение.
if(collisions.length){
 const bad=new Set(collisions);
 DATA.forEach(r=>{const k=r.day+'|'+r.time+'|'+S(r.group).trim(); if(bad.has(k)&&isArabicOva(r)) r.group='2 курс — арабский — группа уточняется';});
}

if(typeof GROUP_LABELS!=='undefined'){
 Object.keys(GROUP_LABELS).forEach(k=>{if(N(k).includes('овя 2 курс — кафедральная сетка преподавателя')) delete GROUP_LABELS[k];});
 ['202_1/3','202_2/3','202_3/3','202_4/3'].forEach(g=>GROUP_LABELS[g]='2 курс — арабский — языковая группа '+g);
 if(GROUP_LABELS['2и_арабский']) GROUP_LABELS['2и_арабский']='2 курс — история — арабский (академическая группа)';
 if(GROUP_LABELS['2п_арабский']) GROUP_LABELS['2п_арабский']='2 курс — политология — арабский (академическая группа)';
 if(GROUP_LABELS['2ф_арабский']) GROUP_LABELS['2ф_арабский']='2 курс — филология — арабский (академическая группа)';
 if(GROUP_LABELS['2э_арабский']) GROUP_LABELS['2э_арабский']='2 курс — экономика — арабский (академическая группа)';
}

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
  const k=r.day+'|'+r.time+'|'+room;
  (roomIndex[k]||(roomIndex[k]=[])).push({teacher:r.teacher,group:r.group,discipline:r.discipline});
 });
}
try{if(typeof buildGroupItems==='function') buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function') buildBrowseList();}catch(e){}
try{if(typeof showEmpty==='function') showEmpty();}catch(e){}

// Короткая инструкция: академическую группу используют для общих предметов,
// 202_1/3–202_4/3 — для арабского ОВЯ.
const help=document.getElementById('modeHelp');
if(help) help.textContent='Для арабского ОВЯ 2 курса выбирайте свою языковую группу 202_1/3, 202_2/3, 202_3/3 или 202_4/3. Для общих предметов выбирайте академическую группу: 2и_арабский, 2п_арабский, 2ф_арабский или 2э_арабский.';
})();
