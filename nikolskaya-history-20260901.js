(function(){
'use strict';
if(typeof DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const TEACHER='никольская ксения дмитриевна';
const GROUP='25б/и223-хинди/3';
const normRoom=v=>N(v).replace(/^ауд(?:итория)?\.?\s*/,'').replace(/\s+/g,'');
const roomsOf=r=>S(r&&r.room_hint).split(/\s*,\s*/).map(normRoom).filter(Boolean);

function isHistoryRow(r){
  if(!r||N(r.teacher)!==TEACHER||S(r.course).trim()!=='2 бакалавриат') return false;
  if(!N(r.group).includes(GROUP)) return false;
  const d=N(r.discipline);
  return d.includes('основные проблемы истории южной азии') || d.includes('основные проблемы и тенденции исторического развития');
}
function teacherBusy(day,time,ignore){
  return DATA.some(r=>r&&r!==ignore&&r.day===day&&r.time===time&&N(r.teacher)===TEACHER);
}
function groupBusy(day,time,ignore){
  return DATA.some(r=>{
    if(!r||r===ignore||r.day!==day||r.time!==time) return false;
    const g=N(r.group);
    if(g.includes(GROUP)) return true;
    // Общая обязательная строка для всех историков 2 курса также блокирует слот.
    if(S(r.course).trim()==='2 бакалавриат' && g.includes('истор')){
      if(g.includes('все истор') || g.includes('историки — поток') || g.includes('историки - поток') || g==='2 курс, историки' || g==='2 курс — история') return true;
    }
    return false;
  });
}
function roomBusy(room,day,time,ignore){
  const rr=normRoom(room);
  return DATA.some(r=>r&&r!==ignore&&r.day===day&&r.time===time&&roomsOf(r).includes(rr));
}

const rows=DATA.filter(isHistoryRow);
const first=rows.find(r=>r.day==='Ср'&&r.time==='13:00') || rows[0];
const second=rows.find(r=>r!==first && (r.day==='уточняется'||r.time==='уточняется'||N(r.extra).includes('2-я из 2')));

if(second){
  // Вторая пара обязательна: по форме К.Д. Никольской курс для историков-хинди
  // составляет 4 ч/нед. Старый Ср14:40 был снят только из-за общего правила МФК.
  // Чт14:40 занят подтверждённым ОВЯ хинди Акимушкиной, поэтому восстанавливаем
  // пару в разрешённый преподавателем Пт14:40, если текущая сетка это подтверждает.
  const day='Пт', time='14:40';
  if(!teacherBusy(day,time,second) && !groupBusy(day,time,second)){
    const candidates=['236','229','151','149','167','228','240','327','433'];
    const room=candidates.find(x=>!roomBusy(x,day,time,second)) || '';
    second.day=day;
    second.time=time;
    second.group='25Б/И223-хинди/3';
    second.direction='История';
    second.extra='2-я из 2 пар; историки-хинди';
    second.room_hint=room;
    second.quality='01.09.2026: восстановлена обязательная 2-я пара курса К.Д. Никольской (4 ч/нед.). Ср14:40 не используется из-за МФК; Чт14:40 занят подтверждённым ОВЯ хинди. Пт14:40 входит в заявленные преподавателем дни/время и проверен по преподавателю и группе; назначена первая свободная аудитория из рабочего пула.';
  }
}

if(typeof PUBLIC_DATA!=='undefined'){
  const rowsPublic=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
  PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rowsPublic);
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
