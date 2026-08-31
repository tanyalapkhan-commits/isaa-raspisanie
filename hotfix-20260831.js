(function(){
  'use strict';

  function txt(v){ return (v == null ? '' : String(v)); }
  function low(v){ return txt(v).toLowerCase().replace(/ё/g,'е'); }
  function isCourse2(r){ return txt(r && r.course).trim() === '2 бакалавриат'; }
  function isOva(r){ return low(txt(r && r.discipline).trim()).indexOf('основной восточный язык') === 0; }
  function isGeo(r){ return low(txt(r && r.discipline).trim()).indexOf('география') === 0; }

  function isHebrew2(r){
    if(!isCourse2(r)) return false;
    var hay = low([r.group,r.extra,r.discipline,r.quality].join(' '));
    return hay.indexOf('иврит') >= 0 || hay.indexOf('израил') >= 0;
  }

  function isLegacyArabicAcademicOva(r){
    if(!isCourse2(r) || !isOva(r)) return false;
    var hay = low([r.group,r.extra,r.direction].join(' '));
    if(hay.indexOf('араб') < 0) return false;
    return /25б\/[ипфэ]202/i.test(txt(r.group));
  }

  function technicalBachelorParts(group){
    return txt(group)
      .split(/\s*;\s*|\s*,\s*(?=2[3-6]Б\/)/)
      .map(function(s){ return s.trim(); })
      .filter(Boolean);
  }
  function isSecondYearHistoryCode(s){ return /^25Б\/И/i.test(txt(s).trim()); }
  function hasSecondYearAcademicCode(s){ return /25Б\/[ИПФЭ]/i.test(txt(s)); }

  function directionFromCodes(parts, fallback){
    var dirs = [];
    parts.forEach(function(p){
      var m = txt(p).match(/^25Б\/([ИПФЭ])/i);
      if(!m) return;
      var d = ({'И':'История','П':'Политология','Ф':'Филология','Э':'Экономика'})[m[1].toUpperCase()];
      if(d && dirs.indexOf(d) < 0) dirs.push(d);
    });
    if(dirs.length) return dirs.join(' + ');
    var f = txt(fallback)
      .replace(/История\s*\+\s*/gi,'')
      .replace(/\s*\+\s*История/gi,'')
      .replace(/\bИстория\b/gi,'')
      .replace(/^\s*\+\s*|\s*\+\s*$/g,'')
      .trim();
    return f;
  }

  var unresolved = [];
  for(var i = DATA.length - 1; i >= 0; i--){
    var r = DATA[i];
    if(!r) continue;

    // 1) На 2 курсе 2026/27 группы иврита нет: старые строки иудаики не публикуем.
    if(isHebrew2(r)){
      DATA.splice(i,1);
      continue;
    }

    // 2) География на 2 курсе относится к старой/прошлосеместровой сетке.
    // В текущих материалах 2026/27 прямого подтверждения для осени нет.
    if(isCourse2(r) && isGeo(r)){
      DATA.splice(i,1);
      continue;
    }

    // 3) Старые арабские ОВЯ, ошибочно привязанные сразу к академическим И/П/Ф/Э-группам,
    // не публикуем. Актуальная кафедральная сетка/языковые подгруппы остаются у преподавателей.
    if(isLegacyArabicAcademicOva(r)){
      DATA.splice(i,1);
      continue;
    }

    // Кафедральную сетку ОВЯ делаем явно неперсональной, чтобы она не выглядела
    // как занятие конкретной академической группы.
    if(isCourse2(r) && /кафедральная сетка преподавателя/i.test(txt(r.group))){
      r.group = '2 курс — арабский — языковая подгруппа преподавателя ' + (r.teacher || '');
      r.direction = 'Арабский ОВЯ — языковая подгруппа';
    }

    // 4) Вт 13:00 у всех историков 2 курса — общий курс
    // «Историко-философские теории». Любая другая запись историков в этот слот
    // не переносится наугад: историческая часть отправляется в «уточняется».
    if(isCourse2(r) && txt(r.day) === 'Вт' && txt(r.time) === '13:00'
       && low(r.discipline).indexOf('историко-философские теории') < 0){

      var group = txt(r.group).trim();
      var parts = technicalBachelorParts(group);
      var histParts = parts.filter(isSecondYearHistoryCode);
      var otherParts = parts.filter(function(p){ return !isSecondYearHistoryCode(p); });

      if(histParts.length){
        var clone = Object.assign({}, r);
        clone.group = histParts.join('; ');
        clone.direction = 'История';
        clone.day = 'уточняется';
        clone.time = 'уточняется';
        clone.room_hint = '';
        clone.quality = '31.08.2026: прежний слот Вт 13:00 снят, потому что у всех историков 2 курса в это время обязательные «Историко-философские теории». Новый слот не назначен без подтверждения преподавателя/кафедры, чтобы не создать новый конфликт.';
        unresolved.push(clone);

        if(otherParts.length){
          r.group = otherParts.join('; ');
          r.direction = directionFromCodes(otherParts, r.direction);
        }else{
          DATA.splice(i,1);
        }
        continue;
      }

      // Текстовые общие обозначения историков без технического шифра.
      var gl = low(group);
      var dl = low(r.direction);
      if(!hasSecondYearAcademicCode(group) && (/историк/.test(gl) || /история/.test(dl))){
        var clone2 = Object.assign({}, r);
        clone2.group = '2 курс — историки';
        clone2.direction = 'История';
        clone2.day = 'уточняется';
        clone2.time = 'уточняется';
        clone2.room_hint = '';
        clone2.quality = '31.08.2026: Вт 13:00 занят общим обязательным курсом «Историко-философские теории» для всех историков 2 курса. Новый слот требует отдельного согласования.';
        unresolved.push(clone2);

        var cleaned = group
          .replace(/(^|[,;])\s*историки?\s*(?=([,;]|$))/ig,'$1')
          .replace(/^[,;\s]+|[,;\s]+$/g,'')
          .replace(/[,;]\s*[,;]/g,';');
        if(cleaned && low(cleaned) !== gl){
          r.group = cleaned;
          r.direction = directionFromCodes([], r.direction);
        }else{
          DATA.splice(i,1);
        }
      }
    }
  }
  unresolved.forEach(function(r){ DATA.push(r); });

  // Для академических арабских групп показываем одну честную запись без времени:
  // точная языковая подгруппа студента в исходных данных не задана.
  [
    ['25Б/И202-арабский/3','История'],
    ['25Б/П202-арабский/3','Политология'],
    ['25Б/Ф202-арабский/3','Филология'],
    ['25Б/Э202-арабский/3','Экономика']
  ].forEach(function(item){
    var exists = DATA.some(function(r){
      return isCourse2(r) && txt(r.group).trim() === item[0] && isOva(r);
    });
    if(!exists){
      DATA.push({
        group:item[0],
        course:'2 бакалавриат',
        direction:item[1],
        day:'уточняется',
        time:'уточняется',
        discipline:'Основной восточный язык (по изучаемому языку)',
        extra:'арабский; точная языковая подгруппа студента уточняется',
        teacher:null,
        room_hint:'',
        quality:'31.08.2026: актуальные кафедральные слоты ОВЯ и преподаватели известны, но соответствие конкретного студента/академической группы языковой подгруппе 202_1/3–202_4/3 в источниках 2026/27 отсутствует. Поэтому ОВЯ не привязан к ложному времени и не дублируется.'
      });
    }
  });

  // Убираем из выбора групп старую ивритскую группу 2 курса и
  // переводим видимые подписи групп в формат без технических кодов.
  function profileName(letter){
    return ({'И':'история','П':'политика','Ф':'филология','Э':'экономика'})[letter] || '';
  }
  function courseName(year){
    return ({'26':'1 курс','25':'2 курс','24':'3 курс','23':'4 курс'})[year] || '';
  }
  function languageName(s){
    var n = low(s);
    if(n.indexOf('япон') >= 0 && n.indexOf('корей') >= 0) return 'японско-корейский';
    if(n.indexOf('тайск') >= 0 && (n.indexOf('кхмер') >= 0 || n.indexOf('малаз') >= 0)) return 'тайско-кхмерский';
    if(n.indexOf('вьет') >= 0 && n.indexOf('индонез') >= 0) return 'вьетнамско-индонезийский';
    if(n.indexOf('филип') >= 0 && n.indexOf('индонез') >= 0) return 'филиппинско-индонезийский';
    if(n.indexOf('индонез') >= 0 && n.indexOf('малай') >= 0) return 'индонезийско-малайский';
    if(n.indexOf('хинди') >= 0 && n.indexOf('урду') >= 0) return 'хинди-урду';
    var tests = [
      ['араб','арабский'],['армян','армянский'],['китай','китайский'],
      ['персид','персидский'],['турец','турецкий'],['хауса','хауса'],
      ['хинди','хинди'],['урду','урду'],['япон','японский'],['корей','корейский'],
      ['африкаанс','африкаанс'],['иврит','иврит'],['пушту','пушту'],
      ['дари','дари'],['суахили','суахили'],['вьет','вьетнамский'],
      ['филип','филиппинский'],['индонез','индонезийский'],['малай','малайский'],
      ['грузин','грузинский'],['амхар','амхарский'],['кхмер','кхмерский'],
      ['тайск','тайский']
    ];
    for(var j=0;j<tests.length;j++) if(n.indexOf(tests[j][0]) >= 0) return tests[j][1];
    return '';
  }
  function codeToHuman(code){
    var s = txt(code).trim();
    var sg = s.match(/^202_([1-4])\/3$/i);
    if(sg) return '2 курс — арабский — языковая подгруппа ' + sg[1];

    var m = s.match(/^(2[3-6])Б\/([ИПФЭ])(.+)$/i);
    if(!m) return '';
    var c = courseName(m[1]);
    var p = profileName(m[2].toUpperCase());
    var l = languageName(m[3]);
    if(!c || !p || !l) return '';

    var suffix = '';
    if(m[1] === '25' && (m[2].toUpperCase() === 'П' || m[2].toUpperCase() === 'Э') && l === 'китайский'){
      if(/(?:^|[-_])2(?:[-_/]|$)/.test(m[3])) suffix = ', группа 2';
      else if(/(?:^|[-_])1(?:[-_/]|$)/.test(m[3])) suffix = ', группа 1';
    }
    return c + ' — ' + p + ' — ' + l + suffix;
  }
  function humanGroupText(value){
    var s = txt(value).trim();
    if(!s) return s;

    var bits = s
      .split(/\s*;\s*|\s*,\s*(?=2[3-6]Б\/)|\s*,\s*(?=202_[1-4]\/3)/)
      .map(function(part){
        var h = codeToHuman(part);
        if(h) return h;
        return part.replace(/(2[3-6]Б\/[ИПФЭ][^\s;,]+)/g,function(code){
          return codeToHuman(code) || code;
        });
      })
      .filter(Boolean);
    var uniq = [];
    bits.forEach(function(b){ if(uniq.indexOf(b) < 0) uniq.push(b); });
    return uniq.join('; ');
  }

  if(typeof GROUP_LABELS === 'object' && GROUP_LABELS){
    Object.keys(GROUP_LABELS).forEach(function(key){
      var label = txt(GROUP_LABELS[key]);
      var combined = low(key + ' ' + label);
      if(combined.indexOf('2 бакалавриат') >= 0 && (combined.indexOf('иврит') >= 0 || combined.indexOf('израил') >= 0)){
        delete GROUP_LABELS[key];
        return;
      }
      var h = codeToHuman(key);
      if(h){
        GROUP_LABELS[key] = h;
        return;
      }
      var subgroup = key.match(/^202_([1-4])\/3$/i);
      if(subgroup){
        GROUP_LABELS[key] = '2 курс — арабский — языковая подгруппа ' + subgroup[1];
        return;
      }
      GROUP_LABELS[key] = label
        .replace(/\s*\((?:2[3-6]Б\/[^)]*|202_[1-4]\/3)\)\s*/g,'')
        .replace(/^([1-4]) бакалавриат\s*·\s*/,'$1 курс — ')
        .replace(/\s*·\s*/g,' — ')
        .replace(/Политология/g,'политика')
        .replace(/История/g,'история')
        .replace(/Филология/g,'филология')
        .replace(/Экономика/g,'экономика')
        .trim();
    });
  }

  var style = document.createElement('style');
  style.textContent = '.code-warn{display:none!important}.group-code{font-family:inherit!important}';
  document.head.appendChild(style);

  function scrub(root){
    if(!root || !root.querySelectorAll) return;
    var els = root.querySelectorAll('.group-code,.group-link,.conflict-warn,.suggest-item,.browse-name');
    els.forEach(function(el){
      if(el.dataset && el.dataset.humanizedGroup === '1') return;
      var old = el.textContent;
      var neu = humanGroupText(old);
      if(neu && neu !== old) el.textContent = neu;
      if(el.dataset) el.dataset.humanizedGroup = '1';
    });
  }
  scrub(document);

  var observer = new MutationObserver(function(muts){
    muts.forEach(function(m){
      m.addedNodes.forEach(function(n){
        if(n.nodeType === 1){
          if(n.matches && n.matches('.group-code,.group-link,.conflict-warn,.suggest-item,.browse-name')){
            var o = n.textContent;
            var h = humanGroupText(o);
            if(h && h !== o) n.textContent = h;
            if(n.dataset) n.dataset.humanizedGroup = '1';
          }
          scrub(n);
        }
      });
    });
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
