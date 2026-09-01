(function(){
'use strict';
if(typeof DATA==='undefined' || !Array.isArray(DATA) || typeof PUBLIC_DATA==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const readers=['Кириллина Светлана Алексеевна','Орлов Владимир Викторович','Жантиев Дмитрий Рустемович','Кобищанов Тарас Юрьевич'];
function isTarget(r){
  if(!r || S(r.course).trim()!=='2 бакалавриат' || S(r.day).trim()!=='Вт' || S(r.time).trim()!=='14:40') return false;
  const d=N(r.discipline);
  return d==='история арабских стран' || d.includes('история арабских стран');
}
DATA.forEach(r=>{
  if(!isTarget(r)) return;
  r.group='25Б/И202-арабский/3, 25Б/П202-арабский/3';
  r.direction='История + Политология';
  r.room_hint='228';
  r.extra='совместное чтение: С.А. Кириллина + В.В. Орлов + Д.Р. Жантиев + Т.Ю. Кобищанов; 2 ч/нед.; ОДИН курс';
  r.joint_readers=readers.filter(t=>N(t)!==N(r.teacher));
  r.quality='01.09.2026, правка №16: по прямому указанию аудитория Вт 14:40 окончательно изменена на 228. День, время, дисциплина, группы и состав совместного чтения не менялись. Ауд.228 проверена: в текущем рабочем своде во Вт 14:40 свободна.';
});
readers.forEach(t=>{
  const exists=DATA.some(r=>isTarget(r) && N(r.teacher)===N(t));
  if(exists) return;
  DATA.push({
    group:'25Б/И202-арабский/3, 25Б/П202-арабский/3',
    course:'2 бакалавриат',direction:'История + Политология',day:'Вт',time:'14:40',
    discipline:'История арабских стран',
    extra:'совместное чтение: С.А. Кириллина + В.В. Орлов + Д.Р. Жантиев + Т.Ю. Кобищанов; 2 ч/нед.; ОДИН курс',
    teacher:t,joint_readers:readers.filter(x=>N(x)!==N(t)),room_hint:'228',
    quality:'01.09.2026, правка №16: единый совместный курс Вт 14:40, ауд.228; преподаватели читают в одном слоте по распределению, это не четыре разные пары.'
  });
});
const rows=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();
PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
try{if(typeof showEmpty==='function')showEmpty();}catch(e){}
})();
