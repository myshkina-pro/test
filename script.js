"use strict";

// Замените временные тексты здесь, сохранив порядок вопросов Q1–Q36.
const questions = Array.from({ length: 36 }, (_, index) => `Утверждение ${index + 1}`);
const TYPE_COUNT = 9;
const MAX_SCORE = 20;

// Ответы существуют только в памяти открытой страницы.
let answers = Array(questions.length).fill(null);
let currentQuestion = 0;
let activeScreen = "intro";

const screens = {
  intro: document.getElementById("intro-screen"),
  question: document.getElementById("question-screen"),
  result: document.getElementById("result-screen"),
};
const questionTitle = document.getElementById("question-title");
const questionCounter = document.getElementById("question-counter");
const progress = document.getElementById("question-progress");
const answerButtons = document.querySelectorAll(".answer-button");
const backButton = document.getElementById("back-button");

function showScreen(name) {
  activeScreen = name;
  Object.entries(screens).forEach(([key, screen]) => {
    screen.hidden = key !== name;
  });
}

function focusHeading(heading) {
  // Фокус на новом вопросе помогает при управлении с клавиатуры и скринридером.
  heading.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}

function showQuestion() {
  showScreen("question");
  questionTitle.textContent = questions[currentQuestion];
  questionCounter.textContent = `${currentQuestion + 1} из ${questions.length}`;
  progress.max = questions.length;
  progress.value = currentQuestion;
  progress.textContent = `${currentQuestion} из ${questions.length}`;
  progress.setAttribute("aria-valuetext", `Вопрос ${currentQuestion + 1} из ${questions.length}`);
  backButton.disabled = currentQuestion === 0;

  const previousAnswer = answers[currentQuestion];
  answerButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(Number(button.dataset.value) === previousAnswer));
  });
  document.getElementById("previous-answer-note").hidden = previousAnswer === null;
  focusHeading(questionTitle);
}

function startTest() {
  answers = Array(questions.length).fill(null);
  currentQuestion = 0;
  showQuestion();
}

function submitAnswer(value) {
  if (activeScreen !== "question" || !Number.isInteger(value) || value < 1 || value > 5) return;
  answers[currentQuestion] = value;

  if (currentQuestion < questions.length - 1) {
    currentQuestion += 1;
    showQuestion();
  } else {
    showResults();
  }
}

function calculateScores(responses) {
  const scores = Array(TYPE_COUNT).fill(0);
  responses.forEach((answer, index) => {
    // Индексы с нуля: 0, 9, 18, 27 относятся к типу 1 и так далее.
    scores[index % TYPE_COUNT] += answer;
  });
  return scores;
}

function showResults() {
  // Результат выводится только после ответа на все вопросы.
  const unansweredIndex = answers.findIndex((answer) => answer === null);
  if (unansweredIndex !== -1) {
    currentQuestion = unansweredIndex;
    showQuestion();
    return;
  }

  const scores = calculateScores(answers);
  const highestScore = Math.max(...scores);
  const leadingTypes = scores.flatMap((score, index) => score === highestScore ? [index + 1] : []);
  const hasTie = leadingTypes.length > 1;

  document.getElementById("main-type-label").textContent = hasTie ? "Основные типы" : "Основной тип";
  document.getElementById("main-type").textContent = `${hasTie ? "Типы" : "Тип"} ${leadingTypes.join(", ")}`;
  document.getElementById("main-score").textContent = `${highestScore} из ${MAX_SCORE} баллов${hasTie ? " у каждого" : ""}`;
  document.getElementById("tie-note").hidden = !hasTie;

  const scaleResults = document.getElementById("scale-results");
  scaleResults.replaceChildren();

  scores.forEach((score, index) => {
    const row = document.createElement("li");
    row.className = `scale-row${score === highestScore ? " is-leading" : ""}`;

    const label = document.createElement("span");
    label.className = "scale-label";
    label.textContent = `Тип ${index + 1}`;

    const track = document.createElement("span");
    track.className = "scale-track";
    track.setAttribute("aria-hidden", "true");
    const fill = document.createElement("span");
    fill.className = "scale-fill";
    fill.style.width = `${score / MAX_SCORE * 100}%`;
    track.append(fill);

    const value = document.createElement("span");
    value.className = "scale-score";
    value.textContent = `${score} / ${MAX_SCORE}`;
    value.setAttribute("aria-label", `${score} из ${MAX_SCORE} баллов`);

    row.append(label, track, value);
    scaleResults.append(row);
  });

  showScreen("result");
  focusHeading(document.getElementById("result-title"));
}

document.getElementById("start-button").addEventListener("click", startTest);
document.getElementById("restart-button").addEventListener("click", startTest);
answerButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    // Повторный click при двойном щелчке не должен отвечать на следующий вопрос.
    if (event.detail > 1) return;
    submitAnswer(Number(button.dataset.value));
  });
});
backButton.addEventListener("click", () => {
  if (activeScreen === "question" && currentQuestion > 0) {
    currentQuestion -= 1;
    showQuestion();
  }
});
document.getElementById("edit-button").addEventListener("click", () => {
  currentQuestion = questions.length - 1;
  showQuestion();
});
