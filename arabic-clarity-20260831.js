(function(){
'use strict';
if(typeof DATA==='undefined'||typeof PUBLIC_DATA==='undefined') return;

const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const isArabic=r=>r&&(N(r.extra).includes('араб')||N(r.discipline).includes('араб')||N(r.group).includes('араб'));
const isOva=r=>r&&(N(r.discipline).includes('основной восточный язык')||N(r.discipline)==='овя'||N(r.discipline)==='арабский язык');
const isGenericArabicGrid=r=>{
  if(!r||!isArabic(r)||!isOva(r)) return false;
  const g=N(r.group);
  return g.includes('языковая подгруппа преподавателя')||
         g.includes('кафедральная сетка преподавателя')||
         g.includes('конкретная языковая группа уточняется')||
         /^202_[1-4]\/3(?:\s*;\s*202_[1-4]\/3)*$/.test(g)||
         /^102_[1-4]\/1(?:\s*;\s*102_[1-4]\/1)*$/.test(g);
};

// В преподавательском расписании оставляем реальные часы и аудитории,
// но честно показываем, что конкретная студенческая подгруппа к слоту не привязана.
DATA.forEach(r=>{
  if(!isGenericArabicGrid(r)) return;
  if(r.course==='2 бакалавриат'){
    r.group='2 курс — арабский — конкретная языковая группа уточняется';
    r.direction='Арабский ОВЯ';
  } else if(r.course==='1 бакалавриат'){
    r.group='1 курс — арабский — конкретная языковая группа уточняется';
    r.direction='Арабский ОВЯ';
  }
});

// Публичную базу синхронизируем после переименования.
const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);

// В режиме конкретной студенческой группы НЕ подмешиваем преподавательскую сетку,
// потому что она не сообщает, какая именно 202_1/3–202_4/3 приходит в этот час.
// Вместо этого показываем одну понятную строку «уточняется».
const prev=typeof fullGroupMatches==='function'?fullGroupMatches:null;
if(prev){
  fullGroupMatches=function(key){
    let out=prev(key)||[];
    const k=N(key);
    const isStudentArabic=/^[12][ипфэ]_арабский(?:_[12])?$/.test(k);
    if(!isStudentArabic) return out;

    out=out.filter(r=>!isGenericArabicGrid(r));

    const course=k.startsWith('1')?'1 бакалавриат':'2 бакалавриат';
    const hasConcreteOva=out.some(r=>r&&r.course===course&&isArabic(r)&&isOva(r)&&!isGenericArabicGrid(r)&&r.day!=='уточняется');
    const hasPlaceholder=out.some(r=>r&&r.course===course&&isArabic(r)&&isOva(r)&&r.day==='уточняется');
    if(!hasConcreteOva&&!hasPlaceholder){
      out.push({
        group:key,
        course:course,
        direction:'',
        day:'уточняется',
        time:'уточняется',
        discipline:'Основной восточный язык (арабский)',
        extra:'',
        teacher:'уточняется',
        room_hint:'',
        quality:''
      });
    }
    return out;
  };
}

// В карточках преподавателей меняем только текст группы; никаких внутренних комментариев.
function scrub(root){
  if(!root||!root.querySelectorAll) return;
  root.querySelectorAll('.group-code,.group-link,.suggest-item,.browse-name').forEach(el=>{
    const t=N(el.textContent);
    if(t.includes('языковая подгруппа преподавателя')||t.includes('кафедральная сетка преподавателя')){
      if(t.includes('1 курс')) el.textContent='1 курс — арабский — конкретная языковая группа уточняется';
      else if(t.includes('2 курс')) el.textContent='2 курс — арабский — конкретная языковая группа уточняется';
    }
  });
}
scrub(document);
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1) scrub(n)}))).observe(document.documentElement,{childList:true,subtree:true});

// Обновляем индекс аудиторий — времена и аудитории преподавателей остаются реальными.
if(typeof roomIndex!=='undefined'){
  Object.keys(roomIndex).forEach(k=>delete roomIndex[k]);
  PUBLIC_DATA.forEach(r=>{
    if(!r||!r.day||!r.time||r.day==='уточняется') return;
    let room='';
    if(typeof singleRoom==='function') room=singleRoom(r.room_hint)||'';
    else if(r.room_hint&&!S(r.room_hint).includes(',')) room=S(r.room_hint).trim();
    if(!room) return;
    const rk=r.day+'|'+r.time+'|'+room;
    (roomIndex[rk]||(roomIndex[rk]=[])).push({teacher:r.teacher,group:r.group,discipline:r.discipline});
  });
}
})();
