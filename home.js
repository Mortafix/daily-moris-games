const LANGUAGE_KEY = "angle-daily:v1:language";
const ANGLY_PREFIX = "angle-daily:v1";
const COLORY_PREFIX = "colory-daily:v1";

const dictionaries = {
  en: {
    homeTitle: "Daily Games",
    homeSubtitle: "Small daily puzzles for quick guesses",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    dailyDateLabel: "Daily date",
    languageLabel: "Language",
    italianLanguage: "Italian",
    englishLanguage: "English",
    anglyTitle: "Angly",
    anglyDescription: "Guess the daily angle",
    coloryTitle: "Colory",
    coloryDescription: "Match the daily color with RGB sliders",
    playAngly: "Play Angly",
    playColory: "Play Colory",
    ready: "To play",
    inProgress: "In progress",
    completed: "Completed",
    readyAria: "{game}: to play",
    inProgressAria: "{game}: in progress",
    completedAria: "{game}: completed",
  },
  it: {
    homeTitle: "Daily Games",
    homeSubtitle: "Piccoli puzzle giornalieri da giocare al volo",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    dailyDateLabel: "Data del daily",
    languageLabel: "Lingua",
    italianLanguage: "Italiano",
    englishLanguage: "Inglese",
    anglyTitle: "Angly",
    anglyDescription: "Indovina l'angolo del giorno",
    coloryTitle: "Colory",
    coloryDescription: "Ricrea il colore del giorno con gli slider RGB",
    playAngly: "Gioca ad Angly",
    playColory: "Gioca a Colory",
    ready: "Da giocare",
    inProgress: "In corso",
    completed: "Completato",
    readyAria: "{game}: da giocare",
    inProgressAria: "{game}: in corso",
    completedAria: "{game}: completato",
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
  completed: {
    icon: "fa-solid fa-circle-check",
    labelKey: "completed",
    ariaKey: "completedAria",
  },
};

const elements = {
  html: document.documentElement,
  dateLabel: document.querySelector("#dateLabel"),
  languageButtons: [...document.querySelectorAll(".language-button")],
  anglyStatus: document.querySelector("#anglyStatus"),
  coloryStatus: document.querySelector("#coloryStatus"),
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

function getGameStatus(prefix) {
  const states = ["easy", "hard"].map((mode) => loadDailyState(prefix, mode)).filter(Boolean);
  if (states.some((state) => state.status === "won" || state.status === "lost")) {
    return "completed";
  }
  if (states.some((state) => Array.isArray(state.guesses) && state.guesses.length > 0)) {
    return "inProgress";
  }
  return "ready";
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
