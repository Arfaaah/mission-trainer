// ui.js
// All rendering. No game rules here: numbers come from game.js.

import { RULES, SYSTEMS } from './config.js';
import { getSite, powerToday, powerUsed, resolveDay } from './game.js';

const $ = (id) => document.getElementById(id);

// Make text safe to put inside HTML (for the base name the player types).
function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

const METERS = [
  { key: 'air', emoji: '💨', name: 'Air' },
  { key: 'food', emoji: '🥕', name: 'Food' },
  { key: 'health', emoji: '❤️', name: 'Crew health' },
  { key: 'science', emoji: '🔬', name: 'Science' },
];

const SYSTEM_INFO = {
  lifeSupport: { emoji: '🫁', name: 'Life support', explain: 'Machines that make fresh air to breathe.' },
  greenhouse: { emoji: '🌱', name: 'Greenhouse', explain: 'A room with lights where plants grow food.' },
  shield: { emoji: '🛡️', name: 'Radiation shield', explain: 'A wall that blocks radiation, invisible energy from space that can hurt people.' },
  science: { emoji: '🔬', name: 'Science lab', explain: 'Where the crew runs experiments to learn new things.' },
};

const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => { s.hidden = s.id !== id; });
  const heading = $(id).querySelector('h1, h2');
  if (heading) heading.focus();
}

function meterHtml(m, value, forecastValue) {
  const low = m.key !== 'science' && value <= 25;
  const forecastLine = forecastValue === undefined ? '' :
    `<span class="forecast">If all goes to plan: ${forecastValue} (${signed(forecastValue - value)})</span>`;
  return `
    <div class="meter ${low ? 'meter-low' : ''}">
      <div class="meter-top">
        <span>${m.emoji} ${m.name}</span>
        <strong>${value}${low ? ' ⚠️ Low!' : ''}</strong>
      </div>
      <div class="bar" role="progressbar" aria-label="${m.name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}">
        <div class="bar-fill bar-${m.key}" style="width:${value}%"></div>
      </div>
      ${forecastLine}
    </div>`;
}

function effectText(key, plan, event, site, d) {
  const n = plan[key];
  switch (key) {
    case 'lifeSupport':
      return `Makes ${d.airMade} air. Crew breathes ${RULES.airBreathedPerDay}.` +
        (event.airLost ? ` The leak loses ${event.airLost} more.` : '');
    case 'greenhouse':
      return `Grows ${n * RULES.foodPerGreenhouseUnit} food. Crew eats ${RULES.foodEatenPerDay}.` +
        (event.extraFood ? ` Harvest adds ${event.extraFood}.` : '');
    case 'shield':
      return `Blocks ${n * RULES.shieldBlockPerUnit} radiation. ${d.radiationIn} radiation is coming today.`;
    case 'science':
      return `Makes ${d.scienceMade} science.` +
        (event.scienceMultiplier > 1 ? ' Counts double today!' : '') +
        ` Goal: ${RULES.scienceGoal}.`;
    default:
      return '';
  }
}

// Draw the daily base screen. focusSelector puts keyboard focus back on the
// button the player just pressed, so Tab and Enter keep working smoothly.
export function renderBase(state, plan, focusSelector) {
  const site = getSite(state);
  const event = state.todayEvent;
  const available = powerToday(site, event);
  const used = powerUsed(plan);
  const left = available - used;
  const { after, details } = resolveDay(state.meters, plan, event, site);

  $('base-title').textContent =
    `${site.emoji} ${state.baseName} · ${site.dayName} ${state.day} of ${RULES.days}`;

  $('meters').innerHTML = METERS
    .map((m) => meterHtml(m, state.meters[m.key], after[m.key]))
    .join('');

  $('news').innerHTML = `
    <p class="speaker">👩🏾‍🚀 CAPCOM Kemi says:</p>
    <p class="news-title">${event.emoji} ${esc(event.title)}</p>
    <p>${esc(event.news)}</p>`;

  const tokens = Array.from({ length: available }, (_, i) =>
    `<span class="token ${i < used ? 'token-used' : ''}" aria-hidden="true">⚡</span>`).join('');
  $('power').innerHTML = `
    <p class="power-count">Power left: <strong>${left}</strong> of ${available}</p>
    <div class="tokens">${tokens || '<span>No power today!</span>'}</div>`;

  $('systems').innerHTML = SYSTEMS.map((key) => {
    const info = SYSTEM_INFO[key];
    const n = plan[key];
    const canMinus = n > 0;
    const canPlus = left > 0;
    return `
      <div class="system">
        <div class="system-text">
          <p class="system-name">${info.emoji} ${info.name}</p>
          <p class="system-explain">${info.explain}</p>
          <p class="system-effect">${effectText(key, plan, event, site, details)}</p>
        </div>
        <div class="stepper">
          <button type="button" class="step" data-system="${key}" data-change="-1"
            aria-label="Less power to ${info.name}" aria-disabled="${!canMinus}">−</button>
          <span class="step-count" aria-live="polite" aria-label="${info.name} power">${n}</span>
          <button type="button" class="step" data-system="${key}" data-change="1"
            aria-label="More power to ${info.name}" aria-disabled="${!canPlus}">+</button>
        </div>
      </div>`;
  }).join('');

  $('waste-warning').textContent = left > 0
    ? `⚠️ ${left} power is not used. Unused power is wasted. It cannot be saved for tomorrow.`
    : '✅ All power is in use.';
  $('waste-warning').className = left > 0 ? 'warning' : 'ok';

  if (focusSelector) {
    const btn = document.querySelector(focusSelector);
    if (btn) btn.focus();
  }
}

export function showReport(report, state) {
  const dialog = $('report');
  const d = report.details;
  const rows = METERS.map((m) => {
    const b = report.before[m.key];
    const a = report.after[m.key];
    return `<tr><th scope="row">${m.emoji} ${m.name}</th><td>${b}</td><td>→</td><td><strong>${a}</strong> (${signed(a - b)})</td></tr>`;
  }).join('');

  const lines = [
    `💨 Air: made ${d.airMade}, used ${d.airLost}.`,
    `🥕 Food: grew ${d.foodMade}, crew ate ${d.foodEaten}.${d.hungry ? ` Not enough food! Crew lost ${RULES.hungerDamage} health.` : ''}`,
    `☢️ Radiation: ${d.radiationIn} came in, shield blocked ${d.radiationBlocked}, ${d.radiationThrough} got through.`,
    `🔬 Science: made ${d.scienceMade}.`,
  ];
  if (d.powerWasted > 0) lines.push(`⚡ ${d.powerWasted} power was wasted.`);

  const isOver = state.status !== 'playing';
  $('report-body').innerHTML = `
    <h2 id="report-title" tabindex="-1">${report.dayName} ${report.day} report</h2>
    <p class="news-title">${report.event.emoji} ${esc(report.event.title)}</p>
    <table class="report-table">
      <thead><tr><th scope="col">Meter</th><th scope="col">Before</th><th></th><th scope="col">After</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <ul class="report-lines">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
    <p class="why"><strong>Why?</strong> ${esc(report.why)}</p>`;
  $('report-next').textContent = isOver ? 'See mission results' : `Start ${report.dayName} ${report.day + 1}`;

  dialog.showModal();
  $('report-next').focus();
}

export function renderResults(state) {
  const site = getSite(state);
  const m = state.meters;
  const daysDone = state.history.length;
  let headline;
  let message;
  if (state.status === 'won') {
    headline = '🎉 Mission complete!';
    message = m.science >= RULES.scienceGoal
      ? `Your crew lived on the ${site.name} for ${RULES.days} days and reached the science goal. Amazing work, Commander!`
      : `Your crew lived on the ${site.name} for ${RULES.days} days. Next time, try to reach ${RULES.scienceGoal} science too.`;
  } else {
    headline = '🚀 The crew flew home safely';
    const cause = state.endReason === 'air' ? 'The air ran out' : 'The crew got too sick';
    message = `${cause} on ${site.dayName} ${daysDone}. Real missions run into trouble too. What would you change?`;
  }

  $('results-title').textContent = headline;
  $('results-body').innerHTML = `
    <p>${message}</p>
    <div class="meters">${METERS.map((mt) => meterHtml(mt, m[mt.key])).join('')}</div>
    <p>Science: <strong>${m.science}</strong> of ${RULES.scienceGoal} goal.</p>
    <p>${site.dayName}s completed: <strong>${daysDone}</strong> of ${RULES.days}.</p>`;
}
