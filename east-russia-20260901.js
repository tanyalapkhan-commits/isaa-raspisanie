(function(){
'use strict';
if(typeof DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/[«»"']/g,'').replace(/\s+/g,' ').trim();

const READERS=[
  'Каимова Анна Сергеевна',
  'Горбылёв Алексей Михайлович',
  'Арешидзе Лиана Георгиевна',
  'Ким Наталья Николаевна',
  'Сабиров Рустам Тагирович',
  'Сюннерберг Максим Алексеевич',
  'Календарь Ольга Константиновна',
  'Сафронова Александра Львовна',
  'Смирнов Валерий Евгеньевич',
  'Шлыков Павел Вячеславович',
  'Коняшкина Тамара Александровна',
  'Хлебникова Луиза Романовна',
  'Сыздыкова Жибек Сапарбековна',
  'Емельянов Андрей Львович'
];
const isEastRussia=r=>r&&S(r.course).trim()==='1 магистратура'&&N(r.discipline)==='восток и россия';

// Обновляем общий курс по последнему прямому кафедральному уточнению:
// единый слот Вт 14:40, ауд.231, полный состав совместного чтения.
const oldRows=DATA.filter(isEastRussia);
if(oldRows.length){
  const firstIndex=DATA.findIndex(isEastRussia);
  const byTeacher=new Map();
  oldRows.forEach(r=>{ if(r.teacher&&!byTeacher.has(N(r.teacher))) byTeacher.set(N(r.teacher),r); });
  for(let i=DATA.length-1;i>=0;i--) if(isEastRussia(DATA[i])) DATA.splice(i,1);

  const template=oldRows[0];
  const rebuilt=READERS.map(name=>{
    const old=byTeacher.get(N(name));
    const r=old?Object.assign({},old):Object.assign({},template);
    r.group='все группы 1 магистратуры';
    r.course='1 магистратура';
    r.direction='все направления';
    r.day='Вт';
    r.time='14:40';
    r.discipline='Восток и Россия';
    r.extra='общий курс; совместное чтение; лекторы по графику';
    r.teacher=name;
    r.room_hint='231';
    r.joint_readers=READERS.filter(x=>N(x)!==N(name));
    r.quality='01.09.2026: прямое уточнение полного состава совместного чтения курса «Восток и Россия»; единый слот Вт 14:40, ауд.231. А.С. Каимова читает первые две лекции по кафедральному графику.';
    return r;
  });
  DATA.splice(firstIndex,0,...rebuilt);
}

// У А.С. Каимовой был реальный конфликт в Вт 14:40: общий курс магистратуры
// и 4 курс историков-китаистов. Сохраняем «Восток и Россия» в подтверждённом
// общем слоте, а 1-ю из двух пар 4 курса переносим в разрешённое преподавателем
// окно Пт 14:40. Вторая пара остаётся Ср 10:40.
const kaimova4=DATA.find(r=>r&&N(r.teacher)==='каимова анна сергеевна'&&S(r.course).trim()==='4 бакалавриат'&&r.day==='Вт'&&r.time==='14:40'&&N(r.discipline).startsWith('основные проблемы и тенденции исторического развития')&&N(r.discipline).includes('китай'));

function roomParts(v){return S(v).split(/\s*,\s*/).map(x=>N(x).replace(/^ауд(?:итория)?\.?\s*/,''));}
function roomBusy(room,day,time,ignore){
  const key=N(room).replace(/^ауд(?:итория)?\.?\s*/,'');
  return DATA.some(r=>r&&r!==ignore&&r.day===day&&r.time===time&&roomParts(r.room_hint).includes(key));
}
function groupBusy(code,day,time,ignore){
  const c=N(code);
  return DATA.some(r=>{
    if(!r||r===ignore||r.day!==day||r.time!==time) return false;
    const g=N(r.group);
    if(g.includes(c)) return true;
    // Общие занятия 4 курса историков тоже считаем занятостью целевой группы.
    return S(r.course).trim()==='4 бакалавриат' && (/^историки$/.test(g)||g.includes('все историки')||g.includes('историки — поток')||g.includes('историки и политологи'));
  });
}
if(kaimova4){
  const targetDay='Пт', targetTime='14:40', targetGroup='23Б/И409-китайский/7';
  if(!groupBusy(targetGroup,targetDay,targetTime,kaimova4)){
    const roomCandidates=['151','229','236','240','303','320 а','328','407','423','433'];
    const room=roomCandidates.find(x=>!roomBusy(x,targetDay,targetTime,kaimova4));
    kaimova4.group=targetGroup;
    kaimova4.direction='История';
    kaimova4.day=targetDay;
    kaimova4.time=targetTime;
    if(room) kaimova4.room_hint=room;
    else kaimova4.room_hint='';
    kaimova4.quality='01.09.2026: устранён конфликт А.С. Каимовой с общим курсом «Восток и Россия» Вт 14:40. 1-я из двух пар 4 курса историков-китаистов перенесена в Пт 14:40 — допустимое окно по прямой корректировке преподавателя от 28.08.2026; группа и аудитория проверяются по текущей сетке. Вторая пара остаётся Ср 10:40.';
  } else {
    // Не создаём новый конфликт, если последующие горячие правки заняли целевой слот.
    kaimova4.day='уточняется';
    kaimova4.time='уточняется';
    kaimova4.room_hint='';
    kaimova4.group='23Б/И409-китайский/7';
    kaimova4.direction='История';
    kaimova4.quality='01.09.2026: Вт 14:40 освобождён для подтверждённого общего курса «Восток и Россия», который первые две лекции читает А.С. Каимова. Безопасный новый слот 4 курса требует уточнения: автоматический перенос не выполнен из-за обнаруженной занятости группы.';
  }
}

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
