const LANGUAGE_KEY = "angle-daily:v1:language";
const ANGLY_PREFIX = "angle-daily:v1";
const COLORY_PREFIX = "colory-daily:v1";
const TIMELY_PREFIX = "timely-daily:v1";
const MOVLY_PREFIX = "movly-daily:v1";

const dictionaries = {
  en: {
    homeTitle: "Daily Games",
    homeSubtitle: "Small daily puzzles for quick guesses",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    navTimely: "Timely",
    navMovly: "Movly",
    navMenu: "Games",
    dailyDateLabel: "Daily date",
    languageLabel: "Language",
    italianLanguage: "Italian",
    englishLanguage: "English",
    anglyTitle: "Angly",
    anglyDescription: "Guess the daily angle",
    coloryTitle: "Colory",
    coloryDescription: "Match the daily color",
    timelyTitle: "Timely",
    timelyDescription: "Order today's historical events",
    movlyTitle: "Movly",
    movlyDescription: "Guess the daily movie from emoji",
    playAngly: "Play Angly",
    playColory: "Play Colory",
    playTimely: "Play Timely",
    playMovly: "Play Movly",
    ready: "To play",
    inProgress: "In progress",
    won: "Won",
    lost: "Lost",
    readyAria: "{game}: to play",
    inProgressAria: "{game}: in progress",
    wonAria: "{game}: won",
    lostAria: "{game}: lost",
  },
  it: {
    homeTitle: "Daily Games",
    homeSubtitle: "Piccoli puzzle giornalieri da giocare al volo",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    navTimely: "Timely",
    navMovly: "Movly",
    navMenu: "Giochi",
    dailyDateLabel: "Data del daily",
    languageLabel: "Lingua",
    italianLanguage: "Italiano",
    englishLanguage: "Inglese",
    anglyTitle: "Angly",
    anglyDescription: "Indovina l'angolo del giorno",
    coloryTitle: "Colory",
    coloryDescription: "Ricrea il colore del giorno",
    timelyTitle: "Timely",
    timelyDescription: "Ordina gli eventi storici di oggi",
    movlyTitle: "Movly",
    movlyDescription: "Indovina il film del giorno dalle emoji",
    playAngly: "Gioca ad Angly",
    playColory: "Gioca a Colory",
    playTimely: "Gioca a Timely",
    playMovly: "Gioca a Movly",
    ready: "Da giocare",
    inProgress: "In corso",
    won: "Vinto",
    lost: "Perso",
    readyAria: "{game}: da giocare",
    inProgressAria: "{game}: in corso",
    wonAria: "{game}: vinto",
    lostAria: "{game}: perso",
  },
};

const statusConfig = {
  ready: {
    icon: "fa-regular fa-circle-play",
    labelKey: "ready",
    ariaKey: "readyAria",
  },
  inProgress: {
    icon: "fa-solid fa-hourglass-half",
    labelKey: "inProgress",
    ariaKey: "inProgressAria",
  },
  won: {
    icon: "fa-solid fa-circle-check",
    labelKey: "won",
    ariaKey: "wonAria",
  },
  lost: {
    icon: "fa-solid fa-circle-xmark",
    labelKey: "lost",
    ariaKey: "lostAria",
  },
};

const elements = {
  html: document.documentElement,
  dateLabel: document.querySelector("#dateLabel"),
  languageButtons: [...document.querySelectorAll(".language-button")],
  anglyStatus: document.querySelector("#anglyStatus"),
  coloryStatus: document.querySelector("#coloryStatus"),
  timelyStatus: document.querySelector("#timelyStatus"),
  movlyStatus: document.querySelector("#movlyStatus"),
};

let lang = getInitialLanguage();
const todayKey = new Date().toISOString().slice(0, 10);

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

function formatDateLabel(dateKey) {
  return new Intl.DateTimeFormat(lang, {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

function loadDailyState(prefix, mode) {
  try {
    const state = JSON.parse(safeGetItem(`${prefix}:${todayKey}:${mode}`));
    return state?.date === todayKey && state?.mode === mode ? state : null;
  } catch (error) {
    return null;
  }
}

function loadTimelyState() {
  try {
    const state = JSON.parse(safeGetItem(`${TIMELY_PREFIX}:${todayKey}`));
    return state?.date === todayKey ? state : null;
  } catch (error) {
    return null;
  }
}

function getStatusSummary(states, isInProgress) {
  if (states.some((state) => state.status === "won")) {
    return "won";
  }
  if (states.some((state) => state.status === "lost")) {
    return "lost";
  }
  if (states.some(isInProgress)) {
    return "inProgress";
  }
  return "ready";
}

function getGameStatus(prefix) {
  const states = ["easy", "hard"].map((mode) => loadDailyState(prefix, mode)).filter(Boolean);
  return getStatusSummary(
    states,
    (state) => Array.isArray(state.guesses) && state.guesses.length > 0,
  );
}

function getTimelyStatus() {
  const state = loadTimelyState();
  if (!state) {
    return "ready";
  }
  return getStatusSummary(
    [state],
    (dailyState) => Array.isArray(dailyState.attempts) && dailyState.attempts.length > 0,
  );
}

function loadMovlyState(pool) {
  try {
    const state = JSON.parse(safeGetItem(`${MOVLY_PREFIX}:${todayKey}:${pool}`));
    return state?.date === todayKey && state?.pool === pool ? state : null;
  } catch (error) {
    return null;
  }
}

function getMovlyStatus() {
  const states = ["best", "trending"].map(loadMovlyState).filter(Boolean);
  return getStatusSummary(
    states,
    (state) => Array.isArray(state.guesses) && state.guesses.length > 0,
  );
}

function renderGameStatus(element, statusKey, gameName) {
  const config = statusConfig[statusKey] ?? statusConfig.ready;
  element.className = `game-status is-${statusKey}`;
  element.setAttribute("aria-label", t(config.ariaKey, { game: gameName }));
  element.innerHTML = `
    <i class="${config.icon}" aria-hidden="true"></i>
    <span>${t(config.labelKey)}</span>
  `;
}

function setLanguage(nextLanguage) {
  if (!dictionaries[nextLanguage]) {
    return;
  }
  lang = nextLanguage;
  safeSetItem(LANGUAGE_KEY, lang);
  render();
}

function render() {
  elements.html.lang = lang;
  document.title = t("homeTitle");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });

  elements.dateLabel.textContent = formatDateLabel(todayKey);
  renderGameStatus(elements.anglyStatus, getGameStatus(ANGLY_PREFIX), t("anglyTitle"));
  renderGameStatus(elements.coloryStatus, getGameStatus(COLORY_PREFIX), t("coloryTitle"));
  renderGameStatus(elements.timelyStatus, getTimelyStatus(), t("timelyTitle"));
  renderGameStatus(elements.movlyStatus, getMovlyStatus(), t("movlyTitle"));

  elements.languageButtons.forEach((button) => {
    const isActive = button.dataset.lang === lang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

elements.languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
});

render();
