// events.js
// The event deck: what can happen each day, and how one is picked.
// No DOM code here.

import { RULES, FLARE_RADIATION } from './config.js';

// STEP 1 PLACEHOLDER: made-up flare classes so the game can run.
// Step 2 replaces this with real flares from NASA DONKI (LIVE) or archive.js
// (ARCHIVED). These are not real data, so the game does not show a date for them.
const PLACEHOLDER_FLARES = ['C3.1', 'C8.4', 'M1.2', 'M2.5', 'X1.1'];
const PLACEHOLDER_M_COUNT = 3;
const PLACEHOLDER_X_COUNT = 1;

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

// A blank event. Every event has all these fields so the game rules
// never have to check whether one is missing.
function baseEvent() {
  return {
    id: 'quiet',
    emoji: '😌',
    title: 'Quiet day',
    news: 'No warnings today. A good day to plan carefully.',
    powerChange: 0,
    extraRadiation: 0,
    extraFood: 0,
    airLost: 0,
    scienceMultiplier: 1,
    flareClass: null,
  };
}

export function makeFlareEvent(classType) {
  return {
    ...baseEvent(),
    id: 'flare',
    emoji: '☀️',
    title: `Solar flare (class ${classType})`,
    news: `Warning! The Sun just sent out a big burst called a solar flare (class ${classType}). It will add ${flareRadiation(classType)} extra radiation today. Radiation is invisible energy that can hurt the crew. The shield can block it.`,
    extraRadiation: flareRadiation(classType),
    flareClass: classType,
  };
}

function makeBadPowerEvent(site) {
  return {
    ...baseEvent(),
    id: 'lowPower',
    emoji: site.id === 'mars' ? '🌪️' : '🌑',
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
export function drawEvent(day, flareCount, site, rng = Math.random) {
  if (day === 1) return baseEvent(); // day 1 is always calm

  const pickFlare = () =>
    PLACEHOLDER_FLARES[Math.floor(rng() * PLACEHOLDER_FLARES.length)];

  // Make sure every player meets a flare.
  if (day >= RULES.forceFlareOnDay && flareCount === 0) {
    return makeFlareEvent(pickFlare());
  }

  if (rng() < flareChance(PLACEHOLDER_M_COUNT, PLACEHOLDER_X_COUNT)) {
    return makeFlareEvent(pickFlare());
  }
  if (rng() < RULES.badPowerChance) {
    return makeBadPowerEvent(site);
  }
  return pickWeighted(OTHER_EVENTS, rng).make();
}
