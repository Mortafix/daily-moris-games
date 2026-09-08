(function (root, factory) {
  const engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) root.PoolyEngine = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const WIDTH = 320;
  const HEIGHT = 440;
  const RADIUS = 11;
  const POCKET_RADIUS = 24;
  const CAPTURE_RADIUS = POCKET_RADIUS - 1;
  const FIXED_STEP = 1 / 240;
  const MAX_SPEED = 760;
  const MIN_SPEED = 45;
  const FRICTION = 210;
  const RAIL_RESTITUTION = 0.84;
  const STOP_SPEED = 2;
  const COLORS = [
    { hex: '#f26368', name: 'red' },
    { hex: '#f7d34f', name: 'yellow' },
    { hex: '#ffa54f', name: 'orange' },
    { hex: '#c38af5', name: 'purple' },
    { hex: '#73b8ff', name: 'blue' },
    { hex: '#f18fc7', name: 'pink' },
    { hex: '#72e2bf', name: 'green' },
  ];

  function dateKey(date) {
    if (date instanceof Date) return date.toISOString().slice(0, 10);
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    return new Date().toISOString().slice(0, 10);
  }

  function randomForDate(date) {
    let seed = 2166136261;
    const key = 'pooly-v1:' + date;
    for (let i = 0; i < key.length; i += 1) {
      seed = Math.imul(seed ^ key.charCodeAt(i), 16777619);
    }
    return function () {
      seed += 0x6d2b79f5;
      let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A continuous perimeter keeps the full rails, including the corners, in play.
  function pocketAt(distance) {
    const perimeter = 2 * (WIDTH + HEIGHT);
    let offset = ((distance % perimeter) + perimeter) % perimeter;
    if (offset < WIDTH) return { x: offset, y: 0 };
    offset -= WIDTH;
    if (offset < HEIGHT) return { x: WIDTH, y: offset };
    offset -= HEIGHT;
    if (offset < WIDTH) return { x: WIDTH - offset, y: HEIGHT };
    return { x: 0, y: HEIGHT - (offset - WIDTH) };
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // The ghost-ball contact point must be reachable, with enough available energy
  // for the object ball to reach the pocket even after an angled collision.
  function playableLayout(cue, target, pocket) {
    const toPocket = distance(target, pocket);
    if (toPocket < 85 || distance(cue, pocket) < 64 || distance(cue, target) < 62) return false;
    const nx = (pocket.x - target.x) / toPocket;
    const ny = (pocket.y - target.y) / toPocket;
    const ghost = { x: target.x - nx * RADIUS * 2, y: target.y - ny * RADIUS * 2 };
    if (ghost.x < RADIUS + 1 || ghost.x > WIDTH - RADIUS - 1 ||
        ghost.y < RADIUS + 1 || ghost.y > HEIGHT - RADIUS - 1) return false;
    const runUp = distance(cue, ghost);
    const cosine = ((ghost.x - cue.x) * nx + (ghost.y - cue.y) * ny) / runUp;
    const energyDistance = runUp + (toPocket - CAPTURE_RADIUS) / (cosine * cosine);
    return cosine > 0.57 && energyDistance < (MAX_SPEED * MAX_SPEED / (2 * FRICTION)) * 0.8;
  }

  function createLayout(date) {
    const random = randomForDate(dateKey(date));
    const pocket = pocketAt(random() * 2 * (WIDTH + HEIGHT));
    const color = { ...COLORS[Math.floor(random() * COLORS.length)] };
    const margin = RADIUS + 24;
    const position = () => ({
      x: margin + random() * (WIDTH - margin * 2),
      y: margin + random() * (HEIGHT - margin * 2),
    });
    for (let attempt = 0; attempt < 2048; attempt += 1) {
      const cue = position();
      const target = position();
      if (playableLayout(cue, target, pocket)) return { pocket, color, cue, target };
    }
    // A collinear fallback also works for pockets near a corner.
    const center = { x: WIDTH / 2, y: HEIGHT / 2 };
    const cue = { x: center.x + (center.x - pocket.x) * 0.3, y: center.y + (center.y - pocket.y) * 0.3 };
    const target = { x: center.x + (pocket.x - center.x) * 0.3, y: center.y + (pocket.y - center.y) * 0.3 };
    return { pocket, color, cue, target };
  }

  function createState(date) {
    const key = dateKey(date);
    const layout = createLayout(key);
    return {
      date: key,
      layout,
      pocket: layout.pocket,
      shots: 0,
      won: false,
      moving: false,
      scratched: false,
      balls: [layout.cue, layout.target].map(ball => ({ ...ball, vx: 0, vy: 0, potted: false })),
    };
  }

  function restoreState(saved, date) {
    const state = createState(date);
    if (!saved || saved.date !== state.date || !Number.isSafeInteger(saved.shots) || saved.shots < 0 ||
        !Array.isArray(saved.balls) || saved.balls.length !== 2 ||
        typeof saved.moving !== 'boolean' || typeof saved.won !== 'boolean' ||
        typeof saved.scratched !== 'boolean') return state;
    const validBall = ball => ball &&
      ['x', 'y', 'vx', 'vy'].every(key => Number.isFinite(ball[key])) &&
      typeof ball.potted === 'boolean' &&
      ball.x >= -POCKET_RADIUS && ball.x <= WIDTH + POCKET_RADIUS &&
      ball.y >= -POCKET_RADIUS && ball.y <= HEIGHT + POCKET_RADIUS &&
      Math.hypot(ball.vx, ball.vy) <= MAX_SPEED * 1.01 &&
      (!ball.potted || (ball.vx === 0 && ball.vy === 0)) &&
      (ball.potted || (ball.x >= RADIUS - 0.1 && ball.x <= WIDTH - RADIUS + 0.1 &&
        ball.y >= RADIUS - 0.1 && ball.y <= HEIGHT - RADIUS + 0.1));
    if (!saved.balls.every(validBall) || saved.won !== saved.balls[1].potted ||
        (!saved.moving && saved.balls.some(ball => ball.vx !== 0 || ball.vy !== 0)) ||
        (!saved.moving && saved.balls[0].potted) ||
        (saved.balls.every(ball => !ball.potted) && distance(saved.balls[0], saved.balls[1]) < RADIUS * 2 - 0.5)) return state;
    state.shots = saved.shots;
    state.won = saved.won;
    state.moving = saved.moving;
    state.scratched = saved.scratched;
    state.balls = saved.balls.map(ball => ({
      x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy, potted: ball.potted,
    }));
    return state;
  }

  function speedForPower(power) {
    return MIN_SPEED + (MAX_SPEED - MIN_SPEED) * Math.pow(Math.max(1, Math.min(100, power)) / 100, 1.15);
  }

  function shoot(state, angle, power) {
    if (state.moving || state.won || state.balls[0].potted ||
        !Number.isFinite(angle) || !Number.isFinite(power)) return false;
    const speed = speedForPower(power);
    state.balls[0].vx = Math.cos(angle) * speed;
    state.balls[0].vy = Math.sin(angle) * speed;
    state.shots += 1;
    state.moving = true;
    state.scratched = false;
    return true;
  }

  function segmentDistanceSquared(ax, ay, bx, by, point) {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const progress = lengthSquared ? Math.max(0, Math.min(1,
      ((point.x - ax) * dx + (point.y - ay) * dy) / lengthSquared)) : 0;
    return (ax + progress * dx - point.x) ** 2 + (ay + progress * dy - point.y) ** 2;
  }

  function capture(state, index, oldX, oldY, events) {
    const ball = state.balls[index];
    if (ball.potted || segmentDistanceSquared(oldX, oldY, ball.x, ball.y, state.pocket) > CAPTURE_RADIUS ** 2) return;
    ball.potted = true;
    ball.x = state.pocket.x;
    ball.y = state.pocket.y;
    ball.vx = 0;
    ball.vy = 0;
    if (index === 0) {
      state.scratched = true;
      state.shots += 1;
      events.cuePotted = true;
    } else {
      state.won = true;
      events.targetPotted = true;
      events.won = true;
    }
  }

  function bounceRails(ball) {
    if (ball.potted) return;
    if (ball.x < RADIUS) {
      ball.x = RADIUS;
      if (ball.vx < 0) ball.vx *= -RAIL_RESTITUTION;
    } else if (ball.x > WIDTH - RADIUS) {
      ball.x = WIDTH - RADIUS;
      if (ball.vx > 0) ball.vx *= -RAIL_RESTITUTION;
    }
    if (ball.y < RADIUS) {
      ball.y = RADIUS;
      if (ball.vy < 0) ball.vy *= -RAIL_RESTITUTION;
    } else if (ball.y > HEIGHT - RADIUS) {
      ball.y = HEIGHT - RADIUS;
      if (ball.vy > 0) ball.vy *= -RAIL_RESTITUTION;
    }
  }

  function collideBalls(a, b) {
    if (a.potted || b.potted) return;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const separation = Math.hypot(dx, dy);
    if (separation >= RADIUS * 2) return;
    const nx = separation > 0.00001 ? dx / separation : 1;
    const ny = separation > 0.00001 ? dy / separation : 0;
    const correction = (RADIUS * 2 - separation + 0.00001) / 2;
    a.x -= nx * correction;
    a.y -= ny * correction;
    b.x += nx * correction;
    b.y += ny * correction;
    const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (approach >= 0) return;
    // Equal masses: exchange only the normal component, keeping tangent motion.
    a.vx += approach * nx;
    a.vy += approach * ny;
    b.vx -= approach * nx;
    b.vy -= approach * ny;
  }

  function respawnCue(state) {
    const target = state.balls[1];
    const safe = point => distance(point, state.pocket) > POCKET_RADIUS + RADIUS + 10 &&
      (target.potted || distance(point, target) > RADIUS * 2 + 10);
    let point = state.layout.cue;
    if (!safe(point)) {
      let bestScore = -Infinity;
      for (let y = RADIUS + 20; y <= HEIGHT - RADIUS - 20; y += 24) {
        for (let x = RADIUS + 20; x <= WIDTH - RADIUS - 20; x += 24) {
          const candidate = { x, y };
          if (!safe(candidate)) continue;
          const score = -distance(candidate, state.layout.cue);
          if (score > bestScore) {
            point = candidate;
            bestScore = score;
          }
        }
      }
    }
    Object.assign(state.balls[0], { x: point.x, y: point.y, vx: 0, vy: 0, potted: false });
  }

  function step(state, dt) {
    const events = { cuePotted: false, targetPotted: false, settled: false, respawned: false, won: false };
    if (!state.moving || !Number.isFinite(dt) || dt <= 0) return events;
    // Bound work after a background-tab pause; the saved shot still resumes.
    const elapsed = Math.min(dt, 0.25);
    const count = Math.ceil(elapsed / FIXED_STEP);
    const interval = elapsed / count;
    for (let tick = 0; tick < count && state.moving; tick += 1) {
      state.balls.forEach((ball, index) => {
        if (ball.potted) return;
        const oldX = ball.x;
        const oldY = ball.y;
        const speed = Math.hypot(ball.vx, ball.vy);
        if (speed > 0) {
          const duration = Math.min(interval, speed / FRICTION);
          const travel = speed * duration - 0.5 * FRICTION * duration * duration;
          ball.x += (ball.vx / speed) * travel;
          ball.y += (ball.vy / speed) * travel;
          const nextSpeed = Math.max(0, speed - FRICTION * interval);
          ball.vx *= nextSpeed / speed;
          ball.vy *= nextSpeed / speed;
        }
        capture(state, index, oldX, oldY, events);
        bounceRails(ball);
      });
      for (let iteration = 0; iteration < 3; iteration += 1) {
        collideBalls(state.balls[0], state.balls[1]);
        state.balls.forEach((ball, index) => {
          capture(state, index, ball.x, ball.y, events);
          bounceRails(ball);
        });
      }
      state.balls.forEach(ball => {
        if (Math.hypot(ball.vx, ball.vy) < STOP_SPEED) {
          ball.vx = 0;
          ball.vy = 0;
        }
      });
      state.moving = state.balls.some(ball => !ball.potted && (ball.vx !== 0 || ball.vy !== 0));
      if (!state.moving) {
        if (state.balls[0].potted) {
          respawnCue(state);
          events.respawned = true;
        }
        events.settled = true;
      }
    }
    return events;
  }

  return {
    WIDTH, HEIGHT, RADIUS, POCKET_RADIUS, CAPTURE_RADIUS, FIXED_STEP,
    MAX_SPEED, MIN_SPEED, FRICTION, RAIL_RESTITUTION,
    createLayout, createState, restoreState, shoot, step, speedForPower, pocketAt,
  };
});
