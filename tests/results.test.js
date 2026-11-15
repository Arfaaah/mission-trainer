// Run with: node --test
// Step 4: stars, badges, tips, saved badges and forecast warnings.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BADGE_STORAGE_KEY } from '../js/config.js';
import {
  newGame, startDay, runDay, starsFor, earnedBadges, tipsFor,
  loadSavedBadges, saveBadges, daysUntilEmpty, forecastWarnings, resolveDay, emptyPlan,
} from '../js/game.js';
import { archivedSun } from '../js/data/donki.js';
import { drawEvent } from '../js/events.js';
import { SITES } from '../js/config.js';

const sun = archivedSun();
// Dice of 0.5: no flare by chance, no bad power event, a quiet day every day,
// and the forced day 6 flare is archived flare M1.0 (18 radiation).
const noFlareDice = () => 0.5;

// Play a whole mission with the same plan every day.
// Uses dice that only give the forced flare on day 6.
function play(siteId, plan, dice = noFlareDice) {
  const state = newGame(siteId, 'Test', sun, () => 0);
  while (state.status === 'playing') {
    startDay(state, dice);
    runDay(state, plan);
  }
  return state;
}

// A fake localStorage
function fakeStorage(start = {}) {
  const data = { ...start };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    data,
  };
}
const brokenStorage = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('blocked'); },
};

// ---------- Stars ----------

test('stars: 0 if the crew went home early', () => {
  const s = newGame('moon', 'T', sun);
  s.status = 'lost';
  assert.equal(starsFor(s), 0);
});

test('stars: survive = 1, survive + 45 science = 2, survive + 70 science = 3', () => {
  const s = newGame('moon', 'T', sun);
  s.status = 'won';
  s.meters.science = 44; assert.equal(starsFor(s), 1);
  s.meters.science = 45; assert.equal(starsFor(s), 2);
  s.meters.science = 69; assert.equal(starsFor(s), 2);
  s.meters.science = 70; assert.equal(starsFor(s), 3);
});

// ---------- Badges ----------

test('a strong shield earns Flare Survivor and Perfect Shield', () => {
  // Flare day: Moon base 6 + flare 18 = 24. Shield 5 blocks 25, so nothing gets through.
  // Greenhouse 0, so food runs out: no Green Thumb. Science 2 x 3 x 10 = 60: no Scientist.
  const s = play('moon', { lifeSupport: 3, greenhouse: 0, shield: 5, science: 2 });
  assert.equal(s.status, 'won');
  assert.deepEqual(earnedBadges(s).sort(), ['flareSurvivor', 'moonCommander', 'perfectShield'].sort());
});

test('Flare Survivor needs a flare day where the shield blocked everything', () => {
  // Shield 3 blocks 15: on normal days (6) nothing gets through, but on the
  // flare day 24 comes in and 9 get through. So no Flare Survivor, no Perfect Shield.
  const s = play('moon', { lifeSupport: 3, greenhouse: 2, shield: 3, science: 2 });
  assert.equal(s.status, 'won');
  const badges = earnedBadges(s);
  assert.ok(!badges.includes('flareSurvivor'));
  assert.ok(!badges.includes('perfectShield'));
  assert.ok(badges.includes('greenThumb'));
});

test('Scientist needs 100 science', () => {
  // Science 5 x 3 = 15 a day: 100 (the top of the meter) by day 7. No shield, so no shield badges.
  const s = play('moon', { lifeSupport: 3, greenhouse: 2, shield: 0, science: 5 });
  assert.equal(s.status, 'won');
  assert.equal(s.meters.science, 100);
  assert.deepEqual(earnedBadges(s).sort(), ['greenThumb', 'moonCommander', 'scientist'].sort());
  const almost = play('moon', { lifeSupport: 3, greenhouse: 2, shield: 2, science: 3 }); // 90
  assert.equal(almost.meters.science, 90);
  assert.ok(!earnedBadges(almost).includes('scientist'));
});

test('Green Thumb needs food to never run out', () => {
  const fed = play('moon', { lifeSupport: 3, greenhouse: 2, shield: 2, science: 3 });
  assert.ok(earnedBadges(fed).includes('greenThumb'));
  const unfed = play('moon', { lifeSupport: 3, greenhouse: 0, shield: 2, science: 5 });
  assert.equal(unfed.status, 'won');
  assert.ok(!earnedBadges(unfed).includes('greenThumb'));
});

test('a finished Mars mission earns Mars Commander, not Moon Commander', () => {
  const s = play('mars', { lifeSupport: 3, greenhouse: 2, shield: 2, science: 2 });
  assert.equal(s.status, 'won');
  assert.ok(earnedBadges(s).includes('marsCommander'));
  assert.ok(!earnedBadges(s).includes('moonCommander'));
});

test('no badges if the crew went home early', () => {
  const s = play('moon', emptyPlan());
  assert.equal(s.status, 'lost');
  assert.deepEqual(earnedBadges(s), []);
});

// ---------- Tips ----------

test('tips: running out of air gives an air tip first', () => {
  const s = play('moon', emptyPlan());
  const tips = tipsFor(s);
  assert.ok(tips.length >= 1 && tips.length <= 3);
  assert.match(tips[0], /air ran out on Day 5/);
});

test('tips: hungry crew gets a Greenhouse tip, using sols on Mars', () => {
  const s = play('mars', { lifeSupport: 3, greenhouse: 0, shield: 2, science: 4 });
  const tips = tipsFor(s);
  assert.ok(tips.some((t) => /went hungry on \d+ sols/.test(t)), tips.join(' | '));
});

test('tips: wasted power gets a tip', () => {
  const s = play('moon', { lifeSupport: 3, greenhouse: 2, shield: 2, science: 0 }); // 3 wasted daily
  assert.ok(tipsFor(s).some((t) => /power was wasted/.test(t)));
});

test('tips: a perfect mission still gets exactly one friendly tip', () => {
  const s = play('moon', { lifeSupport: 3, greenhouse: 2, shield: 5, science: 0 });
  s.meters.science = 100; // pretend they did great science too
  const tips = tipsFor(s);
  assert.equal(tips.length, 1);
  assert.match(tips[0], /brilliant/i);
});

test('tips: never more than 3', () => {
  const s = play('mars', { lifeSupport: 3, greenhouse: 0, shield: 0, science: 0 });
  assert.ok(tipsFor(s).length <= 3);
});

// ---------- Saved badges ----------

test('badges are saved and only new ones are reported as new', () => {
  const store = fakeStorage();
  const first = saveBadges(['moonCommander', 'flareSurvivor'], store);
  assert.deepEqual(first.newOnes, ['moonCommander', 'flareSurvivor']);
  const second = saveBadges(['moonCommander', 'scientist'], store);
  assert.deepEqual(second.newOnes, ['scientist']);
  assert.deepEqual(loadSavedBadges(store).sort(), ['flareSurvivor', 'moonCommander', 'scientist']);
  assert.ok(BADGE_STORAGE_KEY in store.data);
});

test('broken or blocked storage never crashes the game', () => {
  assert.deepEqual(loadSavedBadges(brokenStorage), []);
  const r = saveBadges(['moonCommander'], brokenStorage);
  assert.deepEqual(r.newOnes, ['moonCommander']);
  assert.deepEqual(loadSavedBadges(fakeStorage({ [BADGE_STORAGE_KEY]: 'not json' })), []);
  assert.deepEqual(loadSavedBadges(undefined), []);
});

// ---------- Forecast warnings ----------

test('days until empty', () => {
  assert.equal(daysUntilEmpty(70, 73), null); // going up
  assert.equal(daysUntilEmpty(70, 70), null); // steady
  assert.equal(daysUntilEmpty(60, 45), 4);    // 15 a day: 60 -> 0 in 4
  assert.equal(daysUntilEmpty(70, 55), 5);    // 70/15 = 4.7, so it is gone on the 5th day
  assert.equal(daysUntilEmpty(10, 0), 1);     // gone at the end of today
});

test('forecast warnings show air and food going down, and hunger', () => {
  const quiet = drawEvent(1, 0, SITES.moon);
  const meters = { air: 60, food: 5, health: 100, science: 0 };
  const plan = { lifeSupport: 0, greenhouse: 0, shield: 0, science: 0 };
  const { after, details } = resolveDay(meters, plan, quiet, SITES.moon);
  const w = forecastWarnings(meters, after, details);
  assert.deepEqual(w.find((x) => x.meter === 'air'), { meter: 'air', daysLeft: 4 });
  assert.ok(w.some((x) => x.meter === 'hungry'));
});

test('no forecast warnings when air and food hold steady', () => {
  const quiet = drawEvent(1, 0, SITES.moon);
  const meters = { air: 70, food: 70, health: 100, science: 0 };
  const { after, details } = resolveDay(meters, { lifeSupport: 3, greenhouse: 2, shield: 2, science: 3 }, quiet, SITES.moon);
  assert.deepEqual(forecastWarnings(meters, after, details), []);
});
