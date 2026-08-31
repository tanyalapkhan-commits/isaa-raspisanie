(function(){
'use strict';
if(typeof DATA==='undefined') return;

const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const isCourse=(r,n)=>S(r&&r.course).trim()===n+' бакалавриат';
const isOva=r=>N(r&&r.discipline).includes('основной восточный язык') || /^овя\b/.test(N(r&&r.discipline));
const teacher=(r,stem)=>N(r&&r.teacher).includes(N(stem));
const normRoom=v=>N(v).replace(/^ауд(?:итория)?\.?\s*/,'').replace(/\s+/g,'');
function roomsOf(r){
  return S(r&&r.room_hint).split(/\s*,\s*/).map(normRoom).filter(Boolean);
}
function groupKeys(r){
  const s=S(r&&r.group);
  const codes=s.match(/2[3-6]Б\/[^,;]+/g)||[];
  if(codes.length) return new Set(codes.map(x=>N(x).replace(/\s+/g,'')));
  const t=N(s).replace(/\s+/g,'');
  return t?new Set([t]):new Set();
}
function overlapsGroups(a,b){
  const A=groupKeys(a), B=groupKeys(b);
  if(!A.size||!B.size) return false;
  for(const x of A) if(B.has(x)) return true;
  return false;
}
function teacherBusy(row,day,time,ignore){
  const t=N(row&&row.teacher);
  if(!t) return false;
  return DATA.some(x=>x!==row && x!==ignore && x && x.day===day && x.time===time && N(x.teacher)===t);
}
function groupBusy(row,day,time,ignore){
  return DATA.some(x=>x!==row && x!==ignore && x && x.day===day && x.time===time && overlapsGroups(row,x));
}
function roomBusy(room,day,time,ignoreA,ignoreB){
  const rr=normRoom(room);
  if(!rr) return false;
  return DATA.some(x=>x!==ignoreA && x!==ignoreB && x && x.day===day && x.time===time && roomsOf(x).includes(rr));
}
function firstFreeRoom(row,day,time,candidates,ignore){
  for(const room of candidates){
    if(!roomBusy(room,day,time,row,ignore)) return room;
  }
  return '';
}
function moveIfFree(row,day,time,rooms,ignore){
  if(!row) return false;
  if(teacherBusy(row,day,time,ignore) || groupBusy(row,day,time,ignore)) return false;
  const room=firstFreeRoom(row,day,time,rooms,ignore);
  if(!room) return false;
  row.day=day; row.time=time; row.room_hint=room;
  return true;
}
function syncPublic(){
  if(typeof PUBLIC_DATA!=='undefined'){
    const src=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
    PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...src);
  }
  if(typeof roomIndex!=='undefined' && typeof PUBLIC_DATA!=='undefined'){
    Object.keys(roomIndex).forEach(k=>delete roomIndex[k]);
    PUBLIC_DATA.forEach(r=>{
      const rs=roomsOf(r);
      if(rs.length!==1 || !r.day || !r.time || r.day==='уточняется') return;
      const room=S(r.room_hint).trim();
      const key=r.day+'|'+r.time+'|'+room;
      (roomIndex[key]||(roomIndex[key]=[])).push({teacher:r.teacher,group:r.group,discipline:r.discipline});
    });
  }
  try{ if(typeof buildGroupItems==='function') buildGroupItems(); }catch(e){}
  try{ if(typeof buildBrowseList==='function') buildBrowseList(); }catch(e){}
  try{ if(typeof showEmpty==='function') showEmpty(); }catch(e){}
}

// 1. М.М. Репенкова: убрать среду 10:40; восстановить оба курса 4 бакалавриата.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(teacher(r,'Репенкова Мария') && r.day==='Ср' && r.time==='10:40') DATA.splice(i,1);
}
const rep4=DATA.filter(r=>teacher(r,'Репенкова Мария')&&isCourse(r,'4'));
if(!rep4.some(r=>N(r.discipline).includes('аналитические подходы к изучению современного художественного текста'))){
  DATA.push({group:'23Б/Ф419-турецкий/7',course:'4 бакалавриат',direction:'Филология',day:'Вт',time:'14:40',discipline:'Спецсеминар: Аналитические подходы к изучению современного художественного текста',extra:'',teacher:'Репенкова Мария Михайловна',room_hint:'410',quality:'31.08.2026: восстановлено по прямому замечанию преподавателя.'});
}
if(!rep4.some(r=>N(r.discipline).includes('исследование турецкого фольклора'))){
  // Точный новый слот без пересечения из текущей сетки не следует выдумывать.
  DATA.push({group:'23Б/Ф419-турецкий/7',course:'4 бакалавриат',direction:'Филология',day:'уточняется',time:'уточняется',discipline:'Спецкурс: Исследование турецкого фольклора и турецкой литературы в работах отечественных тюркологов',extra:'',teacher:'Репенкова Мария Михайловна',room_hint:'',quality:'31.08.2026: спецкурс 4 курса восстановлен; точный слот требует отдельного бесконфликтного назначения.'});
}

// 2. С.А. Быкова: вторую Теорию ОВЯ переносим Вт 16:20 -> Вт 13:00, ауд.319а.
// В 319а в этот час стояла Н.Г. Румак (3 курс); её время не меняем, а переносим только в свободную аудиторию.
const bykova=DATA.find(r=>teacher(r,'Быкова Стелла')&&isCourse(r,'4')&&N(r.discipline).includes('теория основного восточного языка')&&r.day==='Вт'&&r.time==='16:20');
if(bykova){
  const rumak319=DATA.find(r=>teacher(r,'Румак Наталья')&&r.day==='Вт'&&r.time==='13:00'&&roomsOf(r).includes(normRoom('319 а')));
  let can=true;
  if(rumak319){
    const rr=firstFreeRoom(rumak319,'Вт','13:00',['328','327','229','240','177','150','151','314К','419','406'],bykova);
    if(rr) rumak319.room_hint=rr; else can=false;
  }
  if(can && !teacherBusy(bykova,'Вт','13:00') && !groupBusy(bykova,'Вт','13:00') && !roomBusy('319 а','Вт','13:00',bykova,rumak319)){
    bykova.day='Вт'; bykova.time='13:00'; bykova.room_hint='319 а';
    bykova.quality='31.08.2026: Теория ОВЯ 4 курса перенесена Вт16:20 → Вт13:00; ауд.319а. Конфликт аудитории снят без изменения времени другого преподавателя.';
  }
}

// 3. Л.С. Бочарова: география арабских стран, 1 курс — одна запись и большая аудитория.
const boch=DATA.filter(r=>teacher(r,'Бочарова Людмила')&&isCourse(r,'1')&&N(r.discipline).includes('география арабских стран'));
if(boch.length){
  const keep=boch[0];
  for(let i=DATA.length-1;i>=0;i--) if(DATA[i]!==keep && boch.includes(DATA[i])) DATA.splice(i,1);
  const br=firstFreeRoom(keep,keep.day,keep.time,['149','167','228','151']);
  if(br) keep.room_hint=br;
}

// 4. М.В. Грачев: слетевшую из Ср14:40 вторую пару истории Японии ставим в четверг до 13:00;
// если оба четверговых слота заняты — разрешённый резерв Вт16:20.
const grachev=DATA.find(r=>teacher(r,'Грачев Максим')&&isCourse(r,'2')&&N(r.discipline).includes('история изучаемой страны')&&(r.day==='уточняется'||(r.day==='Ср'&&r.time==='14:40')));
if(grachev){
  const roomList=['427К','328','327','229','240','177','150','151','314К','419'];
  let done=moveIfFree(grachev,'Чт','10:40',roomList) || moveIfFree(grachev,'Чт','9:00',roomList) || moveIfFree(grachev,'Вт','16:20',roomList);
  if(done) grachev.quality='31.08.2026: прежний Ср14:40 снят из-за МФК; перенесено по прямому замечанию М.В. Грачева в бесконфликтный слот.';
}
// Убрать К.В. Асмолова из НИС во вторник 10:40.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  const nis=N(r&&r.discipline).includes('научно-исследовательский семинар') || /^нис\b/.test(N(r&&r.discipline));
  if(nis && r.day==='Вт' && r.time==='10:40' && teacher(r,'Асмолов Константин')) DATA.splice(i,1);
  else if(nis && r.day==='Вт' && r.time==='10:40' && Array.isArray(r&&r.joint_readers)) r.joint_readers=r.joint_readers.filter(x=>!N(x).includes('асмолов'));
}

// 5. М.А. Кириченко: слетевшую из Ср14:40 пару ОВЯ 4 курса переносим на Чт10:40.
const kir4=DATA.find(r=>teacher(r,'Кириченко Мария')&&isCourse(r,'4')&&isOva(r)&&(r.day==='уточняется'||(r.day==='Ср'&&r.time==='14:40')));
if(kir4){
  const ok=moveIfFree(kir4,'Чт','10:40',['327','328','229','240','177','150','151','314К','419']);
  if(ok) kir4.quality='31.08.2026: ОВЯ 4 курса перенесён на Чт10:40 по прямому замечанию преподавателя.';
}

// 6. А.С. Борисова: 3 курс, группа 8 человек. Чт13 занята самой Борисовой 4 курсом,
// поэтому из пожеланных 3–4 пар выбираем Чт14:40.
const bor3=DATA.find(r=>teacher(r,'Борисова Анастасия')&&isCourse(r,'3')&&isOva(r)&&(r.day==='уточняется'||N(r.group).includes('24б/р324_2')));
if(bor3){
  const ok=moveIfFree(bor3,'Чт','14:40',['328','327','229','240','177','150','151','314К','406','330я.л']);
  if(ok){
    bor3.group='3 курс, 2-я группа японского';
    bor3.quality='31.08.2026: слетевший из среды ОВЯ 3 курса поставлен на Чт14:40; Чт13:00 занята другой парой А.С. Борисовой.';
  }
}

// 7. Булах / Кириченко / Линяев / Сато: в сообщении дана величина пропавшей нагрузки,
// но не указаны конкретные студенческие подгруппы для каждого потерянного часа.
// Не создаём ложные пары и не размножаем старые академические коды автоматически.
// Уже существующие занятия этих преподавателей сохраняются без изменений.

// 8. Л.В. Овчинникова: 4 курс, Чт13:00, 7 студентов — заменить малую ауд.10 на свободную 3-значную.
const ovch4=DATA.find(r=>teacher(r,'Овчинникова Любовь')&&isCourse(r,'4')&&r.day==='Чт'&&r.time==='13:00'&&isOva(r));
if(ovch4){
  const room=firstFreeRoom(ovch4,'Чт','13:00',['328','327','229','240','177','150','151','314К','406','419']);
  if(room) ovch4.room_hint=room;
}

syncPublic();
})();
