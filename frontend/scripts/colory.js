const MAX_ATTEMPTS = 5;
const EASY_TOLERANCE = 5;
const STORAGE_PREFIX = "colory-daily:v1";
const LANGUAGE_KEY = "angle-daily:v1:language";
const STATS_KEY = `${STORAGE_PREFIX}:stats`;

const dictionaries = {
  en: {
    title: "Colory",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    navTimely: "Timely",
    navMovly: "Movly",
    navMenu: "Games",
    dailyDateLabel: "Daily date",
    italianLanguage: "Italian",
    englishLanguage: "English",
    easy: "Easy",
    hard: "Hard",
    ready: "Match the daily color",
    modeLegendTitle: "Modes",
    easyLegend: "win when every channel is within ±5.",
    hardLegend: "guess the exact RGB values.",
    yourGuess: "Your guess",
    guessButton: "Guess",
    attemptsLabel: "Attempts",
    previousGuesses: "Previous guesses",
    targetColorLabel: "Target color",
    difficultyLabel: "Difficulty",
    languageLabel: "Language",
    openStats: "Open statistics",
    closeStats: "Close statistics",
    higher: "Higher",
    lower: "Lower",
    correct: "Correct! The color was {color}.",
    lost: "Out of guesses. The color was {color}.",
    locked: "Come back tomorrow for a new color.",
    invalidRange: "Use whole numbers from 0 to 255 for R, G, and B",
    duplicate: "You already tried {color}",
    cold: "Cold",
    warm: "Warm",
    hot: "Hot",
    veryHot: "Very hot",
    exact: "Exact",
    inRange: "In range",
    attemptEmpty: "empty",
    attemptWrong: "wrong",
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
    title: "Colory",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    navTimely: "Timely",
    navMovly: "Movly",
    navMenu: "Giochi",
    dailyDateLabel: "Data del daily",
    italianLanguage: "Italiano",
    englishLanguage: "Inglese",
    easy: "Facile",
    hard: "Difficile",
    ready: "Ricrea il colore del giorno",
    modeLegendTitle: "Modalità",
    easyLegend: "vinci quando ogni canale è entro ±5.",
    hardLegend: "indovina i valori RGB esatti.",
    yourGuess: "Il tuo colore",
    guessButton: "Prova",
    attemptsLabel: "Tentativi",
    previousGuesses: "Tentativi precedenti",
    targetColorLabel: "Colore da indovinare",
    difficultyLabel: "Difficoltà",
    languageLabel: "Lingua",
    openStats: "Apri statistiche",
    closeStats: "Chiudi statistiche",
    higher: "Più alto",
    lower: "Più basso",
    correct: "Esatto! Il colore era {color}.",
    lost: "Tentativi finiti. Il colore era {color}.",
    locked: "Torna domani per un nuovo colore.",
    invalidRange: "Usa numeri interi da 0 a 255 per R, G e B",
    duplicate: "Hai già provato {color}",
    cold: "Freddo",
    warm: "Tiepido",
    hot: "Caldo",
    veryHot: "Bollente",
    exact: "Esatto",
    inRange: "Nel range",
    attemptEmpty: "vuoto",
    attemptWrong: "errato",
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
  ready: "fa-solid fa-palette",
  won: "fa-solid fa-circle-check",
  lost: "fa-solid fa-circle-xmark",
  warning: "fa-solid fa-triangle-exclamation",
  duplicate: "fa-solid fa-rotate-left",
  higher: "fa-solid fa-arrow-up",
  lower: "fa-solid fa-arrow-down",
  cold: "fa-regular fa-snowflake",
  warm: "fa-solid fa-temperature-half",
  hot: "fa-solid fa-fire-flame-curved",
  veryHot: "fa-solid fa-fire",
  exact: "fa-solid fa-check",
  emptyAttempt: "fa-regular fa-circle",
  wrongAttempt: "fa-solid fa-circle-xmark",
  winAttempt: "fa-solid fa-circle-check",
  lossAttempt: "fa-solid fa-circle-xmark",
};

const channelNames = ["r", "g", "b"];

const elements = {
  html: document.documentElement,
  dateLabel: document.querySelector("#dateLabel"),
  modeButtons: [...document.querySelectorAll(".mode-button")],
  languageButtons: [...document.querySelectorAll(".language-button")],
  statsButton: document.querySelector("#statsButton"),
  statsCloseButton: document.querySelector("#statsCloseButton"),
  statsDialog: document.querySelector("#statsDialog"),
  targetSwatch: document.querySelector("#targetSwatch"),
  guessPreview: document.querySelector("#guessPreview"),
  statusStrip: document.querySelector("#statusStrip"),
  statusCopy: document.querySelector(".status-copy"),
  statusIcon: document.querySelector("#statusIcon"),
  statusText: document.querySelector("#statusText"),
  attemptDots: document.querySelector("#attemptDots"),
  form: document.querySelector("#colorForm"),
  formMessage: document.querySelector("#formMessage"),
  formMessageIcon: document.querySelector("#formMessageIcon"),
  formMessageText: document.querySelector("#formMessageText"),
  guessList: document.querySelector("#guessList"),
  sliders: [...document.querySelectorAll(".rgb-slider")],
  numbers: [...document.querySelectorAll(".rgb-number")],
  submit: document.querySelector(".color-submit"),
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
const targets = {
  easy: createDailyTarget(todayKey, "easy"),
  hard: createDailyTarget(todayKey, "hard"),
};

let activeMode = "easy";
let state = loadState(activeMode);

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

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createDailyTarget(dateKey, mode) {
  return {
    r: hashString(`${STORAGE_PREFIX}:${dateKey}:${mode}:r`) % 256,
    g: hashString(`${STORAGE_PREFIX}:${dateKey}:${mode}:g`) % 256,
    b: hashString(`${STORAGE_PREFIX}:${dateKey}:${mode}:b`) % 256,
  };
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
    guesses: [],
    status: "playing",
    statsRecorded: false,
  };
}

function sanitizeColor(color) {
  if (!color || typeof color !== "object") {
    return null;
  }
  const parsed = {};
  for (const channel of channelNames) {
    if (!Number.isInteger(color[channel]) || color[channel] < 0 || color[channel] > 255) {
      return null;
    }
    parsed[channel] = color[channel];
  }
  return parsed;
}

function loadState(mode) {
  try {
    const saved = JSON.parse(safeGetItem(storageKey(mode)));
    const validStatus = ["playing", "won", "lost"].includes(saved?.status)
      ? saved.status
      : "playing";
    if (saved?.date === todayKey && saved?.mode === mode && Array.isArray(saved.guesses)) {
      return {
        ...emptyState(mode),
        ...saved,
        status: validStatus,
        guesses: saved.guesses.map(sanitizeColor).filter(Boolean).slice(0, MAX_ATTEMPTS),
        statsRecorded: validStatus === "playing" ? false : Boolean(saved.statsRecorded),
      };
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
      attempts: Math.min(state.guesses.length, MAX_ATTEMPTS),
    };
    saveStats(stats);
  }

  state.statsRecorded = true;
  saveState();
}

function colorToCss(color) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function colorToText(color) {
  return `RGB(${color.r}, ${color.g}, ${color.b})`;
}

function parseChannel(value) {
  const trimmed = String(value).trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const number = Number(trimmed);
  return Number.isInteger(number) && number >= 0 && number <= 255 ? number : null;
}

function readCurrentGuess() {
  const guess = {};
  for (const channel of channelNames) {
    const input = elements.numbers.find((node) => node.dataset.channel === channel);
    const value = parseChannel(input.value);
    if (value === null) {
      return null;
    }
    guess[channel] = value;
  }
  return guess;
}

function sameColor(first, second) {
  return channelNames.every((channel) => first[channel] === second[channel]);
}

function getDistance(guess, target) {
  return Math.max(...channelNames.map((channel) => Math.abs(guess[channel] - target[channel])));
}

function isWinningGuess(guess, target) {
  if (activeMode === "hard") {
    return sameColor(guess, target);
  }
  return channelNames.every((channel) => Math.abs(guess[channel] - target[channel]) <= EASY_TOLERANCE);
}

function getHintKey(distance) {
  if (distance === 0) return "exact";
  if (distance <= 5) return "veryHot";
  if (distance <= 16) return "hot";
  if (distance <= 40) return "warm";
  return "cold";
}

function getDirectionKey(value, target) {
  return value < target ? "higher" : "lower";
}

function iconMarkup(iconKey) {
  return `<i class="${iconClasses[iconKey] ?? iconClasses.ready}" aria-hidden="true"></i>`;
}

function feedbackIconMarkup(iconKey) {
  return `<span class="color-feedback-icon is-${iconKey}">${iconMarkup(iconKey)}</span>`;
}

function channelIconMarkup(channel) {
  return `<span class="color-channel-icon is-${channel}"><i class="fa-solid fa-circle" aria-hidden="true"></i></span>`;
}

function badgeMarkup(badge) {
  const icons = badge.directionKey
    ? `${feedbackIconMarkup(badge.directionKey)}${feedbackIconMarkup(badge.key)}`
    : feedbackIconMarkup(badge.key);
  return `
    <span class="feedback-badge color-feedback-badge" aria-label="${badge.channel.toUpperCase()} ${badge.label}">
      <span class="channel-pill is-${badge.channel}">${badge.channel.toUpperCase()}</span>
      <span class="channel-value">${badge.value}</span>
      <span class="color-feedback-icons">${icons}</span>
    </span>
  `;
}

function getColorFeedback(guess) {
  const target = targets[activeMode];
  return channelNames.map((channel) => {
    const distance = Math.abs(guess[channel] - target[channel]);
    const key = getHintKey(distance);
    const isResolved = activeMode === "easy" ? distance <= EASY_TOLERANCE : distance === 0;
    if (isResolved) {
      return {
        channel,
        value: guess[channel],
        key: "exact",
        label: activeMode === "easy" ? t("inRange") : t("exact"),
      };
    }
    const directionKey = getDirectionKey(guess[channel], target[channel]);
    return {
      channel,
      value: guess[channel],
      key,
      directionKey,
      label: `${t(directionKey)} · ${t(key)}`,
    };
  });
}

function getStatusFeedback() {
  const target = targets[activeMode];
  if (state.status === "won") {
    return {
      iconKey: "won",
      badges: [],
      text: `${t("correct", { color: colorToText(target) })} ${t("locked")}`,
    };
  }
  if (state.status === "lost") {
    return {
      iconKey: "lost",
      badges: [],
      text: `${t("lost", { color: colorToText(target) })} ${t("locked")}`,
    };
  }
  if (state.guesses.length === 0) {
    return {
      iconKey: "ready",
      badges: [],
      text: t("ready"),
    };
  }
  return {
    iconKey: "ready",
    badges: getColorFeedback(state.guesses[state.guesses.length - 1]),
    text: "",
  };
}

function syncControl(channel, value) {
  const normalized = Math.max(0, Math.min(255, Number(value) || 0));
  elements.sliders
    .filter((input) => input.dataset.channel === channel)
    .forEach((input) => {
      input.value = String(normalized);
    });
  elements.numbers
    .filter((input) => input.dataset.channel === channel)
    .forEach((input) => {
      input.value = String(normalized);
    });
  updatePreview();
}

function updatePreview() {
  const color = readCurrentGuess() ?? { r: 0, g: 0, b: 0 };
  elements.guessPreview.style.background = colorToCss(color);
}

function renderAttempts() {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < MAX_ATTEMPTS; index += 1) {
    const attempt = document.createElement("span");
    let iconKey = "emptyAttempt";
    let label = t("attemptEmpty");

    if (index < state.guesses.length) {
      iconKey = "wrongAttempt";
      label = t("attemptWrong");
    }
    if (index === state.guesses.length - 1 && state.status === "won") {
      iconKey = "winAttempt";
      label = t("attemptWin");
    }
    if (index === MAX_ATTEMPTS - 1 && state.status === "lost") {
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

function renderGuessList() {
  const fragment = document.createDocumentFragment();

  state.guesses.forEach((guess, index) => {
    const item = document.createElement("li");
    item.className = "color-guess-item";
    item.innerHTML = `
      <span class="guess-index">${index + 1}</span>
      <span class="mini-swatch" style="background: ${colorToCss(guess)}"></span>
      <span class="guess-feedback">${getColorFeedback(guess).map(badgeMarkup).join("")}</span>
    `;
    fragment.append(item);
  });

  for (let index = state.guesses.length; index < MAX_ATTEMPTS; index += 1) {
    const empty = document.createElement("li");
    empty.className = "empty-guess";
    empty.setAttribute("aria-hidden", "true");
    empty.innerHTML = iconMarkup("emptyAttempt");
    fragment.append(empty);
  }

  elements.guessList.replaceChildren(fragment);
}

function setFormMessage(message, iconKey = "warning") {
  elements.formMessageIcon.className = iconClasses[iconKey] ?? iconClasses.warning;
  elements.formMessageText.textContent = message;
  elements.formMessage.classList.toggle("is-visible", Boolean(message));
}

function clearFormMessage() {
  setFormMessage("", "warning");
}

function renderGame() {
  recordStatsIfNeeded();

  const target = targets[activeMode];
  const isLocked = state.status !== "playing";
  const status = getStatusFeedback();

  elements.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === activeMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  elements.targetSwatch.style.background = colorToCss(target);
  elements.html.dataset.mode = activeMode;
  renderAttempts();
  renderGuessList();
  renderStats();

  elements.statusCopy.classList.toggle("is-badged", status.badges.length > 0);
  elements.statusIcon.className = iconClasses[status.iconKey] ?? iconClasses.ready;
  if (status.badges.length > 0) {
    elements.statusText.innerHTML = status.badges.map(badgeMarkup).join("");
  } else {
    elements.statusText.textContent = status.text;
  }

  elements.statusStrip.classList.toggle("is-win", state.status === "won");
  elements.statusStrip.classList.toggle("is-loss", state.status === "lost");
  elements.submit.disabled = isLocked;
  [...elements.sliders, ...elements.numbers].forEach((input) => {
    input.disabled = isLocked;
  });
  clearFormMessage();
}

function setMode(mode) {
  activeMode = mode;
  state = loadState(mode);
  renderGame();
}

function handleSubmit(event) {
  event.preventDefault();

  if (state.status !== "playing") {
    return;
  }

  const guess = readCurrentGuess();
  if (!guess) {
    setFormMessage(t("invalidRange"), "warning");
    return;
  }

  if (state.guesses.some((previous) => sameColor(previous, guess))) {
    setFormMessage(t("duplicate", { color: colorToText(guess) }), "duplicate");
    return;
  }

  state.guesses.push(guess);

  if (isWinningGuess(guess, targets[activeMode])) {
    state.status = "won";
  } else if (state.guesses.length >= MAX_ATTEMPTS) {
    state.status = "lost";
  }

  recordStatsIfNeeded();
  saveState();
  renderGame();
}

function setLanguage(nextLanguage) {
  if (!dictionaries[nextLanguage]) {
    return;
  }
  lang = nextLanguage;
  safeSetItem(LANGUAGE_KEY, lang);
  localizeStaticText();
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

  elements.dateLabel.textContent = formatDateLabel(todayKey);
  elements.languageButtons.forEach((button) => {
    const isActive = button.dataset.lang === lang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function formatDateLabel(dateKey) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  return new Intl.DateTimeFormat(lang, {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
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
  const distribution = Array(MAX_ATTEMPTS).fill(0);
  const dateSummary = new Map();

  results.forEach((result) => {
    if (!dateSummary.has(result.date)) {
      dateSummary.set(result.date, { played: true, won: false });
    }
    if (result.status === "won") {
      dateSummary.get(result.date).won = true;
      const attemptNumber = Number(result.attempts);
      const safeAttempt = Number.isFinite(attemptNumber) ? attemptNumber : MAX_ATTEMPTS;
      const attemptIndex = Math.max(0, Math.min(MAX_ATTEMPTS - 1, safeAttempt - 1));
      distribution[attemptIndex] += 1;
    }
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

function initControls() {
  [...elements.sliders, ...elements.numbers].forEach((input) => {
    input.addEventListener("input", () => {
      const parsed = parseChannel(input.value);
      if (parsed === null) {
        updatePreview();
        return;
      }
      syncControl(input.dataset.channel, parsed);
    });
    input.addEventListener("change", () => {
      const parsed = parseChannel(input.value);
      syncControl(input.dataset.channel, parsed === null ? 0 : parsed);
    });
  });
}

function init() {
  localizeStaticText();
  initControls();
  updatePreview();

  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });
  elements.languageButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
  elements.statsButton.addEventListener("click", openStatsDialog);
  elements.statsCloseButton.addEventListener("click", closeStatsDialog);
  elements.statsDialog.addEventListener("click", (event) => {
    if (event.target === elements.statsDialog) {
      closeStatsDialog();
    }
  });
  elements.form.addEventListener("submit", handleSubmit);

  renderGame();
}

init();
