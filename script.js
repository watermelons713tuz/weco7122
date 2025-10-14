let questions = [];
let current = 0;
const container = document.getElementById('quiz-container');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const resultModal = document.getElementById('resultModal');
const resultTitle = document.getElementById('resultTitle');
const resultSummary = document.getElementById('resultSummary');
const resultDetails = document.getElementById('resultDetails');
const restartBtn = document.getElementById('restartBtn');

async function loadQuestions() {
  try {
    const res = await fetch('questions.json', { cache: "no-store" });
    questions = await res.json();
    renderQuestion();
    updateControls();
  } catch (e) {
    container.innerHTML = '<p>Ошибка загрузки questions.json</p>';
  }
}

function renderQuestion() {
  const q = questions[current];
  container.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<div class="q">Вопрос ${current + 1}. ${q.question}</div>`;
  const opts = document.createElement('div');

  const multi = Array.isArray(q.correct) && q.correct.length > 1;

  q.options.forEach((opt, idx) => {
    const row = document.createElement('label');
    row.className = 'option';
    row.dataset.index = idx;

    const input = document.createElement('input');
    input.type = multi ? 'checkbox' : 'radio';
    input.name = 'opt';
    input.value = idx;
    if (q._userSelected) {
      if (Array.isArray(q._userSelected) && q._userSelected.includes(idx)) input.checked = true;
      if (typeof q._userSelected === 'number' && q._userSelected === idx) input.checked = true;
    }

    input.addEventListener('change', e => {
      if (multi) {
        const sel = q._userSelected || [];
        if (e.target.checked) sel.push(idx);
        else sel.splice(sel.indexOf(idx), 1);
        q._userSelected = sel;
      } else q._userSelected = idx;
      renderQuestion();
    });

    row.appendChild(input);
    row.append(opt);
    if (input.checked) row.classList.add('selected');
    opts.append(row);
  });

  card.append(opts);
  container.append(card);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateControls() {
  prevBtn.hidden = current === 0;
  nextBtn.style.display = current < questions.length - 1 ? '' : 'none';
  submitBtn.style.display = current === questions.length - 1 ? '' : 'none';
}

prevBtn.onclick = () => { if (current > 0) { current--; renderQuestion(); updateControls(); } };
nextBtn.onclick = () => { if (current < questions.length - 1) { current++; renderQuestion(); updateControls(); } };
submitBtn.onclick = () => evaluate();
restartBtn.onclick = () => {
  questions.forEach(q => delete q._userSelected);
  current = 0;
  resultModal.hidden = true;
  renderQuestion();
  updateControls();
};

function evaluate() {
  let correctCount = 0;
  resultDetails.innerHTML = '';
  questions.forEach((q, i) => {
    const correct = Array.isArray(q.correct) ? q.correct.sort() : [q.correct];
    const user = Array.isArray(q._userSelected) ? q._userSelected.sort() : (q._userSelected != null ? [q._userSelected] : []);
    const correctAnswer = correct.map(i => q.options[i]).join(', ');
    const userAnswer = user.length ? user.map(i => q.options[i]).join(', ') : 'Не отвечено';
    const isCorrect = JSON.stringify(correct) === JSON.stringify(user);
    if (isCorrect) correctCount++;

    const div = document.createElement('div');
    div.className = 'result-item ' + (isCorrect ? 'correct' : 'wrong');
    div.innerHTML = `<strong>${i + 1}. ${q.question}</strong><br><small>Ваш ответ: ${userAnswer}</small><br><small>Правильный: ${correctAnswer}</small>`;
    resultDetails.append(div);
  });

  resultSummary.textContent = `Вы ответили правильно на ${correctCount} из ${questions.length}.`;
  resultModal.hidden = false;
}

loadQuestions();
    
