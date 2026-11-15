// Run with: node --test
// Moon vs Mars differences (section 4.4 of CLAUDE.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SITES } from '../js/config.js';
import { newGame, startDay, runDay, resolveDay, emptyPlan, morningEvent, pickMessageDelay, powerToday } from '../js/game.js';
import { drawEvent, knownEvent } from '../js/events.js';
import { archivedSun } from '../js/data/donki.js';

const { moon, mars } = SITES;
const sun = archivedSun();
const meters = { air: 70, food: 70, health: 100, science: 0 };
const quiet = drawEvent(1, 0, mars);

// A dice that gives back these numbers in order, then repeats the last one.
const dice = (...values) => { let i = 0; return () => values[Math.min(i++, values.length - 1)]; };

test('daily power: Moon 10, Mars 9', () => {
  assert.equal(powerToday(moon, quiet), 10);
  assert.equal(powerToday(mars, quiet), 9);
});

test('base radiation: Moon 6, Mars 4', () => {
  assert.equal(resolveDay(meters, emptyPlan(), quiet, moon).details.radiationIn, 6);
  assert.equal(resolveDay(meters, emptyPlan(), quiet, mars).details.radiationIn, 4);
});

test('bad power event: Long shadows on the Moon, Dust storm on Mars, both minus 4', () => {
  // Day 2, no flare (0.99), bad power event (0.0)
  const moonEv = drawEvent(2, 0, moon, dice(0.99, 0.0), sun);
  const marsEv = drawEvent(2, 0, mars, dice(0.99, 0.0), sun);
  assert.equal(moonEv.title, 'Long shadows');
  assert.equal(marsEv.title, 'Dust storm');
  assert.equal(powerToday(moon, moonEv), 6);
  assert.equal(powerToday(mars, marsEv), 5);
});

test('day names: Day on the Moon, Sol on Mars', () => {
  assert.equal(moon.dayName, 'Day');
  assert.equal(mars.dayName, 'Sol');
  assert.equal(mars.dayLength, '24 h 39 min');
});

test('Moon warnings always arrive', () => {
  // Forced flare on day 6. Dice of 0 would hide the warning if the Moon allowed it.
  const ev = drawEvent(6, 0, moon, () => 0, sun);
  assert.equal(ev.id, 'flare');
  assert.equal(ev.hidden, false);
});

test('Mars: a flare warning arrives too late when the dice says so', () => {
  // dice: pick flare (0), late warning roll 0.2 < 0.5 -> hidden
  const late = drawEvent(6, 0, mars, dice(0, 0.2), sun);
  assert.equal(late.id, 'flare');
  assert.equal(late.hidden, true);
  // dice: pick flare (0), late warning roll 0.7 >= 0.5 -> arrives in time
  const onTime = drawEvent(6, 0, mars, dice(0, 0.7), sun);
  assert.equal(onTime.hidden, false);
});

test('Mars: about half of flare warnings arrive too late', () => {
  let seed = 7;
  const rng = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  let hidden = 0;
  const n = 2000;
  for (let i = 0; i < n; i++) if (drawEvent(6, 0, mars, rng, sun).hidden) hidden++;
  assert.ok(hidden / n > 0.45 && hidden / n < 0.55, `got ${hidden / n}`);
});

test('a surprise flare looks like "no warnings" in the morning, and the forecast leaves it out', () => {
  const flare = drawEvent(6, 0, mars, dice(0, 0.2), sun);
  const seen = knownEvent(flare);
  assert.equal(seen.id, 'quiet');
  assert.equal(seen.extraRadiation, 0);
  assert.equal(seen.flare, null);
  assert.equal(seen.news, drawEvent(1, 0, mars).news); // same words as a real quiet day
  // Forecast (what the player sees) vs what really happens
  const forecast = resolveDay(meters, emptyPlan(), seen, mars);
  const real = resolveDay(meters, emptyPlan(), flare, mars);
  assert.equal(forecast.details.radiationIn, 4);
  assert.ok(real.details.radiationIn > 4);
});

test('a surprise flare really hits when the day runs, and the report explains it', () => {
  const state = newGame('mars', 'Test', sun, () => 0);
  state.day = 6;
  startDay(state, dice(0, 0.2));
  assert.equal(morningEvent(state).id, 'quiet');
  const report = runDay(state, { lifeSupport: 3, greenhouse: 2, shield: 1, science: 0 });
  assert.equal(report.event.hidden, true);
  assert.ok(report.details.radiationThrough > 0);
  assert.match(report.why, /arrived too late/);
  assert.equal(state.flareCount, 1);
});

test('message delay: Moon about 1.3 seconds, Mars 3 to 22 minutes', () => {
  assert.equal(pickMessageDelay(moon).text, 'about 1.3 seconds');
  assert.equal(pickMessageDelay(moon).minutes, null);
  assert.equal(pickMessageDelay(mars, () => 0).minutes, 3);
  assert.equal(pickMessageDelay(mars, () => 0.9999).minutes, 22);
  assert.equal(pickMessageDelay(mars, () => 0.5).text, '13 minutes');
});

test('the Mars delay stays the same for the whole mission and is in every report', () => {
  const state = newGame('mars', 'Test', sun, () => 0.5);
  for (let i = 0; i < 3; i++) {
    startDay(state, () => 0.99);
    const r = runDay(state, { lifeSupport: 3, greenhouse: 2, shield: 1, science: 3 });
    assert.equal(r.messageDelay.minutes, 13);
  }
});
