(function(){
'use strict';
if(typeof DATA==='undefined') return;

const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const KUZ='Кузнецов Алексей Анатольевич';
const DEL='Делинад Максим Голамхасанович';
const isKuz=r=>r&&N(r.teacher)===N(KUZ);
const isPersianOva2=r=>r&&r.course==='2 бакалавриат'&&N(r.discipline).includes('основной восточный язык')&&N(r.extra).includes('персид');
const isGroup214=r=>{
  const g=N(r&&r.group);
  return g.includes('25б/и214-персидский/3')||g.includes('25б/ф214-персидский/3')||g.includes('214');
};
const roomNames=['333и.л','335 К','424','431 а','415','416','328','327','229','240'];
function normRoom(v){return N(v).replace(/^ауд(?:итория)?\.?\s*/,'').replace(/\s+/g,'');}
function roomsOf(r){return S(r&&r.room_hint).split(/\s*,\s*/).map(normRoom).filter(Boolean);}
function roomBusy(room,day,time,ignore){
  const rr=normRoom(room);
  return DATA.some(x=>x!==ignore&&x&&x.day===day&&x.time===time&&roomsOf(x).includes(rr));
}
function pickRoom(day,time,ignore,preferred){
  const all=[...(preferred||[]),...roomNames];
  const seen=new Set();
  for(const room of all){
    const k=normRoom(room); if(!k||seen.has(k)) continue; seen.add(k);
    if(!roomBusy(room,day,time,ignore)) return room;
  }
  return '';
}

// 1) Вт 14:40 и Пт 14:40: ОВЯ персидский 2 курса у И214+Ф214
// передаётся от Кузнецова А.А. Делинаду М.Г. Время групп не меняем.
DATA.forEach(r=>{
  if(isKuz(r)&&isPersianOva2(r)&&isGroup214(r)&&['Вт','Пт'].includes(r.day)&&r.time==='14:40'){
    r.teacher=DEL;
    // У Делинада прямое пожелание — ауд.424; если она занята, выбираем свободную
    // аудиторию из иранского пула без создания аудиторного конфликта.
    r.room_hint=pickRoom(r.day,r.time,r,['424','333и.л','335 К'])||r.room_hint;
    r.quality='31.08.2026: по новому письму кафедры иранской филологии пары Кузнецова А.А. по ОВЯ персидский Вт14:40 и Пт14:40 (И214+Ф214) переданы Делинаду М.Г.';
  }
});

// 2) Внешняя занятость Кузнецова «Восточная поэтика и критика»
// перенесена филфаком: Вт16:20 -> Чт18:00. Это не аудитория ИСАА.
DATA.forEach(r=>{
  if(isKuz(r)&&N(r.discipline).includes('восточная поэтика и критика')){
    r.day='Чт'; r.time='18:00'; r.room_hint='вне ИСАА';
    r.quality='31.08.2026: филфак МГУ перенёс внешний курс «Восточная поэтика и критика» с Вт16:20 на Чт18:00; Вт16:20 освобождён для нагрузки ИСАА.';
  }
});

// 3) Субботние пары группы 414 (пушту) убрать с субботы:
// ВВЯ (дари) Сб10:40 -> Вт16:20 (освободилось после переноса филфака);
// История литературы Афганистана Сб13:00 -> Пт14:40 (освободилось у Кузнецова после передачи ОВЯ Делинаду).
let dariSat=null, litSat=null;
for(const r of DATA){
  if(!isKuz(r)||r.course!=='4 бакалавриат'||r.day!=='Сб') continue;
  if(r.time==='10:40'&&(N(r.discipline).includes('второй восточный язык')||N(r.discipline).includes('ввя'))&&N(r.discipline).includes('дари')) dariSat=r;
  if(r.time==='13:00'&&N(r.discipline).includes('история литературы афганистана')) litSat=r;
}
if(dariSat){
  dariSat.day='Вт'; dariSat.time='16:20';
  dariSat.group='4 курс, группа 414 (пушту)';
  dariSat.room_hint=pickRoom('Вт','16:20',dariSat,['335 К','333и.л'])||'';
  dariSat.quality='31.08.2026: по новому письму кафедры иранской филологии ВВЯ (дари) группы 414 перенесён с Сб10:40 на освободившееся Вт16:20.';
}
if(litSat){
  litSat.day='Пт'; litSat.time='14:40';
  litSat.group='4 курс, группа 414 (пушту)';
  litSat.room_hint=pickRoom('Пт','14:40',litSat,['335 К','333и.л'])||'';
  litSat.quality='31.08.2026: по новому письму кафедры иранской филологии «История литературы Афганистана» группы 414 перенесена с Сб13:00 на освободившееся Пт14:40.';
}

// Если в старых слоях сохранились дополнительные точные копии этих субботних пар — удаляем их.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(!isKuz(r)||r.course!=='4 бакалавриат'||r.day!=='Сб') continue;
  if(r.time==='10:40'&&(N(r.discipline).includes('второй восточный язык')||N(r.discipline).includes('ввя'))&&N(r.discipline).includes('дари')) DATA.splice(i,1);
  else if(r.time==='13:00'&&N(r.discipline).includes('история литературы афганистана')) DATA.splice(i,1);
}

// Обновляем публичную базу и индекс аудиторий.
if(typeof PUBLIC_DATA!=='undefined'){
  const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
  PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
}
if(typeof roomIndex!=='undefined'&&typeof PUBLIC_DATA!=='undefined'){
  Object.keys(roomIndex).forEach(k=>delete roomIndex[k]);
  PUBLIC_DATA.forEach(r=>{
    if(!r||!r.day||!r.time||r.day==='уточняется') return;
    let room='';
    if(typeof singleRoom==='function') room=singleRoom(r.room_hint)||'';
    else if(r.room_hint&&!S(r.room_hint).includes(',')) room=S(r.room_hint).trim();
    if(!room||N(room)==='вне исаа') return;
    const key=r.day+'|'+r.time+'|'+room;
    (roomIndex[key]||(roomIndex[key]=[])).push({teacher:r.teacher,group:r.group,discipline:r.discipline});
  });
}
try{if(typeof buildGroupItems==='function') buildGroupItems();}catch(e){}
})();
