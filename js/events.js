// events.js
// The event deck: what can happen each day, and how one is picked.
// No DOM code here.

import { RULES, FLARE_RADIATION } from './config.js';
import { ARCHIVED_FLARES } from './data/archive.js';

// Flare chance per day = 0.10 + 0.01 x M flares + 0.04 x X flares,
// kept between 0.10 and 0.35.
export function flareChance(mCount, xCount) {
  const raw = 0.10 + 0.01 * mCount + 0.04 * xCount;
  return Math.min(RULES.flareChanceMax, Math.max(RULES.flareChanceMin, raw));
}

// "M1.2" -> 18 radiation. Unknown classes count as C.
export function flareRadiation(classType) {
  const letter = String(classType).charAt(0).toUpperCase();
  return FLARE_RADIATION[letter] ?? FLARE_RADIATION.C;
}

// What Mission Control says when it knows of nothing coming. A quiet day and
// a surprise flare look exactly the same in the morning.
const NO_WARNINGS_NEWS = 'No warnings received today.';

// What the player sees in the morning. A surprise (hidden) event looks like a
// day with no warnings, so the forecast cannot give the surprise away.
export function knownEvent(event) {
  if (!event.hidden) return event;
  return { ...baseEvent(), title: 'No warnings received', emoji: '📭' };
}

// A blank event. Every event has all these fields so the game rules
// never have to check whether one is missing.
function baseEvent() {
  return {
    id: 'quiet',
    emoji: '😌',
    title: 'Quiet day',
    news: NO_WARNINGS_NEWS,
    hidden: false,     // true = a surprise: the warning arrived too late
    powerChange: 0,
    extraRadiation: 0,
    extraFood: 0,
    airLost: 0,
    scienceMultiplier: 1,
    flareClass: null,
    flare: null,       // the real flare behind this event: { classType, peakTime, tag, source }
  };
}

// flare = { classType, peakTime, tag: 'LIVE' | 'ARCHIVED', source }
export function makeFlareEvent(flare) {
  const { classType } = flare;
  return {
    ...baseEvent(),
    id: 'flare',
    emoji: '☀️',
    title: `Solar flare (class ${classType})`,
    news: `Warning! The Sun just sent out a big burst called a solar flare (class ${classType}). It will add ${flareRadiation(classType)} extra radiation today. Radiation is invisible energy that can hurt the crew. The shield can block it.`,
    extraRadiation: flareRadiation(classType),
    flareClass: classType,
    flare: { ...flare },
  };
}

// Archived flares with their tag, used when the live list has no flares in it.
const ARCHIVED_WITH_TAGS = ARCHIVED_FLARES.flares.map((f) => ({
  ...f, tag: 'ARCHIVED', source: ARCHIVED_FLARES.source,
}));

function makeBadPowerEvent(site) {
  return {
    ...baseEvent(),
    id: 'lowPower',
    emoji: site.badPowerEvent.emoji,
    title: site.badPowerEvent.title,
    news: site.badPowerEvent.news,
    powerChange: -4,
  };
}

const OTHER_EVENTS = [
  { weight: 5, make: () => baseEvent() },
  {
    weight: 1.5,
    make: () => ({
      ...baseEvent(),
      id: 'harvest',
      emoji: '🥬',
      title: 'Lettuce harvest',
      news: 'The greenhouse lettuce is ready to pick! You get 10 extra food today.',
      extraFood: 10,
    }),
  },
  {
    weight: 1.2,
    make: () => ({
      ...baseEvent(),
      id: 'leak',
      emoji: '💨',
      title: 'Small air leak',
      news: 'A small hole is letting air out. You will lose 10 air today while the crew fixes it.',
      airLost: 10,
    }),
  },
  {
    weight: 1.5,
    make: () => ({
      ...baseEvent(),
      id: 'rock',
      emoji: '🪨',
      title: 'Strange rock found',
      news: 'The crew found a strange rock! Every power unit in the Science lab counts double today.',
      scienceMultiplier: 2,
    }),
  },
];

function pickWeighted(list, rng) {
  const total = list.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of list) {
    roll -= item.weight;
    if (roll < 0) return item;
  }
  return list[list.length - 1];
}

// Pick today's event.
//   day        1 to 10
//   flareCount how many flares have happened so far this mission
//   site       an entry from SITES
//   rng        a function returning 0 to 1 (Math.random by default; tests pass their own)
//   sun        { chance, flares } from data/donki.js (LIVE or ARCHIVED)
export function drawEvent(day, flareCount, site, rng = Math.random, sun = null) {
  if (day === 1) return baseEvent(); // day 1 is always calm

  // Pick a real flare. If the live list is empty (a quiet Sun), use an archived one.
  const pool = sun && sun.flares.length > 0 ? sun.flares : ARCHIVED_WITH_TAGS;
  const chance = sun ? sun.chance : RULES.flareChanceMin;

  // Pick a flare, and on Mars decide if its warning arrives too late.
  const flareEvent = () => {
    const ev = makeFlareEvent(pool[Math.floor(rng() * pool.length)]);
    if (site.lateWarningChance > 0 && rng() < site.lateWarningChance) ev.hidden = true;
    return ev;
  };

  // Make sure every player meets a flare.
  if (day >= RULES.forceFlareOnDay && flareCount === 0) {
    return flareEvent();
  }

  if (rng() < chance) {
    return flareEvent();
  }
  if (rng() < RULES.badPowerChance) {
    return makeBadPowerEvent(site);
  }
  return pickWeighted(OTHER_EVENTS, rng).make();
}
