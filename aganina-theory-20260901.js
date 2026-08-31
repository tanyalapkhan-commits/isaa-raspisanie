(function(){
'use strict';
if(typeof DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();

function isAganinaTheory(r){
  if(!r) return false;
  if(N(r.teacher)!=='аганина гульчара рашидовна') return false;
  if(S(r.course).trim()!=='3 бакалавриат') return false;
  const d=N(r.discipline);
  return d.includes('теория овя') || d.includes('теория основного восточного языка');
}

const rows=DATA.filter(isAganinaTheory);
if(rows.length){
  // В актуальной форме 2026/27 ТОВЯ Аганиной указан для 3 курса филологов.
  // После прямого подтверждения лекции Жантиева Вт 13:00 прежний слот ТОВЯ
  // использовать нельзя. В допустимых для Аганиной Вт/Ср 10:40/13:00/14:40
  // сейчас нет проверенного свободного окна без переноса уже согласованных занятий.
  // Поэтому не придумываем четверг или иной неподтверждённый час.
  let keep=rows.find(r=>N(r.group).includes('24б/ф302')) || rows[0];
  keep.group='24Б/Ф302-арабский/5';
  keep.course='3 бакалавриат';
  keep.direction='Филология';
  keep.day='уточняется';
  keep.time='уточняется';
  keep.discipline='Теория ОВЯ';
  keep.extra='арабский; 5-й семестр';
  keep.room_hint='';
  keep.quality='01.09.2026: актуальная форма Г.Р. Аганиной — ТОВЯ, 3 бакалавриат, филологи; желаемые дни Вт/Ср, время 10:40/13:00/14:40. Прежний Вт 13:00 снят после прямого подтверждения лекции Д.Р. Жантиева для арабистов 3 курса. Проверенного свободного окна внутри пожеланий без переноса других подтверждённых занятий сейчас нет; день/время/аудитория оставлены на уточнение.';

  // Убираем ошибочно размноженные копии ТОВЯ по историкам/политологам и иные дубли.
  for(let i=DATA.length-1;i>=0;i--){
    const r=DATA[i];
    if(isAganinaTheory(r) && r!==keep) DATA.splice(i,1);
  }
}

if(typeof PUBLIC_DATA!=='undefined'){
  const publicRows=typeof isServiceRow==='function' ? DATA.filter(r=>!isServiceRow(r)) : DATA.slice();
  PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...publicRows);
}
if(typeof roomIndex==='object' && typeof PUBLIC_DATA!=='undefined'){
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
