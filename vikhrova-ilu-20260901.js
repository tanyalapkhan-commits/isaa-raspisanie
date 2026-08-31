(function(){
'use strict';
if(typeof DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();

DATA.forEach(r=>{
  if(!r) return;
  if(N(r.teacher)==='вихрова анастасия юрьевна' && N(r.discipline).includes('история лингвистических учений востока')){
    // Актуальное уточнение преподавателя: дисциплина читается на 2 курсе магистратуры.
    // Сам слот Пт 13:00 и ауд.167 уже были в более поздней согласованной версии;
    // исправляем только публичное обозначение курса/потока, не меняя время.
    r.course='2 магистратура';
    r.group='2 магистратура — поток востоковедов-языковедов';
    r.direction='языки';
    if(r.day==='Пт' && r.time==='13:00'){
      r.extra='только сентябрь';
      if(!r.room_hint) r.room_hint='167';
    }
    r.quality='01.09.2026: по прямому уточнению А.Ю. Вихровой дисциплина «История лингвистических учений Востока» относится ко 2 курсу магистратуры; публичная подпись потока уточнена. Слот Пт13:00 и ауд.167 сохранены из последней согласованной версии.';
  }
});

if(typeof PUBLIC_DATA!=='undefined'){
  const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
  PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
}
try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
try{if(typeof showEmpty==='function')showEmpty();}catch(e){}
})();
