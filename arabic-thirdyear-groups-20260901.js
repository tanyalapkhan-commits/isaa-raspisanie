(function(){
'use strict';
if(typeof GROUP_LABELS==='undefined') return;
const S=v=>(v==null?'':String(v));
const N=v=>S(v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const academic={
  '3и_арабский':{profile:'История',code:'24Б/И302-арабский/5'},
  '3п_арабский':{profile:'Политология',code:'24Б/П302-арабский/5'},
  '3ф_арабский':{profile:'Филология',code:'24Б/Ф302-арабский/5'},
  '3э_арабский':{profile:'Экономика',code:''}
};
const languageGroups=['311','321','331','341'];

Object.keys(academic).forEach(k=>{GROUP_LABELS[k]=k;});
languageGroups.forEach(k=>{GROUP_LABELS[k]='3 курс · арабский · языковая группа '+k;});

const prevCourse=typeof courseForGroupKey==='function'?courseForGroupKey:null;
if(prevCourse){
  courseForGroupKey=function(key){
    if(academic[key]||languageGroups.includes(String(key))) return '3 бакалавриат';
    return prevCourse(key);
  };
}
const prevMeta=typeof groupMeta==='function'?groupMeta:null;
if(prevMeta){
  groupMeta=function(key){
    if(academic[key]) return {course:'3 бакалавриат',profile:academic[key].profile,language:'арабский'};
    if(languageGroups.includes(String(key))) return {course:'3 бакалавриат',profile:'ОВЯ',language:'арабский'};
    return prevMeta(key);
  };
}

const isArabic=r=>r&&(N(r.extra).includes('араб')||N(r.discipline).includes('араб')||N(r.group).includes('араб'));
const isOva=r=>r&&(N(r.discipline).includes('основной восточный язык')||N(r.discipline)==='овя'||N(r.discipline)==='арабский язык');
const isGenericThirdOva=r=>r&&r.course==='3 бакалавриат'&&isArabic(r)&&isOva(r)&&(N(r.group).includes('языковая подгруппа преподавателя')||N(r.group).includes('кафедральная языковая подгруппа')||N(r.group).includes('распределение 311/321/331/341'));
const prevMatches=typeof fullGroupMatches==='function'?fullGroupMatches:null;
if(prevMatches){
  fullGroupMatches=function(key){
    if(languageGroups.includes(String(key))){
      // Подгруппы 311/321/331/341 подтверждены, но их привязка к конкретным слотам
      // в источниках 2026/27 не задана. Не показываем студенту всю кафедральную сетку как его личную.
      return [{group:String(key),course:'3 бакалавриат',direction:'ОВЯ',day:'уточняется',time:'уточняется',discipline:'Основной восточный язык (арабский)',extra:'языковая группа '+String(key),teacher:'уточняется',room_hint:'',quality:''}];
    }
    if(!academic[key]) return prevMatches(key)||[];
    let out=(prevMatches(key)||[]).filter(r=>!isGenericThirdOva(r));
    const meta=academic[key];
    const seen=new Set(out);
    if(typeof PUBLIC_DATA!=='undefined'){
      PUBLIC_DATA.forEach(r=>{
        if(!r||r.course!=='3 бакалавриат') return;
        const g=N(r.group), dir=N(r.direction);
        let match=false;
        if(meta.code&&g.includes(N(meta.code))) match=true;
        if(key==='3э_арабский'&&isArabic(r)&&(g.includes('арабская (экономисты)')||dir.includes('эконом'))) match=true;
        if(match&&!isGenericThirdOva(r)&&!seen.has(r)){out.push(r);seen.add(r);}
      });
    }
    return out;
  };
}

try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
})();
