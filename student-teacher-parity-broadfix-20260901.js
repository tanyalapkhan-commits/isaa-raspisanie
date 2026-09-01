(function(){
'use strict';
if(typeof PUBLIC_DATA==='undefined' || typeof fullGroupMatches!=='function') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
function dirs(v){
  const s=S(v),n=N(v),out=new Set();
  if(n.includes('истор')) out.add('история');
  if(n.includes('полит')) out.add('политология');
  if(n.includes('филолог')) out.add('филология');
  if(n.includes('эконом')) out.add('экономика');
  const m=s.match(/(?:^|[\s,;])\d{2}Б\/([ИПФЭ])/i);
  if(m) out.add(({И:'история',П:'политология',Ф:'филология',Э:'экономика'})[m[1].toUpperCase()]);
  return out;
}
function langs(v){
  const n=N(v),out=new Set();
  const a=[['африкаанс','африкаанс'],['амхар','амхарский'],['араб','арабский'],['армян','армянский'],['вьет','вьетнамский'],['иврит','иврит'],['китай','китайский'],['корей','корейский'],['персид','персидский'],['пушту','пушту'],['суахили','суахили'],['турец','турецкий'],['хауса','хауса'],['хинди','хинди'],['урду','урду'],['филип','филиппинский'],['япон','японский'],['индонез','индонезийский']];
  a.forEach(([stem,name])=>{if(n.includes(stem))out.add(name);});
  return out;
}
function langOK(sel,set){
  if(!sel||!set.size)return true;
  const s=N(sel);
  if(set.has(s))return true;
  if(s==='хинди-урду')return set.has('хинди')||set.has('урду');
  return false;
}
const previous=fullGroupMatches;
fullGroupMatches=function(key){
  const base=previous(key)||[];
  let meta={}; try{meta=typeof groupMeta==='function'?(groupMeta(key)||{}):{};}catch(e){}
  const course=S(meta.course).trim();
  const sd=[...dirs(meta.direction)][0]||N(meta.direction);
  const sl=[...langs(meta.language)][0]||N(meta.language);
  if(!course||!sd) return base;
  const extra=PUBLIC_DATA.filter(r=>{
    if(!r||S(r.course).trim()!==course)return false;
    const g=N(r.group); if(!g)return false;
    const broad=['все','весь','поток','групп','историк','политолог','филолог','экономист','арабист','китаист','японист','кореист'].some(x=>g.includes(x));
    if(!broad)return false;
    const rd=dirs(S(r.group)+' '+S(r.direction));
    const rl=langs(S(r.group)+' '+S(r.extra));
    if(rd.size&&!rd.has(sd))return false;
    if(rl.size&&!langOK(sl,rl))return false;
    return rd.has(sd) || ['весь поток','весь курс','все студенты','все направления'].some(x=>g.includes(x));
  });
  const seen=new Set();
  return base.concat(extra).filter(r=>{
    const k=[r.day,r.time,r.course||'',N(r.discipline),N(r.group),N(r.teacher),N(r.room_hint),N(r.extra)].join('|');
    if(seen.has(k))return false; seen.add(k); return true;
  });
};
fullGroupMatches.__parity14BroadFix=true;
})();
