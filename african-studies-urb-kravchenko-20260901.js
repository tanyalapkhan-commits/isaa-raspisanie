(function(){
'use strict';
if(typeof DATA==='undefined' || typeof PUBLIC_DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const OVA='основной восточный язык';
const URB='урб моника райвовна';
const KR='кравченко светлана леонидовна';
const GI='26б/и103-африкаанс/1';
const GF='26б/ф103-африкаанс/1';
const GCOMB='26Б/И103-африкаанс/1 + 26Б/Ф103-африкаанс/1';

function isOva(r){return N(r&&r.discipline).includes(OVA);}
function isUrb(r){return N(r&&r.teacher)===URB;}
function isKr(r){return N(r&&r.teacher)===KR;}
function isFirstAfr(r){const g=N(r&&r.group); return S(r&&r.course).trim()==='1 бакалавриат' && isUrb(r) && isOva(r) && (g===GI || g===GF || g===N(GCOMB));}
function urbNote(room){return '01.09.2026: прямая корректировка М.Р. Урб. Для ОВЯ нужна обычная учебная аудитория с доской вместо кафедральной. Аудитория '+room+' выбрана после проверки текущей занятости; предпочтение преподавателя — 315 или 419 либо другая аудитория с доской.';}

// 1) У М.Р. Урб нет магистров в 2026/27: удаляем две прошлогодние строки 2 магистратуры.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(isUrb(r) && S(r.course).trim()==='2 магистратура') DATA.splice(i,1);
}

// 2) В понедельник на 1 курсе историки и филологи занимаются ВМЕСТЕ.
// Убираем две раздельные строки на каждом из двух понедельничных слотов и создаём одну общую.
['10:40','13:00'].forEach(tm=>{
  for(let i=DATA.length-1;i>=0;i--){
    const r=DATA[i];
    if(isFirstAfr(r) && r.day==='Пн' && r.time===tm) DATA.splice(i,1);
  }
  DATA.push({
    group:GCOMB,
    course:'1 бакалавриат',
    direction:'История + Филология',
    day:'Пн',
    time:tm,
    discipline:'Основной восточный язык (по изучаемому языку)',
    extra:'африкаанс',
    teacher:'Урб Моника Райвовна',
    room_hint:'315',
    quality:'01.09.2026: прямая корректировка М.Р. Урб — в понедельник историки и филологи 1 курса занимаются совместно, а не двумя раздельными группами. '+urbNote('315')
  });
});

// 3) Переносим ОВЯ Урб из кафедральной 314К в свободные аудитории с доской.
// 315/419 используются в приоритете; на Ср 9:00 обе заняты, поэтому используем свободную 229,
// которая в текущей сетке уже используется как аудитория с электронной доской/компьютером.
const roomMap={
  '1 бакалавриат|Вт|10:40':'315',
  '1 бакалавриат|Вт|13:00':'419',
  '1 бакалавриат|Ср|9:00':'229',
  '1 бакалавриат|Чт|9:00':'315',
  '1 бакалавриат|Пт|9:00':'315',
  '3 бакалавриат|Пн|9:00':'419',
  '3 бакалавриат|Пн|14:40':'315',
  '3 бакалавриат|Пн|16:20':'315',
  '3 бакалавриат|Ср|10:40':'315',
  '3 бакалавриат|Чт|10:40':'315',
  '3 бакалавриат|Пт|10:40':'315'
};
DATA.forEach(r=>{
  if(!isUrb(r) || !isOva(r)) return;
  const key=[S(r.course).trim(),r.day,r.time].join('|');
  const room=roomMap[key];
  if(room){r.room_hint=room; r.quality=(S(r.quality)?S(r.quality)+' | ':'')+urbNote(room);}
});

// 4) Светлана Леонидовна Кравченко полностью отсутствовала из расписания.
// Актуальная заявка 2026/27: ОВЯ (амхарский), 3 курс, 24Б/Р201_1/5, 12 ч/нед.;
// Вт/Ср/Чт/Пт, 10:40/13:00/14:40, во вторник — с 13:00.
// Ставим 6 пар без конфликтов группы и с не более чем двумя языковыми парами в день.
for(let i=DATA.length-1;i>=0;i--){ if(isKr(DATA[i]) && isOva(DATA[i])) DATA.splice(i,1); }
const krSlots=[
  ['Вт','13:00'],
  ['Ср','10:40'],['Ср','13:00'],
  ['Чт','14:40'],
  ['Пт','10:40'],['Пт','14:40']
];
krSlots.forEach(([day,time])=>DATA.push({
  group:'24Б/Р201_1/5',
  course:'3 бакалавриат',
  direction:'',
  day,time,
  discipline:'Основной восточный язык (по изучаемому языку)',
  extra:'амхарский',
  teacher:'Кравченко Светлана Леонидовна',
  room_hint:'314К',
  quality:'01.09.2026: восстановлено по актуальной заявке кафедры африканистики 2026/27: ОВЯ амхарский, 24Б/Р201_1/5, 12 ч/нед. Разрешённые дни Вт/Ср/Чт/Пт, время 10:40/13:00/14:40; во вторник — с 13:00. Среда после 14:40 исключена правилом МФК. Выбрано 6 бесконфликтных слотов, не более двух языковых пар в день; ауд.314К освобождена после переноса ОВЯ М.Р. Урб.'
}));

const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);

// Совместная понедельничная строка должна находиться из обеих студенческих групп.
try{
  if(typeof fullGroupMatches==='function' && !fullGroupMatches.__urbJointWrapped){
    const prev=fullGroupMatches;
    const wrapped=function(key){
      const base=prev.apply(this,arguments)||[];
      const k=N(key);
      if(k!==GI && k!==GF) return base;
      const extra=(typeof PUBLIC_DATA!=='undefined'?PUBLIC_DATA:DATA).filter(r=>N(r.group)===N(GCOMB));
      const seen=new Set();
      return base.concat(extra).filter(r=>{const sig=[r.course,r.day,r.time,r.discipline,r.teacher,r.group].map(S).join('|'); if(seen.has(sig))return false; seen.add(sig); return true;});
    };
    wrapped.__urbJointWrapped=true;
    fullGroupMatches=wrapped;
  }
}catch(e){}
try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
try{if(typeof showEmpty==='function')showEmpty();}catch(e){}
})();
