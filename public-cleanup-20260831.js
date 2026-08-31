(function(){
  'use strict';

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
    'в материалах 2026/27 не задано',
    'внутренний регламент',
    'не более 2 языковых пар',
    'для проверки преподавательской сетки',
    'академической группе больше не показывается вся кафедральная сетка',
    'кафедральная сетка как персональное расписание',
    'распределение студентов по языковым подгруппам 202_1/3–202_4/3',
    'распределение студентов по языковым подгруппам 202_1/3-202_4/3'
  ];

  function norm(text){
    return (text||'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
  }
  function isTechnical(text){
    const t=norm(text);
    return technicalPhrases.some(p=>t.includes(norm(p)));
  }

  function removeTechnicalBlocks(root){
    if(!root||!root.querySelectorAll) return;
    root.querySelectorAll('.quality-tag,.code-warn,.day-problem-note').forEach(el=>el.remove());

    const candidates=[...root.querySelectorAll('p,div,aside,section')];
    candidates.sort((a,b)=>b.querySelectorAll('*').length-a.querySelectorAll('*').length);
    candidates.reverse();
    candidates.forEach(el=>{
      if(!el.isConnected) return;
      if(el.id==='results'||el.id==='app'||el.tagName==='BODY') return;
      if(el.classList.contains('card')||el.querySelector('.card')) return;
      if(isTechnical(el.textContent)){
        const parent=el.parentElement;
        el.remove();
        if(parent && parent.children.length===0 && !parent.id) parent.remove();
      }
    });

    root.querySelectorAll('.conflict-warn,.joint-reading,.details div,.details p').forEach(el=>{
      if(isTechnical(el.textContent)) el.remove();
    });
  }

  removeTechnicalBlocks(document);
  new MutationObserver(ms=>{
    ms.forEach(m=>m.addedNodes.forEach(n=>{
      if(n.nodeType===1) removeTechnicalBlocks(n);
    }));
  }).observe(document.documentElement,{childList:true,subtree:true});
})();
