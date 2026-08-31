(function(){
'use strict';
if(typeof DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const normRoom=v=>N(v).replace(/^ауд(?:итория)?\.?\s*/,'').replace(/\s+/g,'');
function roomsOf(r){return S(r&&r.room_hint).split(/\s*,\s*/).map(normRoom).filter(Boolean);}
function roomBusy(room,day,time,ignore){
  const rr=normRoom(room);
  return DATA.some(x=>x!==ignore&&x&&x.day===day&&x.time===time&&roomsOf(x).includes(rr));
}

// Последнее прямое уточнение Д.Р. Жантиева: Вт 13:00, 3 курс,
// арабисты-политологи, филологи и экономисты. 235 слишком мала;
// нужна вместительная аудитория с проектором/экраном.
const zh=DATA.find(r=>r&&N(r.teacher)==='жантиев дмитрий рустемович'&&S(r.course).trim()==='3 бакалавриат'&&r.day==='Вт'&&r.time==='13:00'&&N(r.discipline).includes('основные проблемы')&&N(r.discipline).includes('арабских стран'));
if(zh){
  zh.group='3 курс — арабисты: политологи, филологи и экономисты';
  zh.direction='Политология + Филология + Экономика';
  const room=['149','151','150','228','229'].find(x=>!roomBusy(x,'Вт','13:00',zh));
  zh.room_hint=room||'';
  zh.quality='01.09.2026: по прямому сообщению Д.Р. Жантиева лекция Вт13:00 предназначена для арабистов-политологов, филологов и экономистов 3 курса. Ауд.235 снята как недостаточная по вместимости; выбрана первая свободная из прямо предложенных преподавателем вместительных аудиторий с проектором/экраном.';
}

// В том же слоте в более раннем слое стояла Теория ОВЯ Аганиной для И/П/Ф.
// После нового прямого подтверждения Жантиева П/Ф оказываются в двух парах сразу.
// Новый час Аганиной не придумываем: снимаем Вт13:00 до отдельного согласования.
DATA.forEach(r=>{
  if(!r||N(r.teacher)!=='аганина гульчара рашидовна'||S(r.course).trim()!=='3 бакалавриат'||r.day!=='Вт'||r.time!=='13:00') return;
  const d=N(r.discipline);
  if(d==='теория овя'||d.includes('теория основного восточного языка')){
    r.day='уточняется';
    r.time='уточняется';
    r.room_hint='';
    r.quality='01.09.2026: прежний Вт13:00 снят из-за прямого подтверждения Д.Р. Жантиева: в это время у арабистов-политологов и филологов 3 курса лекция по общественно-политическому развитию арабских стран. Новый слот Теории ОВЯ без подтверждения не назначается.';
  }
});

if(typeof PUBLIC_DATA!=='undefined'){
  const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
  PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
}
if(typeof roomIndex==='object'&&typeof PUBLIC_DATA!=='undefined'){
  Object.keys(roomIndex).forEach(k=>delete roomIndex[k]);
  PUBLIC_DATA.forEach(r=>{
    if(!r||!r.day||!r.time||r.day==='уточняется') return;
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
