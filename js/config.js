// config.js
// Every number that controls the game lives here, so you can tune the game
// without hunting through the code.

// Step 2 will use this key for live NASA DONKI data. Not used yet.
export const NASA_API_KEY = 'DEMO_KEY';

export const RULES = {
  days: 10,            // mission length
  meterMax: 100,       // all meters run 0 to 100

  // Starting values
  startAir: 70,
  startFood: 70,
  startHealth: 100,
  startScience: 0,

  // Air
  airPerLifeSupportUnit: 6,  // each power unit in Life support makes 6 air
  airBreathedPerDay: 15,     // the crew breathes 15 air every day

  // Food
  foodPerGreenhouseUnit: 5,  // each power unit in the Greenhouse grows 5 food
  foodEatenPerDay: 10,       // the crew eats 10 food every day
  hungerDamage: 8,           // health lost on a day without enough food

  // Science
  sciencePerLabUnit: 3,      // each power unit in the Science lab makes 3 science
  scienceGoal: 40,

  // Radiation
  shieldBlockPerUnit: 5,     // each power unit in the shield blocks 5 radiation

  // Events
  forceFlareOnDay: 6,        // if no flare has happened yet, day 6 gets one
  badPowerChance: 0.18,      // chance of Long shadows / Dust storm
  flareChanceMin: 0.10,
  flareChanceMax: 0.35,
};

// How much radiation a flare adds, by its class letter.
export const FLARE_RADIATION = { X: 30, M: 18, C: 10 };

// The four systems the player can power, in the order they are shown.
export const SYSTEMS = ['lifeSupport', 'greenhouse', 'shield', 'science'];

// The power plan already filled in on day 1.
export const STARTING_PLAN = { lifeSupport: 3, greenhouse: 2, shield: 1, science: 0 };

// If today has less power than yesterday's plan, take power away
// from systems in this order until the plan fits.
export const POWER_CUT_ORDER = ['science', 'shield', 'greenhouse', 'lifeSupport'];

export const SITES = {
  moon: {
    id: 'moon',
    name: 'Moon',
    place: 'Shackleton crater rim, south pole',
    emoji: '🌙',
    dailyPower: 10,
    baseRadiation: 6,
    dayName: 'Day',
    badPowerEvent: {
      title: 'Long shadows',
      news: 'The Sun is low and long shadows cover the solar panels. You get 4 less power today.',
    },
  },
  // Mars is ready in the settings but is turned on in build step 3.
  mars: {
    id: 'mars',
    name: 'Mars',
    place: 'Jezero crater',
    emoji: '🔴',
    dailyPower: 9,
    baseRadiation: 4,
    dayName: 'Sol',
    badPowerEvent: {
      title: 'Dust storm',
      news: 'A dust storm is blocking sunlight on the solar panels. You get 4 less power today.',
    },
  },
};
