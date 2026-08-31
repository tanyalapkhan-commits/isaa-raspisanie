(function(){
'use strict';
if(typeof DATA==='undefined') return;

const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const normRoom=v=>N(v).replace(/^ауд(?:итория)?\.?\s*/,'').replace(/\s+/g,'');
const roomsOf=r=>S(r&&r.room_hint).split(/\s*,\s*/).map(normRoom).filter(Boolean);
const TURKIC=new Set([
  'чиврикова анна владимировна','напольнова елена марковна','оганова елена александровна',
  'репенкова мария михайловна','лосева-бахтиярова танем валерьевна',
  'верхова ксения александровна','йылмаз мехтап'
]);
const isTeacher=(r,name)=>r&&N(r.teacher)===N(name);
const isOva=r=>r&&(N(r.discipline).includes('основной восточный язык')||/^овя\b/.test(N(r.discipline)));
const splitGroups=v=>S(v).split(/[;,]/).map(x=>x.trim()).filter(Boolean);
const uniq=a=>[...new Set(a)];

function roomBusy(room,day,time,ignore){
  const rr=normRoom(room);
  return DATA.some(x=>x&&x!==ignore&&x.day===day&&x.time===time&&roomsOf(x).includes(rr));
}
function teacherBusy(name,day,time,ignore){
  return DATA.some(x=>x&&x!==ignore&&x.day===day&&x.time===time&&N(x.teacher)===N(name));
}
function codeBusy(code,day,time,ignore){
  const c=N(code);
  return DATA.some(x=>x&&x!==ignore&&x.day===day&&x.time===time&&N(x.group).includes(c));
}
function firstFreeRoom(row,day,time,candidates){
  for(const room of candidates) if(!roomBusy(room,day,time,row)) return room;
  return '';
}
function removeRow(row){
  const i=DATA.indexOf(row); if(i>=0) DATA.splice(i,1);
}
function setGroup(row,groups,direction){
  if(!row) return;
  row.group=groups.join('; ');
  if(direction!==undefined) row.direction=direction;
}

// ---------------------------------------------------------------------------
// 1) А.В. Чиврикова, 1 курс. По последнему прямому сообщению кафедры на 2026/27
// существуют только две турецкие группы: П119 и Ф119. В указанных кафедрой
// слотах убираем старые И119/Э119 и сводим П+Ф в одну нормальную запись.
// ---------------------------------------------------------------------------
const P1='26Б/П119-турецкий/1', F1='26Б/Ф119-турецкий/1';
const I1='26Б/И119-турецкий/1', E1='26Б/Э119-турецкий/1';

// Старых несуществующих И/Э не должно оставаться в ОВЯ Чивриковой вообще.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(isTeacher(r,'Чиврикова Анна Владимировна')&&S(r.course).trim()==='1 бакалавриат'&&isOva(r)){
    const g=N(r.group);
    if(g.includes(N(I1))||g.includes(N(E1))){
      const kept=splitGroups(r.group).filter(x=>N(x)!==N(I1)&&N(x)!==N(E1));
      if(kept.length) r.group=kept.join('; '); else DATA.splice(i,1);
    }
  }
}

const chivSlots=[['Пн','9:00'],['Пн','10:40'],['Вт','9:00'],['Вт','10:40'],['Чт','9:00']];
for(const [day,time] of chivSlots){
  const rows=DATA.filter(r=>isTeacher(r,'Чиврикова Анна Владимировна')&&S(r.course).trim()==='1 бакалавриат'&&isOva(r)&&r.day===day&&r.time===time);
  let keep=rows.find(r=>N(r.group).includes(N(P1)))||rows.find(r=>N(r.group).includes(N(F1)))||rows[0];
  if(!keep){
    keep={group:P1+'; '+F1,course:'1 бакалавриат',direction:'Политология + Филология',day,time,discipline:'Основной восточный язык (по изучаемому языку)',extra:'турецкий',teacher:'Чиврикова Анна Владимировна',room_hint:'',quality:''};
    DATA.push(keep);
  }
  setGroup(keep,[P1,F1],'Политология + Филология');
  keep.extra='турецкий';
  keep.quality='01.09.2026: прямая корректировка кафедры тюркской филологии — на 1 курсе у А.В. Чивриковой действуют только группы 26Б/П119-турецкий/1 и 26Б/Ф119-турецкий/1.';
  rows.forEach(r=>{if(r!==keep) removeRow(r);});
}

// ---------------------------------------------------------------------------
// 2) Мехтап Йылмаз: снимаем прямое совпадение с Чивриковой во Вт 9:00.
// Актуальная форма 2026/27 разрешает Пн/Вт/Ср, 9:00/10:40/13:00 и просит
// по возможности 2–3 пары. Для набора 2026/27 это одна пара в неделю.
// Объединяем П119+Ф119 и выбираем первый реально свободный допустимый слот:
// приоритет Ср13:00, затем Пн13:00. Если оба заняты — не выдумываем время.
// ---------------------------------------------------------------------------
const yilmaz1=DATA.filter(r=>isTeacher(r,'Йылмаз Мехтап')&&S(r.course).trim()==='1 бакалавриат'&&isOva(r));
if(yilmaz1.length){
  const keep=yilmaz1.find(r=>r.day==='Вт'&&r.time==='9:00')||yilmaz1[0];
  yilmaz1.forEach(r=>{if(r!==keep) removeRow(r);});
  setGroup(keep,[P1,F1],'Политология + Филология');
  keep.extra='турецкий';
  const candidates=[['Ср','13:00'],['Пн','13:00']];
  let placed=false;
  for(const [day,time] of candidates){
    if(teacherBusy('Йылмаз Мехтап',day,time,keep)) continue;
    if(codeBusy(P1,day,time,keep)||codeBusy(F1,day,time,keep)) continue;
    const room=firstFreeRoom(keep,day,time,['346','235','160','149','151','229','401','424']);
    if(!room) continue;
    keep.day=day; keep.time=time; keep.room_hint=room; placed=true; break;
  }
  if(!placed){keep.day='уточняется';keep.time='уточняется';keep.room_hint='';}
  keep.quality='01.09.2026: по прямому замечанию кафедры снято совпадение А.В. Чивриковой и М. Йылмаз во Вт 9:00. Для Йылмаз использован первый свободный слот внутри её актуальных пожеланий 2026/27 (приоритет Ср13:00, затем Пн13:00); если оба заняты, время оставляется на уточнение.';
}

// ---------------------------------------------------------------------------
// 3) Е.М. Напольнова: кафедра прямо закрепила ауд.401 за ВСЕМИ перечисленными
// занятиями. Времена и группы не меняем.
// ---------------------------------------------------------------------------
const napSlots=new Set(['Пн|9:00','Пн|10:40','Пн|13:00','Пн|14:40','Вт|9:00','Вт|10:40','Вт|14:40','Чт|9:00','Чт|10:40','Чт|13:00']);
DATA.forEach(r=>{
  if(isTeacher(r,'Напольнова Елена Марковна')&&napSlots.has(r.day+'|'+r.time)){
    r.room_hint='401';
    r.quality='01.09.2026: прямая корректировка кафедры тюркской филологии — аудитория 401.';
  }
});

// Если прежняя тюркская строка всё ещё занимала 401 в один из закреплённых
// Напольновой слотов, меняем ТОЛЬКО её аудиторию, не время и не группу.
for(const key of napSlots){
  const [day,time]=key.split('|');
  const napHere=DATA.some(r=>isTeacher(r,'Напольнова Елена Марковна')&&r.day===day&&r.time===time&&roomsOf(r).includes(normRoom('401')));
  if(!napHere) continue;
  const others=DATA.filter(r=>r&&r.day===day&&r.time===time&&N(r.teacher)!==N('Напольнова Елена Марковна')&&TURKIC.has(N(r.teacher))&&roomsOf(r).includes(normRoom('401')));
  for(const r of others){
    const room=firstFreeRoom(r,day,time,['424','346','235','160','149','151','229']);
    if(room) r.room_hint=room; else r.room_hint='';
  }
}

// После закрепления 401 под Напольнову назначаем Чивриковой конкретные свободные
// аудитории в её исправленных слотах, чтобы в карточке не оставался старый список.
for(const [day,time] of chivSlots){
  const r=DATA.find(x=>isTeacher(x,'Чиврикова Анна Владимировна')&&S(x.course).trim()==='1 бакалавриат'&&isOva(x)&&x.day===day&&x.time===time);
  if(r){
    const room=firstFreeRoom(r,day,time,['346','235','160','149','151','229','424']);
    r.room_hint=room||'';
  }
}

// ---------------------------------------------------------------------------
// 4) Т.В. Лосева-Бахтиярова — точные группы по последней кафедральной таблице.
// ---------------------------------------------------------------------------
const losevaCorrections=[
  ['Пн','18:00',['24Б/Ф319-турецкий/5'],'Филология'],
  ['Пн','19:40',['24Б/И319-турецкий/5','24Б/Э319-турецкий/5'],'История + Экономика'],
  ['Пт','10:40',['24Б/Ф319-турецкий/5','24Б/П319-турецкий/5'],'Филология + Политология'],
  ['Пт','14:40',['25Б/И219-турецкий/3','25Б/П219-турецкий/3'],'История + Политология'],
  ['Пт','18:00',['25Б/Э219-турецкий/3'],'Экономика']
];
for(const [day,time,groups,dir] of losevaCorrections){
  const rows=DATA.filter(r=>isTeacher(r,'Лосева-Бахтиярова Танем Валерьевна')&&r.day===day&&r.time===time);
  rows.forEach(r=>{
    setGroup(r,groups,dir);
    r.quality='01.09.2026: группа исправлена по прямой таблице кафедры тюркской филологии.';
  });
}

// ---------------------------------------------------------------------------
// 5) Е.А. Оганова: Вт13 — Э419; Вт16:20 убрать; Пт10:40 убрать Ф419.
// ---------------------------------------------------------------------------
DATA.forEach(r=>{
  if(isTeacher(r,'Оганова Елена Александровна')&&r.day==='Вт'&&r.time==='13:00'){
    setGroup(r,['23Б/Э419-турецкий/7'],'Экономика');
    r.quality='01.09.2026: группа исправлена по прямой таблице кафедры тюркской филологии.';
  }
});
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(isTeacher(r,'Оганова Елена Александровна')&&r.day==='Вт'&&r.time==='16:20') DATA.splice(i,1);
}
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(!isTeacher(r,'Оганова Елена Александровна')||r.day!=='Пт'||r.time!=='10:40') continue;
  const groups=splitGroups(r.group).filter(g=>N(g)!==N('23Б/Ф419-турецкий/7'));
  if(!groups.length){DATA.splice(i,1);continue;}
  r.group=groups.join('; ');
  if(groups.length===1&&N(groups[0])===N('23Б/Э419-турецкий/7')) r.direction='Экономика';
  r.quality='01.09.2026: группа 23Б/Ф419-турецкий/7 снята с Пт10:40 по прямой таблице кафедры тюркской филологии.';
}

// ---------------------------------------------------------------------------
// 6) М.М. Репенкова, Ср10:40: новая кафедральная правка — группа Л211.
// Ранее общий hotfix удалял этот слот, поэтому восстанавливаем исходную строку,
// если её уже нет, сохраняя дисциплину и ауд.424 из последней версии до удаления.
// ---------------------------------------------------------------------------
let rep=DATA.find(r=>isTeacher(r,'Репенкова Мария Михайловна')&&r.day==='Ср'&&r.time==='10:40');
if(!rep){
  rep={group:'Л211',course:'2 магистратура',direction:'',day:'Ср',time:'10:40',discipline:'Специальный курс магистерской программы по выбору',extra:'',teacher:'Репенкова Мария Михайловна',room_hint:'424',quality:''};
  DATA.push(rep);
}
rep.group='Л211';
rep.course='2 магистратура';
if(!rep.room_hint) rep.room_hint='424';
rep.quality='01.09.2026: группа исправлена на Л211 по прямой таблице кафедры тюркской филологии; слот Ср10:40 восстановлен после более раннего общего hotfix.';

// ---------------------------------------------------------------------------
// 7) К.А. Верхова: Чт9:00 и Чт10:40 — ауд.424.
// Если в одном слоте было несколько технических строк одной дисциплины,
// объединяем их в одну карточку с перечислением групп.
// ---------------------------------------------------------------------------
for(const time of ['9:00','10:40']){
  const rows=DATA.filter(r=>isTeacher(r,'Верхова Ксения Александровна')&&r.day==='Чт'&&r.time===time);
  const byDisc=new Map();
  rows.forEach(r=>{
    const key=N(r.discipline)+'|'+N(r.extra);
    if(!byDisc.has(key)) byDisc.set(key,[]);
    byDisc.get(key).push(r);
  });
  byDisc.forEach(list=>{
    const keep=list[0];
    const groups=uniq(list.flatMap(r=>splitGroups(r.group)));
    if(groups.length) keep.group=groups.join('; ');
    keep.room_hint='424';
    keep.quality='01.09.2026: ауд.424 по прямой таблице кафедры тюркской филологии.';
    list.slice(1).forEach(removeRow);
  });
}

// Если Репенкова Ср10:40 и другая тюркская строка уже заняли 424 одновременно,
// приоритет 424 остаётся за явно восстановленной Репенковой только если свободно;
// иначе подбираем ей другую свободную аудиторию, не меняя время/группу.
if(rep&&roomBusy('424','Ср','10:40',rep)){
  rep.room_hint=firstFreeRoom(rep,'Ср','10:40',['346','235','160','149','151','229','401'])||'';
}

// Синхронизация публичной базы и аудиторного индекса.
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
