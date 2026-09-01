(function(){
'use strict';
if(typeof DATA==='undefined' || !Array.isArray(DATA) || typeof PUBLIC_DATA==='undefined' || typeof GROUP_LABELS==='undefined') return;

const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const uniq=a=>[...new Set(a.filter(Boolean))];
const splitTeachers=v=>S(v).split(/[;,]/).map(x=>x.trim()).filter(x=>/\s/.test(x));

const LANGS=[
  ['японско-корей','японско-корейский'],['япон.-корей','японско-корейский'],
  ['тайско-кхмер','тайско-кхмерский'],['филиппинск.-индонез','филиппинско-индонезийский'],['филип.-индонез','филиппинско-индонезийский'],
  ['индонезийск.-малай','индонезийско-малайский'],['индонез.-малай','индонезийско-малайский'],
  ['хинди-урду','хинди-урду'],['африкаанс','африкаанс'],['амхар','амхарский'],['араб','арабский'],
  ['армян','армянский'],['вьет','вьетнамский'],['грузин','грузинский'],['иврит','иврит'],['китай','китайский'],
  ['корей','корейский'],['кхмер','кхмерский'],['малай','малайский'],['персид','персидский'],['пушту','пушту'],
  ['суахили','суахили'],['тайск','тайский'],['турец','турецкий'],['хауса','хауса'],['хинди','хинди'],
  ['урду','урду'],['филип','филиппинский'],['япон','японский'],['индонез','индонезийский']
];
function dirSet(v){
  const raw=S(v), n=N(v), out=new Set();
  if(n.includes('истор')) out.add('история');
  if(n.includes('полит')) out.add('политология');
  if(n.includes('филолог')) out.add('филология');
  if(n.includes('эконом')) out.add('экономика');
  const code=raw.match(/(?:^|[\s,;])(\d{2})Б\/([ИПФЭ])/i);
  if(code){ const m={И:'история',П:'политология',Ф:'филология',Э:'экономика'}; out.add(m[code[2].toUpperCase()]); }
  return out;
}
function langSet(v){
  const n=N(v), out=new Set();
  for(const [stem,name] of LANGS) if(n.includes(stem)) out.add(name);
  return out;
}
function langCompatible(selected, rowLangs){
  if(!selected || !rowLangs.size) return true;
  if(rowLangs.has(selected)) return true;
  const compat={
    'хинди-урду':['хинди','урду'],
    'филиппинско-индонезийский':['филиппинский','индонезийский'],
    'индонезийско-малайский':['индонезийский','малайский'],
    'тайско-кхмерский':['тайский','кхмерский']
  };
  return (compat[selected]||[]).some(x=>rowLangs.has(x));
}
function simpleCourse(v){
  const n=N(v);
  for(const c of ['1 бакалавриат','2 бакалавриат','3 бакалавриат','4 бакалавриат','1 магистратура','2 магистратура']) if(n.includes(c)) return c;
  return '';
}
function currentMeta(key){
  let m={course:'',direction:'',language:''};
  try{ if(typeof groupMeta==='function') m=groupMeta(key)||m; }catch(e){}
  const label=S(GROUP_LABELS[key]);
  const alias=S(key).match(/^(\d)([ипфэ])_(.+?)(?:_[12])?$/i);
  if(alias){
    m.course=m.course||alias[1]+' бакалавриат';
    m.direction=m.direction||({и:'История',п:'Политология',ф:'Филология',э:'Экономика'})[alias[2].toLowerCase()]||'';
    m.language=m.language||alias[3];
  }
  if(!m.course) m.course=simpleCourse(label);
  if(!m.direction){ const d=[...dirSet(label+' '+key)]; if(d.length===1) m.direction=d[0]; }
  if(!m.language){ const l=[...langSet(label+' '+key)]; if(l.length===1) m.language=l[0]; }
  return m;
}
function isUnmappedLanguageGrid(r){
  const g=N(r.group), d=N(r.discipline);
  if(g.startsWith('овя 2 курс — кафедральная сетка преподавателя:') || g.startsWith('овя 3 курс — языковая подгруппа преподавателя:')) return true;
  if(/^202_[1-4]\/3$/.test(g)) return true;
  if((d.includes('основной восточный язык')||d.startsWith('овя')) && N(r.teacher)==='уточняется') return true;
  return false;
}
function isSeparateWestern(r){
  const d=N(r.discipline);
  return d==='западный язык' || d.includes('первый западный язык') || d.includes('русский язык как иностранный');
}
function wholeCourseMarker(g){
  const n=N(g);
  return ['весь поток','весь курс','все студенты','все направления','весь 1-й курс','весь 2-й курс','весь 3-й курс','весь 4-й курс'].some(x=>n.includes(x));
}
function genericProfileCode(g){
  return /(?:^|[\s,;])\d{2}б\/[ипфэ]\s*$/i.test(N(g));
}
function hasConcreteAcademicCode(g){
  return /(?:22|23|24|25|26)\s*б\s*[\/\\][ипфэ]/i.test(S(g));
}
function sameCourse(r,meta){
  if(!meta.course) return false;
  const rc=S(r.course).trim();
  return rc===meta.course;
}
function parityMatch(r,key,meta){
  if(!r || !sameCourse(r,meta)) return false;
  try{ if(typeof isServiceRow==='function' && isServiceRow(r)) return false; }catch(e){}
  const g=N(r.group), code=N(key);
  if(!g || ['-','nan','не знаю'].includes(g)) return false;
  if(code && (g===code || g.includes(code))) return true;
  if(isSeparateWestern(r) || isUnmappedLanguageGrid(r)) return false;

  const selectedDir=[...dirSet(meta.direction)][0] || N(meta.direction);
  const selectedLang=[...langSet(meta.language)][0] || N(meta.language);
  const rowDirs=dirSet(S(r.group)+' '+S(r.direction));
  const rowLangs=langSet(S(r.group)+' '+S(r.extra));
  const concrete=hasConcreteAcademicCode(r.group);

  if(rowDirs.size && selectedDir && !rowDirs.has(selectedDir)) return false;
  if(rowLangs.size && selectedLang && !langCompatible(selectedLang,rowLangs)) return false;

  if(wholeCourseMarker(r.group)) return true;
  const broad=/\b(все|весь|поток|групп|историк|политолог|филолог|экономист|арабист|китаист|японист|кореист)\b/i.test(S(r.group));
  if(selectedDir && rowDirs.has(selectedDir) && broad) return true;
  if(selectedDir && selectedLang && rowDirs.has(selectedDir) && rowLangs.size && langCompatible(selectedLang,rowLangs)) return true;
  if(selectedLang && rowLangs.size && langCompatible(selectedLang,rowLangs) && broad && (!rowDirs.size || rowDirs.has(selectedDir))) return true;

  if(concrete && rowDirs.size && rowLangs.size && rowDirs.has(selectedDir) && langCompatible(selectedLang,rowLangs)) return true;
  if(genericProfileCode(r.group) && rowDirs.has(selectedDir)) return true;
  return false;
}

try{
  if(typeof fullGroupMatches==='function' && !fullGroupMatches.__parity14){
    const previous=fullGroupMatches;
    const wrapped=function(key){
      const base=previous(key)||[];
      const meta=currentMeta(key);
      const extra=PUBLIC_DATA.filter(r=>parityMatch(r,key,meta));
      const seen=new Set();
      return base.concat(extra).filter(r=>{
        const k=[r.day,r.time,r.course||'',N(r.discipline),N(r.group),N(r.teacher),N(r.room_hint),N(r.extra)].join('|');
        if(seen.has(k)) return false; seen.add(k); return true;
      });
    };
    wrapped.__parity14=true;
    fullGroupMatches=wrapped;
  }
}catch(e){}

function collective(r){
  const x=N(S(r.extra)+' '+S(r.quality));
  return x.includes('совместное чтение') || x.includes('по отдельным недел') || x.includes('последовательное чтение') ||
         x.includes('единый курс') || x.includes('один общий слот') || x.includes('лекторы читают') || x.includes('преподаватели читают');
}

try{
  const snapshot=DATA.slice();
  snapshot.forEach(r=>{
    if(!r || !collective(r)) return;
    let readers=[];
    readers.push(...splitTeachers(r.teacher));
    if(r.teacher && !readers.length) readers.push(S(r.teacher).trim());
    if(Array.isArray(r.joint_readers)) readers.push(...r.joint_readers);
    if(Array.isArray(r.teachers)) readers.push(...r.teachers);
    readers=uniq(readers.map(x=>S(x).trim()));
    if(readers.length<2) return;
    readers.forEach(t=>{
      const exists=DATA.some(x=>x && N(x.teacher)===N(t) && N(x.group)===N(r.group) && N(x.discipline)===N(r.discipline) && S(x.day)===S(r.day) && S(x.time)===S(r.time) && N(x.room_hint)===N(r.room_hint));
      if(!exists) DATA.push({...r,teacher:t,joint_readers:readers.filter(x=>N(x)!==N(t))});
    });
    DATA.forEach(x=>{
      if(!x || N(x.group)!==N(r.group) || N(x.discipline)!==N(r.discipline) || S(x.day)!==S(r.day) || S(x.time)!==S(r.time) || N(x.room_hint)!==N(r.room_hint)) return;
      if(readers.some(t=>N(t)===N(x.teacher))) x.joint_readers=readers.filter(t=>N(t)!==N(x.teacher));
    });
  });
}catch(e){}

try{
  const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
  PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
}catch(e){}

try{
  if(typeof card==='function' && !card.__parity14){
    const previousCard=card;
    const wrapped=function(r){
      if(!r || !collective(r)) return previousCard(r);
      let readers=[];
      if(Array.isArray(r.teachers)) readers.push(...r.teachers);
      readers.push(...splitTeachers(r.teacher));
      if(r.teacher && !splitTeachers(r.teacher).length) readers.push(r.teacher);
      if(Array.isArray(r.joint_readers)) readers.push(...r.joint_readers);
      try{ if(typeof getJointReaders==='function') readers.push(...(getJointReaders(r)||[])); }catch(e){}
      readers=uniq(readers.map(x=>S(x).trim()));
      let extra=S(r.extra);
      const ex=N(extra);
      if(!ex.includes('совместное чтение') && (ex.includes('по отдельным недел')||ex.includes('последовательное чтение'))){
        extra += '; коллективный курс — преподаватели читают по отдельным неделям';
      } else if(!ex.includes('совместное чтение') && readers.length>1){
        extra += '; совместное чтение';
      }
      return previousCard({...r,extra,teachers:readers,joint_readers:readers.filter(t=>N(t)!==N(r.teacher))});
    };
    wrapped.__parity14=true;
    card=wrapped;
  }
}catch(e){}

try{
  const dirName={и:'история',п:'политология',ф:'филология',э:'экономика'};
  Object.keys(GROUP_LABELS).forEach(k=>{
    const m=k.match(/^(\d)([ипфэ])_(.+?)(?:_([12]))?$/i);
    if(!m) return;
    const course=m[1]+' курс';
    const d=dirName[m[2].toLowerCase()]||m[2];
    const lang=m[3].replace(/_/g,' ');
    GROUP_LABELS[k]=course+' — '+d+' — '+lang+(m[4]?' — группа '+m[4]:'');
  });
  if(typeof buildGroupItems==='function') buildGroupItems();
  if(typeof buildBrowseList==='function') buildBrowseList();
}catch(e){}

try{
  if(typeof showSchedule==='function' && !showSchedule.__parity14){
    const previous=showSchedule;
    const wrapped=function(key){
      previous(key);
      if(typeof MODE!=='undefined' && MODE==='student'){
        const st=document.getElementById('status');
        if(st) st.innerHTML += '<br><span style="font-size:15px;color:var(--muted)"><b>Синхронизация:</b> студенческое расписание берётся из той же актуальной сетки занятий, что и преподавательское. Совместные и последовательные курсы показываются одной карточкой со всеми преподавателями.</span>';
      }
    };
    wrapped.__parity14=true;
    showSchedule=wrapped;
  }
}catch(e){}

})();
