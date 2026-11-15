// main.js
// Screen switching and event wiring. Connects buttons to game.js and ui.js.

import { getSite, newGame, startDay, emptyPlan, runDay, isValidPlan, powerToday } from './game.js';
import { showScreen, renderBase, showReport, renderResults } from './ui.js';

let state = null;
let plan = emptyPlan();

const $ = (id) => document.getElementById(id);

function beginDay() {
  startDay(state);
  plan = emptyPlan();
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

// Title screen
$('btn-play').addEventListener('click', () => showScreen('screen-briefing'));

// Briefing screen
$('briefing-form').addEventListener('submit', (e) => {
  e.preventDefault();
  state = newGame('moon', $('base-name').value);
  beginDay();
});

// Base screen: one listener for all the plus and minus buttons
$('systems').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-system]');
  if (!btn) return;
  changePower(btn.dataset.system, Number(btn.dataset.change));
});

$('btn-run').addEventListener('click', () => {
  const report = runDay(state, plan);
  showReport(report, state);
});

// Report popup: closing it (button or Esc key) moves the game on
$('report-next').addEventListener('click', () => $('report').close());
$('report').addEventListener('close', () => {
  if (state.status === 'playing') {
    beginDay();
  } else {
    renderResults(state);
    showScreen('screen-results');
  }
});

// Results screen
$('btn-again').addEventListener('click', () => showScreen('screen-briefing'));
$('btn-title').addEventListener('click', () => showScreen('screen-title'));
