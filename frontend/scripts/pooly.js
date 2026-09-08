(() => {
  "use strict";
  const Engine = globalThis.PoolyEngine;
  const PREFIX = "pooly-daily:v1";
  const LANGUAGE_KEY = "angle-daily:v1:language";
  const $ = (id) => document.getElementById(id);
  const dictionaries = {
    it: {
      title: "Pooly", navHome: "Home", navPooly: "Pooly", navAngly: "Angly", navColory: "Colory", navTimely: "Timely", navMovly: "Movly", navQuizly: "Quizly", navMenu: "Giochi",
      dailyDateLabel: "Data del daily", languageLabel: "Lingua", italianLanguage: "Italiano", englishLanguage: "Inglese", openStats: "Apri statistiche", closeStats: "Chiudi statistiche",
      shots: "Tiri", target: "Pallina {color}",
      red: "rossa", yellow: "gialla", blue: "blu", purple: "viola", orange: "arancione", green: "verde", pink: "rosa", cyan: "azzurra", maroon: "bordeaux",
      tableTitle: "Tavolo da biliardo del giorno", tableDescription: "Due palline e una sola buca sul bordo. Tocca il tavolo per orientare la stecca dalla bianca. Tastiera sul tavolo: ← → per mirare, Maiusc per maggiore precisione, ↑ ↓ per la potenza, Spazio per tirare.",
      aim: "Mira", aimLeft: "Ruota la mira in senso antiorario", aimRight: "Ruota la mira in senso orario", power: "Potenza", shoot: "Tira",
      ready: "Prendi la mira e tira.", playing: "Le palline sono in movimento…", nextShot: "Prendi la mira per il prossimo tiro.", scratch: "Bianca in buca: +1 di penalità. Puoi tirare di nuovo.", won: "Imbucata! Hai chiuso in {shots} tiri.", wonOne: "Imbucata al primo colpo!", newDay: "Un nuovo giorno, un nuovo tavolo!",
      storageNote: "Questo browser non riesce a salvare i progressi. Tieni aperta la pagina per completare la partita.",
      statsTitle: "Statistiche", statsCompleted: "Completate", statsBest: "Meno tiri", statsAverage: "Media tiri", statsStreak: "Serie", statsEmpty: "Completa un daily per iniziare a tracciare le statistiche locali."
    },
    en: {
      title: "Pooly", navHome: "Home", navPooly: "Pooly", navAngly: "Angly", navColory: "Colory", navTimely: "Timely", navMovly: "Movly", navQuizly: "Quizly", navMenu: "Games",
      dailyDateLabel: "Daily date", languageLabel: "Language", italianLanguage: "Italian", englishLanguage: "English", openStats: "Open statistics", closeStats: "Close statistics",
      shots: "Shots", target: "{color} ball",
      red: "Red", yellow: "Yellow", blue: "Blue", purple: "Purple", orange: "Orange", green: "Green", pink: "Pink", cyan: "Cyan", maroon: "Maroon",
      tableTitle: "Daily pool table", tableDescription: "Two balls and one pocket on the edge. Tap the table to aim the cue from the white ball. Keyboard on the table: ← → aim, Shift for precision, ↑ ↓ power, Space to shoot.",
      aim: "Aim", aimLeft: "Rotate aim counterclockwise", aimRight: "Rotate aim clockwise", power: "Power", shoot: "Shoot",
      ready: "Line up your first shot.", playing: "The balls are moving…", nextShot: "Line up your next shot.", scratch: "White ball potted: +1 penalty. Ready to shoot again.", won: "Potted! You finished in {shots} shots.", wonOne: "Potted in one shot!", newDay: "A new day, a new table!",
      storageNote: "Progress cannot be saved in this browser. Keep this page open to finish your game.",
      statsTitle: "Statistics", statsCompleted: "Completed", statsBest: "Best shots", statsAverage: "Average shots", statsStreak: "Streak", statsEmpty: "Complete a daily table to start tracking your local stats."
    }
  };
  function read(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function write(key, value) {
    try { localStorage.setItem(key, value); }
    catch { $("storageNote").hidden = false; }
  }
  function parse(key) { try { return JSON.parse(read(key)); } catch { return null; } }
  const savedLanguage = read(LANGUAGE_KEY);
  let lang = dictionaries[savedLanguage] ? savedLanguage : ((navigator.languages || [navigator.language]).some((l) => l?.startsWith("it")) ? "it" : "en");
  const t = (key, values = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), dictionaries[lang][key] || dictionaries.en[key] || key);
  const dateKey = () => new Date().toISOString().slice(0, 10);
  let today = dateKey();
  let state = Engine.restoreState(parse(`${PREFIX}:${today}`), today);
  let angle = initialAngle();
  let power = 45;
  let frame = 0;
  let lastTime = 0;
  let pointer = null;
  let notice = "";
  const table = $("poolTable");
  const controls = [$("aimLeft"), $("aimRight"), $("powerInput"), $("shootButton")];
  function initialAngle() {
    return Math.atan2(state.balls[1].y - state.balls[0].y, state.balls[1].x - state.balls[0].x);
  }
  function save() { write(`${PREFIX}:${state.date}`, JSON.stringify(state)); }
  function loadResults() {
    const saved = parse(`${PREFIX}:stats`);
    const results = {};
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      for (const [day, shots] of Object.entries(saved)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isSafeInteger(shots) && shots > 0) results[day] = shots;
      }
    }
    return results;
  }
  function recordResult() {
    if (!state.won || state.moving) return;
    const results = loadResults();
    // One result per day; reopening a finished table never records a second win.
    if (!results[state.date]) {
      results[state.date] = state.shots;
      write(`${PREFIX}:stats`, JSON.stringify(results));
    }
  }
  function renderStats() {
    const results = loadResults();
    const values = Object.values(results);
    $("statsCompleted").textContent = values.length;
    $("statsBest").textContent = values.length ? Math.min(...values) : "—";
    $("statsAverage").textContent = values.length ? new Intl.NumberFormat(lang, {maximumFractionDigits: 1}).format(values.reduce((a, b) => a + b, 0) / values.length) : "—";
    let day = new Date(`${today}T00:00:00Z`);
    if (!results[today]) day.setUTCDate(day.getUTCDate() - 1);
    let streak = 0;
    while (results[day.toISOString().slice(0, 10)]) { streak += 1; day.setUTCDate(day.getUTCDate() - 1); }
    $("statsStreak").textContent = streak;
    $("statsEmpty").hidden = values.length > 0;
  }
  function localize() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll("[data-i18n-aria]").forEach((node) => { node.setAttribute("aria-label", t(node.dataset.i18nAria)); });
    document.querySelectorAll("[data-lang]").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.lang === lang);
      node.setAttribute("aria-pressed", String(node.dataset.lang === lang));
    });
    $("tableTitle").textContent = t("tableTitle");
    $("tableDescription").textContent = t("tableDescription");
    $("dateLabel").textContent = new Intl.DateTimeFormat(lang, {day: "2-digit", month: "short", timeZone: "UTC"}).format(new Date(`${today}T00:00:00Z`));
    render(); renderStats();
  }
  function renderControls() {
    const locked = state.moving || state.won;
    controls.forEach((control) => { control.disabled = locked; });
    table.setAttribute("aria-disabled", String(locked));
    $("shotCount").textContent = state.shots;
    $("powerInput").value = power;
    $("powerValue").textContent = `${power}%`;
    $("powerInput").setAttribute("aria-valuetext", `${power}%`);
    $("angleValue").textContent = `${((angle * 180 / Math.PI % 360 + 360) % 360).toFixed(1).replace(/\.0$/, "")}°`;
    $("powerInput").style.setProperty("--power", `${power}%`);
    $("shotControls").hidden = state.won && !state.moving;
    $("statusStrip").classList.toggle("is-win", state.won && !state.moving);
    const key = state.moving ? "playing" : state.won ? (state.shots === 1 ? "wonOne" : "won") : notice || (state.scratched ? "scratch" : state.shots ? "nextShot" : "ready");
    $("statusText").textContent = t(key, {shots: state.shots});
    $("statusIcon").className = `fa-solid ${state.moving ? "fa-circle-notch" : state.won ? "fa-circle-check" : state.scratched ? "fa-rotate-left" : "fa-bullseye"}`;
  }
  function draw() {
    const layout = state.layout;
    const pocket = layout.pocket;
    // Cut through the cushions and felt. Near corners the opening turns toward
    // both adjoining rails instead of sitting on top of either one.
    const reach = Engine.POCKET_RADIUS;
    const near = (distance) => Math.max(0, 1 - distance / reach);
    const inwardX = near(pocket.x) - near(Engine.WIDTH - pocket.x);
    const inwardY = near(pocket.y) - near(Engine.HEIGHT - pocket.y);
    const rotation = Math.atan2(-inwardX, inwardY) * 180 / Math.PI;
    const pocketTransform = `translate(${pocket.x} ${pocket.y}) rotate(${rotation})`;
    for (const id of ["pocket", "pocketCutout", "pocketJaws"]) {
      $(id).setAttribute("transform", pocketTransform);
    }
    $("targetFill").setAttribute("fill", layout.color.hex);
    $("colorDot").style.backgroundColor = layout.color.hex;
    $("targetLabel").textContent = t("target", {color: t(layout.color.name)});
    state.balls.forEach((ball, index) => {
      const node = $(index === 0 ? "cueBall" : "targetBall");
      node.setAttribute("transform", `translate(${ball.x} ${ball.y})`);
      node.style.display = ball.potted ? "none" : "";
    });
    const cue = state.balls[0], target = state.balls[1];
    const hidden = state.moving || state.won;
    $("aimGuide").style.display = hidden ? "none" : "";
    $("cueStick").style.display = hidden ? "none" : "";
    if (hidden) return;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    // The cue-only guide stops at the first object, never predicting its path.
    const tx = target.x - cue.x, ty = target.y - cue.y;
    const projection = tx * dx + ty * dy;
    const distanceSquared = tx * tx + ty * ty - projection * projection;
    let length = 65;
    if (!target.potted && projection > 0 && distanceSquared < (2 * Engine.RADIUS) ** 2) {
      length = Math.min(length, Math.max(Engine.RADIUS, projection - Math.sqrt((2 * Engine.RADIUS) ** 2 - distanceSquared)));
    }
    $("aimGuide").style.display = length <= Engine.RADIUS + 3 ? "none" : "";
    $("aimGuide").setAttribute("x1", cue.x + dx * (Engine.RADIUS + 3));
    $("aimGuide").setAttribute("y1", cue.y + dy * (Engine.RADIUS + 3));
    $("aimGuide").setAttribute("x2", cue.x + dx * length);
    $("aimGuide").setAttribute("y2", cue.y + dy * length);
    $("cueStick").setAttribute("transform", `translate(${cue.x} ${cue.y}) rotate(${angle * 180 / Math.PI}) translate(${-power * 0.3} 0)`);
  }
  function render() { renderControls(); draw(); }
  function checkDay() {
    if (state.moving || today === dateKey()) return false;
    today = dateKey();
    state = Engine.restoreState(parse(`${PREFIX}:${today}`), today);
    angle = initialAngle(); notice = "newDay";
    localize();
    if (state.moving) animate();
    return true;
  }
  function animate() {
    if (frame) return;
    lastTime = performance.now();
    function tick(time) {
      frame = 0;
      // No time jump when returning from a background tab.
      Engine.step(state, Math.min(Math.max((time - lastTime) / 1000, 0), 0.05));
      lastTime = time;
      draw();
      if (state.moving) frame = requestAnimationFrame(tick);
      else {
        recordResult(); save(); render(); renderStats();
        checkDay();
      }
    }
    frame = requestAnimationFrame(tick);
  }
  function shoot() {
    if (checkDay() || state.moving || state.won) return;
    notice = "";
    if (Engine.shoot(state, angle, power)) {
      save(); render(); animate();
    }
  }
  function rotate(delta) {
    if (checkDay() || state.moving || state.won) return;
    angle = (angle + delta * Math.PI / 180) % (Math.PI * 2);
    renderControls(); draw();
  }
  function aimAt(event) {
    const matrix = table.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const cue = state.balls[0];
    if (Math.hypot(point.x - cue.x, point.y - cue.y) < 8) return;
    angle = Math.atan2(point.y - cue.y, point.x - cue.x);
    renderControls(); draw();
  }
  table.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0 || checkDay() || state.moving || state.won) return;
    pointer = event.pointerId;
    table.setPointerCapture(pointer);
    table.focus({preventScroll: true});
    aimAt(event);
  });
  table.addEventListener("pointermove", (event) => { if (event.pointerId === pointer) aimAt(event); });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) table.addEventListener(name, () => { pointer = null; });
  table.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Enter"].includes(event.key)) return;
    event.preventDefault();
    if (state.moving || state.won || checkDay()) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") rotate((event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 0.2 : 2));
    else if (event.key === "ArrowUp" || event.key === "ArrowDown") { power = Math.min(100, Math.max(1, power + (event.key === "ArrowUp" ? 1 : -1))); renderControls(); draw(); }
    else if (!event.repeat) shoot();
  });
  $("aimLeft").addEventListener("click", () => rotate(-0.5));
  $("aimRight").addEventListener("click", () => rotate(0.5));
  $("powerInput").addEventListener("input", (event) => { power = Number(event.target.value); renderControls(); draw(); });
  $("shootButton").addEventListener("click", shoot);
  document.querySelectorAll("[data-lang]").forEach((node) => node.addEventListener("click", () => { lang = node.dataset.lang; write(LANGUAGE_KEY, lang); localize(); }));
  $("statsButton").addEventListener("click", () => { renderStats(); $("statsDialog").showModal(); });
  $("statsCloseButton").addEventListener("click", () => $("statsDialog").close());
  $("statsDialog").addEventListener("click", (event) => { if (event.target === $("statsDialog")) $("statsDialog").close(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); else checkDay(); });
  window.addEventListener("pagehide", save);
  window.addEventListener("pageshow", () => checkDay());
  setInterval(checkDay, 30000);
  recordResult(); localize();
  if (state.moving) animate();
})();
