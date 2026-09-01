(function(){
'use strict';
if(typeof DATA==='undefined' || !Array.isArray(DATA) || typeof PUBLIC_DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const SAF='сафронова александра львовна';
const BOCH='бочковская анна викторовна';
const H4='23б/и423-хинди/7';
const h4aliases=['23б/и417/7','23б/и417/5','22б/ист-416_хинди/6','22б/ист-416_хинди/7'];
function isH4(r){ const g=N(r&&r.group); return g===H4 || h4aliases.some(x=>g.includes(x)); }

// ПРАВКА №15, 01.09.2026.
// Ауд.416 закрепляется за подтверждёнными КАФЕДРАЛЬНЫМИ курсами А.Л. Сафроновой.
// Общие/поточные курсы не переводим в 416: в форме Сафроновой 2026/27 для них отдельно указана ауд.128.
DATA.forEach(r=>{
  if(!r || N(r.teacher)!==SAF) return;
  const d=N(r.discipline);
  if(S(r.course).trim()==='4 бакалавриат' && isH4(r)){
    if(d.includes('основные проблемы') && d.includes('южной азии')) r.room_hint='416';
    if(d.includes('индийские княжества')) r.room_hint='416';
    if(d.includes('спецсеминар по профилю подготовки')) r.room_hint='416';
    if(d==='нир студентов') r.room_hint='416';
    if(d.includes('социально-политическое развитие южной азии')) r.room_hint='416';
    if(r.room_hint==='416') r.quality=(S(r.quality)?S(r.quality)+' | ':'')+'01.09.2026, правка №15: ауд.416 закреплена за подтверждённым кафедральным курсом А.Л. Сафроновой; день/время не менялись.';
  }
});

// 4 курс: лекция Сафроновой Вт 10:40 сохраняется, меняется только рабочая аудитория 179 -> 416.
DATA.forEach(r=>{
  if(!r || N(r.teacher)!==SAF || S(r.course).trim()!=='4 бакалавриат' || !isH4(r)) return;
  const d=N(r.discipline);
  if(d.includes('основные проблемы') && d.includes('южной азии') && S(r.day).trim()==='Вт'){
    r.day='Вт'; r.time='10:40'; r.room_hint='416';
    r.quality='01.09.2026, правка №15: подтверждённый слот А.Л. Сафроновой Вт 10:40 сохранён; рабочая замена ауд.179 отменена, кафедральный курс возвращён в прямо запрошенную ауд.416.';
  }
});

// 3 курс: «История религий Южной Азии» — один совместный курс Сафронова + Бочковская,
// подтверждённый Чт 10:40. Сохраняем время, меняем только аудиторию 167 -> 416.
function isSouthReligion3(r){
  if(!r || S(r.course).trim()!=='3 бакалавриат') return false;
  const t=N(r.teacher), d=N(r.discipline);
  return (t===SAF || t===BOCH) && d.includes('история религий южной азии');
}
for(let i=DATA.length-1;i>=0;i--){ if(isSouthReligion3(DATA[i])) DATA.splice(i,1); }
const rrReaders=['Сафронова Александра Львовна','Бочковская Анна Викторовна'];
rrReaders.forEach(t=>DATA.push({
  group:'24Б/И323-хинди/5, 24Б/П323-хинди/5, 24Б/Ф323-хинди/5, 24Б/Э323-хинди/5',
  course:'3 бакалавриат',direction:'История + Политология + Филология + Экономика',
  day:'Чт',time:'10:40',discipline:'История религий Южной Азии',
  extra:'совместное чтение: А.Л. Сафронова + А.В. Бочковская; 18 часов / 9 пар; один курс',
  teacher:t,joint_readers:rrReaders.filter(x=>x!==t),room_hint:'416',
  quality:'01.09.2026, правка №15: подтверждённый слот Чт 10:40 сохранён; аудитория совместного кафедрального курса изменена 167 → 416. Это одна пара, преподаватели не считаются двумя одновременными занятиями.'
}));

// У нераспределённых кафедральных позиций 4 курса заранее закрепляем 416,
// но время оставляем «уточняется», чтобы не создавать новый конфликт.
DATA.forEach(r=>{
  if(!r || N(r.teacher)!==SAF || S(r.course).trim()!=='4 бакалавриат' || !isH4(r)) return;
  const d=N(r.discipline);
  if((d.includes('социально-политическое развитие южной азии') || d==='нир студентов') &&
     (N(r.day)==='уточняется' || N(r.time)==='уточняется')) r.room_hint='416';
});

// Кириллина: меняем только ауд.240 у ВТ 14:40 «История арабских стран».
// День, время, группы и совместное чтение сохраняются. Выбрана свободная ауд.167:
// 228 занята Бойцовым, 231 — «Восток и Россия», 236 приоритетно закреплена за Тимониной,
// 179 занята Бочковской; подтверждённого назначения 167 во Вт 14:40 нет.
const kirReaders=['Кириллина Светлана Алексеевна','Орлов Владимир Викторович','Жантиев Дмитрий Рустемович','Кобищанов Тарас Юрьевич'];
function isKirHistory(r){
  if(!r || S(r.course).trim()!=='2 бакалавриат' || S(r.day).trim()!=='Вт' || S(r.time).trim()!=='14:40') return false;
  return N(r.discipline)==='история арабских стран';
}
const existing=[];
DATA.forEach(r=>{
  if(!isKirHistory(r)) return;
  if(!kirReaders.some(t=>N(t)===N(r.teacher))) return;
  existing.push(r);
  r.group='25Б/И202-арабский/3, 25Б/П202-арабский/3';
  r.direction='История + Политология';
  r.room_hint='167';
  r.extra='совместное чтение: С.А. Кириллина + В.В. Орлов + Д.Р. Жантиев + Т.Ю. Кобищанов; 2 ч/нед.';
  r.joint_readers=kirReaders.filter(t=>N(t)!==N(r.teacher));
  r.quality='01.09.2026, правка №15: по прямому указанию аудитория Вт 14:40 изменена 240 → 167. День, время, дисциплина, группы и состав совместного чтения не менялись.';
});
kirReaders.forEach(t=>{
  if(existing.some(r=>N(r.teacher)===N(t))) return;
  DATA.push({
    group:'25Б/И202-арабский/3, 25Б/П202-арабский/3',course:'2 бакалавриат',direction:'История + Политология',
    day:'Вт',time:'14:40',discipline:'История арабских стран',
    extra:'совместное чтение: С.А. Кириллина + В.В. Орлов + Д.Р. Жантиев + Т.Ю. Кобищанов; 2 ч/нед.',
    teacher:t,joint_readers:kirReaders.filter(x=>N(x)!==N(t)),room_hint:'167',
    quality:'01.09.2026, правка №15: синхронизирован общий курс Вт 14:40; аудитория изменена 240 → 167, остальные параметры курса сохранены.'
  });
});

// Фиксированная лекция Кириллиной Вт 13:00, ауд.228 остаётся без изменений.
DATA.forEach(r=>{
  if(N(r.teacher)==='кириллина светлана алексеевна' && S(r.day).trim()==='Вт' && S(r.time).trim()==='13:00' && N(r.discipline).includes('исламовед')) r.room_hint='228';
});

const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
try{if(typeof showEmpty==='function')showEmpty();}catch(e){}
})();
