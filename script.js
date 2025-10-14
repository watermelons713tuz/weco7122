document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("quiz-container");
  const nextBtn = document.getElementById("next-btn");
  const prevBtn = document.getElementById("prev-btn");
  const submitBtn = document.getElementById("submit-btn");
  const restartBtn = document.getElementById("restart-btn");
  const resultModal = document.getElementById("result-modal");
  const closeResultBtn = document.getElementById("close-result");
  const resultTitle = document.getElementById("result-title");
  const resultSummary = document.getElementById("result-summary");
  const resultDetails = document.getElementById("result-details");

  let questions = [];
  let current = 0;

  // ====== Загрузка вопросов ======
  fetch("questions.json")
    .then((res) => res.json())
    .then((data) => {
      questions = data;
      renderQuestion();
      updateControls();
    })
    .catch((err) => {
      console.error("Ошибка загрузки JSON:", err);
      container.innerHTML = "<p>Ошибка загрузки вопросов.</p>";
    });

  // ====== Функции ======
  function renderQuestion() {
    const q = questions[current];
    container.innerHTML = "";

    const questionEl = document.createElement("div");
    questionEl.className = "question";
    questionEl.innerHTML = `<h2>${q.question}</h2>`;

    const optionsList = document.createElement("div");
    optionsList.className = "options";

    q.options.forEach((opt, i) => {
      const label = document.createElement("label");
      label.className = "option";
      label.innerHTML = `
        <input type="${Array.isArray(q.correct) && q.correct.length > 1 ? "checkbox" : "radio"}" 
               name="opt-${current}" 
               value="${i}">
        <span>${opt}</span>
      `;
      optionsList.appendChild(label);
    });

    questionEl.appendChild(optionsList);
    container.appendChild(questionEl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateControls() {
    prevBtn.disabled = current === 0;
    nextBtn.style.display = current < questions.length - 1 ? "inline-block" : "none";
    submitBtn.style.display = current === questions.length - 1 ? "inline-block" : "none";
  }

  function saveAnswer() {
    const q = questions[current];
    const selectedInputs = container.querySelectorAll("input:checked");
    const selected = Array.from(selectedInputs).map((input) => Number(input.value));
    q._userSelected = selected;
  }

  function evaluate() {
    let correctCount = 0;
    const details = [];

    questions.forEach((q, qi) => {
      const userRaw = q._userSelected;
      const correct = Array.isArray(q.correct)
        ? q.correct.map(Number).sort((a, b) => a - b)
        : [Number(q.correct)];
      let user = [];

      if (userRaw === undefined || userRaw === null) user = [];
      else if (Array.isArray(userRaw)) user = userRaw.map(Number).sort((a, b) => a - b);
      else user = [Number(userRaw)];

      const isCorrect = arraysEqual(user, correct);
      if (isCorrect) correctCount++;

      const entry = document.createElement("div");
      entry.className = "result-item " + (isCorrect ? "correct" : "wrong");

      const qh = document.createElement("div");
      qh.innerHTML = `<strong>Вопрос ${qi + 1}:</strong> ${q.question}`;
      entry.appendChild(qh);

      const userText = user.length
        ? user.map((i) => q.options[i]).join(", ")
        : "<em>Не отвечено</em>";
      const correctText = correct.map((i) => q.options[i]).join(", ");

      const p = document.createElement("div");
      p.className = "small";
      p.innerHTML = `<div>Ваш ответ: ${userText}</div><div>Правильный ответ: ${correctText}</div>`;
      entry.appendChild(p);

      details.push(entry);
    });

    resultTitle.textContent = "Результаты";
    const percent = Math.round((correctCount / questions.length) * 100);
    resultSummary.textContent = `Вы ответили правильно на ${correctCount} из ${questions.length} (${percent}%).`;

    resultDetails.innerHTML = "";
    details.forEach((d) => resultDetails.appendChild(d));

    resultModal.hidden = false;
    resultModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // Блокируем прокрутку
  }

  function arraysEqual(a, b) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index])
    );
  }

  // ====== Обработчики ======
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    saveAnswer();
    if (current < questions.length - 1) {
      current++;
      renderQuestion();
      updateControls();
    }
  });

  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    saveAnswer();
    if (current > 0) {
      current--;
      renderQuestion();
      updateControls();
    }
  });

  submitBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    saveAnswer();
    evaluate();
  });

  closeResultBtn.addEventListener("click", () => {
    resultModal.hidden = true;
    resultModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = ""; // Возвращаем прокрутку
  });

  restartBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    questions.forEach((q) => delete q._userSelected);
    current = 0;
    resultModal.hidden = true;
    resultModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    renderQuestion();
    updateControls();
  });
});
    
