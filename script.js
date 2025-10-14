document.addEventListener('DOMContentLoaded', () => {
    const questionsArea = document.getElementById('questions-area');
    const submitButton = document.getElementById('submit-quiz');
    const quizForm = document.getElementById('quiz-form');
    const resultsArea = document.getElementById('results-area');
    const scoreSummary = document.getElementById('score-summary');
    const detailedResults = document.getElementById('detailed-results');
    const startNewQuizButton = document.getElementById('start-new-quiz');

    let questionsData = [];

    // Хелпер: Сравнение двух массивов (без учета порядка)
    function arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        const sortedArr1 = arr1.slice().sort();
        const sortedArr2 = arr2.slice().sort();
        for (let i = 0; i < sortedArr1.length; i++) {
            if (sortedArr1[i] !== sortedArr2[i]) return false;
        }
        return true;
    }

    // 1. Асинхронная загрузка вопросов из JSON
    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            questionsData = await response.json();
            renderQuiz();
        } catch (error) {
            console.error("Не удалось загрузить вопросы:", error);
            questionsArea.innerHTML = `<p class="incorrect-answer-feedback">Ошибка загрузки вопросов. Проверьте файл questions.json.</p>`;
        }
    }

    // 2. Отображение викторины
    function renderQuiz() {
        questionsArea.innerHTML = '';
        questionsData.forEach(q => {
            const isMultiple = q.type === 'multiple';
            const inputTag = isMultiple ? 'md-checkbox' : 'md-radio';
            const card = document.createElement('div');
            card.className = 'question-card';

            card.innerHTML = `
                <p class="question-text">${q.id}. ${q.question}</p>
                <div class="options-group" data-question-id="${q.id}">
                    ${q.options.map((option, index) => `
                        <label class="option-item">
                            <${inputTag} 
                                name="q${q.id}" 
                                value="${option}"
                                id="q${q.id}-o${index}"
                                touch-target="wrapper"
                            ></${inputTag}>
                            <span style="margin-left: 10px;">${option}</span>
                        </label>
                    `).join('')}
                </div>
            `;
            questionsArea.appendChild(card);
        });
        
        quizForm.classList.remove('hidden');
        resultsArea.classList.add('hidden');
    }

    // 3. Обработка отправки викторины
    submitButton.addEventListener('click', () => {
        let correctCount = 0;
        const totalQuestions = questionsData.length;
        detailedResults.innerHTML = '';

        questionsData.forEach(q => {
            let userAnswer = [];
            let isCorrect = false;
            const correctAnswers = q.correct_answers;
            
            // Получаем все выбранные элементы (checkboxes или radio buttons)
            const selectedElements = document.querySelectorAll(`input[name="q${q.id}"]:checked`);
            userAnswer = Array.from(selectedElements).map(el => el.value);

            // Проверяем ответы
            if (q.type === 'single') {
                // Single choice: должен быть 1 ответ, который совпадает с правильным
                isCorrect = userAnswer.length === 1 && arraysEqual(userAnswer, correctAnswers);
            } else {
                // Multiple choice: массивы выбранных и правильных ответов должны полностью совпадать
                isCorrect = arraysEqual(userAnswer, correctAnswers);
            }
            
            if (isCorrect) {
                correctCount++;
            }

            // Вывод обратной связи
            const feedbackClass = isCorrect ? 'feedback-correct' : 'feedback-incorrect';
            const statusText = isCorrect ? 
                `<span class="correct-answer-feedback">✅ Верно!</span>` : 
                `<span class="incorrect-answer-feedback">❌ Ошибка!</span>`;
            
            const userAnswerText = userAnswer.length > 0 ? userAnswer.join('; ') : '— Не отвечено —';
            const correctAnswerText = correctAnswers.join('; ');

            detailedResults.innerHTML += `
                <div class="${feedbackClass} feedback-container">
                    <p><strong>Вопрос ${q.id}:</strong> ${q.question}</p>
                    <p>${statusText}</p>
                    <p>Ваш(и) ответ(ы): <strong>${userAnswerText}</strong></p>
                    ${!isCorrect ? `<p>Правильный ответ: <strong>${correctAnswerText}</strong></p>` : ''}
                </div>
                <md-divider style="margin: 10px 0;"></md-divider>
            `;
        });

        // Выводим сводку результатов
        scoreSummary.innerHTML = `Вы ответили правильно на <strong>${correctCount}</strong> из <strong>${totalQuestions}</strong> вопросов!`;

        // Скрываем викторину, показываем результаты
        quizForm.classList.add('hidden');
        resultsArea.classList.remove('hidden');

        // Прокрутка к началу результатов
        resultsArea.scrollIntoView({ behavior: 'smooth' });
    });

    // 4. Начать викторину заново
    startNewQuizButton.addEventListener('click', () => {
        renderQuiz();
    });

    // Запуск загрузки
    loadQuestions();
});