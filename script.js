document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('quiz-container');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const finishBtn = document.getElementById('finish');
  const resultModal = document.getElementById('resultModal');
  const resultTitle = document.getElementById('resultTitle');
  const resultSummary = document.getElementById('resultSummary');
  const resultDetails = document.getElementById('resultDetails');
  const closeResultBtn = document.getElementById('closeResult');
  const restartBtn = document.getElementById('restart');

  let questions = [];
  let current = 0;

  // === Универсальная функция загрузки JSON ===
  async function loadQuestions() {
    try {
      const url = new URL('questions.json', window.location.href).toString();
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status} ${res.statusText}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('Файл пуст или неверного формата');

      questions = data;
      renderQuestion();
      updateControls();
    } catch (err) {
      console.error('Ошибка при загрузке вопросов:', err);
      container.innerHTML = `
        <div style="padding:16px;text-align:center;">
          <p><strong>Ошибка загрузки вопросов</strong></p>
          <p>${err.message}</p>
          <p style="color:#888">Проверьте, что файл <code>questions.json</code> находится рядом с <code>index.html</code> и доступен по сети.</p>
        </div>`;
    }
  }

  // === Проверка на равенство массивов ===
  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => val === b[i]);
  }

  // === Рендер одного вопроса ===
  function renderQuestion() {
    const q = questions[current];
    if (!q) return;
    container.innerHTML = '';

    const questionEl = document.createElement('div');
    questionEl.className = 'question';
    questionEl.textContent = q.question;
    container.appendChild(questionEl);

    const optionsEl = document.createElement('div');
    optionsEl.className = 'options';

    q.options.forEach((opt, i) => {
      const id = `opt-${current}-${i}`;
      const wrapper = document.createElement('label');
      wrapper.className = 'option-item';

      const input = document.createElement('input');
      input.type = q.multiple ? 'checkbox' : 'radio';
      input.name = `q-${current}`;
      input.value = i;

      // восстановим состояние
      const selected = q._userSelected;
      if (q.multiple && Array.isArray(selected) && selected.includes(i)) input.checked = true;
      if (!q.multiple && selected === i) input.checked = true;

      input.addEventListener('change', () => {
        if (q.multiple) {
          const selectedOpts = Array.from(optionsEl.querySelectorAll('input:checked')).map(el => Number(el.value));
          q._userSelected = selectedOpts;
        } else {
          q._userSelected = Number(input.value);
        }
      });

      const span = document.createElement('span');
      span.textContent = opt;

      wrapper.appendChild(input);
      wrapper.appendChild(span);
      optionsEl.appendChild(wrapper);
    });

    container.appendChild(optionsEl);
  }

  // === Обновление кнопок навигации ===
  function updateControls() {
    prevBtn.disabled = current === 0;
    nextBtn.style.display = current < questions.length - 1 ? 'inline-flex' : 'none';
    finishBtn.style.display = current === questions.length - 1 ? 'inline-flex' : 'none';
  }

  // === Оценка ответов ===
  function evaluate() {
    let correctCount = 0;
    resultDetails.innerHTML = '';

    questions.forEach((q, qi) => {
      const correct = Array.isArray(q.correct) ? q.correct.map(Number).sort((a, b) => a - b) : [Number(q.correct)];
      let user = [];

      if (Array.isArray(q._userSelected)) user = q._userSelected.map(Number).sort((a, b) => a - b);
      else if (q._userSelected !== undefined) user = [Number(q._userSelected)];

      const isCorrect = arraysEqual(user, correct);
      if (isCorrect) correctCount++;

      const entry = document.createElement('div');
      entry.className = 'result-item ' + (isCorrect ? 'correct' : 'wrong');
      entry.innerHTML = `
        <div><strong>Вопрос ${qi + 1}:</strong> ${q.question}</div>
        <div class="small">
          <div>Ваш ответ: ${user.length ? user.map(i => q.options[i]).join(', ') : '<em>Не отвечено</em>'}</div>
          <div>Правильный ответ: ${correct.map(i => q.options[i]).join(', ')}</div>
        </div>`;
      resultDetails.appendChild(entry);
    });

    const percent = Math.round((correctCount / questions.length) * 100);
    resultTitle.textContent = 'Результаты';
    resultSummary.textContent = `Вы ответили правильно на ${correctCount} из ${questions.length} (${percent}%).`;

    resultModal.hidden = false;
    document.body.style.overflow = 'hidden'; // блокируем фон
  }

  // === Навигация ===
  nextBtn.addEventListener('click', () => {
    if (current < questions.length - 1) current++;
    renderQuestion();
    updateControls();
  });
  prevBtn.addEventListener('click', () => {
    if (current > 0) current--;
    renderQuestion();
    updateControls();
  });
  finishBtn.addEventListener('click', () => evaluate());

  // === Обработчики модалки (навешиваются один раз) ===
  closeResultBtn.addEventListener('click', () => {
    resultModal.hidden = true;
    document.body.style.overflow = '';
  });
  restartBtn.addEventListener('click', () => {
    questions.forEach(q => delete q._userSelected);
    current = 0;
    renderQuestion();
    updateControls();
    resultModal.hidden = true;
    document.body.style.overflow = '';
  });

  // === Запуск ===
  loadQuestions();
});
