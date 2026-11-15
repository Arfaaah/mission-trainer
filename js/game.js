// game.js
// Game state, daily resolution, win and lose logic.
// No DOM code here, so these rules can be tested in Node.

import { RULES, SITES, SYSTEMS } from './config.js';
import { drawEvent } from './events.js';

const clamp = (n) => Math.max(0, Math.min(RULES.meterMax, n));

export function emptyPlan() {
  return { lifeSupport: 0, greenhouse: 0, shield: 0, science: 0 };
}

export function newGame(siteId = 'moon', baseName = 'Base') {
  return {
    siteId,
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
  state.todayEvent = drawEvent(state.day, state.flareCount, getSite(state), rng);
  return state.todayEvent;
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
