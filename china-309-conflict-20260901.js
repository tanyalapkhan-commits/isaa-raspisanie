(function(){
'use strict';
if(typeof DATA==='undefined' || typeof PUBLIC_DATA==='undefined') return;

const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const G_I='24б/и309-китайский/5';
const G_P='24б/п309-китайский/5';

function isTargetGroup(r){
  const g=N(r&&r.group);
  return g.includes(G_I) && g.includes(G_P);
}
function isMashkinaOvy(r){
  return r &&
    S(r.course).trim()==='3 бакалавриат' &&
    N(r.teacher)==='машкина ольга анатольевна' &&
    N(r.discipline).includes('основной восточный язык') &&
    isTargetGroup(r);
}

// 01.09.2026. Срочная развязка реального студенческого конфликта 309П.
// Вт 10:40 у политологов-китаистов подтверждена «История изучаемой страны»
// А.С. Каимовой (прямая корректировка 28.08.2026). Поэтому пара ОВЯ
// О.А. Машкиной в тот же слот не может оставаться в публичном расписании.
// Новый слот не придумываем: четверг исключён условием о возможной военной
// кафедре, а среда с 14:40 закрыта под МФК. В DATA уже есть одна строка ОВЯ
// этой группы со статусом «уточняется» — именно она остаётся как незакрытая пара.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(isMashkinaOvy(r) && r.day==='Вт' && r.time==='10:40') DATA.splice(i,1);
}

DATA.forEach(r=>{
  if(!isMashkinaOvy(r)) return;
  if(r.day==='уточняется' || r.time==='уточняется'){
    const note='01.09.2026: Вт 10:40 снят из ОВЯ 24Б/И309 + 24Б/П309, потому что у 24Б/П309 в этот слот стоит подтверждённая прямой корректировкой А.С. Каимовой «История изучаемой страны». Новый слот ОВЯ не выдумывается: четверг не используется из-за условия о возможной военной кафедре; среда с 14:40 закрыта под МФК. Требуется подобрать отдельное бесконфликтное окно с учётом группы, О.А. Машкиной и аудитории.';
    const q=S(r.quality);
    if(!q.includes('01.09.2026: Вт 10:40 снят из ОВЯ')) r.quality=(q?q+' | ':'')+note;
  }
});

const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
try{if(typeof showEmpty==='function')showEmpty();}catch(e){}
})();
