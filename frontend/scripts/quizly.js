const MAX_QUESTIONS = 3;
const STORAGE_PREFIX = "quizly-daily:v2";
const LANGUAGE_KEY = "angle-daily:v1:language";
const STATS_KEY = `${STORAGE_PREFIX}:stats`;

const dictionaries = {
  en: {
    title: "Quizly",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    navTimely: "Timely",
    navMovly: "Movly",
    navQuizly: "Quizly",
    navPooly: "Pooly",
    navMenu: "Games",
    dailyDateLabel: "Daily date",
    italianLanguage: "Italian",
    englishLanguage: "English",
    easy: "Easy",
    hard: "Hard",
    medium: "Medium",
    difficultyLabel: "Difficulty",
    languageLabel: "Language",
    openStats: "Open statistics",
    closeStats: "Close statistics",
    questionsLabel: "Questions",
    reviewLabel: "Answer review",
    ready: "Pick the correct answer.",
    loading: "Loading today's trivia",
    generating: "Creating today's trivia",
    loadError: "Could not load today's Quizly. Try again later.",
    retryButton: "Retry",
    prevButton: "Previous",
    nextButton: "Next",
    submitButton: "Submit",
    locked: "Come back tomorrow for a new Quizly.",
    correct: "Correct",
    wrong: "Wrong",
    correctAnswer: "Correct answer",
    userAnswer: "Your answer",
    questionProgress: "Question {current} of {total}",
    selected: "Answer saved. You can change it before submitting.",
    missingAnswers: "Answer every question before submitting.",
    resultEyebrow: "Result",
    resultWin: "Perfect score",
    resultLoss: "Lost",
    resultCopy: "You scored {score}/{total}. {locked}",
    attemptEmpty: "empty",
    attemptSelected: "answered",
    attemptCorrect: "correct",
    attemptWrong: "wrong",
    attemptAria: "Question {index}: {state}",
    statsEyebrow: "Local stats",
    statsTitle: "Statistics",
    statsPlayed: "Played",
    statsWins: "Wins",
    statsWinRate: "Win rate",
    statsCurrentStreak: "Streak",
    statsBestStreak: "Best",
    distributionTitle: "Scores",
    statsEmpty: "Finish a daily puzzle to start tracking stats",
  },
  it: {
    title: "Quizly",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    navTimely: "Timely",
    navMovly: "Movly",
    navQuizly: "Quizly",
    navPooly: "Pooly",
    navMenu: "Giochi",
    dailyDateLabel: "Data del daily",
    italianLanguage: "Italiano",
    englishLanguage: "Inglese",
    easy: "Facile",
    hard: "Difficile",
    medium: "Media",
    difficultyLabel: "Difficoltà",
    languageLabel: "Lingua",
    openStats: "Apri statistiche",
    closeStats: "Chiudi statistiche",
    questionsLabel: "Domande",
    reviewLabel: "Riepilogo risposte",
    ready: "Scegli la risposta corretta.",
    loading: "Caricamento del trivia di oggi",
    generating: "Creazione del trivia di oggi",
    loadError: "Non riesco a caricare Quizly. Riprova più tardi.",
    retryButton: "Riprova",
    prevButton: "Indietro",
    nextButton: "Avanti",
    submitButton: "Invia",
    locked: "Torna domani per un nuovo Quizly.",
    correct: "Corretta",
    wrong: "Errata",
    correctAnswer: "Risposta corretta",
    userAnswer: "La tua risposta",
    questionProgress: "Domanda {current} di {total}",
    selected: "Risposta salvata. Puoi cambiarla prima dell'invio.",
    missingAnswers: "Rispondi a tutte le domande prima di inviare.",
    resultEyebrow: "Risultato",
    resultWin: "Punteggio perfetto",
    resultLoss: "Perso",
    resultCopy: "Hai fatto {score}/{total}. {locked}",
    attemptEmpty: "vuota",
    attemptSelected: "risposta scelta",
    attemptCorrect: "corretta",
    attemptWrong: "errata",
    attemptAria: "Domanda {index}: {state}",
    statsEyebrow: "Statistiche locali",
    statsTitle: "Statistiche",
    statsPlayed: "Giocate",
    statsWins: "Vinte",
    statsWinRate: "Vittorie",
    statsCurrentStreak: "Serie",
    statsBestStreak: "Record",
    distributionTitle: "Punteggi",
    statsEmpty: "Completa un daily per iniziare a tracciare le statistiche",
  },
};

const iconClasses = {
  ready: "fa-solid fa-circle-question",
  loading: "fa-solid fa-circle-notch fa-spin",
  won: "fa-solid fa-circle-check",
  lost: "fa-solid fa-circle-xmark",
  warning: "fa-solid fa-triangle-exclamation",
  emptyAttempt: "fa-regular fa-circle",
  selectedAttempt: "fa-solid fa-circle-dot",
  correctAttempt: "fa-solid fa-circle-check",
  wrongAttempt: "fa-solid fa-circle-xmark",
};

const elements = {
  html: document.documentElement,
  dateLabel: document.querySelector("#dateLabel"),
  modeButtons: [...document.querySelectorAll(".mode-button")],
  languageButtons: [...document.querySelectorAll(".language-button")],
  statsButton: document.querySelector("#statsButton"),
  statsCloseButton: document.querySelector("#statsCloseButton"),
  statsDialog: document.querySelector("#statsDialog"),
  quizlyStage: document.querySelector("#quizlyStage"),
  quizlyLoading: document.querySelector("#quizlyLoading"),
  quizlyLoadingText: document.querySelector("#quizlyLoading span"),
  questionWrap: document.querySelector("#questionWrap"),
  questionProgress: document.querySelector("#questionProgress"),
  questionCategory: document.querySelector("#questionCategory"),
  questionDifficulty: document.querySelector("#questionDifficulty"),
  questionText: document.querySelector("#questionText"),
  answerGrid: document.querySelector("#answerGrid"),
  resultPanel: document.querySelector("#resultPanel"),
  resultTitle: document.querySelector("#resultTitle"),
  resultCopy: document.querySelector("#resultCopy"),
  statusStrip: document.querySelector("#statusStrip"),
  statusIcon: document.querySelector("#statusIcon"),
  statusText: document.querySelector("#statusText"),
  attemptDots: document.querySelector("#attemptDots"),
  retryButton: document.querySelector("#retryButton"),
  prevButton: document.querySelector("#prevButton"),
  nextButton: document.querySelector("#nextButton"),
  submitButton: document.querySelector("#submitButton"),
  reviewList: document.querySelector("#reviewList"),
  statsPlayed: document.querySelector("#statsPlayed"),
  statsWins: document.querySelector("#statsWins"),
  statsWinRate: document.querySelector("#statsWinRate"),
  statsCurrentStreak: document.querySelector("#statsCurrentStreak"),
  statsBestStreak: document.querySelector("#statsBestStreak"),
  statsDistribution: document.querySelector("#statsDistribution"),
  statsEmpty: document.querySelector("#statsEmpty"),
};

let lang = getInitialLanguage();
const todayKey = getCanonicalDateKey(new Date());
let activeMode = "easy";
let state = loadState(activeMode);
let loadStatus = state.puzzle ? "ready" : "idle";
let loadRequestId = 0;

function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    return;
  }
}

function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    return;
  }
}

function getInitialLanguage() {
  const saved = safeGetItem(LANGUAGE_KEY);
  if (dictionaries[saved]) {
    return saved;
  }
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.some((language) => language?.toLowerCase().startsWith("it")) ? "it" : "en";
}

function t(key, values = {}) {
  const template = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}

function getCanonicalDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function storageKey(mode) {
  return `${STORAGE_PREFIX}:${todayKey}:${mode}`;
}

function resultKey(date, mode) {
  return `${date}:${mode}`;
}

function emptyState(mode) {
  return {
    date: todayKey,
    mode,
    status: "playing",
    questionIndex: 0,
    selections: [],
    puzzle: null,
    statsRecorded: false,
  };
}

function sanitizeState(saved, mode) {
  const status = ["playing", "won", "lost"].includes(saved?.status)
    ? saved.status
    : "playing";
  const selections = Array.isArray(saved?.selections)
    ? saved.selections
      .filter((selection) => selection && typeof selection.questionId === "string")
      .slice(0, MAX_QUESTIONS)
    : [];
  return {
    ...emptyState(mode),
    ...saved,
    status,
    questionIndex: Math.max(0, Math.min(MAX_QUESTIONS - 1, Number(saved?.questionIndex) || 0)),
    selections,
    puzzle: saved?.puzzle && Array.isArray(saved.puzzle.questions) ? saved.puzzle : null,
    statsRecorded: status === "playing" ? false : Boolean(saved?.statsRecorded),
  };
}

function puzzleQuestionIds(puzzle) {
  return (puzzle?.questions ?? []).map((question) => question.id).join("|");
}

function samePuzzleIdentity(savedPuzzle, nextPuzzle) {
  return Boolean(
    savedPuzzle
    && nextPuzzle
    && savedPuzzle.version === nextPuzzle.version
    && savedPuzzle.date === nextPuzzle.date
    && savedPuzzle.mode === nextPuzzle.mode
    && savedPuzzle.lang === nextPuzzle.lang
    && puzzleQuestionIds(savedPuzzle) === puzzleQuestionIds(nextPuzzle),
  );
}

function mergeStateWithPuzzle(saved, puzzle, mode) {
  const compatible = samePuzzleIdentity(saved?.puzzle, puzzle);
  const base = compatible ? sanitizeState(saved, mode) : emptyState(mode);
  const questions = puzzle?.questions ?? [];
  const validAnswersByQuestion = new Map(
    questions.map((question) => [
      question.id,
      new Set((question.answers ?? []).map((answer) => answer.id)),
    ]),
  );
  const selections = compatible
    ? base.selections.filter((selection) => (
      validAnswersByQuestion.get(selection.questionId)?.has(selection.answerId)
    ))
    : [];

  return {
    ...base,
    date: puzzle?.date ?? todayKey,
    mode,
    status: compatible ? base.status : "playing",
    questionIndex: Math.max(
      0,
      Math.min((questions.length || 1) - 1, compatible ? base.questionIndex : 0),
    ),
    selections,
    puzzle,
    statsRecorded: compatible && base.status !== "playing" ? base.statsRecorded : false,
  };
}

function loadState(mode) {
  try {
    const saved = JSON.parse(safeGetItem(storageKey(mode)));
    if (saved?.date === todayKey && saved?.mode === mode) {
      return sanitizeState(saved, mode);
    }
  } catch (error) {
    safeRemoveItem(storageKey(mode));
  }
  return emptyState(mode);
}

function saveState() {
  safeSetItem(storageKey(activeMode), JSON.stringify(state));
}

function emptyStats() {
  return {
    version: 1,
    results: {},
  };
}

function loadStats() {
  try {
    const saved = JSON.parse(safeGetItem(STATS_KEY));
    if (saved && typeof saved.results === "object" && !Array.isArray(saved.results)) {
      return {
        ...emptyStats(),
        ...saved,
        results: saved.results,
      };
    }
  } catch (error) {
    safeRemoveItem(STATS_KEY);
  }
  return emptyStats();
}

function saveStats(stats) {
  safeSetItem(STATS_KEY, JSON.stringify(stats));
}

function getScore() {
  return state.selections.filter((selection) => {
    const question = questionById(selection.questionId);
    return question && selection.answerId === question.correctAnswerId;
  }).length;
}

function questionCount() {
  return state.puzzle?.questions?.length ?? MAX_QUESTIONS;
}

function allQuestionsAnswered() {
  const questions = state.puzzle?.questions ?? [];
  return questions.length > 0 && questions.every((question) => (
    state.selections.some((selection) => selection.questionId === question.id)
  ));
}

function questionById(questionId) {
  return state.puzzle?.questions?.find((question) => question.id === questionId) ?? null;
}

function recordStatsIfNeeded() {
  if (state.status === "playing" || state.statsRecorded) {
    return;
  }

  const stats = loadStats();
  const key = resultKey(state.date, state.mode);
  if (!stats.results[key]) {
    stats.results[key] = {
      date: state.date,
      mode: state.mode,
      status: state.status,
      score: getScore(),
      total: questionCount(),
    };
    saveStats(stats);
  }

  state.statsRecorded = true;
  saveState();
}

function currentQuestion() {
  return state.puzzle?.questions?.[state.questionIndex] ?? null;
}

function currentSelection() {
  const question = currentQuestion();
  return question
    ? state.selections.find((selection) => selection.questionId === question.id)
    : null;
}

function correctAnswer(question) {
  return question?.answers?.find((answer) => answer.id === question.correctAnswerId) ?? null;
}

function setLoadStatus(nextStatus) {
  loadStatus = nextStatus;
  renderGame();
}

async function loadDailyPuzzle() {
  const requestId = loadRequestId + 1;
  loadRequestId = requestId;
  setLoadStatus("loading");

  try {
    const params = new URLSearchParams({ mode: activeMode, lang });
    const response = await fetch(`/api/quizly/daily?${params.toString()}`);
    const payload = await response.json();
    if (requestId !== loadRequestId) {
      return;
    }
    if (response.status === 202 || payload.status === "generating") {
      setLoadStatus("generating");
      return;
    }
    if (!response.ok || !payload.puzzle?.questions?.length) {
      throw new Error(payload.message || "Quizly load failed");
    }

    state = mergeStateWithPuzzle(state, payload.puzzle, activeMode);
    saveState();
    setLoadStatus("ready");
  } catch (error) {
    if (requestId === loadRequestId) {
      setLoadStatus("error");
    }
  }
}

function selectAnswer(answerId) {
  if (loadStatus !== "ready" || state.status !== "playing") {
    return;
  }

  const question = currentQuestion();
  if (!question) {
    return;
  }

  const selected = question.answers.find((answer) => answer.id === answerId);
  if (!selected) {
    return;
  }

  const existingIndex = state.selections.findIndex(
    (selection) => selection.questionId === question.id,
  );
  const selection = {
    questionId: question.id,
    answerId,
    answerText: selected.text,
  };
  if (existingIndex >= 0) {
    state.selections.splice(existingIndex, 1, selection);
  } else {
    state.selections.push(selection);
  }

  saveState();
  renderGame();
}

function goNext() {
  if (state.status !== "playing" || !state.puzzle) {
    return;
  }
  if (state.questionIndex < state.puzzle.questions.length - 1) {
    state.questionIndex += 1;
    saveState();
    renderGame();
  }
}

function goPrevious() {
  if (state.status !== "playing" || !state.puzzle) {
    return;
  }
  if (state.questionIndex > 0) {
    state.questionIndex -= 1;
    saveState();
    renderGame();
  }
}

function submitAnswers() {
  if (state.status !== "playing" || !state.puzzle) {
    return;
  }
  if (!allQuestionsAnswered()) {
    setStatus("warning", t("missingAnswers"));
    return;
  }
  state.status = getScore() === questionCount() ? "won" : "lost";
  recordStatsIfNeeded();
  saveState();
  renderGame();
}

function setMode(mode) {
  if (!["easy", "hard"].includes(mode)) {
    return;
  }
  activeMode = mode;
  state = loadState(mode);
  loadStatus = state.puzzle ? "ready" : "idle";
  renderGame();
  loadDailyPuzzle();
}

function setLanguage(nextLanguage) {
  if (!dictionaries[nextLanguage]) {
    return;
  }
  lang = nextLanguage;
  safeSetItem(LANGUAGE_KEY, lang);
  localizeStaticText();
  renderGame();
  loadDailyPuzzle();
}

function localizeStaticText() {
  elements.html.lang = lang;
  document.title = t("title");

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });

  elements.dateLabel.textContent = formatDateLabel(todayKey);
  elements.languageButtons.forEach((button) => {
    const isActive = button.dataset.lang === lang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function formatDateLabel(dateKey) {
  return new Intl.DateTimeFormat(lang, {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

function renderAttempts() {
  const fragment = document.createDocumentFragment();
  const questions = state.puzzle?.questions ?? [];
  for (let index = 0; index < questionCount(); index += 1) {
    const attempt = document.createElement("span");
    const question = questions[index];
    const selection = question
      ? state.selections.find((item) => item.questionId === question.id)
      : null;
    let iconKey = "emptyAttempt";
    let label = t("attemptEmpty");

    if (selection && state.status === "playing") {
      iconKey = "selectedAttempt";
      label = t("attemptSelected");
    } else if (selection) {
      const isCorrect = question && selection.answerId === question.correctAnswerId;
      iconKey = isCorrect ? "correctAttempt" : "wrongAttempt";
      label = t(isCorrect ? "attemptCorrect" : "attemptWrong");
    }

    attempt.className = `attempt-icon is-${iconKey.replace("Attempt", "")}`;
    attempt.setAttribute("aria-label", t("attemptAria", { index: index + 1, state: label }));
    attempt.innerHTML = `<i class="${iconClasses[iconKey]}" aria-hidden="true"></i>`;
    fragment.append(attempt);
  }
  elements.attemptDots.replaceChildren(fragment);
}

function renderAnswers(question) {
  const selected = currentSelection();
  const fragment = document.createDocumentFragment();

  question.answers.forEach((answer, index) => {
    const isSelected = selected?.answerId === answer.id;
    const isCorrect = answer.id === question.correctAnswerId;
    const isFinished = state.status !== "playing";
    const button = document.createElement("button");
    button.className = "quizly-answer";
    button.type = "button";
    button.disabled = isFinished;
    button.classList.toggle("is-selected", isSelected);
    button.classList.toggle("is-correct", isFinished && isCorrect);
    button.classList.toggle("is-wrong", isFinished && isSelected && !isCorrect);
    button.innerHTML = `
      <span class="quizly-answer-letter">${String.fromCharCode(65 + index)}</span>
      <span class="quizly-answer-text">${answer.text}</span>
      <span class="quizly-answer-result" aria-hidden="true">
        <i class="fa-solid ${isCorrect ? "fa-check" : "fa-xmark"}"></i>
      </span>
    `;
    button.addEventListener("click", () => selectAnswer(answer.id));
    fragment.append(button);
  });

  elements.answerGrid.replaceChildren(fragment);
}

function renderQuestion() {
  const question = currentQuestion();
  if (!question) {
    return;
  }

  const selected = currentSelection();
  const total = questionCount();
  elements.questionProgress.textContent = t("questionProgress", {
    current: state.questionIndex + 1,
    total,
  });
  elements.questionCategory.textContent = question.category;
  elements.questionDifficulty.textContent = t(question.difficulty) || question.difficulty;
  elements.questionText.textContent = question.question;
  renderAnswers(question);

  if (!selected) {
    setStatus("ready", t("ready"));
  } else {
    setStatus("ready", t("selected"));
  }
  elements.prevButton.disabled = state.questionIndex === 0;
  elements.nextButton.disabled = state.questionIndex >= total - 1;
  elements.submitButton.disabled = !allQuestionsAnswered();
}

function setStatus(iconKey, text) {
  elements.statusIcon.className = iconClasses[iconKey] ?? iconClasses.ready;
  elements.statusText.textContent = text;
  elements.statusStrip.classList.toggle("is-win", iconKey === "won");
  elements.statusStrip.classList.toggle("is-loss", iconKey === "lost");
}

function renderReview() {
  const questions = state.puzzle?.questions ?? [];
  const fragment = document.createDocumentFragment();

  questions.forEach((question, index) => {
    const selection = state.selections.find((item) => item.questionId === question.id);
    const answer = correctAnswer(question);
    const selectedAnswer = question.answers.find((item) => item.id === selection?.answerId);
    const isCorrect = selection?.answerId === question.correctAnswerId;
    const item = document.createElement("li");
    item.className = "quizly-review-item";
    item.classList.toggle("is-correct", Boolean(isCorrect));
    const userAnswerMarkup = isCorrect ? "" : `
        <p class="quizly-review-answer is-user">
          <span>${t("userAnswer")}:</span> ${selectedAnswer?.text ?? ""}
        </p>
      `;
    item.innerHTML = `
      <span class="quizly-review-index">${index + 1}</span>
      <div class="quizly-review-copy">
        <p class="quizly-review-question">${question.question}</p>
        <span class="quizly-review-divider" aria-hidden="true"></span>
        <p class="quizly-review-answer">
          <span>${t("correctAnswer")}:</span> ${answer?.text ?? ""}
        </p>
        ${userAnswerMarkup}
      </div>
      <i class="quizly-review-result ${isCorrect ? "is-correct fa-solid fa-check" : "is-wrong fa-solid fa-xmark"}" aria-hidden="true"></i>
    `;
    fragment.append(item);
  });

  elements.reviewList.replaceChildren(fragment);
}

function renderResult() {
  recordStatsIfNeeded();
  const score = getScore();
  const total = questionCount();
  const isWin = score === total;
  const title = t(isWin ? "resultWin" : "resultLoss");
  elements.resultPanel.classList.toggle("is-win", isWin);
  elements.resultPanel.classList.toggle("is-loss", !isWin);
  elements.resultTitle.replaceChildren();
  const icon = document.createElement("i");
  icon.className = isWin ? "fa-solid fa-trophy" : "fa-solid fa-circle-xmark";
  icon.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.textContent = title;
  elements.resultTitle.append(icon, label);
  elements.resultCopy.textContent = t("resultCopy", {
    score,
    total,
    locked: t("locked"),
  });
  setStatus(isWin ? "won" : "lost", `${title} - ${score}/${total}. ${t("locked")}`);
  renderReview();
  elements.reviewList.hidden = false;
}

function renderGame() {
  const isLoading = ["idle", "loading", "generating"].includes(loadStatus);
  const isError = loadStatus === "error";
  const isFinished = state.status !== "playing";
  const showQuestion = loadStatus === "ready" && !isFinished;

  elements.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === activeMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  elements.html.dataset.mode = activeMode;
  elements.quizlyStage.classList.toggle("is-loading", isLoading);
  elements.quizlyStage.classList.toggle("is-error", isError);
  elements.quizlyLoading.hidden = !isLoading && !isError;
  elements.questionWrap.hidden = !showQuestion;
  elements.resultPanel.hidden = !isFinished || loadStatus !== "ready";
  elements.retryButton.hidden = !isError && loadStatus !== "generating";
  elements.nextButton.hidden = isFinished || isLoading || isError;
  elements.prevButton.hidden = isFinished || isLoading || isError;
  elements.submitButton.hidden = isFinished || isLoading || isError;
  elements.reviewList.hidden = true;

  if (loadStatus === "loading" || loadStatus === "idle") {
    elements.quizlyLoadingText.textContent = t("loading");
    setStatus("loading", t("loading"));
  } else if (loadStatus === "generating") {
    elements.quizlyLoadingText.textContent = t("generating");
    setStatus("loading", t("generating"));
  } else if (loadStatus === "error") {
    elements.quizlyLoadingText.textContent = t("loadError");
    setStatus("warning", t("loadError"));
  } else if (isFinished) {
    renderResult();
  } else {
    renderQuestion();
  }

  renderAttempts();
  renderStats();
}

function utcDayNumber(dateKey) {
  return Math.floor(Date.parse(`${dateKey}T00:00:00Z`) / 86400000);
}

function dateKeyFromUtcDay(dayNumber) {
  return new Date(dayNumber * 86400000).toISOString().slice(0, 10);
}

function calculateStats(stats) {
  const results = Object.values(stats.results)
    .filter((result) => (
      result
      && ["won", "lost"].includes(result.status)
      && /^\d{4}-\d{2}-\d{2}$/.test(result.date)
      && ["easy", "hard"].includes(result.mode)
    ));
  const distribution = Array(MAX_QUESTIONS + 1).fill(0);
  const dateSummary = new Map();

  results.forEach((result) => {
    if (!dateSummary.has(result.date)) {
      dateSummary.set(result.date, { played: true, won: false });
    }
    if (result.status === "won") {
      dateSummary.get(result.date).won = true;
    }
    const score = Math.max(0, Math.min(MAX_QUESTIONS, Number(result.score) || 0));
    distribution[score] += 1;
  });

  const played = results.length;
  const wins = results.filter((result) => result.status === "won").length;
  const winDates = [...dateSummary.entries()]
    .filter(([, summary]) => summary.won)
    .map(([date]) => date)
    .sort();
  const winDateSet = new Set(winDates);
  const winDays = winDates.map(utcDayNumber).sort((a, b) => a - b);

  let bestStreak = 0;
  let runningStreak = 0;
  let previousDay = null;
  winDays.forEach((day) => {
    runningStreak = previousDay !== null && day === previousDay + 1 ? runningStreak + 1 : 1;
    bestStreak = Math.max(bestStreak, runningStreak);
    previousDay = day;
  });

  const playedDays = [...dateSummary.keys()].map(utcDayNumber);
  const latestPlayedDay = playedDays.length ? Math.max(...playedDays) : null;
  let currentStreak = 0;
  if (latestPlayedDay !== null && winDateSet.has(dateKeyFromUtcDay(latestPlayedDay))) {
    for (let day = latestPlayedDay; winDateSet.has(dateKeyFromUtcDay(day)); day -= 1) {
      currentStreak += 1;
    }
  }

  return {
    played,
    wins,
    winRate: played ? Math.round((wins / played) * 100) : 0,
    currentStreak,
    bestStreak,
    distribution,
  };
}

function renderStats() {
  const summary = calculateStats(loadStats());
  const maxDistribution = Math.max(1, ...summary.distribution);

  elements.statsPlayed.textContent = String(summary.played);
  elements.statsWins.textContent = String(summary.wins);
  elements.statsWinRate.textContent = `${summary.winRate}%`;
  elements.statsCurrentStreak.textContent = String(summary.currentStreak);
  elements.statsBestStreak.textContent = String(summary.bestStreak);
  elements.statsEmpty.hidden = summary.played > 0;

  const fragment = document.createDocumentFragment();
  summary.distribution.forEach((count, score) => {
    const row = document.createElement("div");
    row.className = "distribution-row";
    const width = Math.max(8, Math.round((count / maxDistribution) * 100));
    row.innerHTML = `
      <span class="distribution-attempt">${score}</span>
      <div class="distribution-track">
        <span class="distribution-bar" style="width: ${width}%">${count}</span>
      </div>
    `;
    fragment.append(row);
  });
  elements.statsDistribution.replaceChildren(fragment);
}

function openStatsDialog() {
  renderStats();
  if (typeof elements.statsDialog.showModal === "function") {
    elements.statsDialog.showModal();
    return;
  }
  elements.statsDialog.setAttribute("open", "");
}

function closeStatsDialog() {
  if (typeof elements.statsDialog.close === "function") {
    elements.statsDialog.close();
    return;
  }
  elements.statsDialog.removeAttribute("open");
}

function init() {
  localizeStaticText();

  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });
  elements.languageButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
  elements.retryButton.addEventListener("click", loadDailyPuzzle);
  elements.prevButton.addEventListener("click", goPrevious);
  elements.nextButton.addEventListener("click", goNext);
  elements.submitButton.addEventListener("click", submitAnswers);
  elements.statsButton.addEventListener("click", openStatsDialog);
  elements.statsCloseButton.addEventListener("click", closeStatsDialog);
  elements.statsDialog.addEventListener("click", (event) => {
    if (event.target === elements.statsDialog) {
      closeStatsDialog();
    }
  });

  renderGame();
  loadDailyPuzzle();
}

init();
