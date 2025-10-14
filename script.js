// Quiz script: loads questions.json, renders UI, supports multiple-correct answers
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

async function loadQuestions(){
  try{
    const res = await fetch('questions.json', {cache: "no-store"});
    questions = await res.json();
    if(!Array.isArray(questions) || questions.length===0){
      container.innerHTML = '<p>Вопросы не найдены или неверный формат questions.json</p>';
      return;
    }
    renderQuestion();
    updateControls();
  }catch(e){
    container.innerHTML = '<p>Ошибка загрузки questions.json — убедитесь, что файл доступен.</p>';
    console.error(e);
  }
}

function renderQuestion(){
  const q = questions[current];
  container.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card';
  const qnum = document.createElement('div');
  qnum.className = 'q';
  qnum.textContent = `Вопрос ${current+1}. ${q.question}`;
  card.appendChild(qnum);

  const opts = document.createElement('div');
  opts.className = 'options';

  const multi = Array.isArray(q.correct) && q.correct.length>1;

  q.options.forEach((opt, idx)=>{
    const row = document.createElement('label');
    row.className = 'option';
    row.dataset.index = idx;

    const input = document.createElement('input');
    input.type = multi ? 'checkbox' : 'radio';
    input.name = 'opt';
    input.value = idx;
    input.id = `opt-${current}-${idx}`;

    // Restore previous answer if any
    if(q._userSelected){
      if(Array.isArray(q._userSelected) && q._userSelected.includes(idx)) input.checked = true;
      if(typeof q._userSelected === 'number' && q._userSelected === idx) input.checked = true;
      if(input.checked) row.classList.add('selected');
    }

    input.addEventListener('change', (e)=>{
      if(multi){
        const sel = q._userSelected || [];
        if(e.target.checked){
          if(!sel.includes(idx)) sel.push(idx);
        } else {
          const i = sel.indexOf(idx);
          if(i>-1) sel.splice(i,1);
        }
        q._userSelected = sel;
      } else {
        q._userSelected = idx;
        // uncheck others visually
        const siblings = opts.querySelectorAll('.option');
        siblings.forEach(s=>s.classList.remove('selected'));
        row.classList.add('selected');
      }
      // toggle selected class for checkbox too
      if(e.target.checked) row.classList.add('selected'); else row.classList.remove('selected');
    });

    const fake = document.createElement('span');
    fake.className = 'label';
    fake.textContent = opt;

    row.appendChild(input);
    row.appendChild(fake);
    opts.appendChild(row);
  });

  card.appendChild(opts);
  container.appendChild(card);
}

function updateControls(){
  prevBtn.hidden = current===0;
  nextBtn.style.display = current < questions.length-1 ? '' : 'none';
  submitBtn.style.display = current === questions.length-1 ? '' : 'none';
}

prevBtn.addEventListener('click', ()=>{
  if(current>0){ current--; renderQuestion(); updateControls(); }
});
nextBtn.addEventListener('click', ()=>{
  if(current < questions.length-1){ current++; renderQuestion(); updateControls(); }
});
submitBtn.addEventListener('click', evaluate);

restartBtn.addEventListener('click', ()=>{
  // reset
  questions.forEach(q=>delete q._userSelected);
  current = 0;
  resultModal.hidden = true;
  renderQuestion();
  updateControls();
});

function evaluate(){
  let correctCount = 0;
  const details = [];

  questions.forEach((q, qi)=>{
    const user = q._userSelected === undefined ? (Array.isArray(q.correct) ? [] : null) : q._userSelected;
    const correct = Array.isArray(q.correct) ? q.correct.slice().sort((a,b)=>a-b) : [q.correct];

    let userArr;
    if(Array.isArray(user)) userArr = user.slice().sort((a,b)=>a-b);
    else if(user===null) userArr = [];
    else userArr = [user];

    // Comparison
    const isCorrect = arraysEqual(userArr, correct.map(String).map(s=>Number(s)) .sort((a,b)=>a-b)) || arraysEqual(userArr.map(Number).sort((a,b)=>a-b), correct);
    if(isCorrect) correctCount++;

    // Prepare detail entry
    const entry = document.createElement('div');
    entry.className = 'result-item ' + (isCorrect ? 'correct' : 'wrong');
    const qh = document.createElement('div');
    qh.innerHTML = `<strong>Вопрос ${qi+1}:</strong> ${q.question}`;
    entry.appendChild(qh);

    const userText = (userArr.length? userArr.map(i=>q.options[i]).join(', '): '<em>Не отвечено</em>');
    const correctText = correct.map(i=>q.options[i]).join(', ');

    const p = document.createElement('div');
    p.className = 'small';
    p.innerHTML = `<div>Ваш ответ: ${userText}</div><div>Правильный ответ: ${correctText}</div>`;
    entry.appendChild(p);
    details.push(entry);
  });

  // Show modal results
  resultTitle.textContent = 'Результаты';
  const percent = Math.round((correctCount / questions.length) * 100);
  resultSummary.textContent = `Вы ответили правильно на ${correctCount} из ${questions.length} (${percent}%).`;
  resultDetails.innerHTML = '';
  details.forEach(d=>resultDetails.appendChild(d));
  resultModal.hidden = false;
}

/* helper */
function arraysEqual(a,b){
  if(a.length !== b.length) return false;
  for(let i=0;i<a.length;i++){
    if(Number(a[i]) !== Number(b[i])) return false;
  }
  return true;
}

loadQuestions();
