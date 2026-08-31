(function(){
  'use strict';

  const groupBtn = document.getElementById('modeStudent');
  if (!groupBtn) return;

  // Эти два режима в интерфейсе должны быть отдельными.
  groupBtn.textContent = 'По группам';

  let studentBtn = document.getElementById('modeStudentPersonal');
  if (!studentBtn) {
    studentBtn = document.createElement('button');
    studentBtn.className = 'mode-btn';
    studentBtn.id = 'modeStudentPersonal';
    studentBtn.type = 'button';
    studentBtn.textContent = 'Я студент';
    groupBtn.parentNode.insertBefore(studentBtn, groupBtn);
  }

  function deactivatePersonal(){
    studentBtn.classList.remove('active');
  }

  studentBtn.addEventListener('click', function(){
    // Студенческий режим использует ту же проверенную базу групп,
    // но остаётся отдельной вкладкой интерфейса.
    if (typeof switchMode === 'function') switchMode('student');
    groupBtn.classList.remove('active');
    studentBtn.classList.add('active');

    if (typeof qLabel !== 'undefined' && qLabel) qLabel.textContent = 'Найдите свою группу';
    if (typeof qInput !== 'undefined' && qInput) qInput.placeholder = 'Например: 2 курс — история — арабский…';
    if (typeof browseToggle !== 'undefined' && browseToggle) browseToggle.textContent = 'Показать список всех групп';
  });

  groupBtn.addEventListener('click', deactivatePersonal);
  ['modeTeacher','modeCourse','modeDiscipline','modeDepartment','modeDay','modeRoom'].forEach(function(id){
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', deactivatePersonal);
  });

  const results = document.getElementById('results');
  if (results) {
    results.addEventListener('click', function(e){
      if (e.target.closest('.group-link[data-group]')) deactivatePersonal();
    }, true);
  }
})();
