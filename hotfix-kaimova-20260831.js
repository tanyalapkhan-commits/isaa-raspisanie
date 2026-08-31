(function(){
'use strict';
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е');
const KAIMOVA='Каимова Анна Сергеевна';
const CHINA3_ALL='24Б/И309-китайский/5; 24Б/П309-китайский/5; 24Б/Ф309-китайский/5; 24Б/Э309-1-китайский/5; 24Б/Э309-2-китайский/5';
const CHINA3_NO_HIST='24Б/П309-китайский/5; 24Б/Ф309-китайский/5; 24Б/Э309-1-китайский/5; 24Б/Э309-2-китайский/5';

DATA.forEach(r=>{
  if(S(r.teacher).trim()!==KAIMOVA || S(r.course).trim()!=='3 бакалавриат') return;
  const d=N(r.discipline).trim();
  if(d.startsWith('история религий изучаемого региона') || d==='история религий китая'){
    r.group=CHINA3_ALL;
    r.direction='История + Политология + Филология + Экономика';
    r.extra='Китай; общий поток китаистов 3 курса';
  }
  if(d.startsWith('история изучаемой страны')){
    r.group=CHINA3_NO_HIST;
    r.direction='Политология + Филология + Экономика';
    r.extra='Китай; политологи, филологи и экономисты-китаисты 3 курса';
  }
});

// Синхронизируем публичные данные после конкретизации групп.
if(typeof PUBLIC_DATA!=='undefined' && typeof isServiceRow==='function'){
  PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...DATA.filter(r=>!isServiceRow(r)));
}
if(typeof roomIndex==='object' && typeof singleRoom==='function'){
  Object.keys(roomIndex).forEach(k=>delete roomIndex[k]);
  PUBLIC_DATA.forEach(r=>{
    const room=singleRoom(r.room_hint);
    if(!room) return;
    const key=r.day+'|'+r.time+'|'+room;
    (roomIndex[key]||(roomIndex[key]=[])).push({teacher:r.teacher,group:r.group,discipline:r.discipline});
  });
}
try{ if(typeof buildGroupItems==='function') buildGroupItems(); if(typeof buildBrowseList==='function') buildBrowseList(); if(typeof showEmpty==='function') showEmpty(); }catch(e){}
})();
