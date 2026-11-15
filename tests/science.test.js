// Run with: node --test
// Step 5: archived RadLab and OSDR data, experiment cards and fact cards.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SITES, EXPERIMENTS } from '../js/config.js';
import { ISS_RADIATION, OSDR_STUDIES, SCIENCE_FACTS } from '../js/data/archive.js';
import { drawEvent, drawExperiment, makeFlareEvent } from '../js/events.js';
import {
  newGame, startDay, runDay, resolveDay, emptyPlan, powerUsed, isValidPlan, carryOverPlan,
  pickDayFact, resultFacts, missionRadiation, powerToday,
} from '../js/game.js';
import { archivedSun } from '../js/data/donki.js';

const sun = archivedSun();
const meters = { air: 70, food: 70, health: 100, science: 0 };
const quiet = drawEvent(1, 0, SITES.moon);
const card = (id) => ({ ...EXPERIMENTS.find((e) => e.id === id) });

// ---------- Archived data ----------

test('RadLab sample: 7 days from DosTel1 on the ISS, and the average matches', () => {
  assert.equal(ISS_RADIATION.instrument, 'DosTel1');
  assert.equal(ISS_RADIATION.spacecraft, 'ISS');
  assert.equal(ISS_RADIATION.dailyDose.length, 7);
  const mean = ISS_RADIATION.dailyDose.reduce((s, d) => s + d.microgray, 0) / 7;
  assert.equal(Math.round(mean), ISS_RADIATION.averagePerDay);
});

test('OSDR studies: 6 to 10 real study IDs, each with a title, kid sentence and link', () => {
  assert.ok(OSDR_STUDIES.length >= 6 && OSDR_STUDIES.length <= 10);
  for (const s of OSDR_STUDIES) {
    assert.match(s.id, /^OSD-\d+$/);
    assert.ok(s.title.length > 10 && s.kid.length > 10);
    assert.equal(s.url, `https://osdr.nasa.gov/bio/repo/data/studies/${s.id}`);
  }
});

test('every fact card has text, a source and an https link', () => {
  const ids = new Set();
  for (const f of SCIENCE_FACTS) {
    assert.ok(f.text && f.source, f.id);
    assert.match(f.url, /^https:\/\//);
    assert.ok(!ids.has(f.id), `duplicate fact ${f.id}`);
    ids.add(f.id);
  }
});

test('every experiment card is based on one of the archived OSDR studies', () => {
  for (const e of EXPERIMENTS) {
    assert.ok(OSDR_STUDIES.some((s) => s.id === e.study), e.id);
    assert.ok(e.science > 0 && e.powerCost >= 0 && e.airCost >= 0);
  }
});

// ---------- Experiment cards ----------

test('the Moon soil experiment never appears on Mars', () => {
  for (let i = 0; i < 100; i++) {
    const c = drawExperiment(SITES.mars, () => i / 100);
    assert.notEqual(c.id, 'moon-soil');
    assert.equal(c.studyInfo.id, c.study);
  }
  assert.ok([...Array(100).keys()].some((i) => drawExperiment(SITES.moon, () => i / 100).id === 'moon-soil'));
});

test('an experiment uses power, and you cannot run it without enough', () => {
  const plan = { ...emptyPlan(), lifeSupport: 3, greenhouse: 2, shield: 2, science: 1, experiment: card('tomato-light') };
  assert.equal(powerUsed(plan), 10); // 8 in systems + 2 for the experiment
  assert.ok(isValidPlan(plan, 10));
  assert.ok(!isValidPlan({ ...plan, science: 2 }, 10));
});

test('an experiment adds its science, and a strange rock does not double it', () => {
  const plan = { ...emptyPlan(), science: 2, experiment: card('tomato-light') }; // lab 6 + experiment 8
  const normal = resolveDay(meters, plan, quiet, SITES.moon);
  assert.equal(normal.details.scienceMade, 14);
  const rock = drawEvent(2, 0, SITES.moon, (() => { const v = [0.99, 0.99, 0.99]; return () => v.shift() ?? 0.99; })(), sun);
  assert.equal(rock.id, 'rock');
  const rockDay = resolveDay(meters, plan, rock, SITES.moon);
  assert.equal(rockDay.details.labScience, 12);
  assert.equal(rockDay.details.experimentScience, 8);
});

test('the crew fitness test costs air instead of power', () => {
  const plan = { ...emptyPlan(), lifeSupport: 3, experiment: card('fitness-test') };
  assert.equal(powerUsed(plan), 3);
  const r = resolveDay(meters, plan, quiet, SITES.moon);
  assert.equal(r.details.airLost, 15 + 6);
  assert.equal(r.after.air, 70 + 18 - 21);
  assert.equal(r.after.science, 6);
});

test('the experiment is not carried over to the next day', () => {
  const yesterday = { ...emptyPlan(), lifeSupport: 3, experiment: card('muscle-chip') };
  assert.equal(carryOverPlan(yesterday, 10).experiment, null);
});

test('each day has an experiment card', () => {
  const state = newGame('mars', 'Test', sun, () => 0);
  startDay(state, () => 0.5);
  assert.ok(state.todayExperiment && state.todayExperiment.studyInfo);
});

// ---------- Fact cards ----------

test('a flare day gets a flare fact, a Mars dust storm gets the Opportunity fact', () => {
  const moonState = newGame('moon', 'T', sun);
  const flare = makeFlareEvent({ classType: 'M1.0', peakTime: null, tag: 'ARCHIVED', source: 'x' });
  assert.ok(pickDayFact(moonState, flare).tags.includes('flare'));

  const marsState = newGame('mars', 'T', sun);
  const dust = drawEvent(2, 0, SITES.mars, (() => { const v = [0.99, 0.0]; return () => v.shift() ?? 0.5; })(), sun);
  assert.equal(dust.title, 'Dust storm');
  assert.equal(pickDayFact(marsState, dust).id, 'opportunity-dust');
});

test('a surprise flare on Mars gets the message delay fact', () => {
  const state = newGame('mars', 'T', sun);
  const surprise = { ...makeFlareEvent({ classType: 'M1.0', peakTime: null, tag: 'ARCHIVED', source: 'x' }), hidden: true };
  assert.equal(pickDayFact(state, surprise).id, 'mars-delay');
});

test('facts do not repeat during a mission until all have been shown', () => {
  const state = newGame('moon', 'T', sun);
  const seen = new Set();
  for (let i = 0; i < SCIENCE_FACTS.length; i++) seen.add(pickDayFact(state, quiet, Math.random).id);
  assert.equal(seen.size, SCIENCE_FACTS.length);
  assert.ok(pickDayFact(state, quiet)); // then it starts again without crashing
});

test('every day report has a fact card', () => {
  const state = newGame('moon', 'T', sun, () => 0);
  for (let i = 0; i < 3; i++) {
    startDay(state, () => 0.5);
    const r = runDay(state, carryOverPlan(null, 10));
    assert.ok(r.fact && r.fact.source && r.fact.url);
  }
});

test('the results screen gets 3 different facts, preferring ones not seen yet', () => {
  const state = newGame('moon', 'T', sun);
  state.factsShown = SCIENCE_FACTS.slice(0, SCIENCE_FACTS.length - 3).map((f) => f.id);
  const facts = resultFacts(state, () => 0.5);
  assert.equal(facts.length, 3);
  assert.equal(new Set(facts.map((f) => f.id)).size, 3);
  assert.ok(facts.every((f) => !state.factsShown.includes(f.id)));
});

// ---------- Radiation comparison ----------

test('mission radiation adds up what reached the base, what was blocked and what got through', () => {
  const state = newGame('moon', 'T', sun, () => 0);
  for (let i = 0; i < 2; i++) {
    startDay(state, () => 0.5); // quiet days on the Moon: 6 radiation each
    runDay(state, { ...emptyPlan(), lifeSupport: 3, shield: 1 }); // shield blocks 5
  }
  assert.deepEqual(missionRadiation(state), { reached: 12, through: 2, blocked: 10, days: 2, throughPerDay: 1 });
});

test('a full Mars mission running an experiment whenever there is power still works', () => {
  let seed = 11;
  const rng = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const state = newGame('mars', 'T', sun, rng);
  let ran = 0;
  while (state.status === 'playing') {
    startDay(state, rng);
    const power = powerToday(SITES.mars, state.todayEvent); // 9, or 5 in a dust storm
    const plan = carryOverPlan({ lifeSupport: 3, greenhouse: 2, shield: 2, science: 0 }, power);
    const ex = state.todayExperiment;
    const withEx = { ...plan, experiment: ex };
    if (isValidPlan(withEx, power)) { runDay(state, withEx, rng); ran++; } else runDay(state, plan, rng);
  }
  assert.equal(state.status, 'won');
  assert.ok(ran > 0);
  assert.ok(state.meters.science > 0);
});
