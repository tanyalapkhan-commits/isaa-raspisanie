(function(){
'use strict';
if(typeof DATA==='undefined' || typeof PUBLIC_DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const GROUP='1 курс, 3-я группа японского';
const DISC='Основной восточный язык (по изучаемому языку)';
const teachers=[
  'Булах Людмила Александровна',
  'Линяев Дмитрий Владимирович',
  'Кириченко Мария Алексеевна',
  'Сато Юсукэ'
];
const note='01.09.2026: прямая срочная корректировка кафедры японской филологии — восстановлена отсутствовавшая в текущем варианте 3-я группа 1 курса. Кафедра прямо указала преподавателей: Л.А. Булах, Д.В. Линяев, М.А. Кириченко, Сато Юсукэ. Точные часы этой группы не копируются из старых анкет 2025 года и не назначаются произвольно: их нужно восстановить по актуальной кафедральной заявке/первому варианту и проверить по преподавателям, группе и аудиториям.';

// Удаляем только прежние технические заглушки этой самой третьей группы, если патч запускается повторно.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(N(r&&r.group)===N(GROUP) && N(r&&r.extra).includes('япон') && teachers.includes(S(r.teacher)) && (r.day==='уточняется' || r.time==='уточняется')) DATA.splice(i,1);
}

// Восстанавливаем саму группу и подтверждённый кафедрой состав преподавателей,
// но НЕ создаём ложных пар в конкретное время до полной развязки слотов.
teachers.forEach(t=>DATA.push({
  group:GROUP,
  course:'1 бакалавриат',
  direction:'',
  day:'уточняется',
  time:'уточняется',
  discipline:DISC,
  extra:'японский',
  teacher:t,
  room_hint:'',
  quality:note
}));

const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);

// Поддержка коротких студенческих запросов, чтобы группа не исчезала из интерфейса.
try{
  if(typeof fullGroupMatches==='function' && !fullGroupMatches.__jpFirst3Wrapped){
    const prev=fullGroupMatches;
    const wrapped=function(key){
      const base=prev.apply(this,arguments)||[];
      const k=N(key).replace(/\s/g,'');
      const aliases=['1я_японский_3','1я-японский-3','1японский3','1курс3группаяпонского','1курс,3-ягруппаяпонского'];
      if(!aliases.includes(k)) return base;
      const extra=(typeof PUBLIC_DATA!=='undefined'?PUBLIC_DATA:DATA).filter(r=>N(r.group)===N(GROUP));
      const seen=new Set();
      return base.concat(extra).filter(r=>{const sig=[r.course,r.day,r.time,r.discipline,r.teacher,r.group].map(S).join('|'); if(seen.has(sig))return false; seen.add(sig); return true;});
    };
    wrapped.__jpFirst3Wrapped=true;
    fullGroupMatches=wrapped;
  }
}catch(e){}
try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
try{if(typeof showEmpty==='function')showEmpty();}catch(e){}
})();
