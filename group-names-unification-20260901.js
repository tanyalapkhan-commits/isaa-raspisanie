// Унификация отображения групп ИСАА 2026-2027
// ТОЛЬКО названия групп. Не меняет дисциплины, время, аудитории, преподавателей.
(function(){
  const profile={И:'история',П:'политика',Ф:'филология',Э:'экономика'};
  const magProfile={И:'история',Л:'филология',П:'политология',Э:'экономика',Я:'японоведение'};
  const course={'1':'1 курс','3':'2 курс','5':'3 курс','7':'4 курс'};

  function autoName(value){
    let m=value.match(/^(\d+)Б\/([ИПФЭ])(\d+)-(.+)\/(1|3|5|7)$/);
    if(m){
      return (course[m[5]]||m[5])+' — '+profile[m[2]]+' — '+m[4].trim();
    }
    m=value.match(/^(\d+)М\/([ИЛПЭЯ])\s*\((.+)\)\/(\d+)$/);
    if(m){
      return 'магистратура — '+magProfile[m[2]]+' — '+m[3].trim();
    }
    return value;
  }

  function replaceText(root){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(n){
      const old=n.nodeValue;
      const updated=old.replace(/\b\d+[БМ]\/[^,;\n]+?\/\d+\b/g,function(x){
        return autoName(x);
      });
      if(updated!==old) n.nodeValue=updated;
    });
  }

  function run(){
    replaceText(document.body);
    window.dispatchEvent(new CustomEvent('groupNamesUpdated'));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run);
  else run();
})();
