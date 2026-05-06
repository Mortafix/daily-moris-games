const MAX_ATTEMPTS = 4;
const CENTER = 180;
const OUTER_RADIUS = 132;
const ARC_RADIUS = 86;
const SECTOR_RADIUS = 78;
const STORAGE_PREFIX = "angle-daily:v1";
const LANGUAGE_KEY = `${STORAGE_PREFIX}:language`;
const STATS_KEY = `${STORAGE_PREFIX}:stats`;

const dictionaries = {
  en: {
    title: "Angly",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    navTimely: "Timely",
    navMovly: "Movly",
    dailyDateLabel: "Daily date",
    italianLanguage: "Italian",
    englishLanguage: "English",
    easy: "Easy",
    hard: "Hard",
    ready: "Make your first guess",
    guessLabel: "Degrees",
    guessButton: "Guess",
    attemptsLabel: "Attempts",
    previousGuesses: "Previous guesses",
    angleTitle: "Daily angle",
    angleDesc: "An angle to guess",
    difficultyLabel: "Difficulty",
    languageLabel: "Language",
    openStats: "Open statistics",
    closeStats: "Close statistics",
    higher: "Higher",
    lower: "Lower",
    correct: "Correct! The angle was {angle}°.",
    lost: "Out of guesses.. the angle was {angle}°.",
    invalidEmpty: "Enter a whole number from 0 to 360",
    invalidRange: "Use a whole number from 0 to 360",
    duplicate: "You already tried {angle}°",
    locked: "Come back tomorrow for a new angle.",
    cold: "Cold",
    warm: "Warm",
    hot: "Hot",
    veryHot: "Very hot",
    exact: "Exact",
    guessFeedback: "{direction} · {hint}",
    guessFeedbackHard: "{direction}",
    placeholder: "0-360",
    attemptEmpty: "empty",
    attemptUsed: "used",
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
    title: "Angly",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    navTimely: "Timely",
    navMovly: "Movly",
    dailyDateLabel: "Data del daily",
    italianLanguage: "Italiano",
    englishLanguage: "Inglese",
    easy: "Facile",
    hard: "Difficile",
    ready: "Fai il primo tentativo",
    guessLabel: "Gradi",
    guessButton: "Prova",
    attemptsLabel: "Tentativi",
    previousGuesses: "Tentativi precedenti",
    angleTitle: "Angolo del giorno",
    angleDesc: "Un angolo da indovinare",
    difficultyLabel: "Difficoltà",
    languageLabel: "Lingua",
    openStats: "Apri statistiche",
    closeStats: "Chiudi statistiche",
    higher: "Più alto",
    lower: "Più basso",
    correct: "Esatto! L'angolo era {angle}°.",
    lost: "Tentativi finiti.. l'angolo era {angle}°.",
    invalidEmpty: "Inserisci un numero intero da 0 a 360",
    invalidRange: "Usa un numero intero da 0 a 360",
    duplicate: "Hai già provato {angle}°",
    locked: "Torna domani per un nuovo angolo.",
    cold: "Freddo",
    warm: "Tiepido",
    hot: "Caldo",
    veryHot: "Bollente",
    exact: "Esatto",
    guessFeedback: "{direction} · {hint}",
    guessFeedbackHard: "{direction}",
    placeholder: "0-360",
    attemptEmpty: "vuoto",
    attemptUsed: "usato",
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
  ready: "fa-solid fa-bullseye",
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
  usedAttempt: "fa-solid fa-circle-dot",
  wrongAttempt: "fa-solid fa-circle-xmark",
  winAttempt: "fa-solid fa-circle-check",
  lossAttempt: "fa-solid fa-circle-xmark",
};

const elements = {
  html: document.documentElement,
  dateLabel: document.querySelector("#dateLabel"),
  modeButtons: [...document.querySelectorAll(".mode-button")],
  languageButtons: [...document.querySelectorAll(".language-button")],
  statsButton: document.querySelector("#statsButton"),
  statsCloseButton: document.querySelector("#statsCloseButton"),
  statsDialog: document.querySelector("#statsDialog"),
  angleStage: document.querySelector("#angleStage"),
  angleTitle: document.querySelector("#angleTitle"),
  angleDesc: document.querySelector("#angleDesc"),
  sector: document.querySelector("#angleSector"),
  arc: document.querySelector("#angleArc"),
  targetRay: document.querySelector("#targetRay"),
  statusStrip: document.querySelector("#statusStrip"),
  statusCopy: document.querySelector(".status-copy"),
  statusIcon: document.querySelector("#statusIcon"),
  statusText: document.querySelector("#statusText"),
  attemptDots: document.querySelector("#attemptDots"),
  form: document.querySelector("#guessForm"),
  input: document.querySelector("#guessInput"),
  submit: document.querySelector(".guess-button"),
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
  return dictionaries[saved] ? saved : detectLanguage();
}

function detectLanguage() {
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

function createDailyTarget(dateKey, mode) {
  return hashString(`${STORAGE_PREFIX}:${dateKey}:${mode}:angle`) % 360;
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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

function sanitizeGuesses(guesses) {
  return guesses
    .filter(Number.isInteger)
    .map(normalizeAngle)
    .filter((guess) => guess >= 0 && guess < 360)
    .slice(0, MAX_ATTEMPTS);
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
        guesses: sanitizeGuesses(saved.guesses),
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

function normalizeAngle(value) {
  return value === 360 ? 0 : value;
}

function displayAngle(value) {
  return value === 0 ? "0/360" : String(value);
}

function parseGuess(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { ok: false, message: t("invalidEmpty"), icon: "warning" };
  }

  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, message: t("invalidRange"), icon: "warning" };
  }

  const numericValue = Number(trimmed);
  if (!Number.isInteger(numericValue) || numericValue < 0 || numericValue > 360) {
    return { ok: false, message: t("invalidRange"), icon: "warning" };
  }

  return { ok: true, value: normalizeAngle(numericValue), entered: numericValue };
}

function getDistance(guess, target) {
  const distance = Math.abs(guess - target);
  return Math.min(distance, 360 - distance);
}

function getHintKey(distance) {
  if (distance === 0) return "exact";
  if (distance <= 3) return "veryHot";
  if (distance <= 10) return "hot";
  if (distance <= 25) return "warm";
  return "cold";
}

function getDirectionKey(guess, target) {
  return guess < target ? "higher" : "lower";
}

function getGuessFeedbackParts(guess) {
  const target = targets[activeMode];
  if (guess === target) {
    return {
      text: t("exact"),
      iconKeys: ["exact"],
      badges: [{ key: "exact", label: t("exact") }],
    };
  }

  const directionKey = getDirectionKey(guess, target);
  if (activeMode === "hard") {
    return {
      text: t("guessFeedbackHard", { direction: t(directionKey) }),
      iconKeys: [directionKey],
      badges: [{ key: directionKey, label: t(directionKey) }],
    };
  }

  const hintKey = getHintKey(getDistance(guess, target));
  return {
    text: t("guessFeedback", {
      direction: t(directionKey),
      hint: t(hintKey),
    }),
    iconKeys: [directionKey, hintKey],
    badges: [
      { key: directionKey, label: t(directionKey) },
      { key: hintKey, label: t(hintKey) },
    ],
  };
}

function getStatusFeedback() {
  const target = targets[activeMode];
  if (state.status === "won") {
    return {
      iconKey: "won",
      badges: [],
      text: `${t("correct", { angle: displayAngle(target) })} ${t("locked")}`,
    };
  }
  if (state.status === "lost") {
    return {
      iconKey: "lost",
      badges: [],
      text: `${t("lost", { angle: displayAngle(target) })} ${t("locked")}`,
    };
  }
  if (state.guesses.length === 0) {
    return {
      iconKey: "ready",
      badges: [],
      text: t("ready"),
    };
  }

  const feedback = getGuessFeedbackParts(state.guesses[state.guesses.length - 1]);
  return {
    iconKey: feedback.iconKeys[0],
    badges: feedback.badges,
    text: feedback.text,
  };
}

function iconMarkup(iconKey) {
  return `<i class="${iconClasses[iconKey] ?? iconClasses.ready}" aria-hidden="true"></i>`;
}

function badgeMarkup(badge) {
  return `
    <span class="feedback-badge is-${badge.key}">
      ${iconMarkup(badge.key)}
      <span>${badge.label}</span>
    </span>
  `;
}

function polarPoint(radius, angle) {
  const radians = (-angle * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

function createArcPath(radius, angle) {
  if (angle === 0) {
    return "";
  }

  if (angle === 359) {
    const start = polarPoint(radius, 0);
    const mid = polarPoint(radius, 180);
    const end = polarPoint(radius, 359);
    return [
      `M ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
      `A ${radius} ${radius} 0 1 0 ${mid.x.toFixed(3)} ${mid.y.toFixed(3)}`,
      `A ${radius} ${radius} 0 1 0 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
    ].join(" ");
  }

  const start = polarPoint(radius, 0);
  const end = polarPoint(radius, angle);
  const largeArc = angle > 180 ? 1 : 0;
  return [
    `M ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
  ].join(" ");
}

function createSectorPath(radius, angle) {
  if (angle === 0) {
    return "";
  }

  const start = polarPoint(radius, 0);
  const end = polarPoint(radius, angle);
  const largeArc = angle > 180 ? 1 : 0;
  return [
    `M ${CENTER} ${CENTER}`,
    `L ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
    "Z",
  ].join(" ");
}

function drawAngle(angle) {
  const targetPoint = polarPoint(OUTER_RADIUS, angle);
  elements.targetRay.setAttribute("x2", targetPoint.x.toFixed(3));
  elements.targetRay.setAttribute("y2", targetPoint.y.toFixed(3));
  elements.arc.setAttribute("d", createArcPath(ARC_RADIUS, angle));
  elements.sector.setAttribute("d", createSectorPath(SECTOR_RADIUS, angle));
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
    const feedback = getGuessFeedbackParts(guess);
    const item = document.createElement("li");
    item.className = "guess-item";
    item.innerHTML = `
      <span class="guess-index">${index + 1}</span>
      <span class="guess-value">${displayAngle(guess)}°</span>
      <span class="guess-feedback">
        ${feedback.badges.map(badgeMarkup).join("")}
      </span>
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
  elements.angleStage.dataset.mode = activeMode;
  elements.html.dataset.mode = activeMode;

  drawAngle(target);
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
  elements.input.disabled = isLocked;
  elements.submit.disabled = isLocked;
  clearFormMessage();

  if (!isLocked) {
    elements.input.focus({ preventScroll: true });
  }
}

function setMode(mode) {
  activeMode = mode;
  state = loadState(mode);
  renderGame();
}

function setFormMessage(message, iconKey = "warning") {
  elements.formMessageIcon.className = iconClasses[iconKey] ?? iconClasses.warning;
  elements.formMessageText.textContent = message;
  elements.formMessage.classList.toggle("is-visible", Boolean(message));
}

function clearFormMessage() {
  setFormMessage("", "warning");
}

function handleSubmit(event) {
  event.preventDefault();

  if (state.status !== "playing") {
    return;
  }

  const parsed = parseGuess(elements.input.value);
  if (!parsed.ok) {
    setFormMessage(parsed.message, parsed.icon);
    return;
  }

  const guess = parsed.value;
  if (state.guesses.includes(guess)) {
    setFormMessage(t("duplicate", { angle: displayAngle(guess) }), "duplicate");
    elements.input.select();
    return;
  }

  state.guesses.push(guess);

  if (guess === targets[activeMode]) {
    state.status = "won";
  } else if (state.guesses.length >= MAX_ATTEMPTS) {
    state.status = "lost";
  }

  recordStatsIfNeeded();
  saveState();
  elements.input.value = "";
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

  elements.angleTitle.textContent = t("angleTitle");
  elements.angleDesc.textContent = t("angleDesc");
  elements.input.placeholder = t("placeholder");
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

function init() {
  localizeStaticText();
  elements.dateLabel.textContent = formatDateLabel(todayKey);

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
