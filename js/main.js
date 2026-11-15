// main.js
// Screen switching and event wiring. Connects buttons to game.js and ui.js.

import {
  getSite, newGame, startDay, emptyPlan, runDay, isValidPlan, powerToday, carryOverPlan,
  missionResults, saveBadges,
} from './game.js';
import { showScreen, renderBase, showReport, renderResults, renderSunPanel, renderChooseBase, renderBriefing } from './ui.js';
import { SITES } from './config.js';
import { loadSun, archivedSun } from './data/donki.js';

let state = null;
let plan = emptyPlan();
let sun = null; // solar flare data: LIVE from NASA, or ARCHIVED
let siteId = 'moon'; // the base the player chose

const $ = (id) => document.getElementById(id);

// Load real solar flares when the page opens.
// Add ?archived to the address to skip NASA and test the archived data.
async function startSun() {
  renderSunPanel(null);
  if (new URLSearchParams(location.search).has('archived')) {
    sun = archivedSun('?archived is in the address, so NASA was not asked');
  } else {
    sun = await loadSun();
  }
  if (sun.reason) console.warn(`Using ARCHIVED solar flares. Reason: ${sun.reason}`);
  else console.info(`Using LIVE solar flares from ${sun.source}: ${sun.flares.length} flares from ${sun.windowStart} to ${sun.windowEnd}`);
  renderSunPanel(sun);
}
startSun();

function beginDay() {
  startDay(state);
  // Day 1 uses the starting plan; later days copy yesterday's plan.
  const yesterday = state.history.at(-1);
  plan = carryOverPlan(yesterday ? yesterday.plan : null, powerToday(getSite(state), state.todayEvent));
  renderBase(state, plan);
  showScreen('screen-base');
}

function changePower(system, change) {
  const next = { ...plan, [system]: plan[system] + change };
  const available = powerToday(getSite(state), state.todayEvent);
  if (!isValidPlan(next, available)) return; // not allowed: ignore the press
  plan = next;
  renderBase(state, plan, `[data-system="${system}"][data-change="${change}"]`);
}

function chooseBase(id) {
  siteId = id;
  renderBriefing(SITES[siteId]);
  showScreen('screen-briefing');
}

// Title screen
$('btn-play').addEventListener('click', () => {
  renderChooseBase();
  showScreen('screen-choose');
});

// Choose your base screen: one listener for both base cards
$('base-cards').addEventListener('click', (e) => {
  const card = e.target.closest('button[data-site]');
  if (card) chooseBase(card.dataset.site);
});
$('btn-choose-back').addEventListener('click', () => showScreen('screen-title'));

// Briefing screen
$('briefing-form').addEventListener('submit', (e) => {
  e.preventDefault();
  // If NASA has not answered yet, play with archived flares.
  state = newGame(siteId, $('base-name').value, sun ?? archivedSun('NASA had not answered yet'));
  beginDay();
});

// Base screen: one listener for all the plus and minus buttons
$('systems').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-system]');
  if (!btn) return;
  changePower(btn.dataset.system, Number(btn.dataset.change));
});

// Base screen: turn today's experiment on or off
$('experiment').addEventListener('click', (e) => {
  if (!e.target.closest('#btn-experiment')) return;
  const next = { ...plan, experiment: plan.experiment ? null : state.todayExperiment };
  const available = powerToday(getSite(state), state.todayEvent);
  if (!isValidPlan(next, available)) return; // not enough power: ignore the press
  plan = next;
  renderBase(state, plan, '#btn-experiment');
});

$('btn-run').addEventListener('click', () => {
  if (!state || state.status !== 'playing' || $('report').open) return; // ignore extra presses
  const report = runDay(state, plan);
  showReport(report, state);
});

// Report popup: closing it (button or Esc key) moves the game on
$('report-next').addEventListener('click', () => $('report').close());
$('report').addEventListener('close', () => {
  if (state.status === 'playing') {
    beginDay();
  } else {
    const results = missionResults(state);
    const saved = saveBadges(results.badges); // remembered in this browser only
    renderResults(state, results, saved);
    showScreen('screen-results');
  }
});

// Results screen
$('btn-again').addEventListener('click', () => chooseBase(siteId));
$('btn-other-base').addEventListener('click', (e) => chooseBase(e.currentTarget.dataset.site));
$('btn-title').addEventListener('click', () => showScreen('screen-title'));
