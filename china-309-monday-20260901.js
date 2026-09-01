(function(){
'use strict';
if(typeof DATA==='undefined'||typeof PUBLIC_DATA==='undefined')return;
const n=v=>String(v==null?'':v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const target=r=>r&&String(r.course).trim()==='3 бакалавриат'&&n(r.teacher)==='машкина ольга анатольевна'&&n(r.discipline).includes('основной восточный язык')&&n(r.group).includes('24б/и309-китайский/5')&&n(r.group).includes('24б/п309-китайский/5');
for(let i=DATA.length-1;i>=0;i--){const r=DATA[i];if(target(r)&&r.day==='Вт'&&r.time==='10:40')DATA.splice(i,1);}
let r=DATA.find(x=>target(x)&&(x.day==='уточняется'||x.time==='уточняется'));
if(!r)r=DATA.find(x=>target(x)&&x.day==='Пн'&&x.time==='13:00');
if(!r){r={group:'24Б/И309-китайский/5, 24Б/П309-китайский/5',course:'3 бакалавриат',direction:'История + Политология',discipline:'Основной восточный язык (по изучаемому языку)',extra:'китайский',teacher:'Машкина Ольга Анатольевна'};DATA.push(r);}
r.day='Пн';r.time='13:00';r.room_hint='317';r.quality='01.09.2026: ОВЯ И309+П309 перенесён на Пн 13:00 после снятия конфликта Вт 10:40 с подтверждённой «Историей изучаемой страны» А.С. Каимовой. Слот соответствует пожеланиям О.А. Машкиной: Пн/Ср/Пт, 10:40/13:00/14:40, минимум первых пар, предпочтительно ауд.317; четверг не используется из-за возможной военной кафедры; среда после 14:40 закрыта под МФК.';
const rows=typeof isServiceRow==='function'?DATA.filter(x=>!isServiceRow(x)):DATA.slice();PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...rows);
try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}
try{if(typeof buildBrowseList==='function')buildBrowseList();}catch(e){}
})();
