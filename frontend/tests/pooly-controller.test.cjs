'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('../scripts/pooly-engine.js');

const controller = fs.readFileSync(path.join(__dirname, '../scripts/pooly.js'), 'utf8');
const markup = fs.readFileSync(path.join(__dirname, '../pages/pooly.html'), 'utf8');
const PREFIX = 'pooly-daily:v1';

function harness({ now = '2026-09-08T12:00:00Z', storage = new Map() } = {}) {
  let date = new Date(now).valueOf();
  let time = 0;
  let frameId = 0;
  const frames = new Map();
  const intervals = [];
  class Node {
    constructor(attributes = '') {
      this.listeners = new Map();
      this.attributes = new Map();
      this.dataset = {};
      this.textContent = '';
      this.hidden = /\bhidden\b/.test(attributes);
      this.disabled = false;
      this.style = { setProperty() {} };
      this.classList = { toggle() {} };
      for (const match of attributes.matchAll(/([\w-]+)="([^"]*)"/g)) {
        this.attributes.set(match[1], match[2]);
        if (match[1].startsWith('data-')) {
          const key = match[1].slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
          this.dataset[key] = match[2];
        }
        if (match[1] === 'value') this.value = match[2];
      }
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    addEventListener(name, callback) {
      if (!this.listeners.has(name)) this.listeners.set(name, []);
      this.listeners.get(name).push(callback);
    }
    emit(name, properties = {}) {
      const event = { target: this, preventDefault() {}, ...properties };
      for (const listener of this.listeners.get(name) || []) listener(event);
    }
    click() { if (!this.disabled) this.emit('click'); }
    focus() {}
    setPointerCapture() {}
    getScreenCTM() { return { inverse: () => ({}) }; }
    showModal() { this.open = true; }
    close() { this.open = false; }
  }
  const nodes = [...markup.matchAll(/<[\w-]+\b([^>]*?)>/g)].map(match => new Node(match[1]));
  const ids = new Map(nodes.filter(node => node.attributes.has('id')).map(node => [node.attributes.get('id'), node]));
  const document = new Node();
  document.hidden = false;
  document.documentElement = {};
  document.getElementById = id => ids.get(id) || null;
  document.querySelectorAll = selector => nodes.filter(node => node.attributes.has(selector.slice(1, -1)));
  const window = new Node();
  const context = {
    PoolyEngine: engine, document, window,
    navigator: { languages: ['en'] },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    Date: class extends Date { constructor(...args) { super(...(args.length ? args : [date])); } static now() { return date; } },
    performance: { now: () => time },
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
    setInterval: callback => { intervals.push(callback); return intervals.length; },
    DOMPoint: class { constructor(x, y) { this.x = x; this.y = y; } matrixTransform() { return this; } },
  };
  vm.runInNewContext(controller, context, { filename: 'pooly.js' });
  const node = id => ids.get(id);
  return {
    storage, node, document, window,
    setDate(value) { date = new Date(value).valueOf(); },
    interval() { intervals.forEach(callback => callback()); },
    frame() {
      time += 1000 / 60;
      const callbacks = [...frames.values()]; frames.clear();
      callbacks.forEach(callback => callback(time));
    },
    settle() {
      let count = 0;
      while (frames.size && count++ < 1200) this.frame();
      assert.equal(frames.size, 0, 'animation settles');
    },
    aim(x, y) { node('poolTable').emit('pointerdown', { isPrimary: true, button: 0, pointerId: 1, clientX: x, clientY: y }); node('poolTable').emit('pointerup'); },
    power(value) { node('powerInput').value = String(value); node('powerInput').emit('input'); },
    saved(day = '2026-09-08') { return JSON.parse(storage.get(`${PREFIX}:${day}`)); },
  };
}

test('pointer, rotation and keyboard controls work and cannot fire duplicate shots', () => {
  const app = harness();
  const { cue } = engine.createLayout('2026-09-08');
  app.aim(cue.x + 100, cue.y);
  assert.equal(app.node('angleValue').textContent, '0°');
  app.node('aimRight').click();
  assert.equal(app.node('angleValue').textContent, '0.5°');
  app.node('poolTable').emit('keydown', { key: 'ArrowLeft', shiftKey: true });
  assert.equal(app.node('angleValue').textContent, '0.3°');
  app.power(100);
  app.node('poolTable').emit('keydown', { key: 'ArrowUp' });
  assert.equal(app.node('powerValue').textContent, '100%');
  app.power(1);
  app.node('poolTable').emit('keydown', { key: 'ArrowDown' });
  assert.equal(app.node('powerValue').textContent, '1%');
  app.node('poolTable').emit('keydown', { key: ' ', repeat: true });
  assert.equal(app.node('shotCount').textContent, 0);
  app.node('poolTable').emit('keydown', { key: ' ', repeat: false });
  app.node('shootButton').click();
  app.node('poolTable').emit('keydown', { key: ' ', repeat: false });
  assert.equal(app.saved().shots, 1);
  assert.equal(app.node('shootButton').disabled, true);
  app.settle();
  assert.equal(app.node('shootButton').disabled, false);
  assert.equal(app.saved().shots, 1);
});

test('pagehide saves an in-flight shot and reload resumes without charging another shot', () => {
  const app = harness();
  app.aim(300, 300); app.power(73); app.node('shootButton').click();
  for (let index = 0; index < 10; index += 1) app.frame();
  app.window.emit('pagehide');
  const pending = app.saved();
  assert.equal(pending.moving, true);
  const reloaded = harness({ storage: new Map(app.storage) });
  assert.equal(reloaded.node('shootButton').disabled, true);
  reloaded.settle(); app.settle();
  const actual = reloaded.saved();
  const expected = app.saved();
  assert.equal(actual.shots, expected.shots);
  assert.equal(actual.won, expected.won);
  actual.balls.forEach((ball, index) => {
    // Animation timestamps may split rail contact across adjacent substeps.
    assert.ok(Math.hypot(ball.x - expected.balls[index].x, ball.y - expected.balls[index].y) < 0.1);
  });
});

test('a scratch adds one penalty, restores the cue and permits another shot', () => {
  const state = engine.createState('2026-09-08');
  state.balls[0].x = state.pocket.x;
  state.balls[0].y = 65;
  const app = harness({ storage: new Map([[`${PREFIX}:${state.date}`, JSON.stringify(state)]]) });
  app.aim(state.pocket.x, state.pocket.y); app.power(45); app.node('shootButton').click(); app.settle();
  assert.equal(app.saved().shots, 2);
  assert.equal(app.saved().balls[0].potted, false);
  assert.match(app.node('statusText').textContent, /\+1 penalty/);
  assert.equal(app.node('shootButton').disabled, false);
  app.aim(100, 350); app.power(1); app.node('shootButton').click(); app.settle();
  assert.equal(app.saved().shots, 3);
  assert.doesNotMatch(app.node('statusText').textContent, /penalty/);
});

test('a completed daily locks the table and records its result once across reloads', () => {
  const state = engine.createState('2026-09-08');
  state.balls[0].x = state.pocket.x;
  state.balls[0].y = 100;
  state.balls[1].x = state.pocket.x;
  state.balls[1].y = 55;
  const app = harness({ storage: new Map([[`${PREFIX}:${state.date}`, JSON.stringify(state)]]) });
  app.aim(state.pocket.x, state.pocket.y); app.power(40); app.node('shootButton').click(); app.settle();
  assert.equal(app.saved().won, true);
  assert.equal(app.node('shotControls').hidden, true);
  assert.match(app.node('statusText').textContent, /Potted/);
  assert.equal(app.node('statsCompleted').textContent, 1);
  const reloaded = harness({ storage: new Map(app.storage) });
  assert.equal(reloaded.node('statsCompleted').textContent, 1);
  assert.equal(reloaded.node('shootButton').disabled, true);
  assert.deepEqual(JSON.parse(reloaded.storage.get(`${PREFIX}:stats`)), { '2026-09-08': app.saved().shots });
});

test('midnight lets the current shot settle and stores it under the previous day', () => {
  const app = harness({ now: '2026-09-08T23:59:59Z' });
  app.power(1); app.node('shootButton').click();
  app.setDate('2026-09-09T00:00:01Z'); app.interval();
  assert.equal(app.node('shotCount').textContent, 1);
  app.settle();
  assert.equal(app.saved('2026-09-08').moving, false);
  assert.equal(app.saved('2026-09-08').shots, 1);
  assert.equal(app.node('shotCount').textContent, 0);
  assert.match(app.node('statusText').textContent, /new day/i);
  app.node('shootButton').click();
  assert.equal(app.saved('2026-09-09').shots, 1);
});

test('the first action after midnight loads the new table without shooting at an unseen layout', () => {
  const app = harness({ now: '2026-09-08T23:59:59Z' });
  app.setDate('2026-09-09T00:00:01Z');
  app.node('shootButton').click();
  assert.equal(app.node('shotCount').textContent, 0);
  assert.equal(app.node('shootButton').disabled, false);
  assert.equal(app.storage.has(`${PREFIX}:2026-09-09`), false);
  app.node('shootButton').click();
  assert.equal(app.saved('2026-09-09').shots, 1);
});
