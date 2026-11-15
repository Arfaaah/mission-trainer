// game.js
// Game state, daily resolution, win and lose logic.
// No DOM code here, so these rules can be tested in Node.

import { RULES, SITES, SYSTEMS, STARTING_PLAN, POWER_CUT_ORDER, BADGES, BADGE_STORAGE_KEY } from './config.js';
import { drawEvent, knownEvent } from './events.js';
import { archivedSun } from './data/donki.js';

const clamp = (n) => Math.max(0, Math.min(RULES.meterMax, n));

export function emptyPlan() {
  return { lifeSupport: 0, greenhouse: 0, shield: 0, science: 0 };
}

// Start today with yesterday's plan (or the day 1 plan). If it needs more
// power than today has, remove power in POWER_CUT_ORDER until it fits.
export function carryOverPlan(previousPlan, available) {
  const plan = { ...(previousPlan || STARTING_PLAN) };
  for (const key of POWER_CUT_ORDER) {
    const extra = powerUsed(plan) - available;
    if (extra <= 0) break;
    plan[key] = Math.max(0, plan[key] - extra);
  }
  return plan;
}

// How long a message takes between Earth and this base, for one mission.
// Moon: about 1.3 seconds. Mars: a whole number of minutes from 3 to 22.
export function pickMessageDelay(site, rng = Math.random) {
  const d = site.messageDelay;
  if (d.minMinutes === undefined) return { minutes: null, text: d.text };
  const minutes = d.minMinutes + Math.floor(rng() * (d.maxMinutes - d.minMinutes + 1));
  return { minutes, text: `${minutes} minutes` };
}

// sun = flare data from data/donki.js (LIVE or ARCHIVED). Archived by default.
export function newGame(siteId = 'moon', baseName = 'Base', sun = archivedSun(), rng = Math.random) {
  return {
    siteId,
    sun,
    messageDelay: pickMessageDelay(SITES[siteId], rng),
    baseName: baseName.trim() || 'Base',
    day: 1,
    meters: {
      air: RULES.startAir,
      food: RULES.startFood,
      health: RULES.startHealth,
      science: RULES.startScience,
    },
    status: 'playing',      // 'playing' | 'won' | 'lost'
    endReason: null,        // 'air' | 'health' | null
    flareCount: 0,
    todayEvent: null,
    history: [],            // one report per finished day
  };
}

export function getSite(state) {
  return SITES[state.siteId];
}

// Draw the event for the current day. Call once at the start of each day.
export function startDay(state, rng = Math.random) {
  state.todayEvent = drawEvent(state.day, state.flareCount, getSite(state), rng, state.sun);
  return state.todayEvent;
}

// Today's event as the player knows it in the morning (surprises hidden).
export function morningEvent(state) {
  return knownEvent(state.todayEvent);
}

export function powerToday(site, event) {
  return Math.max(0, site.dailyPower + event.powerChange);
}

export function powerUsed(plan) {
  return SYSTEMS.reduce((sum, key) => sum + plan[key], 0);
}

// The heart of the game: work out what one day does to the meters.
// Pure function: it does not change anything, it just returns the result.
// Used both for the forecast and for really running the day.
export function resolveDay(meters, plan, event, site) {
  const available = powerToday(site, event);
  const used = powerUsed(plan);

  // Air
  const airMade = plan.lifeSupport * RULES.airPerLifeSupportUnit;
  const airLost = RULES.airBreathedPerDay + event.airLost;
  const air = clamp(meters.air + airMade - airLost);

  // Food
  const foodMade = plan.greenhouse * RULES.foodPerGreenhouseUnit + event.extraFood;
  const foodRaw = meters.food + foodMade - RULES.foodEatenPerDay;
  const hungry = foodRaw < 0; // not enough food for everyone today
  const food = clamp(foodRaw);

  // Radiation
  const radiationIn = site.baseRadiation + event.extraRadiation;
  const radiationBlocked = Math.min(radiationIn, plan.shield * RULES.shieldBlockPerUnit);
  const radiationThrough = radiationIn - radiationBlocked;

  // Health
  const health = clamp(meters.health - radiationThrough - (hungry ? RULES.hungerDamage : 0));

  // Science
  const scienceMade = plan.science * RULES.sciencePerLabUnit * event.scienceMultiplier;
  const science = clamp(meters.science + scienceMade);

  return {
    after: { air, food, health, science },
    details: {
      powerAvailable: available,
      powerUsed: used,
      powerWasted: Math.max(0, available - used),
      airMade, airLost,
      foodMade, foodEaten: RULES.foodEatenPerDay, hungry,
      radiationIn, radiationBlocked, radiationThrough,
      scienceMade,
    },
  };
}

// Is this plan allowed? (no negatives, not more power than we have)
export function isValidPlan(plan, available) {
  return SYSTEMS.every((k) => Number.isInteger(plan[k]) && plan[k] >= 0) &&
    powerUsed(plan) <= available;
}

// Really run the day. Changes the state and returns a report for the popup.
export function runDay(state, plan) {
  if (state.status !== 'playing') throw new Error('Mission is already over');
  const site = getSite(state);
  const event = state.todayEvent;
  if (!isValidPlan(plan, powerToday(site, event))) throw new Error('Plan uses too much power');

  const before = { ...state.meters };
  const { after, details } = resolveDay(before, plan, event, site);

  state.meters = after;
  if (event.flareClass) state.flareCount += 1;

  if (after.air <= 0) {
    state.status = 'lost';
    state.endReason = 'air';
  } else if (after.health <= 0) {
    state.status = 'lost';
    state.endReason = 'health';
  } else if (state.day >= RULES.days) {
    state.status = 'won';
  }

  const report = {
    day: state.day,
    dayName: site.dayName,
    event,
    plan: { ...plan },
    before,
    after,
    details,
    messageDelay: state.messageDelay,
    why: explainWhy(details, event, after),
  };
  state.history.push(report);

  if (state.status === 'playing') state.day += 1;
  return report;
}

// One cause-and-effect sentence about the most important thing that happened.
export function explainWhy(d, event, after) {
  if (after.air <= 0) {
    return `The base made ${d.airMade} air but the crew needed ${d.airLost}, so the air ran out. More power to Life support makes more air.`;
  }
  if (after.health <= 0) {
    return 'Too much radiation and too little food wore the crew down. A stronger shield and more food keep them healthy.';
  }
  if (event.flareClass && event.hidden) {
    if (d.radiationThrough === 0) {
      return `The flare warning arrived too late, but your shield was strong enough to block all ${d.radiationIn} radiation anyway. Smart thinking!`;
    }
    return `The flare warning arrived too late, so you could not get ready. Your shield blocked ${d.radiationBlocked} and ${d.radiationThrough} got through. On Mars, keeping some shield on every sol helps with surprises.`;
  }
  if (event.flareClass) {
    if (d.radiationThrough === 0) {
      return `The solar flare sent ${d.radiationIn} radiation, but your shield blocked all of it. Great planning!`;
    }
    return `The solar flare sent ${d.radiationIn} radiation. Your shield blocked ${d.radiationBlocked}, so ${d.radiationThrough} got through and hurt the crew.`;
  }
  if (d.hungry) {
    return `The crew needed ${d.foodEaten} food but there was not enough, so they lost ${RULES.hungerDamage} health. Power the Greenhouse to grow more.`;
  }
  if (d.airMade < d.airLost) {
    return `Life support made ${d.airMade} air but the crew used ${d.airLost}, so the air went down.`;
  }
  if (d.powerWasted > 0) {
    return `${d.powerWasted} power was not used, so it was wasted. Power cannot be saved for tomorrow.`;
  }
  if (d.radiationThrough > 0) {
    return `Space radiation is always around. ${d.radiationThrough} got past the shield and lowered crew health a little.`;
  }
  return 'Every system had the power it needed. Nice work, Commander!';
}

// ---------- Forecast warnings (base screen) ----------

// How many days until a meter hits 0 if it keeps falling at today's rate.
// null = it is not going down.
export function daysUntilEmpty(now, forecast) {
  if (forecast >= now) return null;
  if (forecast <= 0) return 1;            // runs out at the end of today
  return Math.ceil(now / (now - forecast));
}

// Warnings for the base screen, worked out from today's forecast.
// Returns a list like [{ meter: 'air', daysLeft: 4 }, { meter: 'hungry' }].
export function forecastWarnings(meters, forecast, details) {
  const warnings = [];
  for (const meter of ['air', 'food']) {
    const daysLeft = daysUntilEmpty(meters[meter], forecast[meter]);
    if (daysLeft !== null) warnings.push({ meter, daysLeft });
  }
  if (details.hungry) warnings.push({ meter: 'hungry' });
  return warnings;
}

// ---------- Mission results: stars, badges, tips ----------

// 3 stars: survive + RULES.scienceGoal science. 2: survive + RULES.scienceForTwoStars.
// 1: survive. 0: crew flew home early.
export function starsFor(state) {
  if (state.status !== 'won') return 0;
  if (state.meters.science >= RULES.scienceGoal) return 3;
  if (state.meters.science >= RULES.scienceForTwoStars) return 2;
  return 1;
}

// Which badges this mission earned (badge ids). All need a finished mission.
export function earnedBadges(state) {
  if (state.status !== 'won') return [];
  const h = state.history;
  const checks = {
    // at least one flare day where the shield blocked everything
    flareSurvivor: h.some((r) => r.event.flareClass && r.details.radiationThrough === 0),
    greenThumb: h.every((r) => r.after.food > 0 && !r.details.hungry),
    marsCommander: state.siteId === 'mars',
    moonCommander: state.siteId === 'moon',
    perfectShield: h.every((r) => r.details.radiationThrough === 0),
    scientist: state.meters.science >= RULES.scienceForBadge,
  };
  return BADGES.map((b) => b.id).filter((id) => checks[id]);
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// 1 to 3 tips based on what went wrong, most important first.
export function tipsFor(state) {
  const site = getSite(state);
  const day = site.dayName.toLowerCase();
  const h = state.history;
  const last = h[h.length - 1];
  const tips = [];

  if (state.endReason === 'air') {
    tips.push(`The air ran out on ${site.dayName} ${last.day}. Give Life support at least 3 power every ${day}: that makes 18 air, more than the 15 the crew breathes.`);
  }
  if (state.endReason === 'health') {
    tips.push(`The crew got too sick on ${site.dayName} ${last.day}. Radiation and hunger both hurt health, so keep the shield and the Greenhouse powered.`);
  }

  const surpriseHits = h.filter((r) => r.event.hidden && r.details.radiationThrough > 0);
  if (surpriseHits.length) {
    tips.push(`A surprise flare hit your base because its warning arrived too late. On ${site.name}, keep some power in the shield every ${day}, just in case.`);
  }

  const warnedFlareHits = h.filter((r) => r.event.flareClass && !r.event.hidden && r.details.radiationThrough > 0);
  if (warnedFlareHits.length) {
    const through = warnedFlareHits.reduce((s, r) => s + r.details.radiationThrough, 0);
    tips.push(`When CAPCOM Kemi warned you about a flare, ${through} radiation still got past your shield. On flare ${day}s, move power into the shield: each unit blocks ${RULES.shieldBlockPerUnit}.`);
  }

  const hungryDays = h.filter((r) => r.details.hungry).length;
  if (hungryDays) {
    tips.push(`The crew went hungry on ${plural(hungryDays, day)}. Give the Greenhouse 2 power: that grows 10 food, the same as the crew eats.`);
  }

  const totalThrough = h.reduce((s, r) => s + r.details.radiationThrough, 0);
  if (!surpriseHits.length && !warnedFlareHits.length && totalThrough >= 20) {
    tips.push(`Everyday space radiation added up: ${totalThrough} got through your shield. Even 1 power in the shield blocks ${RULES.shieldBlockPerUnit} every ${day}.`);
  }

  const wasted = h.reduce((s, r) => s + r.details.powerWasted, 0);
  if (wasted >= 3) {
    tips.push(`${wasted} power was wasted during the mission. Power cannot be saved for later, so put every ⚡ to work.`);
  }

  if (state.status === 'won' && state.meters.science < RULES.scienceGoal) {
    tips.push(`You made ${state.meters.science} science. Once air and food are safe, put spare power into the Science lab to reach ${RULES.scienceGoal}.`);
  }

  if (tips.length === 0) {
    tips.push('A brilliant mission! Try the other base, or go for the badges you have not earned yet.');
  }
  return tips.slice(0, 3);
}

// Everything the results screen needs.
export function missionResults(state) {
  return { stars: starsFor(state), badges: earnedBadges(state), tips: tipsFor(state) };
}

// ---------- Saved badges (localStorage, wrapped in try/catch) ----------
// storage is passed in so tests can use a fake one. In the browser it is
// localStorage. If storage is blocked or broken, the game still works:
// badges just are not remembered.

export function loadSavedBadges(storage = globalThis.localStorage) {
  try {
    const list = JSON.parse(storage.getItem(BADGE_STORAGE_KEY) || '[]');
    const known = new Set(BADGES.map((b) => b.id));
    return Array.isArray(list) ? list.filter((id) => known.has(id)) : [];
  } catch {
    return [];
  }
}

// Adds the new badges to the saved list. Returns { all, newOnes }.
export function saveBadges(earned, storage = globalThis.localStorage) {
  const saved = loadSavedBadges(storage);
  const newOnes = earned.filter((id) => !saved.includes(id));
  const all = [...saved, ...newOnes];
  try {
    storage.setItem(BADGE_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage is blocked (for example private browsing). Keep playing.
  }
  return { all, newOnes };
}
