/* Безопасная замена только отображения названий групп по справочнику. Расписание не изменяет. */
(function(){
function convert(text){
 const course={"1":"1 курс","3":"2 курс","5":"3 курс","7":"4 курс"};
 const prof={"И":"история","П":"политика","Ф":"филология","Э":"экономика"};
 const mag={"И":"история","Л":"филология","П":"политология","Э":"экономика","Я":"японоведение"};
 return text.replace(/\b(\d+)Б\/([ИПФЭ])(\d+)-([^,;\n/]+)\/(1|3|5|7)\b/g,function(_,year,dir,num,lang,c){return (course[c]||c)+' — '+prof[dir]+' — '+lang.trim();})
 .replace(/\b(\d+)М\/([ИЛПЭЯ])\s*\(([^)]+)\)\/(\d+)\b/g,function(_,year,dir,lang){return 'магистратура — '+mag[dir]+' — '+lang.trim();});
}
function run(){
 document.querySelectorAll('*').forEach(function(el){
  el.childNodes.forEach(function(n){
   if(n.nodeType===3){let x=convert(n.nodeValue); if(x!==n.nodeValue)n.nodeValue=x;}
  });
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();