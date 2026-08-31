(function(){
'use strict';

const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е');
const course2=r=>S(r?.course).trim()==='2 бакалавриат';
const ova=r=>N(r?.discipline).trim().startsWith('основной восточный язык');
const geo=r=>N(r?.discipline).trim().startsWith('география');
const commonHist=r=>N(r?.discipline).includes('историко-философские теории');
const hebrew2=r=>course2(r) && /иврит|израил/.test(N([r.group,r.extra,r.discipline,r.quality].join(' ')));
const oldArabicAcademic=r=>course2(r)&&ova(r)&&/араб/.test(N([r.group,r.extra,r.direction].join(' ')))&&/25б\/[ипфэ]202/i.test(S(r.group));
const hasHist2=r=>course2(r) && (/25Б\/И/i.test(S(r.group)) || (!/25Б\/[ПФЭ]/i.test(S(r.group)) && (/историк/.test(N(r.group)) || /история/.test(N(r.direction)))));

// Применяем правку к основной базе. В спорных случаях новый слот НЕ придумываем.
for(let i=DATA.length-1;i>=0;i--){
  const r=DATA[i];
  if(!r) continue;

  // В актуальном списке студентов 2026/27 на 2 курсе группы иврита нет.
  if(hebrew2(r)){
    DATA.splice(i,1);
    continue;
  }

  // География 2 курса — остаток старой/предыдущесеместровой сетки; актуального
  // подтверждения на осень 2026/27 в рабочем пакете нет.
  if(course2(r)&&geo(r)){
    DATA.splice(i,1);
    continue;
  }

  // Старые строки, где арабский ОВЯ ошибочно приписан сразу академическим
  // И/П/Ф/Э-группам, удаляем. Остаётся кафедральная сетка языковых подгрупп.
  if(oldArabicAcademic(r)){
    DATA.splice(i,1);
    continue;
  }

  if(course2(r)&&/кафедральная сетка преподавателя/i.test(S(r.group))){
    r.group='2 курс — арабский — языковая подгруппа преподавателя '+(r.teacher||'');
    r.direction='Арабский ОВЯ — языковая подгруппа';
  }

  // Вт 13:00 — обязательный общий курс всех историков 2 курса.
  // Если другая совместная/языковая пара затрагивает хотя бы историков,
  // переносим ВСЮ эту запись в «уточняется», а не расщепляем одно занятие
  // и не выбираем преподавателю новый слот без подтверждения.
  if(course2(r)&&r.day==='Вт'&&r.time==='13:00'&&!commonHist(r)&&hasHist2(r)){
    r.day='уточняется';
    r.time='уточняется';
    r.room_hint='';
    r.quality='31.08.2026: прежний слот Вт 13:00 снят: у всех историков 2 курса в это время обязательные «Историко-философские теории». Новый слот не назначен автоматически, чтобы не создать конфликт преподавателю, другим группам или аудитории.';
  }
}

// Для академических арабских групп показываем честный статус без ложного времени:
// точного соответствия студент → языковая подгруппа в источниках нет.
[
 ['25Б/И202-арабский/3','История'],
 ['25Б/П202-арабский/3','Политология'],
 ['25Б/Ф202-арабский/3','Филология'],
 ['25Б/Э202-арабский/3','Экономика']
].forEach(([g,d])=>{
  if(!DATA.some(r=>course2(r)&&S(r.group).trim()===g&&ova(r))){
    DATA.push({group:g,course:'2 бакалавриат',direction:d,day:'уточняется',time:'уточняется',discipline:'Основной восточный язык (по изучаемому языку)',extra:'арабский; языковая подгруппа студента уточняется',teacher:null,room_hint:'',quality:'31.08.2026: преподавательская сетка ОВЯ известна, но распределение студентов по языковым подгруппам 202_1/3–202_4/3 в материалах 2026/27 не задано. Поэтому не показываем несколько ложных ОВЯ в один час.'});
  }
});

// PUBLIC_DATA был построен исходным файлом до загрузки этого hotfix.
// Синхронизируем его с уже исправленным DATA, сохраняя служебные блокировки скрытыми.
PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...DATA.filter(r=>!isServiceRow(r)));

// Перестраиваем индекс аудиторий, чтобы удалённые старые строки не создавали
// ложные предупреждения о конфликтах.
Object.keys(roomIndex).forEach(k=>delete roomIndex[k]);
PUBLIC_DATA.forEach(r=>{
  const room=singleRoom(r.room_hint);
  if(!room) return;
  const key=r.day+'|'+r.time+'|'+room;
  (roomIndex[key]||(roomIndex[key]=[])).push({teacher:r.teacher,group:r.group,discipline:r.discipline});
});

// ---- Публичные названия групп БЕЗ технических кодов ----
const profile=l=>({'И':'история','П':'политика','Ф':'филология','Э':'экономика'})[l]||'';
const course=y=>({'26':'1 курс','25':'2 курс','24':'3 курс','23':'4 курс'})[y]||'';
function language(s){
  const n=N(s);
  if(n.includes('япон')&&n.includes('корей')) return 'японско-корейский';
  if(n.includes('тайск')&&(n.includes('кхмер')||n.includes('малаз'))) return 'тайско-кхмерский';
  if(n.includes('вьет')&&n.includes('индонез')) return 'вьетнамско-индонезийский';
  if(n.includes('филип')&&n.includes('индонез')) return 'филиппинско-индонезийский';
  if(n.includes('индонез')&&n.includes('малай')) return 'индонезийско-малайский';
  if(n.includes('хинди')&&n.includes('урду')) return 'хинди-урду';
  const a=[['араб','арабский'],['армян','армянский'],['китай','китайский'],['персид','персидский'],['турец','турецкий'],['хауса','хауса'],['хинди','хинди'],['урду','урду'],['япон','японский'],['корей','корейский'],['африкаанс','африкаанс'],['иврит','иврит'],['пушту','пушту'],['дари','дари'],['суахили','суахили'],['вьет','вьетнамский'],['филип','филиппинский'],['индонез','индонезийский'],['малай','малайский'],['грузин','грузинский'],['амхар','амхарский'],['кхмер','кхмерский'],['тайск','тайский']];
  for(const [stem,name] of a) if(n.includes(stem)) return name;
  return '';
}
function humanCode(code){
  const s=S(code).trim();
  const sg=s.match(/^202_([1-4])\/3$/i);
  if(sg) return '2 курс — арабский — языковая подгруппа '+sg[1];
  const m=s.match(/^(2[3-6])Б\/([ИПФЭ])(.+)$/i);
  if(!m) return '';
  const c=course(m[1]),p=profile(m[2].toUpperCase()),l=language(m[3]);
  if(!c||!p||!l) return '';
  let suffix='';
  if(m[1]==='25'&&(m[2].toUpperCase()==='П'||m[2].toUpperCase()==='Э')&&l==='китайский'){
    if(/(?:^|[-_])2(?:[-_/]|$)/.test(m[3])) suffix=', группа 2';
    else if(/(?:^|[-_])1(?:[-_/]|$)/.test(m[3])) suffix=', группа 1';
  }
  return c+' — '+p+' — '+l+suffix;
}
function humanText(value){
  const s=S(value).trim();
  if(!s) return s;
  const parts=s.split(/\s*;\s*|\s*,\s*(?=2[3-6]Б\/)|\s*,\s*(?=202_[1-4]\/3)/).map(part=>{
    const h=humanCode(part);
    if(h) return h;
    return part.replace(/2[3-6]Б\/[ИПФЭ][^\s;,]+/g,c=>humanCode(c)||c);
  }).filter(Boolean);
  return [...new Set(parts)].join('; ');
}

Object.keys(GROUP_LABELS).forEach(key=>{
  const all=N(key+' '+GROUP_LABELS[key]);
  if(all.includes('2 бакалавриат')&&(all.includes('иврит')||all.includes('израил'))){ delete GROUP_LABELS[key]; return; }
  const h=humanCode(key);
  if(h){ GROUP_LABELS[key]=h; return; }
  GROUP_LABELS[key]=S(GROUP_LABELS[key])
    .replace(/\s*\((?:2[3-6]Б\/[^)]*|202_[1-4]\/3)\)\s*/g,'')
    .replace(/^([1-4]) бакалавриат\s*·\s*/,'$1 курс — ')
    .replace(/\s*·\s*/g,' — ')
    .replace(/Политология/g,'политика').replace(/История/g,'история').replace(/Филология/g,'филология').replace(/Экономика/g,'экономика').trim();
});
buildGroupItems();

// Скрываем старые предупреждения о кодах: дальше коды не являются публичным названием группы.
const st=document.createElement('style');
st.textContent='.code-warn{display:none!important}.group-code{font-family:inherit!important}';
document.head.appendChild(st);

function scrub(root){
  if(!root?.querySelectorAll) return;
  root.querySelectorAll('.group-code,.group-link,.conflict-warn,.suggest-item,.browse-name').forEach(el=>{
    const h=humanText(el.textContent);
    if(h&&h!==el.textContent) el.textContent=h;
  });
}
scrub(document);
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1) scrub(n)}))).observe(document.documentElement,{childList:true,subtree:true});

// Обновляем стартовые списки/счётчики после удаления старых групп.
try{ buildBrowseList(); showEmpty(); }catch(e){}
})();
