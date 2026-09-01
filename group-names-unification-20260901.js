// Унификация отображения групп ИСАА 2026-2027
// Без изменения дисциплин, времени, аудиторий и преподавателей.
(function(){
  const map = {
    '26Б/И102-арабский/1':'1 курс — история — арабский',
    '26Б/П124-японский/1':'1 курс — политика — японский',
    '26Б/Ф124-японский/1':'1 курс — филология — японский',
    '26Б/Э124-японский/1':'1 курс — экономика — японский',
    '25Б/И224-японский/3':'2 курс — история — японский',
    '25Б/П224-японский/3':'2 курс — политика — японский',
    '25Б/Ф224-японский/3':'2 курс — филология — японский',
    '25Б/Э224-японский/3':'2 курс — экономика — японский',
    '24Б/И324-японский/5':'3 курс — история — японский',
    '24Б/П324-японский/5':'3 курс — политика — японский',
    '24Б/Ф324-японский/5':'3 курс — филология — японский',
    '24Б/Э324-японский/5':'3 курс — экономика — японский'
  };

  function replaceText(root){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      let t=n.nodeValue;
      Object.keys(map).forEach(oldName=>{
        if(t.includes(oldName)) t=t.split(oldName).join(map[oldName]);
      });
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
