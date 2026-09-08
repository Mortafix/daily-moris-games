'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../scripts/pooly-engine.js');

const { WIDTH, HEIGHT, RADIUS, POCKET_RADIUS, FRICTION } = engine;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ball = (x, y, vx = 0, vy = 0) => ({ x, y, vx, vy, potted: false });

function fixture(cue = ball(90, 200), target = ball(210, 300), pocket = { x: 0, y: 400 }) {
  const state = engine.createState('2026-09-08');
  state.balls = [cue, target];
  state.pocket = pocket;
  state.moving = state.balls.some(item => item.vx || item.vy);
  return state;
}

function settle(state, maxSeconds = 12) {
  let steps = 0;
  const events = [];
  while (state.moving && steps < maxSeconds * 120) {
    events.push(engine.step(state, 1 / 120));
    steps += 1;
  }
  assert.equal(state.moving, false, 'the shot must come to rest');
  return events;
}

function dayAt(offset) {
  return new Date(Date.UTC(2026, 0, offset + 1)).toISOString().slice(0, 10);
}

test('daily layouts are deterministic, varied and safe over ten years', () => {
  const seen = new Set();
  const sides = new Set();
  const colors = new Set();
  let nearCorners = 0;
  for (let day = 0; day < 3650; day += 1) {
    const key = dayAt(day);
    const layout = engine.createLayout(key);
    assert.deepEqual(layout, engine.createLayout(key));
    seen.add(JSON.stringify(layout));
    colors.add(layout.color.hex);
    assert.notEqual(layout.color.hex.toLowerCase(), '#000000');
    const { pocket, cue, target } = layout;
    assert.ok(pocket.x === 0 || pocket.x === WIDTH || pocket.y === 0 || pocket.y === HEIGHT);
    assert.ok(pocket.x >= 0 && pocket.x <= WIDTH && pocket.y >= 0 && pocket.y <= HEIGHT);
    sides.add(pocket.x === 0 ? 'left' : pocket.x === WIDTH ? 'right' : pocket.y === 0 ? 'top' : 'bottom');
    if (Math.min(distance(pocket, { x: 0, y: 0 }), distance(pocket, { x: WIDTH, y: 0 }),
      distance(pocket, { x: 0, y: HEIGHT }), distance(pocket, { x: WIDTH, y: HEIGHT })) < POCKET_RADIUS) nearCorners += 1;
    for (const item of [cue, target]) {
      assert.ok(item.x > RADIUS && item.x < WIDTH - RADIUS);
      assert.ok(item.y > RADIUS && item.y < HEIGHT - RADIUS);
      assert.ok(distance(item, pocket) > POCKET_RADIUS + RADIUS);
    }
    assert.ok(distance(cue, target) >= 62);
  }
  assert.equal(seen.size, 3650);
  assert.equal(sides.size, 4);
  assert.equal(colors.size, 7);
  assert.ok(nearCorners > 100, 'corner-adjacent pockets should occur naturally');
});

test('perimeter mapping includes every rail and all four corners', () => {
  assert.deepEqual(engine.pocketAt(0), { x: 0, y: 0 });
  assert.deepEqual(engine.pocketAt(WIDTH), { x: WIDTH, y: 0 });
  assert.deepEqual(engine.pocketAt(WIDTH + HEIGHT), { x: WIDTH, y: HEIGHT });
  assert.deepEqual(engine.pocketAt(WIDTH * 2 + HEIGHT), { x: 0, y: HEIGHT });
  assert.deepEqual(engine.pocketAt(147.25), { x: 147.25, y: 0 });
});

test('shoot enforces turn state, clamps power, and allows unlimited shots', () => {
  const state = fixture();
  state.shots = 10000;
  assert.equal(engine.shoot(state, 0, 100), true);
  assert.equal(state.shots, 10001);
  assert.equal(state.balls[0].vx, engine.MAX_SPEED);
  assert.equal(engine.shoot(state, 0, 100), false);
  assert.equal(state.shots, 10001);
  settle(state);
  state.won = true;
  assert.equal(engine.shoot(state, 0, 100), false);
  const other = fixture();
  assert.equal(engine.shoot(other, NaN, 50), false);
  assert.equal(engine.shoot(other, 0, Infinity), false);
  assert.equal(other.shots, 0);
  assert.equal(engine.speedForPower(999), engine.MAX_SPEED);
  assert.equal(engine.speedForPower(-10), engine.speedForPower(1));
  assert.ok(engine.speedForPower(1) < engine.speedForPower(50));
  assert.ok(engine.speedForPower(50) < engine.speedForPower(100));
});

test('rail rebounds reverse only the incoming normal velocity and lose energy', () => {
  const scenarios = [
    [ball(12, 200, -300, 50), 'vx', 1],
    [ball(WIDTH - 12, 200, 300, 50), 'vx', -1],
    [ball(100, 12, 50, -300), 'vy', 1],
    [ball(100, HEIGHT - 12, 50, 300), 'vy', -1],
  ];
  for (const [cue, axis, sign] of scenarios) {
    const state = fixture(cue, ball(250, 300), { x: 0, y: 50 });
    engine.step(state, 1 / 60);
    assert.ok(state.balls[0][axis] * sign > 0);
    assert.ok(Math.abs(state.balls[0][axis]) < 300);
    assert.ok(state.balls[0].x >= RADIUS && state.balls[0].x <= WIDTH - RADIUS);
    assert.ok(state.balls[0].y >= RADIUS && state.balls[0].y <= HEIGHT - RADIUS);
  }
});

test('head-on equal-mass collision transfers motion to the target', () => {
  const state = fixture(ball(100, 200, 300, 0), ball(122, 200));
  engine.step(state, engine.FIXED_STEP);
  assert.ok(Math.abs(state.balls[0].vx) < 0.0001);
  assert.ok(Math.abs(state.balls[1].vx - (300 - FRICTION * engine.FIXED_STEP)) < 0.0001);
  assert.ok(Math.abs(state.balls[1].vy) < 0.0001);
  assert.ok(distance(...state.balls) >= RADIUS * 2);
});

test('glancing collisions preserve momentum and split velocities perpendicular to one another', () => {
  const state = fixture(ball(100, 200, 300, 0), ball(120, 210));
  engine.step(state, engine.FIXED_STEP);
  const [cue, target] = state.balls;
  const expected = 300 - FRICTION * engine.FIXED_STEP;
  assert.ok(cue.vy < 0 && target.vy > 0);
  assert.ok(cue.vx > 0 && target.vx > 0);
  assert.ok(Math.abs(cue.vx + target.vx - expected) < 0.0001);
  assert.ok(Math.abs(cue.vy + target.vy) < 0.0001);
  assert.ok(Math.abs(cue.vx * target.vx + cue.vy * target.vy) < 0.0001);
  assert.ok(Math.abs(cue.vx ** 2 + cue.vy ** 2 + target.vx ** 2 + target.vy ** 2 - expected ** 2) < 0.0001);
});

test('maximum-speed opposing balls cannot tunnel through each other', () => {
  const state = fixture(ball(100, 200, engine.MAX_SPEED), ball(130, 200, -engine.MAX_SPEED));
  engine.step(state, 1 / 60);
  assert.ok(state.balls[0].x < state.balls[1].x);
  assert.ok(state.balls[0].vx < 0);
  assert.ok(state.balls[1].vx > 0);
});

test('pockets capture on every rail, exact corners, and beside corners', () => {
  const pockets = [
    { x: 83, y: 0 }, { x: WIDTH, y: 163 }, { x: 137, y: HEIGHT }, { x: 0, y: 301 },
    { x: 0, y: 0 }, { x: WIDTH, y: 0 }, { x: WIDTH, y: HEIGHT }, { x: 0, y: HEIGHT },
    { x: 4, y: 0 }, { x: WIDTH, y: 5 }, { x: WIDTH - 4, y: HEIGHT }, { x: 0, y: HEIGHT - 5 },
  ];
  for (const pocket of pockets) {
    const toCenter = Math.hypot(WIDTH / 2 - pocket.x, HEIGHT / 2 - pocket.y);
    const nx = (WIDTH / 2 - pocket.x) / toCenter;
    const ny = (HEIGHT / 2 - pocket.y) / toCenter;
    const state = fixture(ball(70, 220), ball(pocket.x + nx * 70, pocket.y + ny * 70, -nx * 300, -ny * 300), pocket);
    settle(state);
    assert.equal(state.won, true, JSON.stringify(pocket));
    assert.equal(state.balls[1].potted, true);
  }
});

test('a high-speed ball is captured along its travel segment', () => {
  const state = fixture(ball(70, 220), ball(160, 45, 0, -engine.MAX_SPEED), { x: 160, y: 0 });
  engine.step(state, 0.25);
  assert.equal(state.won, true);
  assert.equal(state.balls[1].potted, true);
});

test('scratches add one penalty immediately and respawn safely at rest', () => {
  const state = fixture(ball(160, 65), ball(200, 240), { x: 160, y: 0 });
  state.layout.cue = { x: 200, y: 240 }; // Initial position is now occupied.
  assert.equal(engine.shoot(state, -Math.PI / 2, 45), true);
  const events = settle(state);
  assert.equal(state.scratched, true);
  assert.equal(state.shots, 2);
  assert.equal(state.balls[0].potted, false);
  assert.ok(events.some(event => event.cuePotted));
  assert.ok(events.some(event => event.respawned));
  assert.ok(distance(...state.balls) > RADIUS * 2 + 10);
  assert.ok(distance(state.balls[0], state.pocket) > POCKET_RADIUS + RADIUS);
  engine.shoot(state, Math.PI, 1);
  assert.equal(state.scratched, false);
  assert.equal(state.shots, 3);
});

test('potting both balls still wins and safely settles the cue', () => {
  const state = fixture(ball(149, 20, 0, -100), ball(171, 20, 0, -100), { x: 160, y: 0 });
  state.shots = 1;
  settle(state);
  assert.equal(state.won, true);
  assert.equal(state.scratched, true);
  assert.equal(state.balls[0].potted, false);
  assert.equal(state.balls[1].potted, true);
  assert.equal(state.shots, 2);
});

test('restoring a shot after a scratch preserves the penalty exactly once', () => {
  const date = '2026-09-08';
  const state = engine.createState(date);
  const { pocket } = state;
  const inwardDistance = distance(pocket, { x: WIDTH / 2, y: HEIGHT / 2 });
  const nx = (WIDTH / 2 - pocket.x) / inwardDistance;
  const ny = (HEIGHT / 2 - pocket.y) / inwardDistance;
  state.balls[0] = ball(pocket.x + nx * 35, pocket.y + ny * 35, -nx * 200, -ny * 200);
  state.balls[1] = ball(WIDTH / 2, HEIGHT / 2, 35, 20);
  state.shots = 5;
  state.moving = true;
  while (!state.balls[0].potted) engine.step(state, engine.FIXED_STEP);
  assert.equal(state.shots, 6);
  assert.equal(state.moving, true);
  const restored = engine.restoreState(JSON.parse(JSON.stringify(state)), date);
  assert.equal(restored.shots, 6);
  assert.equal(restored.balls[0].potted, true);
  settle(restored);
  assert.equal(restored.shots, 6);
  assert.equal(restored.scratched, true);
  assert.equal(restored.balls[0].potted, false);
  engine.step(restored, 1);
  assert.equal(restored.shots, 6);
});

test('a resting cue produces a predictable distance at a low power', () => {
  const state = fixture(ball(100, 220), ball(250, 350));
  engine.shoot(state, 0, 20);
  const speed = state.balls[0].vx;
  settle(state);
  const expected = speed * speed / (2 * FRICTION);
  assert.ok(Math.abs(state.balls[0].x - 100 - expected) < 0.02);
  assert.equal(state.balls[0].y, 220);
});

test('random shots stay finite, inside the table, separated and eventually stop', () => {
  for (let day = 0; day < 80; day += 1) {
    const state = engine.createState(dayAt(day));
    for (let shot = 0; shot < 10 && !state.won; shot += 1) {
      const angle = ((day * 137.508 + shot * 47.3) % 360) * Math.PI / 180;
      engine.shoot(state, angle, 1 + ((day * 41 + shot * 13) % 100));
      settle(state);
      for (const item of state.balls) {
        assert.ok(['x', 'y', 'vx', 'vy'].every(key => Number.isFinite(item[key])));
        if (item.potted) continue;
        assert.ok(item.x >= RADIUS && item.x <= WIDTH - RADIUS);
        assert.ok(item.y >= RADIUS && item.y <= HEIGHT - RADIUS);
      }
      if (state.balls.every(item => !item.potted)) assert.ok(distance(...state.balls) >= RADIUS * 2 - 0.1);
    }
  }
});

test('saved shots resume identically and persisted layouts cannot override the daily seed', () => {
  const state = engine.createState('2026-09-08');
  engine.shoot(state, 0.75, 73);
  engine.step(state, 0.25);
  const saved = JSON.parse(JSON.stringify(state));
  saved.layout.color.hex = '#000000';
  saved.pocket = { x: 100, y: 100 };
  const restored = engine.restoreState(saved, state.date);
  assert.deepEqual(restored.layout, engine.createLayout(state.date));
  assert.deepEqual(restored.pocket, restored.layout.pocket);
  settle(state);
  settle(restored);
  assert.deepEqual(restored, state);
});

test('corrupt or outdated saves fall back to a fresh safe state', () => {
  const date = '2026-09-08';
  const corruptions = [
    state => { state.date = '2026-09-07'; },
    state => { state.shots = -1; },
    state => { state.shots = 1.2; },
    state => { state.balls[0].x = NaN; },
    state => { state.balls[0].vx = 100000; },
    state => { state.balls[0].x = -100; },
    state => { state.balls[0].potted = true; },
    state => { state.balls[1] = { ...state.balls[0] }; },
    state => { state.won = true; },
  ];
  for (const corrupt of corruptions) {
    const state = engine.createState(date);
    corrupt(state);
    assert.deepEqual(engine.restoreState(state, date), engine.createState(date));
  }
  assert.deepEqual(engine.restoreState(null, date), engine.createState(date));
});

test('daily layouts admit a direct pot with a short aim and power search', () => {
  for (let day = 0; day < 30; day += 1) {
    const date = dayAt(day);
    const { cue, target, pocket } = engine.createLayout(date);
    const objectDistance = distance(target, pocket);
    const nx = (pocket.x - target.x) / objectDistance;
    const ny = (pocket.y - target.y) / objectDistance;
    const ghost = { x: target.x - nx * 2 * RADIUS, y: target.y - ny * 2 * RADIUS };
    const angle = Math.atan2(ghost.y - cue.y, ghost.x - cue.x);
    let potted = false;
    for (const offset of [0, -0.008, 0.008, -0.016, 0.016, -0.024, 0.024]) {
      for (const power of [60, 70, 80, 90, 100]) {
        const state = engine.createState(date);
        engine.shoot(state, angle + offset, power);
        settle(state);
        if (state.won) { potted = true; break; }
      }
      if (potted) break;
    }
    assert.ok(potted, `Daily layout ${date} should allow a direct pot`);
  }
});
