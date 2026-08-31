(function(){
'use strict';
if(typeof DATA==='undefined' || typeof PUBLIC_DATA==='undefined' || typeof GROUP_LABELS==='undefined') return;

const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const TARGET_COURSES=new Set(['2 бакалавриат','3 бакалавриат','4 бакалавриат','2 магистратура']);
const ALIASES=new Map();

const langRules=[
  ['япон.-корей','японско-корейский'],['японско-корей','японско-корейский'],
  ['тайско-кхмер','тайско-кхмерский'],['тайск','тайский'],['кхмер','кхмерский'],
  ['индонез.-малай','индонезийско-малайский'],['индонезийский-малай','индонезийско-малайский'],
  ['филип.-индонез','филиппинско-индонезийский'],['филиппинский-индонез','филиппинско-индонезийский'],
  ['хинди-урду','хинди-урду'],['араб','арабский'],['армян','армянский'],['амхар','амхарский'],
  ['африкаанс','африкаанс'],['вьет','вьетнамский'],['иврит','иврит'],['израил','иврит'],
  ['китай','китайский'],['корей','корейский'],['малай','малайский'],['персид','персидский'],
  ['пушту','пушту'],['суахили','суахили'],['турец','турецкий'],['хауса','хауса'],
  ['хинди','хинди'],['урду','урду'],['филип','филиппинский'],['япон','японский'],
  ['индонез','индонезийский']
];
function languageOf(v){
  const n=N(v);
  for(const [stem,name] of langRules) if(n.includes(stem)) return name;
  return '';
}
function bachelorProfileLetter(v){
  const n=N(v);
  if(/(^|\W)и(\W|$)/i.test(v)||n.includes('истор')) return 'и';
  if(/(^|\W)п(\W|$)/i.test(v)||n.includes('полит')) return 'п';
  if(/(^|\W)ф(\W|$)/i.test(v)||n.includes('филолог')) return 'ф';
  if(/(^|\W)э(\W|$)/i.test(v)||n.includes('эконом')) return 'э';
  return '';
}
function masterProfileLetter(v){
  const n=N(v);
  if(n.includes('истор')) return 'и';
  if(n.includes('литератур')) return 'л';
  if(n.includes('лингв')||n.includes('языки')) return 'я';
  if(n.includes('полит')) return 'п';
  if(n.includes('эконом')) return 'э';
  return '';
}
function courseNum(course){
  return ({'2 бакалавриат':'2','3 бакалавриат':'3','4 бакалавриат':'4'})[course]||'';
}
function aliasName(course,profile,lang,suffix){
  if(course==='2 магистратура') return 'м2'+profile+'_'+lang+(suffix||'');
  return courseNum(course)+profile+'_'+lang+(suffix||'');
}
function register(alias,meta,target){
  if(!alias||!meta||!meta.course||!meta.profile||!meta.language) return;
  let item=ALIASES.get(alias);
  if(!item){ item={...meta,targets:[]}; ALIASES.set(alias,item); }
  if(target && !item.targets.includes(target)) item.targets.push(target);
}

function parseBachelorRaw(key,label){
  const m=S(key).match(/^(25|24|23)Б\/([ИПФЭ])(.+)$/i);
  if(!m) return null;
  const course=({'25':'2 бакалавриат','24':'3 бакалавриат','23':'4 бакалавриат'})[m[1]];
  const profile=({'И':'и','П':'п','Ф':'ф','Э':'э'})[m[2].toUpperCase()];
  const language=languageOf(key+' '+label);
  if(!course||!profile||!language) return null;
  let suffix='';
  const rest=N(m[3]);
  if(language==='китайский'){
    if(/(?:^|[-_])1(?:[-_/]|$)/.test(rest)) suffix='_1';
    if(/(?:^|[-_])2(?:[-_/]|$)/.test(rest)) suffix='_2';
    // На 2 курсе у политологов две китайские группы: основной код считаем первой.
    if(course==='2 бакалавриат'&&profile==='п'&&!suffix) suffix='_1';
  }
  return {course,profile,language,suffix};
}
function parseMasterRaw(key,label){
  const s=S(key);
  let profile='';
  let m=s.match(/^25М\/([ИЛЯПЭ])/i);
  if(m) profile=({'И':'и','Л':'л','Я':'я','П':'п','Э':'э'})[m[1].toUpperCase()]||'';
  if(/^25М\/Эр/i.test(s)) profile='э';
  let old=s.match(/24М\/К-227\(([илпэя])\)/i);
  if(old) profile=old[1].toLowerCase();
  const language=languageOf(s+' '+label);
  if(!profile||!language) return null;
  return {course:'2 магистратура',profile,language,suffix:''};
}

// 1) Собираем простые псевдонимы из уже известных реальных кодов.
Object.keys(GROUP_LABELS).forEach(key=>{
  const label=S(GROUP_LABELS[key]);
  const b=parseBachelorRaw(key,label);
  if(b) register(aliasName(b.course,b.profile,b.language,b.suffix),b,key);
  const m=parseMasterRaw(key,label);
  if(m) register(aliasName(m.course,m.profile,m.language,''),m,key);
});

// Отдельные известные группы без нормального полного шифра.
register('2п_китайский_2',{course:'2 бакалавриат',profile:'п',language:'китайский',suffix:'_2'},'2 курс, политологи, китайский, группа 2 (точный код уточняется)');
register('2и_тайско-кхмерский',{course:'2 бакалавриат',profile:'и',language:'тайско-кхмерский'},'2 курс, историки, тайско-кхмерская группа');
register('2э_тайско-кхмерский',{course:'2 бакалавриат',profile:'э',language:'тайско-кхмерский'},'2 курс, экономисты, тайско-кхмерская группа');
register('4и_пушту',{course:'4 бакалавриат',profile:'и',language:'пушту'},'4 курс, группа 414 (пушту)');
register('м2э_арабский',{course:'2 магистратура',profile:'э',language:'арабский'},'25М/Эр102 (арабский)/3');

// 2) Добавляем все реально существующие сочетания из актуального списка студентов,
// чтобы студент мог найти себя даже там, где старый технический код в HTML отсутствует.
const canonical={
 '2 бакалавриат':{
  'и':['арабский','армянский','китайский','персидский','тайско-кхмерский','турецкий','хауса','хинди-урду','японский','японско-корейский'],
  'п':['арабский','армянский','китайский','турецкий','японский','японско-корейский'],
  'ф':['арабский','китайский','персидский','турецкий','хинди-урду','японский','японско-корейский'],
  'э':['арабский','китайский','тайско-кхмерский','турецкий','хауса','хинди-урду','японский','японско-корейский']
 },
 '3 бакалавриат':{
  'и':['амхарский','арабский','африкаанс','иврит','индонезийско-малайский','китайский','корейский','персидский','турецкий','филиппинско-индонезийский','хинди','японский'],
  'п':['арабский','африкаанс','индонезийско-малайский','китайский','корейский','турецкий','филиппинско-индонезийский','хинди','японский'],
  'ф':['арабский','китайский','корейский','персидский','турецкий','филиппинско-индонезийский','хинди','японский'],
  'э':['амхарский','арабский','африкаанс','индонезийско-малайский','китайский','корейский','турецкий','филиппинско-индонезийский','хинди','японский']
 },
 '4 бакалавриат':{
  'и':['арабский','вьетнамский','китайский','пушту','суахили','хауса','хинди','японский'],
  'п':['арабский','китайский','японский'],
  'ф':['арабский','китайский','персидский','турецкий','филиппинский','японский'],
  'э':['арабский','китайский','турецкий','японский']
 },
 '2 магистратура':{
  'и':['арабский','китайский','корейский','кхмерский','хинди','японский'],
  'л':['арабский','китайский','персидский','турецкий','японский'],
  'я':['хинди','японский'],
  'п':['арабский','иврит','китайский','корейский','малайский','персидский','турецкий'],
  'э':['арабский','вьетнамский','иврит','китайский']
 }
};
Object.entries(canonical).forEach(([course,profiles])=>{
  Object.entries(profiles).forEach(([profile,languages])=>{
    languages.forEach(language=>{
      const base=aliasName(course,profile,language,'');
      // Если уже есть только _1/_2, базовое имя оставляем как общий понятный вход.
      register(base,{course,profile,language},null);
    });
  });
});

// Для китайских реально разделённых групп оставляем также номера подгрупп.
['2э_китайский_1','2э_китайский_2','2п_китайский_1','2п_китайский_2','3э_китайский_1','3э_китайский_2','4п_китайский_1','4п_китайский_2'].forEach(a=>{
  if(!ALIASES.has(a)){
    const m=a.match(/^(\d)([ипфэ])_([^_]+)_([12])$/);
    if(m) register(a,{course:m[1]+' бакалавриат',profile:m[2],language:m[3],suffix:'_'+m[4]},null);
  }
});

function targetCourseForOldKey(key){
  const s=S(key), lab=N(GROUP_LABELS[key]);
  if(/^25Б\//i.test(s)||lab.startsWith('2 курс —')||lab.startsWith('2 бакалавриат')) return '2 бакалавриат';
  if(/^24Б\//i.test(s)||lab.startsWith('3 курс —')||lab.startsWith('3 бакалавриат')) return '3 бакалавриат';
  if(/^23Б\//i.test(s)||lab.startsWith('4 курс —')||lab.startsWith('4 бакалавриат')) return '4 бакалавриат';
  if(/^25М\//i.test(s)||/^24М\//i.test(s)||lab.startsWith('2 магистратура')) return '2 магистратура';
  try{
    if(typeof courseForGroupKey==='function'){
      const c=courseForGroupKey(key); if(TARGET_COURSES.has(c)) return c;
    }
  }catch(e){}
  return '';
}

// Убираем старые технические варианты из основного списка выбора только для тех курсов,
// которые выдаём студентам завтра. 1 курс НЕ трогаем.
Object.keys(GROUP_LABELS).forEach(key=>{
  if(targetCourseForOldKey(key)) delete GROUP_LABELS[key];
});
ALIASES.forEach((meta,alias)=>{ GROUP_LABELS[alias]=alias; });
if(typeof buildGroupItems==='function') buildGroupItems();

function parseBachelorCodes(group){
  const matches=S(group).match(/(?:25|24|23)Б\/[ИПФЭ][^,;\s]*/gi)||[];
  return matches.map(code=>parseBachelorRaw(code,code)).filter(Boolean);
}
function parseMasterCodes(group){
  const s=S(group);
  const out=[];
  const modern=s.match(/25М\/(?:Эр|[ИЛЯПЭ])[^;,]*/gi)||[];
  modern.forEach(code=>{ const m=parseMasterRaw(code,code); if(m) out.push(m); });
  const legacy=s.match(/24М\/К-227\([илпэя]\)[^;,]*/gi)||[];
  legacy.forEach(code=>{ const m=parseMasterRaw(code,code); if(m) out.push(m); });
  return out;
}
function profileSetFromText(v,master){
  const n=N(v), set=new Set();
  if(n.includes('истор')) set.add('и');
  if(master){
    if(n.includes('литературовед')||n.includes('литературы')) set.add('л');
    if(n.includes('лингвист')||n.includes('языки')) set.add('я');
  }else if(n.includes('филолог')) set.add('ф');
  if(n.includes('полит')) set.add('п');
  if(n.includes('эконом')) set.add('э');
  return set;
}
function languagesFromText(v){
  const n=N(v), set=new Set();
  langRules.forEach(([stem,name])=>{ if(n.includes(stem)) set.add(name); });
  return set;
}
function isWholeCourse(group){
  const g=N(group);
  return ['весь поток','весь курс','все студенты','все направления','весь 2 курс','весь 3 курс','весь 4 курс','весь поток 2 магистратуры'].some(x=>g.includes(x));
}
function isBadUnmappedLanguageGrid(r,meta){
  if(meta.language!=='арабский') return false;
  const g=N(r.group), d=N(r.discipline), e=N(r.extra);
  const isOva=d.includes('основной восточный язык')||d.startsWith('овя')||d==='арабский язык';
  if(!isOva || !e.includes('араб') && !d.includes('араб')) return false;
  if(g.startsWith('овя 2 курс — кафедральная сетка преподавателя:')) return true;
  if(g.startsWith('овя 3 курс — языковая подгруппа преподавателя:')) return true;
  if(/^202_[1-4]\/3$/.test(g)) return true;
  if(N(r.teacher)==='уточняется') return true;
  return false;
}
function rowMatchesAlias(r,meta){
  if(!r || S(r.course).trim()!==meta.course) return false;
  const disc=N(r.discipline);
  if(disc==='западный язык'||disc.includes('русский язык как иностранный')) return false;
  if(isBadUnmappedLanguageGrid(r,meta)) return false;

  const isMaster=meta.course==='2 магистратура';
  const coded=isMaster?parseMasterCodes(r.group):parseBachelorCodes(r.group);
  if(coded.length){
    const exact=coded.some(c=>c.course===meta.course && c.profile===meta.profile && c.language===meta.language && (!meta.suffix||!c.suffix||c.suffix===meta.suffix));
    return exact;
  }

  if(isWholeCourse(r.group)) return true;

  const pset=profileSetFromText(S(r.group)+' '+S(r.direction),isMaster);
  const lset=languagesFromText(S(r.group)+' '+S(r.extra)+' '+S(r.discipline));
  if(pset.size && !pset.has(meta.profile)) return false;
  if(lset.size && !lset.has(meta.language)) return false;

  const g=N(r.group);
  if(!g||['-','nan','не знаю'].includes(g)) return false;

  // Общие занятия направления или языка.
  if(pset.has(meta.profile)) return true;
  if(lset.has(meta.language) && /\b(все|весь|поток|групп|арабист|китаист|японист|кореист)/.test(g)) return true;
  return false;
}

const oldFullGroupMatches=typeof fullGroupMatches==='function'?fullGroupMatches:null;
if(oldFullGroupMatches){
  fullGroupMatches=function(key){
    const meta=ALIASES.get(key);
    if(!meta) return oldFullGroupMatches(key);
    const rows=PUBLIC_DATA.filter(r=>rowMatchesAlias(r,meta));
    const seen=new Set();
    return rows.filter(r=>{
      const k=[r.day,r.time,r.discipline,r.group,r.teacher,r.room_hint].join('|');
      if(seen.has(k)) return false; seen.add(k); return true;
    });
  };
}

const oldGroupMeta=typeof groupMeta==='function'?groupMeta:null;
if(oldGroupMeta){
  groupMeta=function(key){
    const m=ALIASES.get(key);
    if(!m) return oldGroupMeta(key);
    const direction=({'и':'История','п':'Политология','ф':'Филология','э':'Экономика','л':'Литературы','я':'Языки'})[m.profile]||'';
    return {course:m.course,direction,language:m.language};
  };
}
const oldCourseForGroupKey=typeof courseForGroupKey==='function'?courseForGroupKey:null;
if(oldCourseForGroupKey){
  courseForGroupKey=function(key){ const m=ALIASES.get(key); return m?m.course:oldCourseForGroupKey(key); };
}

// Убираем технические пояснения из статуса при выборе нового простого обозначения.
const oldShowSchedule=typeof showSchedule==='function'?showSchedule:null;
if(oldShowSchedule){
  showSchedule=function(key){
    oldShowSchedule(key);
    if(!ALIASES.has(key)) return;
    const status=document.getElementById('status');
    const results=document.getElementById('results');
    if(status){
      const count=results?results.querySelectorAll('.card').length:0;
      status.innerHTML='<b>'+key+'</b> — занятий: '+count;
    }
  };
}

function compactCode(code){
  const raw=S(code).trim();
  const b=parseBachelorRaw(raw,raw);
  if(b){
    let a=aliasName(b.course,b.profile,b.language,b.suffix);
    // Если для китайской группы есть только общий вход — не навязываем номер.
    if(!ALIASES.has(a)) a=aliasName(b.course,b.profile,b.language,'');
    return a;
  }
  const m=parseMasterRaw(raw,raw);
  if(m) return aliasName('2 магистратура',m.profile,m.language,'');
  return '';
}
function compactText(v){
  let s=S(v);
  s=s.replace(/(?:25|24|23)Б\/[ИПФЭ][^,;\s]*/gi,c=>compactCode(c)||c);
  s=s.replace(/25М\/(?:Эр|[ИЛЯПЭ])[^,;\s]*/gi,c=>compactCode(c)||c);
  s=s.replace(/2 курс, историки, тайско-кхмерская группа/gi,'2и_тайско-кхмерский');
  s=s.replace(/2 курс, экономисты, тайско-кхмерская группа/gi,'2э_тайско-кхмерский');
  s=s.replace(/2 курс, политологи, китайский, группа 2[^;,]*/gi,'2п_китайский_2');
  return s;
}
function scrub(root){
  if(!root||!root.querySelectorAll) return;
  root.querySelectorAll('.group-code,.group-link,.suggest-item,.browse-name').forEach(el=>{
    const t=compactText(el.textContent);
    if(t&&t!==el.textContent) el.textContent=t;
  });
}
scrub(document);
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1) scrub(n)}))).observe(document.documentElement,{childList:true,subtree:true});

// Простая инструкция прямо в студенческом режиме.
const help=document.getElementById('modeHelp');
const q=document.getElementById('q');
function studentHint(){
  if(help) help.textContent='Студентам 2–4 курса: ищите себя по схеме 3ф_японский, 4и_вьетнамский. Магистратура: м2э_арабский, м2и_китайский.';
  if(q) q.placeholder='Например: 3ф_японский или м2э_арабский';
}
const personal=document.getElementById('modeStudentPersonal');
const groups=document.getElementById('modeStudent');
if(personal) personal.addEventListener('click',studentHint);
if(groups) groups.addEventListener('click',studentHint);

})();
