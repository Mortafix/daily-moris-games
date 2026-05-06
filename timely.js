const MAX_EVENTS = 5;
const EASY_MAX_ATTEMPTS = 2;
const HARD_MAX_ATTEMPTS = 3;
const STORAGE_PREFIX = "timely-daily:v1";
const LANGUAGE_KEY = "angle-daily:v1:language";
const STATS_KEY = `${STORAGE_PREFIX}:stats`;
const WIKIMEDIA_BASE_URL = "https://api.wikimedia.org/feed/v1/wikipedia";
const API_USER_AGENT = "daily-moris-games/1.0 (local browser game)";

const dictionaries = {
  en: {
    title: "Timely",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    navTimely: "Timely",
    dailyDateLabel: "Daily date",
    italianLanguage: "Italian",
    englishLanguage: "English",
    easy: "Easy",
    hard: "Hard",
    modeLegendTitle: "Modes",
    easyLegend: "2 attempts, with locked correct positions.",
    hardLegend: "3 attempts, with no hints between attempts.",
    ready: "Order events from oldest to newest",
    loading: "Loading today's events",
    loadError: "Could not load today's events. Try again later.",
    loadingMessage: "Events are still loading",
    difficultyLabel: "Difficulty",
    languageLabel: "Language",
    openStats: "Open statistics",
    closeStats: "Close statistics",
    attemptsLabel: "Attempts",
    timelyListLabel: "Timely events",
    attemptHistoryLabel: "Attempt history",
    submitOrder: "Submit order",
    correct: "Correct! Timely solved in {attempts}.",
    lost: "Out of attempts. Here is the correct order.",
    locked: "Come back tomorrow for a new Timely.",
    easyFeedback: "{count}/5 positions are correct",
    hardFeedback: "Order submitted. No hints in hard mode",
    incompleteOrder: "Place all 5 events before submitting",
    moveUp: "Move event {position} up",
    moveDown: "Move event {position} down",
    lockedPosition: "Correct position locked",
    attemptEmpty: "empty",
    attemptWrong: "wrong",
    attemptWin: "correct",
    attemptLoss: "lost",
    attemptAria: "Attempt {index}: {state}",
    attemptNumber: "Attempt {index}",
    correctPosition: "correct position",
    wrongPosition: "wrong position",
    usedPosition: "submitted position",
    statsEyebrow: "Local stats",
    statsTitle: "Statistics",
    statsPlayed: "Played",
    statsWins: "Wins",
    statsWinRate: "Win rate",
    statsCurrentStreak: "Streak",
    statsBestStreak: "Best",
    distributionTitle: "Attempts",
    statsEmpty: "Finish a daily puzzle to start tracking stats",
  },
  it: {
    title: "Timely",
    navHome: "Home",
    navAngly: "Angly",
    navColory: "Colory",
    navTimely: "Timely",
    dailyDateLabel: "Data del daily",
    italianLanguage: "Italiano",
    englishLanguage: "Inglese",
    easy: "Facile",
    hard: "Difficile",
    modeLegendTitle: "Modalita",
    easyLegend: "2 tentativi, con posizioni corrette fissate.",
    hardLegend: "3 tentativi, senza indizi tra un tentativo e l'altro.",
    ready: "Ordina gli eventi dal piu antico al piu recente",
    loading: "Caricamento degli eventi di oggi",
    loadError: "Non riesco a caricare gli eventi di oggi. Riprova piu tardi.",
    loadingMessage: "Gli eventi sono ancora in caricamento",
    difficultyLabel: "Difficolta",
    languageLabel: "Lingua",
    openStats: "Apri statistiche",
    closeStats: "Chiudi statistiche",
    attemptsLabel: "Tentativi",
    timelyListLabel: "Eventi di Timely",
    attemptHistoryLabel: "Storico tentativi",
    submitOrder: "Conferma ordine",
    correct: "Esatto! Timely risolto in {attempts}.",
    lost: "Tentativi finiti. Ecco l'ordine corretto.",
    locked: "Torna domani per un nuovo Timely.",
    easyFeedback: "{count}/5 posizioni sono corrette",
    hardFeedback: "Ordine inviato. Nessun indizio in hard mode",
    incompleteOrder: "Disponi tutti e 5 gli eventi prima di confermare",
    moveUp: "Sposta l'evento {position} in alto",
    moveDown: "Sposta l'evento {position} in basso",
    lockedPosition: "Posizione corretta fissata",
    attemptEmpty: "vuoto",
    attemptWrong: "errato",
    attemptWin: "corretto",
    attemptLoss: "perso",
    attemptAria: "Tentativo {index}: {state}",
    attemptNumber: "Tentativo {index}",
    correctPosition: "posizione corretta",
    wrongPosition: "posizione errata",
    usedPosition: "posizione inviata",
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
  ready: "fa-solid fa-timeline",
  loading: "fa-solid fa-circle-notch fa-spin",
  won: "fa-solid fa-circle-check",
  lost: "fa-solid fa-circle-xmark",
  warning: "fa-solid fa-triangle-exclamation",
  emptyAttempt: "fa-regular fa-circle",
  wrongAttempt: "fa-solid fa-circle-xmark",
  winAttempt: "fa-solid fa-circle-check",
  lossAttempt: "fa-solid fa-circle-xmark",
  up: "fa-solid fa-arrow-up",
  down: "fa-solid fa-arrow-down",
  drag: "fa-solid fa-grip-lines",
  lock: "fa-solid fa-lock",
  exact: "fa-solid fa-check",
  wrong: "fa-solid fa-xmark",
  used: "fa-solid fa-circle-dot",
};

const elements = {
  html: document.documentElement,
  dateLabel: document.querySelector("#dateLabel"),
  modeButtons: [...document.querySelectorAll(".mode-button")],
  languageButtons: [...document.querySelectorAll(".language-button")],
  statsButton: document.querySelector("#statsButton"),
  statsCloseButton: document.querySelector("#statsCloseButton"),
  statsDialog: document.querySelector("#statsDialog"),
  timelyStage: document.querySelector("#timelyStage"),
  timelyLoading: document.querySelector("#timelyLoading"),
  timelyList: document.querySelector("#timelyList"),
  statusStrip: document.querySelector("#statusStrip"),
  statusCopy: document.querySelector(".status-copy"),
  statusIcon: document.querySelector("#statusIcon"),
  statusText: document.querySelector("#statusText"),
  attemptDots: document.querySelector("#attemptDots"),
  attemptHistory: document.querySelector("#attemptHistory"),
  form: document.querySelector("#timelyForm"),
  submit: document.querySelector(".timely-submit"),
  formMessage: document.querySelector("#formMessage"),
  formMessageIcon: document.querySelector("#formMessageIcon"),
  formMessageText: document.querySelector("#formMessageText"),
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
let state = loadState();
let loadStatus = state.events.length === MAX_EVENTS ? "ready" : "idle";
let loadError = "";
let draggedEventId = null;
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

function getDateParts(dateKey) {
  const [, month, day] = dateKey.split("-");
  return { month, day };
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function storageKey() {
  return `${STORAGE_PREFIX}:${todayKey}`;
}

function resultKey(date) {
  return date;
}

function getMaxAttempts(mode = state.mode) {
  return mode === "easy" ? EASY_MAX_ATTEMPTS : HARD_MAX_ATTEMPTS;
}

function emptyState() {
  return {
    date: todayKey,
    mode: "easy",
    status: "playing",
    events: [],
    order: [],
    attempts: [],
    sourceLanguage: "",
    sourceType: "",
    statsRecorded: false,
  };
}

function cleanEventText(value) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().replace(/[;；]+$/u, "").trim()
    : "";
}

function sanitizeEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }
  const seenIds = new Set();
  const seenYears = new Set();
  return events
    .map((event) => ({
      id: typeof event?.id === "string" ? event.id : "",
      year: Number(event?.year),
      text: cleanEventText(event?.text),
    }))
    .filter((event) => {
      if (
        !event.id
        || !Number.isInteger(event.year)
        || !event.text
        || seenIds.has(event.id)
        || seenYears.has(event.year)
      ) {
        return false;
      }
      seenIds.add(event.id);
      seenYears.add(event.year);
      return true;
    })
    .slice(0, MAX_EVENTS);
}

function sanitizeOrder(order, eventIds, seed) {
  if (Array.isArray(order) && order.length === eventIds.length) {
    const unique = new Set(order);
    if (unique.size === eventIds.length && order.every((id) => eventIds.includes(id))) {
      return [...order];
    }
  }
  return shuffleIds(eventIds, seed);
}

function sanitizeAttempts(attempts, eventIds, mode) {
  if (!Array.isArray(attempts) || eventIds.length !== MAX_EVENTS) {
    return [];
  }
  return attempts
    .map((attempt) => ({
      order: sanitizeOrder(attempt?.order, eventIds, "attempt"),
    }))
    .filter((attempt) => attempt.order.length === eventIds.length)
    .slice(0, getMaxAttempts(mode));
}

function getCorrectOrderIdsForEvents(events) {
  return [...events]
    .sort((first, second) => first.year - second.year)
    .map((event) => event.id);
}

function loadState() {
  try {
    const saved = JSON.parse(safeGetItem(storageKey()));
    if (saved?.date !== todayKey) {
      return emptyState();
    }

    const events = sanitizeEvents(saved.events);
    const eventIds = events.map((event) => event.id);
    const status = ["playing", "won", "lost"].includes(saved.status) ? saved.status : "playing";
    const mode = ["easy", "hard"].includes(saved.mode) ? saved.mode : "easy";
    const sourceLanguage = typeof saved.sourceLanguage === "string" ? saved.sourceLanguage : "";
    const sourceType = ["selected", "events"].includes(saved.sourceType) ? saved.sourceType : "";
    const attempts = sanitizeAttempts(saved.attempts, eventIds, mode);
    const validStatus = events.length === MAX_EVENTS ? status : "playing";
    const normalizedStatus =
      validStatus === "playing" && attempts.length >= getMaxAttempts(mode) ? "lost" : validStatus;

    return {
      ...emptyState(),
      mode,
      status: normalizedStatus,
      events,
      order: normalizedStatus === "lost"
        ? getCorrectOrderIdsForEvents(events)
        : sanitizeOrder(saved.order, eventIds, `${todayKey}:${sourceLanguage}:order`),
      attempts,
      sourceLanguage,
      sourceType,
      statsRecorded: normalizedStatus === "playing" ? false : Boolean(saved.statsRecorded),
    };
  } catch (error) {
    safeRemoveItem(storageKey());
    return emptyState();
  }
}

function saveState() {
  safeSetItem(storageKey(), JSON.stringify(state));
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
  const key = resultKey(state.date);
  if (!stats.results[key]) {
    stats.results[key] = {
      date: state.date,
      mode: state.mode,
      status: state.status,
      attempts: Math.min(state.attempts.length, getMaxAttempts()),
    };
    saveStats(stats);
  }

  state.statsRecorded = true;
  saveState();
}

function normalizeApiEvents(payload, sourceType) {
  const list = Array.isArray(payload?.[sourceType]) ? payload[sourceType] : [];
  const seenYears = new Set();
  return list
    .map((item) => {
      const year = Number(item?.year);
      const text = cleanEventText(item?.text);
      if (!Number.isInteger(year) || !text || seenYears.has(year)) {
        return null;
      }
      seenYears.add(year);
      return {
        id: `${year}:${hashString(text)}`,
        year,
        text,
      };
    })
    .filter(Boolean);
}

function chooseDailyEvents(events, seed) {
  const sorted = [...events].sort((first, second) => first.year - second.year);
  if (sorted.length <= MAX_EVENTS) {
    return sorted.slice(0, MAX_EVENTS);
  }

  const selected = [];
  for (let slot = 0; slot < MAX_EVENTS; slot += 1) {
    const start = Math.floor((slot * sorted.length) / MAX_EVENTS);
    const end = Math.max(start, Math.floor(((slot + 1) * sorted.length) / MAX_EVENTS) - 1);
    const width = end - start + 1;
    const offset = hashString(`${seed}:${slot}`) % width;
    selected.push(sorted[start + offset]);
  }

  return selected.sort((first, second) => first.year - second.year);
}

function getCorrectOrderIds() {
  return getCorrectOrderIdsForEvents(state.events);
}

function shuffleIds(ids, seed) {
  const shuffled = [...ids];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = hashString(`${seed}:${index}`) % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  const correct = [...ids];
  if (shuffled.length > 1 && arraysEqual(shuffled, correct)) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  return shuffled;
}

async function fetchDailyPuzzle(requestedLanguage) {
  const languages = [...new Set([requestedLanguage, "it", "en"].filter(Boolean))];
  const { month, day } = getDateParts(todayKey);

  for (const sourceLanguage of languages) {
    for (const sourceType of ["selected", "events"]) {
      try {
        const response = await fetch(
          `${WIKIMEDIA_BASE_URL}/${sourceLanguage}/onthisday/${sourceType}/${month}/${day}`,
          {
            headers: {
              "Api-User-Agent": API_USER_AGENT,
            },
          },
        );

        if (!response.ok) {
          continue;
        }

        const payload = await response.json();
        const events = normalizeApiEvents(payload, sourceType);
        if (events.length >= MAX_EVENTS) {
          return {
            events: chooseDailyEvents(events, `${todayKey}:${sourceLanguage}:${sourceType}`),
            sourceLanguage,
            sourceType,
          };
        }
      } catch (error) {
        continue;
      }
    }
  }

  throw new Error("No playable Wikimedia event set");
}

function shouldKeepSavedPuzzle() {
  if (state.events.length !== MAX_EVENTS) {
    return false;
  }
  return state.attempts.length > 0 || state.status !== "playing" || state.sourceLanguage === lang;
}

async function loadPuzzleForLanguage() {
  const requestId = loadRequestId + 1;
  loadRequestId = requestId;

  if (shouldKeepSavedPuzzle()) {
    loadStatus = "ready";
    loadError = "";
    renderGame();
    return;
  }

  loadStatus = "loading";
  loadError = "";
  renderGame();

  try {
    const puzzle = await fetchDailyPuzzle(lang);
    if (requestId !== loadRequestId) {
      return;
    }

    const nextMode = state.status === "playing" && state.attempts.length === 0 ? state.mode : "easy";
    const eventIds = puzzle.events.map((event) => event.id);
    state = {
      ...emptyState(),
      mode: nextMode,
      events: puzzle.events,
      order: shuffleIds(eventIds, `${todayKey}:${puzzle.sourceLanguage}:${puzzle.sourceType}:order`),
      sourceLanguage: puzzle.sourceLanguage,
      sourceType: puzzle.sourceType,
    };
    saveState();
    loadStatus = "ready";
  } catch (error) {
    if (requestId !== loadRequestId) {
      return;
    }
    loadStatus = "error";
    loadError = t("loadError");
  }

  renderGame();
}

function arraysEqual(first, second) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function getCorrectness(order) {
  const correctOrder = getCorrectOrderIds();
  return order.map((eventId, index) => eventId === correctOrder[index]);
}

function getLockedPositions() {
  if (state.mode !== "easy" || state.status !== "playing" || state.attempts.length === 0) {
    return Array(state.order.length).fill(false);
  }
  return getCorrectness(state.attempts[state.attempts.length - 1].order);
}

function getUnlockedIndexes() {
  const lockedPositions = getLockedPositions();
  return state.order
    .map((eventId, index) => ({ eventId, index }))
    .filter(({ index }) => !lockedPositions[index])
    .map(({ index }) => index);
}

function getMoveTargetIndex(index, direction) {
  const unlockedIndexes = getUnlockedIndexes();
  const unlockedPosition = unlockedIndexes.indexOf(index);
  if (unlockedPosition === -1) {
    return -1;
  }
  const targetPosition = direction === "up" ? unlockedPosition - 1 : unlockedPosition + 1;
  return targetPosition >= 0 && targetPosition < unlockedIndexes.length
    ? unlockedIndexes[targetPosition]
    : -1;
}

function isCorrectOrder(order) {
  return getCorrectness(order).every(Boolean);
}

function isInteractionLocked() {
  return loadStatus !== "ready" || state.events.length !== MAX_EVENTS || state.status !== "playing";
}

function formatAttemptCount(count) {
  if (lang === "it") {
    return count === 1 ? "1 tentativo" : `${count} tentativi`;
  }
  return count === 1 ? "1 attempt" : `${count} attempts`;
}

function formatYear(year) {
  if (year < 0) {
    return lang === "it" ? `${Math.abs(year)} a.C.` : `${Math.abs(year)} BCE`;
  }
  return String(year);
}

function iconMarkup(iconKey) {
  return `<i class="${iconClasses[iconKey] ?? iconClasses.ready}" aria-hidden="true"></i>`;
}

function getStatusFeedback() {
  if (loadStatus === "loading" || loadStatus === "idle") {
    return {
      iconKey: "loading",
      text: t("loading"),
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
      text: `${t("correct", { attempts: formatAttemptCount(state.attempts.length) })} ${t("locked")}`,
    };
  }
  if (state.status === "lost") {
    return {
      iconKey: "lost",
      text: `${t("lost")} ${t("locked")}`,
    };
  }
  if (state.attempts.length === 0) {
    return {
      iconKey: "ready",
      text: t("ready"),
    };
  }

  if (state.mode === "easy") {
    const lastAttempt = state.attempts[state.attempts.length - 1];
    const count = getCorrectness(lastAttempt.order).filter(Boolean).length;
    return {
      iconKey: "ready",
      text: t("easyFeedback", { count }),
    };
  }

  return {
    iconKey: "ready",
    text: t("hardFeedback"),
  };
}

function createIconButton(iconKey, label, direction, disabled) {
  const button = document.createElement("button");
  button.className = "timely-move-button";
  button.type = "button";
  button.dataset.direction = direction;
  button.setAttribute("aria-label", label);
  button.disabled = disabled;
  button.innerHTML = iconMarkup(iconKey);
  return button;
}

function renderTimelyList() {
  const fragment = document.createDocumentFragment();
  const eventById = new Map(state.events.map((event) => [event.id, event]));
  const isLocked = isInteractionLocked();
  const lockedPositions = getLockedPositions();
  const revealYears = state.status !== "playing";

  state.order.forEach((eventId, index) => {
    const event = eventById.get(eventId);
    if (!event) {
      return;
    }

    const item = document.createElement("li");
    const isPositionLocked = lockedPositions[index];
    item.className = "timely-card";
    item.dataset.eventId = event.id;
    item.draggable = !isLocked && !isPositionLocked;
    item.setAttribute(
      "aria-label",
      isPositionLocked ? `${index + 1}. ${event.text}. ${t("lockedPosition")}` : `${index + 1}. ${event.text}`,
    );
    if (revealYears) {
      item.classList.add("is-revealed");
    }
    if (isPositionLocked) {
      item.classList.add("is-locked");
    }

    const position = document.createElement("span");
    position.className = "timely-position";
    if (isPositionLocked) {
      position.setAttribute("aria-label", t("lockedPosition"));
      position.innerHTML = iconMarkup("lock");
    } else {
      position.textContent = String(index + 1);
    }

    const grip = document.createElement("span");
    grip.className = "timely-grip";
    grip.innerHTML = iconMarkup("drag");

    const copy = document.createElement("div");
    copy.className = "timely-event-copy";

    const year = document.createElement("span");
    year.className = "timely-year";
    year.hidden = !revealYears;
    year.textContent = formatYear(event.year);

    const text = document.createElement("p");
    text.className = "timely-event-text";
    text.textContent = event.text;

    copy.append(year, text);

    const actions = document.createElement("div");
    actions.className = "timely-card-actions";
    actions.append(
      createIconButton(
        "up",
        t("moveUp", { position: index + 1 }),
        "up",
        isLocked || isPositionLocked || getMoveTargetIndex(index, "up") === -1,
      ),
      createIconButton(
        "down",
        t("moveDown", { position: index + 1 }),
        "down",
        isLocked || isPositionLocked || getMoveTargetIndex(index, "down") === -1,
      ),
    );

    item.append(position, grip, copy, actions);
    fragment.append(item);
  });

  elements.timelyList.replaceChildren(fragment);
}

function renderAttempts() {
  const fragment = document.createDocumentFragment();
  const maxAttempts = getMaxAttempts();
  for (let index = 0; index < maxAttempts; index += 1) {
    const attempt = document.createElement("span");
    let iconKey = "emptyAttempt";
    let label = t("attemptEmpty");

    if (index < state.attempts.length) {
      iconKey = "wrongAttempt";
      label = t("attemptWrong");
    }
    if (index === state.attempts.length - 1 && state.status === "won") {
      iconKey = "winAttempt";
      label = t("attemptWin");
    }
    if (index === maxAttempts - 1 && state.status === "lost") {
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

function renderAttemptHistory() {
  const fragment = document.createDocumentFragment();
  const showHints = state.mode === "easy";

  state.attempts.forEach((attempt, attemptIndex) => {
    const row = document.createElement("div");
    row.className = "timely-attempt-row";

    const label = document.createElement("span");
    label.className = "timely-attempt-label";
    label.textContent = t("attemptNumber", { index: attemptIndex + 1 });

    const cells = document.createElement("div");
    cells.className = "timely-attempt-cells";

    const correctness = getCorrectness(attempt.order);
    const revealFinalWin = state.status === "won" && attemptIndex === state.attempts.length - 1;
    correctness.forEach((isCorrect, positionIndex) => {
      const cell = document.createElement("span");
      const shouldShowResult = showHints || revealFinalWin;
      const stateKey = shouldShowResult ? (isCorrect ? "exact" : "wrong") : "used";
      const labelKey = shouldShowResult
        ? (isCorrect ? "correctPosition" : "wrongPosition")
        : "usedPosition";
      cell.className = `timely-attempt-cell is-${stateKey}`;
      cell.setAttribute("aria-label", `${positionIndex + 1}: ${t(labelKey)}`);
      cell.innerHTML = iconMarkup(stateKey);
      cells.append(cell);
    });

    row.append(label, cells);
    fragment.append(row);
  });

  elements.attemptHistory.hidden = state.attempts.length === 0;
  elements.attemptHistory.replaceChildren(fragment);
}

function renderGame() {
  recordStatsIfNeeded();

  const hasPuzzle = state.events.length === MAX_EVENTS;
  const isLocked = isInteractionLocked();
  const modeLocked = state.attempts.length > 0 || state.status !== "playing";
  const status = getStatusFeedback();

  elements.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === state.mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.disabled = modeLocked || loadStatus === "loading";
  });

  elements.html.dataset.mode = state.mode;
  elements.timelyStage.classList.toggle("is-loading", loadStatus === "loading" || loadStatus === "idle");
  elements.timelyStage.classList.toggle("is-error", loadStatus === "error");
  elements.timelyStage.classList.toggle("is-revealed", state.status !== "playing");
  elements.timelyLoading.hidden = loadStatus !== "loading" && loadStatus !== "idle";

  renderTimelyList();
  renderAttempts();
  renderAttemptHistory();
  renderStats();

  elements.statusCopy.classList.remove("is-badged");
  elements.statusIcon.className = iconClasses[status.iconKey] ?? iconClasses.ready;
  elements.statusText.textContent = status.text;
  elements.statusStrip.classList.toggle("is-win", state.status === "won");
  elements.statusStrip.classList.toggle("is-loss", state.status === "lost" || loadStatus === "error");

  elements.submit.disabled = isLocked || !hasPuzzle;
  elements.timelyList.classList.toggle("is-disabled", isLocked);
  clearFormMessage();
}

function setMode(mode) {
  if (!["easy", "hard"].includes(mode) || state.attempts.length > 0 || state.status !== "playing") {
    return;
  }
  state.mode = mode;
  saveState();
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

function moveEvent(eventId, direction) {
  if (isInteractionLocked()) {
    return;
  }
  const index = state.order.indexOf(eventId);
  if (getLockedPositions()[index]) {
    return;
  }
  const targetIndex = getMoveTargetIndex(index, direction);
  if (index < 0 || targetIndex < 0 || targetIndex >= state.order.length) {
    return;
  }
  [state.order[index], state.order[targetIndex]] = [state.order[targetIndex], state.order[index]];
  saveState();
  renderGame();
}

function dropEvent(draggedId, targetId, placeAfter) {
  if (isInteractionLocked() || draggedId === targetId) {
    return;
  }
  const lockedPositions = getLockedPositions();
  const draggedIndex = state.order.indexOf(draggedId);
  const targetIndex = state.order.indexOf(targetId);
  if (
    draggedIndex < 0
    || targetIndex < 0
    || lockedPositions[draggedIndex]
    || lockedPositions[targetIndex]
  ) {
    return;
  }

  const unlockedIndexes = getUnlockedIndexes();
  const unlockedOrder = unlockedIndexes.map((index) => state.order[index]);
  const nextUnlockedOrder = unlockedOrder.filter((eventId) => eventId !== draggedId);
  const unlockedTargetIndex = nextUnlockedOrder.indexOf(targetId);
  if (unlockedTargetIndex < 0) {
    return;
  }

  nextUnlockedOrder.splice(unlockedTargetIndex + (placeAfter ? 1 : 0), 0, draggedId);
  const nextOrder = [...state.order];
  unlockedIndexes.forEach((index, unlockedIndex) => {
    nextOrder[index] = nextUnlockedOrder[unlockedIndex];
  });
  state.order = nextOrder;
  saveState();
  renderGame();
}

function handleSubmit(event) {
  event.preventDefault();

  if (loadStatus === "loading" || loadStatus === "idle") {
    setFormMessage(t("loadingMessage"), "warning");
    return;
  }
  if (state.status !== "playing") {
    return;
  }
  if (state.events.length !== MAX_EVENTS || state.order.length !== MAX_EVENTS) {
    setFormMessage(t("incompleteOrder"), "warning");
    return;
  }

  state.attempts.push({ order: [...state.order] });

  if (isCorrectOrder(state.order)) {
    state.status = "won";
  } else if (state.attempts.length >= getMaxAttempts()) {
    state.status = "lost";
    state.order = getCorrectOrderIds();
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
  loadPuzzleForLanguage();
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
  const distribution = Array(HARD_MAX_ATTEMPTS).fill(0);

  results.forEach((result) => {
    if (result.status === "won") {
      const attemptNumber = Number(result.attempts);
      const safeAttempt = Number.isFinite(attemptNumber) ? attemptNumber : HARD_MAX_ATTEMPTS;
      const attemptIndex = Math.max(0, Math.min(HARD_MAX_ATTEMPTS - 1, safeAttempt - 1));
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
  const winDays = winDates.map(utcDayNumber).sort((a, b) => a - b);

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

function initTimelyListEvents() {
  elements.timelyList.addEventListener("click", (event) => {
    const button = event.target.closest(".timely-move-button");
    const item = event.target.closest(".timely-card");
    if (!button || !item) {
      return;
    }
    moveEvent(item.dataset.eventId, button.dataset.direction);
  });

  elements.timelyList.addEventListener("dragstart", (event) => {
    const item = event.target.closest(".timely-card");
    const index = item ? state.order.indexOf(item.dataset.eventId) : -1;
    if (!item || isInteractionLocked() || getLockedPositions()[index]) {
      event.preventDefault();
      return;
    }
    draggedEventId = item.dataset.eventId;
    item.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedEventId);
  });

  elements.timelyList.addEventListener("dragover", (event) => {
    if (!draggedEventId || isInteractionLocked()) {
      return;
    }
    const item = event.target.closest(".timely-card");
    const index = item ? state.order.indexOf(item.dataset.eventId) : -1;
    if (!item || getLockedPositions()[index]) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  });

  elements.timelyList.addEventListener("drop", (event) => {
    const item = event.target.closest(".timely-card");
    if (!item || !draggedEventId) {
      return;
    }
    event.preventDefault();
    const rect = item.getBoundingClientRect();
    const placeAfter = event.clientY > rect.top + rect.height / 2;
    dropEvent(draggedEventId, item.dataset.eventId, placeAfter);
  });

  elements.timelyList.addEventListener("dragend", () => {
    draggedEventId = null;
    elements.timelyList.querySelectorAll(".is-dragging").forEach((item) => {
      item.classList.remove("is-dragging");
    });
  });
}

function init() {
  localizeStaticText();

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
  initTimelyListEvents();

  renderGame();
  loadPuzzleForLanguage();
}

init();
