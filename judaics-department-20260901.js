(function(){
'use strict';
if(typeof DATA==='undefined') return;

const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/[«»"']/g,'').replace(/\s+/g,' ').trim();
const normRoom=v=>N(v).replace(/^ауд(?:итория)?\.?\s*/,'').replace(/\s+/g,'');
const roomsOf=r=>S(r&&r.room_hint).split(/\s*,\s*/).map(normRoom).filter(Boolean);
const isOva=r=>r&&(N(r.discipline).includes('основной восточный язык')||/^овя\b/.test(N(r.discipline)));
const teacher=(r,stem)=>r&&N(r.teacher).startsWith(N(stem));
const groupParts=v=>S(v).split(/[;,]/).map(x=>N(x)).filter(Boolean);
function removeRow(r){const i=DATA.indexOf(r);if(i>=0)DATA.splice(i,1);}
function roomBusy(room,day,time,ignore){
  const rr=normRoom(room);
  return DATA.some(r=>r&&r!==ignore&&r.day===day&&r.time===time&&roomsOf(r).includes(rr));
}
function teacherBusy(name,day,time,ignore){
  return DATA.some(r=>r&&r!==ignore&&r.day===day&&r.time===time&&N(r.teacher)===N(name));
}
function groupBusy(code,day,time,ignore){
  const c=N(code);
  return DATA.some(r=>{
    if(!r||r===ignore||r.day!==day||r.time!==time) return false;
    const g=N(r.group);
    if(g.includes(c)) return true;
    // Для группы историков 3 курса учитываем общие поточные занятия историков.
    if(c===N('24Б/И306-иврит/5') && S(r.course).trim()==='3 бакалавриат'){
      return g.includes('историки и политологи')||g.includes('историки — поток')||g.includes('историки - поток')||g.includes('все историки');
    }
    return false;
  });
}
function freeRoom(row,day,time,preferred){
  const pool=[...(preferred||[]),'407','334а','228','235','401','346','424','149','151','229','240','327','433'];
  const seen=new Set();
  for(const room of pool){const k=normRoom(room);if(!k||seen.has(k))continue;seen.add(k);if(!roomBusy(room,day,time,row))return room;}
  return '';
}
function place(row,candidates,groupCode,preferredRooms){
  for(const [day,time] of candidates){
    if(teacherBusy(row.teacher,day,time,row)) continue;
    if(groupCode&&groupBusy(groupCode,day,time,row)) continue;
    const room=freeRoom(row,day,time,preferredRooms);
    if(!room) continue;
    row.day=day;row.time=time;row.room_hint=room;return true;
  }
  row.day='уточняется';row.time='уточняется';row.room_hint='';return false;
}
function sync(){
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
}

const HEB3='24Б/И306-иврит/5';
const HEB1='26Б/И106-иврит/1';
const HEBM2='25М/П204 (иврит)/2';

// =====================================================================
// 1. М.И. Гаммал — последнее прямое уточнение кафедры иудаики.
// =====================================================================
// Убрать осеннюю «Историю литературы» — кафедра прямо подтвердила, что в 1 семестре её нет.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(teacher(r,'Гаммал Максим')&&N(r.discipline).includes('история литературы изучаемой страны')) DATA.splice(i,1);
}

// История изучаемой страны: 3 курс, 4 часа = две пары. Старую строку 24Б/Р-206
// считаем устаревшей маркировкой курса; актуальная историческая группа 2026/27 — 24Б/И306.
let histRows=DATA.filter(r=>teacher(r,'Гаммал Максим')&&N(r.discipline).includes('история изучаемой страны')&&!N(r.discipline).includes('литератур'));
let hist1=histRows[0]||{teacher:'Гаммал Максим Игоревич',discipline:'История изучаемой страны (Израиль)',extra:'иврит',room_hint:''};
histRows.slice(1).forEach(removeRow);
hist1.teacher='Гаммал Максим Игоревич';hist1.course='3 бакалавриат';hist1.direction='История';hist1.group=HEB3;hist1.discipline='История изучаемой страны (Израиль)';hist1.extra='иврит; лекция';
place(hist1,[['Ср','9:00'],['Ср','10:40'],['Пн','13:00'],['Пн','14:40'],['Пн','16:20'],['Ср','13:00']],HEB3,['407','334а']);
if(!DATA.includes(hist1)) DATA.push(hist1);
hist1.quality='01.09.2026: прямое уточнение кафедры иудаики — 3 курс, «История изучаемой страны», 4 ч/нед.; первая пара. Приоритет Пн/Ср, без Ср14:40 из-за МФК.';

let hist2=Object.assign({},hist1,{day:'уточняется',time:'уточняется',room_hint:'',discipline:'История изучаемой страны (Израиль) — семинар',extra:'иврит; семинар'});
place(hist2,[['Ср','10:40'],['Ср','9:00'],['Пн','14:40'],['Пн','13:00'],['Пн','16:20'],['Ср','13:00']],HEB3,['407','334а']);
DATA.push(hist2);
hist2.quality='01.09.2026: добавлена недостающая вторая пара (семинар) по прямому уточнению кафедры иудаики; 3 курс, всего 4 ч/нед.';

// Экономическое развитие изучаемого региона — 3 курс, 2 часа.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(teacher(r,'Гаммал Максим')&&N(r.discipline).includes('экономическое развитие изучаемого региона')) DATA.splice(i,1);
}
let econ={group:HEB3,course:'3 бакалавриат',direction:'История',day:'уточняется',time:'уточняется',discipline:'Экономическое развитие изучаемого региона',extra:'иврит',teacher:'Гаммал Максим Игоревич',room_hint:'',quality:''};
place(econ,[['Пн','13:00'],['Пн','14:40'],['Пн','16:20'],['Ср','9:00'],['Ср','10:40'],['Ср','13:00']],HEB3,['407','334а']);
DATA.push(econ);
econ.quality='01.09.2026: добавлено по прямому уточнению кафедры иудаики — 3 курс, 2 ч; предпочтительные дни Пн/Ср.';

// 1 курс магистратуры: ОВЯ 6 часов = 3 пары, все в пятницу.
let oldMagOva=DATA.filter(r=>teacher(r,'Гаммал Максим')&&S(r.course).trim()==='1 магистратура'&&isOva(r));
let magGroup=oldMagOva.find(r=>S(r.group).trim())?.group||'Культура и общество стран Азии и Африки; Экономика и МЭО стран Азии и Африки';
oldMagOva.forEach(removeRow);
for(const time of ['9:00','14:40','16:20']){
  const r={group:magGroup,course:'1 магистратура',direction:'',day:'Пт',time,discipline:'Основной восточный язык (по изучаемому языку)',extra:'иврит',teacher:'Гаммал Максим Игоревич',room_hint:'',quality:''};
  // Пт10:40 и Пт13:00 сознательно не используем: по последнему письму там занятия Хлебниковой 1 магистратуры.
  if(teacherBusy(r.teacher,'Пт',time,r)){r.day='уточняется';r.time='уточняется';}
  else r.room_hint=freeRoom(r,'Пт',time,['407','334а']);
  r.quality='01.09.2026: прямое уточнение кафедры иудаики — ОВЯ 1 курса магистратуры, 6 ч (3 пары), пятница.';
  DATA.push(r);
}

// =====================================================================
// 2. Г.С. Зеленина — уже согласованная последовательная правка сохраняется:
// 3 пары 3 курса в один день. Новый комментарий допускает Пн/Ср/Пт, поэтому
// текущий бесконфликтный понедельник 10:40–14:40 не меняем.
// =====================================================================
const zel=DATA.filter(r=>teacher(r,'Зеленина Галина')&&S(r.course).trim()==='3 бакалавриат');
const zelMap=[
  ['специальный курс по выбору кафедры', '10:40'],
  ['история религий изучаемого региона','13:00']
];
zel.forEach(r=>{
  if(isOva(r)){r.day='Пн';r.time='14:40';r.room_hint='228';r.group='24Б/Р306_1/4';r.extra='иврит';}
  else for(const [needle,time] of zelMap) if(N(r.discipline).includes(needle)){r.day='Пн';r.time=time;r.room_hint='228';r.group='24Б/Р306_1/4';}
  r.quality='01.09.2026: подтверждено новым письмом кафедры иудаики — три пары 3 курса в один день; допустимы Пн/Ср/Пт. Сохраняется ранее согласованный Пн.';
});

// =====================================================================
// 3. А.А. Луппова — убрать явно устаревшие строки и снять понедельник 1–2 пары.
// =====================================================================
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(!teacher(r,'Луппова Анна')) continue;
  if(N(r.group).includes(N('22Б/ПОЛ-445_иврит/6'))){DATA.splice(i,1);continue;}
  if(N(r.discipline).includes('источниковедение и историография изучаемой страны')&&N(r.group).includes('24б/р-206_1')){DATA.splice(i,1);continue;}
}

// 1 курс ОВЯ: прежний Пн9:00 переносим на 3-ю или более позднюю пару понедельника.
let lup1=DATA.find(r=>teacher(r,'Луппова Анна')&&S(r.course).trim()==='1 бакалавриат'&&isOva(r)&&(r.day==='Пн'&&(r.time==='9:00'||r.time==='10:40')));
if(lup1){
  lup1.group=HEB1;lup1.direction='История';lup1.extra='иврит';
  place(lup1,[['Пн','13:00'],['Пн','14:40'],['Пн','16:20'],['Ср','13:00']],HEB1,['407','334а']);
  lup1.quality='01.09.2026: по прямому замечанию кафедры Лупповой не ставить 1–2 пары в понедельник; ОВЯ 1 курса перенесён на первый свободный поздний понедельничный слот.';
}
// 3 курс ОВЯ Лупповой также не оставляем Пн10:40; переносим позже в понедельник,
// учитывая уже созданные пары Гаммала для этой же исторической группы.
let lup3=DATA.find(r=>teacher(r,'Луппова Анна')&&S(r.course).trim()==='3 бакалавриат'&&isOva(r)&&(r.day==='Пн'&&(r.time==='9:00'||r.time==='10:40')));
if(lup3){
  lup3.group=HEB3;lup3.direction='История';lup3.extra='иврит';
  place(lup3,[['Пн','16:20'],['Пн','14:40'],['Пн','13:00'],['Ср','13:00']],HEB3,['407','334а']);
  lup3.quality='01.09.2026: по прямому замечанию кафедры снята 1–2 пара понедельника; 3 курс ОВЯ перенесён в первый свободный более поздний слот.';
}

// =====================================================================
// 4. Л.Р. Хлебникова — точная новая схема Пн/Пт.
// =====================================================================
// Удаляем дисциплины, которые кафедра прямо просит снять.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(!teacher(r,'Хлебникова Луиза')) continue;
  const d=N(r.discipline);
  if(d.includes('воюющая демократия')||d.includes('спецсеминар')) DATA.splice(i,1);
}
// Снимаем старые копии двух дисциплин 2 магистратуры перед созданием точной пары подряд.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(!teacher(r,'Хлебникова Луиза')||S(r.course).trim()!=='2 магистратура') continue;
  const d=N(r.discipline);
  if(d.includes('израиль в мировой политике')||d.includes('научно')&&d.includes('семинар')||d==='нис') DATA.splice(i,1);
}
let world={group:HEBM2,course:'2 магистратура',direction:'Политология',day:'Пн',time:'13:00',discipline:'Израиль в мировой политике',extra:'иврит',teacher:'Хлебникова Луиза Романовна',room_hint:'',quality:''};
if(teacherBusy(world.teacher,'Пн','13:00',world)||groupBusy(HEBM2,'Пн','13:00',world)) world.time='14:40';
world.room_hint=freeRoom(world,'Пн',world.time,['407','334а','228']);
world.quality='01.09.2026: прямое уточнение Л.Р. Хлебниковой — Пн13:00, резерв Пн14:40; 2 год магистратуры.';
DATA.push(world);
const nisTime=world.time==='13:00'?'14:40':'16:20';
let nis2={group:HEBM2,course:'2 магистратура',direction:'Политология',day:'Пн',time:nisTime,discipline:'Научно-исследовательский семинар',extra:'иврит',teacher:'Хлебникова Луиза Романовна',room_hint:'',quality:''};
if(teacherBusy(nis2.teacher,'Пн',nisTime,nis2)||groupBusy(HEBM2,'Пн',nisTime,nis2)){nis2.day='уточняется';nis2.time='уточняется';}
else nis2.room_hint=freeRoom(nis2,'Пн',nisTime,['407','334а','228']);
nis2.quality='01.09.2026: НИС 2 года магистратуры перенесён на понедельник сразу после «Израиля в мировой политике».';
DATA.push(nis2);

// Пятница: оставить только заявленные кафедрой позиции Хлебниковой.
let conflict=DATA.find(r=>teacher(r,'Хлебникова Луиза')&&N(r.discipline).includes('современные вооруженные конфликты на ближнем востоке'));
if(!conflict){conflict={group:'1 магистратура — иврит',course:'1 магистратура',direction:'',day:'Пт',time:'10:40',discipline:'Современные вооруженные конфликты на Ближнем Востоке и Северной Африке',extra:'',teacher:'Хлебникова Луиза Романовна',room_hint:'',quality:''};DATA.push(conflict);}
conflict.course='1 магистратура';conflict.group=conflict.group&&N(conflict.group)!=='100'?conflict.group:'1 магистратура — иврит';conflict.day='Пт';conflict.time='10:40';if(!conflict.room_hint)conflict.room_hint=freeRoom(conflict,'Пт','10:40',['407','334а','228']);
conflict.quality='01.09.2026: пятничная пара сохранена по прямому уточнению Л.Р. Хлебниковой.';

let nis1=DATA.find(r=>teacher(r,'Хлебникова Луиза')&&S(r.course).trim()==='1 магистратура'&&(N(r.discipline).includes('научно')&&N(r.discipline).includes('семинар')||N(r.discipline)==='нис'));
if(!nis1){nis1={group:'1 магистратура — иврит',course:'1 магистратура',direction:'',day:'Пт',time:'13:00',discipline:'Научно-исследовательский семинар',extra:'иврит',teacher:'Хлебникова Луиза Романовна',room_hint:'',quality:''};DATA.push(nis1);}
nis1.group=nis1.group&&N(nis1.group)!=='100'?nis1.group:'1 магистратура — иврит';nis1.day='Пт';nis1.time='13:00';if(!nis1.room_hint)nis1.room_hint=freeRoom(nis1,'Пт','13:00',['407','334а','228']);
nis1.quality='01.09.2026: НИС 1 года магистратуры сохранён Пт13:00 по прямому уточнению Л.Р. Хлебниковой.';

// =====================================================================
// 5. Р.Е. Романенко — фиксируем границы пожелания, не размножая нагрузку:
// ОВЯ 1 курса остаётся только Пн/Ср/Пт и на 1–3 парах.
// =====================================================================
DATA.forEach(r=>{
  if(!teacher(r,'Романенко Роман')||S(r.course).trim()!=='1 бакалавриат'||!isOva(r)) return;
  if(!['Пн','Ср','Пт'].includes(r.day)||!['9:00','10:40','13:00'].includes(r.time)){
    r.day='уточняется';r.time='уточняется';r.room_hint='';
  }
  r.quality='01.09.2026: прямое уточнение кафедры иудаики — ОВЯ 1 курса у Р.Е. Романенко только Пн/Ср/Пт, 1–3 пары.';
});

sync();
})();
