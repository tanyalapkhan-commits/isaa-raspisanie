(function(){
'use strict';
if(typeof DATA==='undefined' || typeof PUBLIC_DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const T='ардашникова анна наумовна';
const G='24б/ф314-персидский/5';
function isTarget(r){return r&&N(r.teacher)===T&&S(r.course).trim()==='3 бакалавриат'&&N(r.discipline).includes('литература изучаемого региона')&&(N(r.group)===G||N(r.group)==='24б/р214_1/5/(ф)'||N(r.group)==='3 курс — филология — персидский');}

// Прямая корректировка кафедры иранской филологии от 28.08.2026 имеет приоритет:
// основная еженедельная литература Ардашниковой для 3 курса филологов-персистов
// должна стоять именно во вторник 13:00, ауд.415. Предыдущий перенос на четверг
// был ошибочным способом решения конфликта с западным языком и отменяется.
for(let i=DATA.length-1;i>=0;i--){if(isTarget(DATA[i])) DATA.splice(i,1);}
DATA.push({
  group:'24Б/Ф314-персидский/5',
  course:'3 бакалавриат',
  direction:'Филология',
  day:'Вт',
  time:'13:00',
  discipline:'Литература изучаемого региона',
  extra:'1-я пара еженедельно; нагрузка курса 3 акад. ч/нед.',
  teacher:'Ардашникова Анна Наумовна',
  room_hint:'415',
  quality:'01.09.2026: восстановлено по прямой корректировке кафедры иранской филологии от 28.08.2026. Основная еженедельная пара Ардашниковой для 3 курса филологов-персистов — Вт 13:00, ауд.415. Предыдущий перенос на Чт 13:00 отменён. Конфликт с западным/английским языком должен решаться изменением западного языка, а не удалением или переносом этой пары Ардашниковой.'
});

const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
})();