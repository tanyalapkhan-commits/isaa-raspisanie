(function(){
'use strict';
if(typeof DATA==='undefined' || !Array.isArray(DATA) || typeof PUBLIC_DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const G='23б/и423-хинди/7';
const teachers=new Set(['бочковская анна викторовна','сафронова александра львовна','филимонова алина левоновна']);
function isSocPol(r){
  if(!r || S(r.course).trim()!=='4 бакалавриат') return false;
  const d=N(r.discipline), g=N(r.group), t=N(r.teacher);
  const disc=d.includes('социально-политическое развитие южной азии') || d.includes('социально-политическое развитие изучаемой страны');
  const hindi=g.includes('хинди') || g.includes('23б/и423') || g.includes('23б/и417') || g.includes('22б/ист-416');
  return disc && hindi && (teachers.has(t) || !t);
}
function isStaleTueOva(r){
  if(!r || S(r.course).trim()!=='4 бакалавриат') return false;
  return N(r.group)===G && r.day==='Вт' && r.time==='13:00' &&
    N(r.discipline).includes('основной восточный язык') &&
    N(r.teacher)==='волхонский борис михайлович';
}

// 01.09.2026, срочная корректировка по фактической студенческой накладке:
// Вт 13:00 у 4 курса хинди занят английским/западным языком.
// Убираем из этого слота соцпол и устаревшую техническую строку ОВЯ Б.М. Волхонского.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(isSocPol(r) || isStaleTueOva(r)) DATA.splice(i,1);
}

DATA.push({
  group:'23Б/И423-хинди/7',
  course:'4 бакалавриат',
  direction:'История',
  day:'Пт',
  time:'16:20',
  discipline:'Социально-политическое развитие Южной Азии',
  extra:'совместное чтение; перенесено со Вт 13:00 из-за английского/западного языка',
  teacher:'Бочковская Анна Викторовна',
  room_hint:'228',
  quality:'01.09.2026, МЕГА-СРОЧНО: Вт 13:00 снят из-за подтверждённой накладки у 4 курса хинди с английским/западным языком. Совместный курс перенесён на Пт 16:20, ауд.228. Проверено по текущей рабочей сетке: у группы, А.В. Бочковской, А.Л. Сафроновой, А.Л. Филимоновой и ауд.228 прямой накладки в Пт 16:20 нет. Это вынужденное исключение из предпочтения А.Л. Сафроновой Вт/Чт. Английский/западный язык не переносится. Устаревшая строка ОВЯ Б.М. Волхонского Вт 13:00 удалена: актуальная кафедральная правка 27.08 фиксирует у него на 4 курсе ВВЯ (синхала), а ОВЯ хинди стоит в других слотах.',
  joint_readers:['Сафронова Александра Львовна','Филимонова Алина Левоновна']
});

const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
try{if(typeof showEmpty==='function')showEmpty();}catch(e){}
})();
