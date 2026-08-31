(function(){
'use strict';
if(typeof DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const isLit=r=>r&&N(r.discipline).includes('литература изучаемой страны')&&N(r.discipline).includes('араб');
const isOva=r=>r&&(N(r.discipline).includes('основной восточный язык')||N(r.discipline)==='овя');

// 1) Убираем устаревшие две одинаковые арабские литературы у Налич Т.С. во вторник.
// Последнее актуальное замечание: сводная литература 4 курса должна идти в Пн 13:00
// совместно с Налич М.С., а не Вт 9:00/10:40 с Осиповой.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(N(r&&r.teacher)==='налич татьяна сергеевна'&&r.course==='4 бакалавриат'&&r.day==='Вт'&&isLit(r)) DATA.splice(i,1);
}
DATA.forEach(r=>{
  if(N(r&&r.teacher)==='осипова кристина тиграновна'&&r.course==='4 бакалавриат'&&r.day==='Вт'&&isLit(r)){
    if(Array.isArray(r.joint_readers)) r.joint_readers=r.joint_readers.filter(x=>N(x)!=='налич татьяна сергеевна');
    r.quality=S(r.quality)+' | не совместное чтение с Налич Т.С. по последнему замечанию от 31.08.2026';
  }
});

// Создаём/нормализуем одну сводную пару Пн 13:00 для каждой из двух Налич,
// чтобы в расписании преподавателя она отображалась ровно один раз.
function ensureNalichLit(teacher,other){
  let row=DATA.find(r=>N(r&&r.teacher)===N(teacher)&&r.course==='4 бакалавриат'&&isLit(r)&&r.day==='Пн'&&r.time==='13:00');
  if(!row){
    row={group:'4 курс филологи',course:'4 бакалавриат',direction:'Филология',day:'Пн',time:'13:00',discipline:'Литература изучаемой страны (арабская литература)',extra:'совместное чтение',teacher,room_hint:'149',quality:'31.08.2026: сводная литература 4 курса Пн13:00 по актуальному замечанию Налич Т.С.; совместное чтение.',joint_readers:[other]};
    DATA.push(row);
  }else{
    row.day='Пн'; row.time='13:00'; row.extra=(S(row.extra)+' совместное чтение').trim();
    row.joint_readers=[other];
  }
}
ensureNalichLit('Налич Мария Сергеевна','Налич Татьяна Сергеевна');
ensureNalichLit('Налич Татьяна Сергеевна','Налич Мария Сергеевна');

// 2) Удаляем точные дубли одной и той же строки у одного преподавателя.
const seen=new Set();
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  const key=[N(r.teacher),r.course,r.day,r.time,N(r.discipline),N(r.group),N(r.extra),S(r.room_hint).trim()].join('|');
  if(seen.has(key)) DATA.splice(i,1); else seen.add(key);
}

// 3) Первый курс тоже переводим на единые короткие обозначения.
// Для арабского ОВЯ текущая база противоречива: один и тот же профиль одновременно
// приписан нескольким преподавателям. Пока не назначаем эти ложные строки студентам;
// в преподавательском режиме сворачиваем их в языковую подгруппу преподавателя.
const arabic1ByTeacher=new Map();
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(r&&r.course==='1 бакалавриат'&&isOva(r)&&N(r.extra).includes('араб')){
    const t=S(r.teacher).trim();
    if(!t) continue;
    const k=[t,r.day,r.time,N(r.discipline),N(r.extra),S(r.room_hint).trim()].join('|');
    if(!arabic1ByTeacher.has(k)){
      const clone={...r,group:'1 курс — арабский — языковая подгруппа преподавателя '+t,direction:'Арабский ОВЯ — языковая подгруппа'};
      arabic1ByTeacher.set(k,clone);
    }
    DATA.splice(i,1);
  }
}
arabic1ByTeacher.forEach(r=>DATA.push(r));

// Синхронизируем PUBLIC_DATA после очистки.
if(typeof PUBLIC_DATA!=='undefined'){
  const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
  PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
}

// 4) Простые обозначения 1 курса: 1и_китайский, 1ф_японский и т.д.
if(typeof GROUP_LABELS!=='undefined'){
  const aliases=new Map();
  const prof={'И':'и','П':'п','Ф':'ф','Э':'э'};
  function lang(v){
    const n=N(v);
    const rules=[['тайско-малаз','тайско-малазийский'],['вьет.-индонез','вьетнамско-индонезийский'],['япон.-корей','японско-корейский'],['араб','арабский'],['африкаанс','африкаанс'],['армян','армянский'],['вьет','вьетнамский'],['грузин','грузинский'],['иврит','иврит'],['китай','китайский'],['корей','корейский'],['персид','персидский'],['пушту','пушту'],['дари','дари'],['тайск','тайский'],['турец','турецкий'],['хинди','хинди'],['япон','японский'],['индонез','индонезийский']];
    for(const [s,l] of rules) if(n.includes(s)) return l;
    return '';
  }
  Object.keys(GROUP_LABELS).forEach(key=>{
    const m=S(key).match(/^26Б\/([ИПФЭ])(.+)$/i);
    if(!m) return;
    const l=lang(key+' '+S(GROUP_LABELS[key]));
    const p=prof[m[1].toUpperCase()];
    if(!l||!p) return;
    const alias='1'+p+'_'+l;
    if(!aliases.has(alias)) aliases.set(alias,{code:key,profile:p,language:l});
  });
  // Убираем старые технические обозначения первого курса из списка выбора.
  Object.keys(GROUP_LABELS).forEach(key=>{if(/^26Б\//i.test(key)) delete GROUP_LABELS[key];});
  aliases.forEach((meta,a)=>GROUP_LABELS[a]=a);
  if(typeof buildGroupItems==='function') buildGroupItems();

  // Оборачиваем уже существующий fullGroupMatches (создан предыдущим student hotfix).
  const prev=typeof fullGroupMatches==='function'?fullGroupMatches:null;
  if(prev){
    fullGroupMatches=function(key){
      const meta=aliases.get(key);
      if(!meta) return prev(key);
      const raw=meta.code;
      const result=PUBLIC_DATA.filter(r=>{
        // Не показываем первокурсникам арабский ОВЯ до точного распределения преподавателей по профилям.
        if(meta.language==='арабский'&&r.course==='1 бакалавриат'&&isOva(r)&&N(r.extra).includes('араб')) return false;
        const g=S(r.group);
        if(g===raw||g.split(/\s*[;,]\s*/).includes(raw)) return true;
        const ng=N(g), nd=N(r.direction), ne=N(r.extra), dd=N(r.discipline);
        if(r.course!=='1 бакалавриат') return false;
        // Общие предметы профиля/языка/всего курса.
        if(ng.includes('весь поток 1 курса')||ng.includes('весь 1 курс')||ng.includes('все группы 1 курса')) return true;
        const pName={'и':'истор','п':'полит','ф':'филолог','э':'эконом'}[meta.profile];
        if(pName&&(ng.includes(pName)||nd.includes(pName))&&(ng.includes(meta.language)||ne.includes(meta.language)||dd.includes(meta.language))) return true;
        return false;
      });
      const uniq=[]; const s=new Set();
      result.forEach(r=>{const k=[r.day,r.time,N(r.discipline),N(r.group),N(r.teacher),S(r.room_hint)].join('|');if(!s.has(k)){s.add(k);uniq.push(r);}});
      return uniq;
    };
  }

  // На карточках первого курса показываем тот же короткий код вместо полного шифра.
  const reverse=new Map([...aliases].map(([a,m])=>[m.code,a]));
  function scrub(root){
    if(!root||!root.querySelectorAll) return;
    root.querySelectorAll('.group-code,.group-link,.suggest-item,.browse-name').forEach(el=>{
      const raw=el.getAttribute&&el.getAttribute('data-group');
      if(raw&&reverse.has(raw)) el.textContent=reverse.get(raw);
      else if(reverse.has(el.textContent.trim())) el.textContent=reverse.get(el.textContent.trim());
    });
  }
  scrub(document);
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1) scrub(n)}))).observe(document.documentElement,{childList:true,subtree:true});
}

// Обновляем аудиторный индекс.
if(typeof roomIndex!=='undefined'&&typeof PUBLIC_DATA!=='undefined'){
  Object.keys(roomIndex).forEach(k=>delete roomIndex[k]);
  PUBLIC_DATA.forEach(r=>{
    if(!r||!r.day||!r.time||r.day==='уточняется') return;
    let room='';
    if(typeof singleRoom==='function') room=singleRoom(r.room_hint)||'';
    if(!room) return;
    const key=r.day+'|'+r.time+'|'+room;
    (roomIndex[key]||(roomIndex[key]=[])).push({teacher:r.teacher,group:r.group,discipline:r.discipline});
  });
}
})();
