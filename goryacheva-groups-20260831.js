(function(){
if(typeof DATA==='undefined') return;
const n=v=>(v==null?'':String(v)).toLowerCase().replace(/ё/g,'е').trim();
const a={'Вт|9:00':'202_1/3','Ср|9:00':'202_1/3','Вт|10:40':'202_2/3','Ср|10:40':'202_2/3','Вт|13:00':'202_3/3','Чт|10:40':'202_3/3','Ср|13:00':'202_4/3','Чт|13:00':'202_4/3'};
DATA.forEach(r=>{if(r&&n(r.teacher)==='горячева николь андреевна'&&r.course==='2 бакалавриат'&&n(r.discipline).includes('основной восточный язык')&&n(r.extra).includes('араб')){const g=a[r.day+'|'+r.time];if(g){r.group=g;r.direction='ОВЯ (арабский, отдельная языковая группа)';}}});
if(typeof PUBLIC_DATA!=='undefined'){const x=typeof isServiceRow==='function'?DATA.filter(r=>!isServiceRow(r)):DATA.slice();PUBLIC_DATA.splice(0,PUBLIC_DATA.length,...x);}
if(typeof GROUP_LABELS!=='undefined'){['202_1/3','202_2/3','202_3/3','202_4/3'].forEach(g=>GROUP_LABELS[g]='2 курс — арабский — группа '+g);try{if(typeof buildGroupItems==='function')buildGroupItems();}catch(e){}}
})();
