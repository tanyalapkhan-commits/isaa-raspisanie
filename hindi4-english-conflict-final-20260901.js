(function(){
'use strict';
if(typeof DATA==='undefined' || !Array.isArray(DATA) || typeof PUBLIC_DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const G='23б/и423-хинди/7';
const CAN='23Б/И423-хинди/7';
const aliases=['22б/ист-416_хинди/6','22б/ист-416_хинди/7','22б/ист_хинди/6','23б/и417/7','23б/и417/5'];
const isHindi4=r=>{
  if(!r || S(r.course).trim()!=='4 бакалавриат') return false;
  const g=N(r.group);
  return g===G || aliases.some(a=>g.includes(a));
};
const isLit=r=>isHindi4(r) && N(r.discipline).includes('история литературы изучаемой страны');
const isNik=r=>isHindi4(r) && N(r.teacher)==='никольская ксения дмитриевна' && N(r.discipline).includes('спецсеминар по профилю подготовки');
const isSoc=r=>isHindi4(r) && N(r.discipline).includes('социально-политическое развитие южной азии');
const isVvya=r=>isHindi4(r) && (N(r.discipline).includes('второй восточный язык') || N(r.discipline).includes('овя - синхала') || N(r.discipline).includes('сингальск')) && N(r.teacher)==='волхонский борис михайлович';
const isRole=r=>S(r.course).trim()==='4 бакалавриат' && N(r.discipline).includes('роль религи') && N(r.discipline).includes('общественно-политическ') && N(r.discipline).includes('xxi');

const roleReaders=[];
DATA.forEach(r=>{
  if(!isRole(r)) return;
  if(r.teacher && !roleReaders.includes(r.teacher)) roleReaders.push(r.teacher);
  if(Array.isArray(r.joint_readers)) r.joint_readers.forEach(t=>{ if(t && !roleReaders.includes(t)) roleReaders.push(t); });
});

for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(isLit(r) || isNik(r) || isSoc(r) || isVvya(r) || isRole(r)) DATA.splice(i,1);
}

function addForReaders(base, readers){
  readers.forEach(t=>DATA.push({...base,teacher:t,joint_readers:readers.filter(x=>x!==t)}));
}

const litReaders=['Стрелкова Гюзэль Владимировна','Волхонский Борис Михайлович'];
[
  ['Вт','9:00','239','1-я из 2 еженедельных пар'],
  ['Пн','14:40','241','2-я из 2 еженедельных пар']
].forEach(([day,time,room,part])=>addForReaders({
  group:CAN,course:'4 бакалавриат',direction:'История',day,time,
  discipline:'История литературы изучаемой страны',
  extra:`${part}; преподаватели читают по отдельным неделям: Г.В. Стрелкова — 26 ч/семестр, Б.М. Волхонский — 10 ч/семестр (5 назначенных недель); это один курс, не две одновременные пары`,
  room_hint:room,
  quality:'01.09.2026, правка №13: единая кафедральная схема курса для 4 курса историков-хинди; дубль Стрелкова/Волхонский объединён как последовательное чтение по неделям.'
},litReaders));

DATA.push({
  group:CAN,course:'4 бакалавриат',direction:'История',day:'Пт',time:'16:20',
  discipline:'Спецсеминар по профилю подготовки',extra:'хинди; отдельный спецсеминар К.Д. Никольской',
  teacher:'Никольская Ксения Дмитриевна',room_hint:'236',
  quality:'01.09.2026, правка №13: возвращён подтверждённый слот Пт 16:20, ауд.236 по прямой корректировке К.Д. Никольской; ошибочный дубль Чт 13:00 удалён.'
});

DATA.push({
  group:CAN,course:'4 бакалавриат',direction:'История',day:'уточняется',time:'уточняется',
  discipline:'Второй восточный язык (синхала)',extra:'4 ч/нед.; требуется 2 пары; точные безопасные слоты уточняются, Вт 13:00 не используется из-за западного языка',
  teacher:'Волхонский Борис Михайлович',room_hint:'',
  quality:'01.09.2026, правка №13: сохранена актуальная нагрузка ВВЯ (синхала), но неподтверждённые технические часы не выдаются за готовое расписание.'
});

const socReaders=['Сафронова Александра Львовна','Бочковская Анна Викторовна','Филимонова Алина Левоновна'];
addForReaders({
  group:CAN,course:'4 бакалавриат',direction:'История',day:'уточняется',time:'уточняется',
  discipline:'Социально-политическое развитие Южной Азии',
  extra:'совместное чтение; единый курс; 12 ч / 6 пар; преподаватели читают по распределению недель; точный общий слот согласуется',
  room_hint:'',
  quality:'01.09.2026, правка №13: отменён конфликтный перенос Пт 16:20. Новый точный слот намеренно не придуман: Вт 13:00 занят английским/западным языком, а остальные допустимые Вт/Чт пересекаются с подтверждённой нагрузкой. До согласования курс показывается одним совместным занятием «уточняется».'
},socReaders);

const roleBaseReaders=roleReaders.length?roleReaders:[
  'Бектимирова Надежда Николаевна','Горбылёв Алексей Михайлович','Жантиев Дмитрий Рустемович',
  'Львова Элеонора Сергеевна','Сабиров Рустам Тагирович','Сафронова Александра Львовна','Сучков Григорий Викторович'
];
addForReaders({
  group:'4 курс, историки и политологи — поток',course:'4 бакалавриат',direction:'История + Политология',
  day:'уточняется',time:'уточняется',discipline:'Роль религий в общественно-политической жизни стран Востока в XXI в.',
  extra:'общий коллективный курс; преподаватели читают в одном слоте по отдельным неделям; это не параллельные занятия',
  room_hint:'',
  quality:'01.09.2026, правка №13: все преподавательские строки синхронизированы в одно публичное занятие. Точный общий слот остаётся «уточняется» до межкафедрального согласования.'
},roleBaseReaders);

try{
  if(typeof fullGroupMatches==='function' && !fullGroupMatches.__hindi13){
    const original=fullGroupMatches;
    const wrapped=function(key){
      const rows=original(key);
      if(N(key)!==G) return rows;
      return rows.filter(r=>{
        const g=N(r.group),t=N(r.teacher);
        if(t==='сюннерберг максим алексеевич' && (g.includes('23б/и412/7') || g.includes('вьетнам'))) return false;
        return true;
      });
    };
    wrapped.__hindi13=true; fullGroupMatches=wrapped;
  }
}catch(e){}

try{
  if(typeof findConflicts==='function' && !findConflicts.__hindi13){
    const original=findConflicts;
    const wrapped=function(r){
      const list=original(r)||[];
      if(!isHindi4(r)) return list;
      return list.filter(c=>{
        const g=N(c.group),dir=N(c.direction);
        if((g.includes('все филолог') || g.includes('филологи') || dir==='филология') && !g.includes('историк')) return false;
        return true;
      });
    };
    wrapped.__hindi13=true; findConflicts=wrapped;
  }
}catch(e){}

const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
try{if(typeof showEmpty==='function')showEmpty();}catch(e){}
})();
