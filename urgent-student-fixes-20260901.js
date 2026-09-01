(function(){
'use strict';
if(typeof DATA==='undefined' || typeof PUBLIC_DATA==='undefined') return;

const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();

function rowSig(r){
  return [r&&r.course,r&&r.direction,r&&r.day,r&&r.time,r&&r.discipline,r&&r.group,r&&r.extra,r&&r.teacher,r&&r.room_hint]
    .map(N).join('||');
}
function mergeRows(a,b){
  const out=[];
  const seen=new Set();
  [...(a||[]),...(b||[])].forEach(r=>{
    if(!r) return;
    const k=rowSig(r);
    if(seen.has(k)) return;
    seen.add(k);
    out.push(r);
  });
  return out;
}
function rebuildPublic(){
  const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
  PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
}

// 1) Срочное уточнение А.Ю. Вихровой: Вт 13:00 «Общее языкознание» —
// лекция для всего потока филологов 3 курса, а не только для китаистов-филологов.
DATA.forEach(r=>{
  if(!r) return;
  if(S(r.course).trim()==='3 бакалавриат' &&
     N(r.discipline)==='общее языкознание' &&
     N(r.teacher)==='вихрова анастасия юрьевна'){
    r.group='3 курс филологи';
    r.direction='Филология';
    r.quality='01.09.2026: по прямому уточнению А.Ю. Вихровой занятие «Общее языкознание» Вт 13:00 относится ко всему потоку филологов 3 курса; время, преподаватель и аудитория сохранены.';
  }
});
rebuildPublic();

// 2) Точечные исправления выдачи коротких студенческих групп.
// Старый matcher не узнаёт 25Б/Р224_3 как историческую японско-корейскую подгруппу
// и отбрасывает общекурсовые строки с группой «все» у 3 курса.
const previousFull=typeof fullGroupMatches==='function'?fullGroupMatches:null;
if(previousFull){
  const langStems=[
    'араб','армян','амхар','африкаанс','вьет','иврит','индонез','малай',
    'китай','корей','персид','пушту','суахили','турец','хауса','хинди','урду',
    'филип','япон','кхмер','тайск'
  ];

  function compactKey(key){
    return N(key).replace(/\s+/g,'');
  }
  function isYapKor2I(key){
    const k=compactKey(key);
    return k==='2и_япкор' ||
           k==='2и_японско-корейский' ||
           k==='2и_япон.-корейский' ||
           k==='2и_япон-корейский';
  }
  function isAfrikaans3E(key){
    return compactKey(key)==='3э_африкаанс';
  }
  function hasOtherNamedLanguage(r){
    const blob=N(S(r.group)+' '+S(r.extra));
    return langStems.some(st=>st!=='африкаанс' && blob.includes(st));
  }

  fullGroupMatches=function(key){
    let rows=previousFull(key)||[];

    // 2 курс, история, японско-корейская группа: вернуть третью подгруппу 25Б/Р224_3.
    if(isYapKor2I(key)){
      const extra=PUBLIC_DATA.filter(r=>
        r && S(r.course).trim()==='2 бакалавриат' && N(r.group).includes('25б/р224_3')
      );
      rows=mergeRows(rows,extra);
    }

    // 3 курс, экономика, африкаанс: вернуть точные строки группы и общие занятия 3 курса.
    if(isAfrikaans3E(key)){
      const extra=PUBLIC_DATA.filter(r=>{
        if(!r || S(r.course).trim()!=='3 бакалавриат') return false;
        const g=N(r.group);
        const d=N(r.direction);
        const e=N(r.extra);

        if(g.includes('24б/э303-африкаанс/5')) return true;
        if(['все','все группы','все студенты','весь 3 курс','все 3 курс','весь курс'].includes(g)) return true;

        const economicsWide=d.includes('эконом') || g.includes('экономист') || g.includes('экономическ');
        if(!economicsWide) return false;
        if((g.includes('африкаанс') || e.includes('африкаанс'))) return true;
        if(hasOtherNamedLanguage(r)) return false;
        return true;
      });
      rows=mergeRows(rows,extra);
    }

    return rows;
  };
}

try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
try{if(typeof showEmpty==='function')showEmpty();}catch(e){}
})();
