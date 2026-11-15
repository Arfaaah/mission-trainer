// Run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SITES, RULES } from '../js/config.js';
import { newGame, startDay, runDay, resolveDay, emptyPlan, carryOverPlan } from '../js/game.js';
import { drawEvent, flareChance, makeFlareEvent } from '../js/events.js';

const moon = SITES.moon;
const quiet = drawEvent(1, 0, moon); // day 1 is always the quiet event
const plan = (p) => ({ ...emptyPlan(), ...p });

test('air math: 3 life support units make 18, crew breathes 15', () => {
  const { after } = resolveDay({ air: 70, food: 70, health: 100, science: 0 },
    plan({ lifeSupport: 3 }), quiet, moon);
  assert.equal(after.air, 73);
});

test('shield blocks 5 radiation per power unit', () => {
  const flare = makeFlareEvent('M1.0'); // 18 extra radiation
  const meters = { air: 70, food: 70, health: 100, science: 0 };
  // Moon base radiation 6 + flare 18 = 24. Shield 2 blocks 10, so 14 gets through.
  const r = resolveDay(meters, plan({ shield: 2 }), flare, moon);
  assert.equal(r.details.radiationBlocked, 10);
  assert.equal(r.after.health, 86);
  // Shield 5 blocks 25, more than the 24 coming in: nothing gets through.
  const r2 = resolveDay(meters, plan({ shield: 5 }), flare, moon);
  assert.equal(r2.details.radiationThrough, 0);
  assert.equal(r2.after.health, 100);
});

test('running out of food lowers health by 8', () => {
  const r = resolveDay({ air: 70, food: 5, health: 100, science: 0 },
    plan({ shield: 2 }), quiet, moon); // shield blocks all base radiation
  assert.equal(r.after.food, 0);
  assert.equal(r.details.hungry, true);
  assert.equal(r.after.health, 100 - RULES.hungerDamage);
});

test('game ends when air reaches 0', () => {
  const state = newGame('moon', 'Test');
  state.meters.air = 10;
  startDay(state);
  runDay(state, emptyPlan()); // no life support: 10 - 15 -> 0
  assert.equal(state.meters.air, 0);
  assert.equal(state.status, 'lost');
  assert.equal(state.endReason, 'air');
});

test('a flare is forced on day 6 if none has happened yet', () => {
  const neverFlare = () => 0.99; // a dice roll that never picks a flare by chance
  assert.equal(drawEvent(5, 0, moon, neverFlare).id === 'flare', false);
  assert.equal(drawEvent(6, 0, moon, neverFlare).id, 'flare');
});

test('day 1 is always calm', () => {
  assert.equal(drawEvent(1, 0, moon, () => 0).id, 'quiet');
});

test('flare chance is clamped between 0.10 and 0.35', () => {
  assert.equal(flareChance(0, 0), 0.10);
  assert.ok(Math.abs(flareChance(5, 1) - 0.19) < 1e-9);
  assert.equal(flareChance(50, 10), 0.35);
});

test('a full 10 day mission with a sensible plan is won', () => {
  // Seeded dice so the test gives the same result every run.
  let seed = 42;
  const rng = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const state = newGame('moon', 'Test');
  for (let i = 0; i < RULES.days; i++) {
    const ev = startDay(state, rng);
    const power = moon.dailyPower + ev.powerChange;
    // Simple strategy: air first, then shield, food, science.
    const p = emptyPlan();
    let left = power;
    for (const [k, n] of [['lifeSupport', 3], ['shield', 2], ['greenhouse', 2], ['science', 3]]) {
      p[k] = Math.min(n, left);
      left -= p[k];
    }
    runDay(state, p);
  }
  assert.equal(state.status, 'won');
  assert.equal(state.history.length, 10);
});

test('day 1 starts with life support 3, greenhouse 2, shield 1, science 0', () => {
  assert.deepEqual(carryOverPlan(null, 10),
    { lifeSupport: 3, greenhouse: 2, shield: 1, science: 0 });
});

test('yesterday\'s plan is kept when it fits', () => {
  const p = plan({ lifeSupport: 3, greenhouse: 2, shield: 2, science: 3 });
  assert.deepEqual(carryOverPlan(p, 10), p);
});

test('less power cuts science, then shield, then food, then life support', () => {
  const p = plan({ lifeSupport: 3, greenhouse: 2, shield: 2, science: 3 }); // uses 10
  // 6 power: science 3 -> 0, shield 2 -> 1
  assert.deepEqual(carryOverPlan(p, 6),
    { lifeSupport: 3, greenhouse: 2, shield: 1, science: 0 });
  // 2 power: science, shield and greenhouse all gone, life support 3 -> 2
  assert.deepEqual(carryOverPlan(p, 2),
    { lifeSupport: 2, greenhouse: 0, shield: 0, science: 0 });
});
