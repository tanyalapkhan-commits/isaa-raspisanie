// Унификация отображения групп ИСАА 2026-2027
// ТОЛЬКО названия групп. Не меняет дисциплины, время, аудитории, преподавателей.
(function(){
  const profile={И:'история',П:'политика',Ф:'филология',Э:'экономика'};
  const magProfile={И:'история',Л:'филология',П:'политология',Э:'экономика',Я:'японоведение'};
  const map={
    '26Б/И102-арабский/1':'1 курс — история — арабский',
    '26Б/П124-японский/1':'1 курс — политика — японский',
    '26Б/Ф124-японский/1':'1 курс — филология — японский',
    '26Б/Э124-японский/1':'1 курс — экономика — японский'
  };
  const course={'1':'1 курс','3':'2 курс','5':'3 курс','7':'4 курс'};

  function autoName(value){
    if(map[value]) return map[value];
    let m=value.match(/^(\d+)Б\/([ИПФЭ])(\d+)-(.+)\/(\d)$/);
    if(m){
      return (course[m[5]]||m[5])+' — '+profile[m[2]]+' — '+m[4];
    }
    m=value.match(/^(\d+)М\/([ИЛПЭЯ])\s*\((.+)\)\/(\d)$/);
    if(m){
      return 'магистратура — '+magProfile[m[2]]+' — '+m[3];
    }
    return value;
  }

  function replaceText(root){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      let t=n.nodeValue;
      Object.keys(map).forEach(oldName=>{
        if(t.includes(oldName)) t=t.split(oldName).join(map[oldName]);
      });
      const re=/\b\d+[БМ]\/[^,;\n]+?\/\d\b/g;
      t=t.replace(re,function(x){return autoName(x);});
      if(t!==n.nodeValue) n.nodeValue=t;
    });
  }

  function run(){
    replaceText(document.body);
    window.dispatchEvent(new CustomEvent('groupNamesUpdated'));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run);
  else run();
})();
