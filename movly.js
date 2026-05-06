const MAX_ATTEMPTS = 5;
const STORAGE_PREFIX = "movly-daily:v1";
const LANGUAGE_KEY = "angle-daily:v1:language";
const STATS_KEY = `${STORAGE_PREFIX}:stats`;
const POOLS = ["best", "trending"];

const dictionaries = {
  en: {
    title: "Movly",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    navTimely: "Timely",
    navMovly: "Movly",
    dailyDateLabel: "Daily date",
    italianLanguage: "Italian",
    englishLanguage: "English",
    best: "Best",
    trending: "Trending",
    ready: "Guess the movie from emoji",
    loading: "Loading today's movie",
    generating: "Creating today's movie",
    loadError: "Could not load today's Movly. Try again later.",
    poolLabel: "Movie pool",
    languageLabel: "Language",
    openStats: "Open statistics",
    closeStats: "Close statistics",
    attemptsLabel: "Attempts",
    emojiLabel: "Emoji hint",
    answerLabel: "Answer",
    guessLabel: "Movie",
    guessButton: "Guess",
    skipButton: "Skip",
    previousGuesses: "Previous guesses",
    placeholder: "Search a movie",
    searching: "Searching movies",
    noSuggestions: "No movies found",
    invalidEmpty: "Enter a movie title",
    invalidMovie: "Movie not found",
    duplicate: "You already tried {movie}",
    loadingMessage: "Movly is still loading",
    sameSaga: "Same saga, but not this one.",
    sameSagaPill: "Same saga",
    yearOlder: "The correct movie is older.",
    yearNewer: "The correct movie is newer.",
    yearSame: "The correct movie is from the same year.",
    nextLevel: "Wrong. A new emoji level is unlocked.",
    skipLabel: "Skipped",
    skipStatus: "Skipped. A new emoji level is unlocked.",
    correct: "Correct! It was {movie}.",
    lost: "Out of guesses. It was {movie}.",
    locked: "Come back tomorrow for a new Movly.",
    attemptEmpty: "empty",
    attemptWrong: "wrong",
    attemptSkip: "skipped",
    attemptWin: "correct",
    attemptLoss: "lost",
    attemptAria: "Attempt {index}: {state}",
    statsEyebrow: "Local stats",
    statsTitle: "Statistics",
    statsPlayed: "Played",
    statsWins: "Wins",
    statsWinRate: "Win rate",
    statsCurrentStreak: "Streak",
    statsBestStreak: "Best",
    distributionTitle: "Guesses",
    statsEmpty: "Finish a daily puzzle to start tracking stats",
  },
  it: {
    title: "Movly",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    navTimely: "Timely",
    navMovly: "Movly",
    dailyDateLabel: "Data del daily",
    italianLanguage: "Italiano",
    englishLanguage: "Inglese",
    best: "Best",
    trending: "Trending",
    ready: "Indovina il film dalle emoji",
    loading: "Caricamento del film di oggi",
    generating: "Creazione del film di oggi",
    loadError: "Non riesco a caricare Movly di oggi. Riprova piu tardi.",
    poolLabel: "Pool film",
    languageLabel: "Lingua",
    openStats: "Apri statistiche",
    closeStats: "Chiudi statistiche",
    attemptsLabel: "Tentativi",
    emojiLabel: "Indizio emoji",
    answerLabel: "Risposta",
    guessLabel: "Film",
    guessButton: "Prova",
    skipButton: "Salta",
    previousGuesses: "Tentativi precedenti",
    placeholder: "Cerca un film",
    searching: "Ricerca film",
    noSuggestions: "Nessun film trovato",
    invalidEmpty: "Inserisci il titolo di un film",
    invalidMovie: "Film non trovato",
    duplicate: "Hai gia provato {movie}",
    loadingMessage: "Movly si sta ancora caricando",
    sameSaga: "Stessa saga, ma non e questo.",
    sameSagaPill: "Stessa saga",
    yearOlder: "Il film corretto e piu vecchio.",
    yearNewer: "Il film corretto e piu recente.",
    yearSame: "Il film corretto e dello stesso anno.",
    nextLevel: "Sbagliato. Sblocchi un nuovo livello di emoji.",
    skipLabel: "Saltato",
    skipStatus: "Saltato. Sblocchi un nuovo livello di emoji.",
    correct: "Esatto! Era {movie}.",
    lost: "Tentativi finiti. Era {movie}.",
    locked: "Torna domani per un nuovo Movly.",
    attemptEmpty: "vuoto",
    attemptWrong: "errato",
    attemptSkip: "saltato",
    attemptWin: "corretto",
    attemptLoss: "perso",
    attemptAria: "Tentativo {index}: {state}",
    statsEyebrow: "Statistiche locali",
    statsTitle: "Statistiche",
    statsPlayed: "Giocate",
    statsWins: "Vinte",
    statsWinRate: "Vittorie",
    statsCurrentStreak: "Serie",
    statsBestStreak: "Record",
    distributionTitle: "Tentativi",
    statsEmpty: "Completa un daily per iniziare a tracciare le statistiche",
  },
};

const iconClasses = {
  ready: "fa-solid fa-film",
  loading: "fa-solid fa-circle-notch fa-spin",
  won: "fa-solid fa-circle-check",
  lost: "fa-solid fa-circle-xmark",
  warning: "fa-solid fa-triangle-exclamation",
  duplicate: "fa-solid fa-rotate-left",
  emptyAttempt: "fa-regular fa-circle",
  wrongAttempt: "fa-solid fa-circle-xmark",
  skipAttempt: "fa-solid fa-forward-step",
  winAttempt: "fa-solid fa-circle-check",
  lossAttempt: "fa-solid fa-circle-xmark",
  sameSaga: "fa-solid fa-link",
  yearDirection: "fa-solid fa-calendar-days",
};

const elements = {
  html: document.documentElement,
  dateLabel: document.querySelector("#dateLabel"),
  poolButtons: [...document.querySelectorAll(".mode-button")],
  languageButtons: [...document.querySelectorAll(".language-button")],
  statsButton: document.querySelector("#statsButton"),
  statsCloseButton: document.querySelector("#statsCloseButton"),
  statsDialog: document.querySelector("#statsDialog"),
  movlyStage: document.querySelector("#movlyStage"),
  movlyLoading: document.querySelector("#movlyLoading"),
  movlyLoadingText: document.querySelector("#movlyLoading span"),
  emojiLine: document.querySelector("#emojiLine"),
  resultPanel: document.querySelector("#resultPanel"),
  resultPoster: document.querySelector("#resultPoster"),
  resultTitle: document.querySelector("#resultTitle"),
  resultYear: document.querySelector("#resultYear"),
  statusStrip: document.querySelector("#statusStrip"),
  statusIcon: document.querySelector("#statusIcon"),
  statusText: document.querySelector("#statusText"),
  attemptDots: document.querySelector("#attemptDots"),
  form: document.querySelector("#guessForm"),
  input: document.querySelector("#guessInput"),
  submit: document.querySelector(".guess-button"),
  skip: document.querySelector("#skipButton"),
  suggestions: document.querySelector("#suggestions"),
  formMessage: document.querySelector("#formMessage"),
  formMessageIcon: document.querySelector("#formMessageIcon"),
  formMessageText: document.querySelector("#formMessageText"),
  guessList: document.querySelector("#guessList"),
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
let activePool = "best";
let state = loadState(activePool);
let loadStatus = state.levels.length === MAX_ATTEMPTS ? "ready" : "idle";
let loadError = "";
let loadRequestId = 0;
let searchRequestId = 0;
let searchTimer = null;
let suggestions = [];
let selectedSuggestion = null;

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

function storageKey(pool) {
  return `${STORAGE_PREFIX}:${todayKey}:${pool}`;
}

function resultKey(date, pool) {
  return `${date}:${pool}`;
}

function normalizeTitle(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function emptyState(pool) {
  return {
    date: todayKey,
    pool,
    status: "playing",
    levels: [],
    guesses: [],
    answer: null,
    statsRecorded: false,
  };
}

function sanitizeLevels(levels) {
  if (!Array.isArray(levels)) {
    return [];
  }
  return levels
    .map((level) => (typeof level === "string" ? level.trim() : ""))
    .filter(Boolean)
    .slice(0, MAX_ATTEMPTS);
}

function sanitizeMovie(movie) {
  if (!movie || typeof movie !== "object") {
    return null;
  }
  const id = Number(movie.id);
  const title = typeof movie.title === "string" ? movie.title.trim() : "";
  if (!Number.isInteger(id) || id <= 0 || !title) {
    return null;
  }
  return {
    id,
    title,
    originalTitle: typeof movie.originalTitle === "string" ? movie.originalTitle : "",
    year: Number.isInteger(Number(movie.year)) ? Number(movie.year) : null,
    posterPath: typeof movie.posterPath === "string" ? movie.posterPath : "",
    posterUrl: typeof movie.posterUrl === "string" ? movie.posterUrl : "",
    feedbackType: typeof movie.feedbackType === "string" ? movie.feedbackType : "",
    feedbackMessage: typeof movie.feedbackMessage === "string" ? movie.feedbackMessage : "",
    yearDirection: typeof movie.yearDirection === "string" ? movie.yearDirection : "",
  };
}

function sanitizeAttempt(attempt) {
  if (!attempt || typeof attempt !== "object") {
    return null;
  }
  if (attempt.type === "skip" || attempt.skip === true) {
    return {
      type: "skip",
      skip: true,
      feedbackType: "",
      feedbackMessage: "",
      yearDirection: "",
    };
  }

  const movie = sanitizeMovie(attempt);
  return movie ? { ...movie, type: "guess" } : null;
}

function loadState(pool) {
  try {
    const saved = JSON.parse(safeGetItem(storageKey(pool)));
    const status = ["playing", "won", "lost"].includes(saved?.status) ? saved.status : "playing";
    if (saved?.date === todayKey && saved?.pool === pool) {
      const guesses = Array.isArray(saved.guesses)
        ? saved.guesses.map(sanitizeAttempt).filter(Boolean).slice(0, MAX_ATTEMPTS)
        : [];
      const answer = sanitizeMovie(saved.answer);
      const normalizedStatus = status !== "playing" && !answer ? "playing" : status;
      return {
        ...emptyState(pool),
        ...saved,
        status: normalizedStatus,
        levels: sanitizeLevels(saved.levels),
        guesses,
        answer,
        statsRecorded: normalizedStatus === "playing" ? false : Boolean(saved.statsRecorded),
      };
    }
  } catch (error) {
    safeRemoveItem(storageKey(pool));
  }
  return emptyState(pool);
}

function saveState() {
  safeSetItem(storageKey(activePool), JSON.stringify(state));
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

function recordStatsIfNeeded() {
  if (state.status === "playing" || state.statsRecorded) {
    return;
  }

  const stats = loadStats();
  const key = resultKey(state.date, state.pool);
  if (!stats.results[key]) {
    stats.results[key] = {
      date: state.date,
      pool: state.pool,
      status: state.status,
      attempts: state.status === "won" ? Math.max(1, state.guesses.length) : MAX_ATTEMPTS,
    };
    saveStats(stats);
  }

  state.statsRecorded = true;
  saveState();
}

async function loadDailyPuzzle() {
  const requestId = loadRequestId + 1;
  loadRequestId = requestId;

  if (state.levels.length === MAX_ATTEMPTS) {
    loadStatus = "ready";
    loadError = "";
    renderGame();
    return;
  }

  loadStatus = loadStatus === "generating" ? "generating" : "loading";
  loadError = "";
  renderGame();

  try {
    const response = await fetch(`/api/movly/daily?pool=${activePool}&lang=${lang}`);
    const payload = await response.json().catch(() => ({}));
    if (requestId !== loadRequestId) {
      return;
    }
    if (response.status === 202 || payload.status === "generating") {
      loadStatus = "generating";
      renderGame();
      setTimeout(() => {
        if (requestId === loadRequestId) {
          loadDailyPuzzle();
        }
      }, 1800);
      return;
    }
    if (!response.ok || payload.status !== "ready") {
      throw new Error(payload.message || "Daily request failed");
    }

    state.levels = sanitizeLevels(payload.puzzle?.levels);
    if (state.levels.length !== MAX_ATTEMPTS) {
      throw new Error("Daily puzzle has invalid emoji levels");
    }
    saveState();
    loadStatus = "ready";
    loadError = "";
  } catch (error) {
    if (requestId !== loadRequestId) {
      return;
    }
    loadStatus = state.levels.length === MAX_ATTEMPTS ? "ready" : "error";
    loadError = t("loadError");
  }

  renderGame();
}

function getCurrentLevelIndex() {
  if (!state.levels.length) {
    return 0;
  }
  if (state.status !== "playing") {
    return state.levels.length - 1;
  }
  return Math.min(state.guesses.length, state.levels.length - 1);
}

function isInteractionLocked() {
  return loadStatus !== "ready" || state.status !== "playing" || state.levels.length !== MAX_ATTEMPTS;
}

function setFormMessage(message, iconKey = "warning") {
  elements.formMessageIcon.className = iconClasses[iconKey] ?? iconClasses.warning;
  elements.formMessageText.textContent = message;
  elements.formMessage.classList.toggle("is-visible", Boolean(message));
}

function clearFormMessage() {
  setFormMessage("", "warning");
}

function formatDateLabel(dateKey) {
  return new Intl.DateTimeFormat(lang, {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

function getStatusFeedback() {
  if (loadStatus === "loading" || loadStatus === "idle") {
    return {
      iconKey: "loading",
      text: t("loading"),
    };
  }
  if (loadStatus === "generating") {
    return {
      iconKey: "loading",
      text: t("generating"),
    };
  }
  if (loadStatus === "error") {
    return {
      iconKey: "warning",
      text: loadError || t("loadError"),
    };
  }
  if (state.status === "won") {
    return {
      iconKey: "won",
      text: `${t("correct", { movie: state.answer?.title || "" })} ${t("locked")}`,
    };
  }
  if (state.status === "lost") {
    return {
      iconKey: "lost",
      text: `${t("lost", { movie: state.answer?.title || "" })} ${t("locked")}`,
    };
  }
  if (state.guesses.length === 0) {
    return {
      iconKey: "ready",
      text: t("ready"),
    };
  }

  const lastGuess = state.guesses[state.guesses.length - 1];
  if (lastGuess?.type === "skip") {
    return {
      iconKey: "skipAttempt",
      text: t("skipStatus"),
    };
  }
  const feedback = getGuessFeedbackContent(lastGuess);
  if (feedback.pills.length || feedback.fallbackText) {
    return {
      iconKey: "wrongAttempt",
      text: feedback.fallbackText,
      feedback,
    };
  }
  return {
    iconKey: "wrongAttempt",
    text: t("nextLevel"),
  };
}

function getYearDirectionText(direction) {
  if (direction === "older") {
    return t("yearOlder");
  }
  if (direction === "newer") {
    return t("yearNewer");
  }
  if (direction === "same") {
    return t("yearSame");
  }
  return "";
}

function getGuessFeedbackPills(guess) {
  const pills = [];
  if (!guess) {
    return pills;
  }
  if (guess.feedbackType === "same_saga" || guess.feedbackType === "combined") {
    pills.push({
      kind: "saga",
      iconKey: "sameSaga",
      text: t("sameSagaPill"),
    });
  }
  const yearText = getYearDirectionText(guess.yearDirection);
  if (yearText) {
    pills.push({
      kind: "year",
      iconKey: "yearDirection",
      text: yearText,
    });
  }
  return pills;
}

function getGuessFeedbackContent(guess) {
  const pills = getGuessFeedbackPills(guess);
  if (pills.length) {
    return {
      pills,
      fallbackText: "",
    };
  }
  return {
    pills,
    fallbackText: guess?.feedbackMessage || "",
  };
}

function createFeedbackPill(pill) {
  const element = document.createElement("span");
  element.className = `movly-feedback-pill is-${pill.kind}`;
  element.innerHTML = iconMarkup(pill.iconKey);

  const text = document.createElement("span");
  text.textContent = pill.text;
  element.append(text);
  return element;
}

function createFeedbackNodes(guess, extraClass = "") {
  const feedback = getGuessFeedbackContent(guess);
  const fragment = document.createDocumentFragment();
  if (feedback.pills.length) {
    const wrap = document.createElement("span");
    wrap.className = `movly-feedback-pills${extraClass ? ` ${extraClass}` : ""}`;
    feedback.pills.forEach((pill) => wrap.append(createFeedbackPill(pill)));
    fragment.append(wrap);
    return fragment;
  }
  if (feedback.fallbackText) {
    const fallback = document.createElement("span");
    fallback.className = "movly-feedback-fallback";
    fallback.textContent = feedback.fallbackText;
    fragment.append(fallback);
  }
  return fragment;
}

function iconMarkup(iconKey) {
  return `<i class="${iconClasses[iconKey] ?? iconClasses.ready}" aria-hidden="true"></i>`;
}

function renderAttempts() {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < MAX_ATTEMPTS; index += 1) {
    const attempt = document.createElement("span");
    let iconKey = "emptyAttempt";
    let label = t("attemptEmpty");

    if (index < state.guesses.length) {
      if (state.guesses[index]?.type === "skip") {
        iconKey = "skipAttempt";
        label = t("attemptSkip");
      } else {
        iconKey = "wrongAttempt";
        label = t("attemptWrong");
      }
    }
    if (index === state.guesses.length - 1 && state.status === "won") {
      iconKey = "winAttempt";
      label = t("attemptWin");
    }
    if (
      index === MAX_ATTEMPTS - 1
      && state.status === "lost"
      && state.guesses[index]?.type !== "skip"
    ) {
      iconKey = "lossAttempt";
      label = t("attemptLoss");
    }

    attempt.className = `attempt-icon is-${iconKey.replace("Attempt", "")}`;
    attempt.setAttribute("aria-label", t("attemptAria", { index: index + 1, state: label }));
    attempt.innerHTML = iconMarkup(iconKey);
    fragment.append(attempt);
  }
  elements.attemptDots.replaceChildren(fragment);
}

function createPosterNode(movie) {
  const poster = document.createElement("span");
  poster.className = "movly-mini-poster";
  if (movie?.type === "skip" || movie?.skip === true) {
    poster.classList.add("is-skip");
    poster.innerHTML = iconMarkup("skipAttempt");
    return poster;
  }
  if (movie.posterUrl) {
    const image = document.createElement("img");
    image.src = movie.posterUrl;
    image.alt = "";
    image.loading = "lazy";
    poster.append(image);
  } else {
    poster.innerHTML = iconMarkup("ready");
  }
  return poster;
}

function renderGuessList() {
  const fragment = document.createDocumentFragment();
  state.guesses.forEach((guess, index) => {
    const item = document.createElement("li");
    item.className = "movly-guess-item";

    const position = document.createElement("span");
    position.className = "guess-index";
    position.textContent = String(index + 1);

    const copy = document.createElement("span");
    copy.className = "movly-guess-copy";

    const title = document.createElement("span");
    title.className = "movly-guess-title";
    title.textContent = guess.type === "skip" ? t("skipLabel") : guess.title;

    const meta = document.createElement("span");
    meta.className = "movly-guess-meta";
    if (guess.type !== "skip") {
      meta.append(createFeedbackNodes(guess));
    }

    copy.append(title, meta);

    const result = document.createElement("span");
    const isWinningGuess = state.status === "won" && index === state.guesses.length - 1;
    const resultState = isWinningGuess ? "win" : guess.type === "skip" ? "skip" : "wrong";
    result.className = `movly-guess-result is-${resultState}`;
    result.innerHTML = isWinningGuess
      ? iconMarkup("winAttempt")
      : iconMarkup(guess.type === "skip" ? "skipAttempt" : "wrongAttempt");

    item.append(position, createPosterNode(guess), copy, result);
    fragment.append(item);
  });
  elements.guessList.replaceChildren(fragment);
}

function renderResult() {
  const answer = state.answer;
  elements.resultPanel.hidden = !answer || state.status === "playing";
  if (!answer || state.status === "playing") {
    elements.resultPoster.style.backgroundImage = "";
    elements.resultPoster.innerHTML = iconMarkup("ready");
    elements.resultTitle.textContent = "";
    elements.resultYear.textContent = "";
    return;
  }

  elements.resultTitle.textContent = answer.title;
  elements.resultYear.textContent = answer.year ? String(answer.year) : "";
  if (answer.posterUrl) {
    elements.resultPoster.style.backgroundImage = `url("${answer.posterUrl}")`;
    elements.resultPoster.replaceChildren();
  } else {
    elements.resultPoster.style.backgroundImage = "";
    elements.resultPoster.innerHTML = iconMarkup("ready");
  }
}

function renderEmojiLevel(level) {
  const tokens = level.split(/\s+/).filter(Boolean);
  const fragment = document.createDocumentFragment();
  tokens.forEach((token) => {
    const emoji = document.createElement("span");
    emoji.className = "movly-emoji-token";
    emoji.textContent = token;
    fragment.append(emoji);
  });
  elements.emojiLine.classList.toggle("is-long", tokens.length >= 7);
  elements.emojiLine.classList.toggle("is-very-long", tokens.length >= 9);
  elements.emojiLine.setAttribute("aria-label", level || t("emojiLabel"));
  elements.emojiLine.replaceChildren(fragment);
}

function renderGame() {
  recordStatsIfNeeded();

  const status = getStatusFeedback();
  const isLocked = isInteractionLocked();
  const level = state.levels[getCurrentLevelIndex()] || "";
  const lastGuess = state.guesses[state.guesses.length - 1];

  elements.poolButtons.forEach((button) => {
    const isActive = button.dataset.pool === activePool;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  elements.html.dataset.pool = activePool;
  elements.movlyStage.classList.toggle("is-loading", loadStatus === "loading" || loadStatus === "idle" || loadStatus === "generating");
  elements.movlyStage.classList.toggle("is-error", loadStatus === "error");
  elements.movlyLoading.hidden = loadStatus !== "loading" && loadStatus !== "idle" && loadStatus !== "generating";
  elements.movlyLoadingText.textContent = loadStatus === "generating" ? t("generating") : t("loading");
  renderEmojiLevel(level);

  elements.statusIcon.className = iconClasses[status.iconKey] ?? iconClasses.ready;
  elements.statusText.replaceChildren();
  if (status.feedback?.pills.length) {
    elements.statusText.append(createFeedbackNodes(lastGuess, "is-status"));
  } else {
    elements.statusText.textContent = status.text;
  }
  elements.statusStrip.classList.toggle("is-win", state.status === "won");
  elements.statusStrip.classList.toggle("is-loss", state.status === "lost" || loadStatus === "error");
  elements.statusStrip.classList.toggle("is-wrong", status.iconKey === "wrongAttempt");

  elements.input.disabled = isLocked;
  elements.submit.disabled = isLocked;
  elements.skip.disabled = isLocked;

  renderAttempts();
  renderGuessList();
  renderResult();
  renderStats();
  clearFormMessage();
}

function setPool(pool) {
  if (!POOLS.includes(pool) || pool === activePool) {
    return;
  }
  activePool = pool;
  state = loadState(activePool);
  loadStatus = state.levels.length === MAX_ATTEMPTS ? "ready" : "idle";
  loadError = "";
  selectedSuggestion = null;
  suggestions = [];
  elements.input.value = "";
  hideSuggestions();
  renderGame();
  loadDailyPuzzle();
}

function searchUrl(query) {
  const params = new URLSearchParams({
    q: query,
    lang,
  });
  return `/api/movly/search?${params.toString()}`;
}

function hideSuggestions() {
  elements.suggestions.hidden = true;
  elements.suggestions.replaceChildren();
}

function renderSuggestions(message = "") {
  const fragment = document.createDocumentFragment();
  if (message) {
    const empty = document.createElement("div");
    empty.className = "movly-suggestion-empty";
    empty.textContent = message;
    fragment.append(empty);
  } else {
    suggestions.forEach((movie) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "movly-suggestion";
      button.setAttribute("role", "option");
      button.dataset.movieId = String(movie.id);

      const poster = createPosterNode(movie);
      const copy = document.createElement("span");
      copy.className = "movly-suggestion-copy";

      const title = document.createElement("span");
      title.className = "movly-suggestion-title";
      title.textContent = movie.title;

      const year = document.createElement("span");
      year.className = "movly-suggestion-year";
      year.textContent = movie.year ? String(movie.year) : "";

      copy.append(title, year);
      button.append(poster, copy);
      fragment.append(button);
    });
  }
  elements.suggestions.replaceChildren(fragment);
  elements.suggestions.hidden = false;
}

async function runSearch(query) {
  const requestId = searchRequestId + 1;
  searchRequestId = requestId;
  renderSuggestions(t("searching"));

  try {
    const response = await fetch(searchUrl(query));
    const payload = await response.json().catch(() => ({}));
    if (requestId !== searchRequestId) {
      return;
    }
    suggestions = Array.isArray(payload.results) ? payload.results : [];
    if (!suggestions.length) {
      renderSuggestions(t("noSuggestions"));
      return;
    }
    renderSuggestions();
  } catch (error) {
    if (requestId === searchRequestId) {
      suggestions = [];
      renderSuggestions(t("noSuggestions"));
    }
  }
}

function scheduleSearch() {
  selectedSuggestion = null;
  const query = elements.input.value.trim();
  clearTimeout(searchTimer);
  if (query.length < 2 || isInteractionLocked()) {
    suggestions = [];
    hideSuggestions();
    return;
  }
  searchTimer = setTimeout(() => runSearch(query), 180);
}

function selectSuggestion(movieId) {
  const movie = suggestions.find((item) => String(item.id) === String(movieId));
  if (!movie) {
    return;
  }
  selectedSuggestion = movie;
  elements.input.value = movie.title;
  hideSuggestions();
  elements.input.focus();
}

function isDuplicateGuess(movie, title) {
  const normalizedInput = normalizeTitle(title);
  return state.guesses.some((guess) => (
    guess.type !== "skip"
    && (
      (movie?.id && guess.id === movie.id)
      || normalizeTitle(guess.title) === normalizedInput
    )
  ));
}

function buildGuessPayload() {
  const title = elements.input.value.trim();
  if (selectedSuggestion && normalizeTitle(selectedSuggestion.title) === normalizeTitle(title)) {
    return {
      tmdbId: selectedSuggestion.id,
      title,
    };
  }
  return { title };
}

function applyGuessResult(payload, fallbackAttempt = null) {
  const attempt = sanitizeAttempt(fallbackAttempt || {
    ...payload.guess,
    feedbackType: payload.feedback?.type || "",
    feedbackMessage: payload.feedback?.message || "",
    yearDirection: payload.feedback?.yearDirection || "",
  });
  if (!attempt) {
    throw new Error("Invalid guess response");
  }
  state.guesses.push(attempt);

  if (payload.correct) {
    state.status = "won";
    state.answer = sanitizeMovie(payload.answer);
  } else if (state.guesses.length >= MAX_ATTEMPTS || payload.finalAttempt) {
    state.status = "lost";
    state.answer = sanitizeMovie(payload.answer);
  }

  selectedSuggestion = null;
  suggestions = [];
  elements.input.value = "";
  hideSuggestions();
  recordStatsIfNeeded();
  saveState();
  renderGame();
}

async function handleSubmit(event) {
  event.preventDefault();

  if (loadStatus !== "ready") {
    setFormMessage(t("loadingMessage"), "warning");
    return;
  }
  if (state.status !== "playing") {
    return;
  }

  const title = elements.input.value.trim();
  if (!title) {
    setFormMessage(t("invalidEmpty"), "warning");
    return;
  }
  if (isDuplicateGuess(selectedSuggestion, title)) {
    setFormMessage(t("duplicate", { movie: title }), "duplicate");
    return;
  }

  elements.submit.disabled = true;
  elements.skip.disabled = true;
  clearFormMessage();

  try {
    const response = await fetch("/api/movly/guess", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pool: activePool,
        date: todayKey,
        lang,
        attemptNumber: state.guesses.length + 1,
        guess: buildGuessPayload(),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "Guess request failed");
    }
    if (!payload.valid) {
      setFormMessage(payload.message || t("invalidMovie"), "warning");
      elements.submit.disabled = isInteractionLocked();
      return;
    }

    applyGuessResult(payload);
  } catch (error) {
    setFormMessage(error.message || t("invalidMovie"), "warning");
    elements.submit.disabled = isInteractionLocked();
    elements.skip.disabled = isInteractionLocked();
  }
}

async function handleSkip() {
  if (loadStatus !== "ready") {
    setFormMessage(t("loadingMessage"), "warning");
    return;
  }
  if (state.status !== "playing") {
    return;
  }

  elements.submit.disabled = true;
  elements.skip.disabled = true;
  clearFormMessage();
  hideSuggestions();

  try {
    const response = await fetch("/api/movly/guess", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pool: activePool,
        date: todayKey,
        lang,
        attemptNumber: state.guesses.length + 1,
        guess: { skip: true },
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "Skip request failed");
    }
    if (!payload.valid) {
      setFormMessage(payload.message || t("invalidMovie"), "warning");
      elements.submit.disabled = isInteractionLocked();
      elements.skip.disabled = isInteractionLocked();
      return;
    }

    applyGuessResult(payload, { type: "skip", skip: true });
  } catch (error) {
    setFormMessage(error.message || t("invalidMovie"), "warning");
    elements.submit.disabled = isInteractionLocked();
    elements.skip.disabled = isInteractionLocked();
  }
}

function setLanguage(nextLanguage) {
  if (!dictionaries[nextLanguage]) {
    return;
  }
  lang = nextLanguage;
  safeSetItem(LANGUAGE_KEY, lang);
  localizeStaticText();
  hideSuggestions();
  renderGame();
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

  elements.input.placeholder = t("placeholder");
  elements.dateLabel.textContent = formatDateLabel(todayKey);
  elements.languageButtons.forEach((button) => {
    const isActive = button.dataset.lang === lang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
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
      && POOLS.includes(result.pool)
    ));
  const distribution = Array(MAX_ATTEMPTS).fill(0);

  results.forEach((result) => {
    if (result.status === "won") {
      const attemptNumber = Number(result.attempts);
      const safeAttempt = Number.isFinite(attemptNumber) ? attemptNumber : MAX_ATTEMPTS;
      const attemptIndex = Math.max(0, Math.min(MAX_ATTEMPTS - 1, safeAttempt - 1));
      distribution[attemptIndex] += 1;
    }
  });

  const played = results.length;
  const wins = results.filter((result) => result.status === "won").length;
  const winDates = results
    .filter((result) => result.status === "won")
    .map((result) => result.date)
    .sort();
  const winDateSet = new Set(winDates);
  const winDays = [...winDateSet].map(utcDayNumber).sort((a, b) => a - b);

  let bestStreak = 0;
  let runningStreak = 0;
  let previousDay = null;
  winDays.forEach((day) => {
    runningStreak = previousDay !== null && day === previousDay + 1 ? runningStreak + 1 : 1;
    bestStreak = Math.max(bestStreak, runningStreak);
    previousDay = day;
  });

  const playedDays = results.map((result) => utcDayNumber(result.date));
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
  summary.distribution.forEach((count, index) => {
    const row = document.createElement("div");
    row.className = "distribution-row";
    const width = Math.max(8, Math.round((count / maxDistribution) * 100));
    row.innerHTML = `
      <span class="distribution-attempt">${index + 1}</span>
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
  elements.poolButtons.forEach((button) => {
    button.addEventListener("click", () => setPool(button.dataset.pool));
  });
  elements.languageButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
  elements.statsButton.addEventListener("click", openStatsDialog);
  elements.statsCloseButton.addEventListener("click", closeStatsDialog);
  elements.skip.addEventListener("click", handleSkip);
  elements.statsDialog.addEventListener("click", (event) => {
    if (event.target === elements.statsDialog) {
      closeStatsDialog();
    }
  });
  elements.input.addEventListener("input", scheduleSearch);
  elements.input.addEventListener("focus", () => {
    if (suggestions.length) {
      renderSuggestions();
    }
  });
  elements.suggestions.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });
  elements.suggestions.addEventListener("click", (event) => {
    const button = event.target.closest(".movly-suggestion");
    if (button) {
      selectSuggestion(button.dataset.movieId);
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".movly-search-wrap")) {
      hideSuggestions();
    }
  });
  elements.form.addEventListener("submit", handleSubmit);

  renderGame();
  loadDailyPuzzle();
}

init();
