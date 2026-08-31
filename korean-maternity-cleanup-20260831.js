(function(){
'use strict';
if(typeof DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();

// А.А. Горожанкина находится в декретном отпуске: её строки не должны
// показываться как действующие занятия 2026/27. Замещающего преподавателя
// автоматически не назначаем.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(N(r&&r.teacher)==='горожанкина анна андреевна') DATA.splice(i,1);
}

function syncPublic(){
  if(typeof PUBLIC_DATA!=='undefined'){
    const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
    PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
  }
  if(typeof roomIndex==='object' && typeof PUBLIC_DATA!=='undefined'){
    Object.keys(roomIndex).forEach(k=>delete roomIndex[k]);
    PUBLIC_DATA.forEach(r=>{
      if(typeof singleRoom!=='function') return;
      const room=singleRoom(r.room_hint);
      if(!room) return;
      const key=r.day+'|'+r.time+'|'+room;
      (roomIndex[key]||(roomIndex[key]=[])).push({teacher:r.teacher,group:r.group,discipline:r.discipline});
    });
  }
}
syncPublic();

// Технический шифр 224_1 «япон.-корейский» в строках 2 курса относится
// здесь именно к ОВЯ корейского языка. В публичном студенческом режиме
// слово «японско-корейский» вводило студентов в заблуждение.
const remap={
  '2и_корейский':'2и_японско-корейский',
  '2п_корейский':'2п_японско-корейский',
  '2ф_корейский':'2ф_японско-корейский',
  '2э_корейский':'2э_японско-корейский'
};
const labels={
  '2и_корейский':'2 курс — история — корейский',
  '2п_корейский':'2 курс — политика — корейский',
  '2ф_корейский':'2 курс — филология — корейский',
  '2э_корейский':'2 курс — экономика — корейский'
};
if(typeof GROUP_LABELS==='object'){
  Object.keys(GROUP_LABELS).forEach(k=>{
    const all=N(k+' '+GROUP_LABELS[k]);
    if(all.includes('2') && all.includes('японско-корейский')) delete GROUP_LABELS[k];
  });
  Object.entries(labels).forEach(([k,v])=>GROUP_LABELS[k]=v);
}
if(typeof fullGroupMatches==='function'){
  const previousFullGroupMatches=fullGroupMatches;
  fullGroupMatches=function(key){
    if(remap[key]){
      const rows=previousFullGroupMatches(remap[key])||[];
      return rows.filter(r=>N(r&&r.extra).includes('корей') && N(r&&r.teacher)!=='горожанкина анна андреевна');
    }
    const rows=previousFullGroupMatches(key)||[];
    return rows.filter(r=>N(r&&r.teacher)!=='горожанкина анна андреевна');
  };
}

try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
try{if(typeof showEmpty==='function')showEmpty();}catch(e){}

// Исправляем уже отрисованные и новые публичные подписи. Дисциплины не меняем:
// в данных они и так имеют extra="корейский".
function cleanLabels(root){
  if(!root || !root.querySelectorAll) return;
  const nodes=[];
  if(root.matches && root.matches('.group-code,.group-link,.suggest-item,.browse-name')) nodes.push(root);
  root.querySelectorAll('.group-code,.group-link,.suggest-item,.browse-name').forEach(el=>nodes.push(el));
  nodes.forEach(el=>{
    const t=S(el.textContent);
    if(/2\s*курс/i.test(t) && /японско-корейск/i.test(t)){
      el.textContent=t.replace(/японско-корейский/gi,'корейский');
    }
  });
}
cleanLabels(document);
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1) cleanLabels(n);}))).observe(document.documentElement,{childList:true,subtree:true});
})();
