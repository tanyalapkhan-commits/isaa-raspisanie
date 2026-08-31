(function(){
  'use strict';

  // Служебные пояснения, черновые статусы и внутренние комментарии
  // не должны отображаться студентам/преподавателям в опубликованном расписании.
  const style=document.createElement('style');
  style.textContent=[
    '.quality-tag{display:none!important}',
    '.code-warn{display:none!important}',
    '.day-problem-note{display:none!important}'
  ].join('\n');
  document.head.appendChild(style);

  const technicalPhrases=[
    'подтверждена преподавательская сетка',
    'в актуальной форме нет распределения',
    'не приписываются академической группе автоматически',
    'требует актуализации',
    'автоматическая замена',
    'точный код уточняется',
    'новый слот не назначен автоматически',
    'распределение студентов по языковым подгруппам',
    'в материалах 2026/27 не задано'
  ];

  function isTechnical(text){
    const t=(text||'').toLowerCase().replace(/ё/g,'е');
    return technicalPhrases.some(p=>t.includes(p));
  }

  function clean(root){
    if(!root || !root.querySelectorAll) return;
    root.querySelectorAll('.quality-tag,.code-warn,.day-problem-note').forEach(el=>el.remove());
    root.querySelectorAll('.conflict-warn,.joint-reading,.details div,.details p').forEach(el=>{
      if(isTechnical(el.textContent)) el.remove();
    });
  }

  clean(document);
  new MutationObserver(ms=>{
    ms.forEach(m=>m.addedNodes.forEach(n=>{
      if(n.nodeType===1) clean(n);
    }));
  }).observe(document.documentElement,{childList:true,subtree:true});
})();
