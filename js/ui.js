// ui.js
// All rendering. No game rules here: numbers come from game.js.

import { RULES, SYSTEMS, SITES } from './config.js';
import { getSite, powerToday, powerUsed, resolveDay, morningEvent } from './game.js';

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

// "2025-03-05T11:50Z" -> "5 March 2025"
function niceDate(isoText) {
  const d = new Date(isoText);
  if (Number.isNaN(d.getTime())) return 'an unknown date';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// The LIVE / ARCHIVED label. Uses words and an icon, not just colour.
function tagHtml(tag) {
  return tag === 'LIVE'
    ? '<span class="tag tag-live">📡 LIVE</span>'
    : '<span class="tag tag-archived">🗄️ ARCHIVED</span>';
}

// One line under a flare event saying where the flare came from.
function flareSourceHtml(flare) {
  const when = flare.tag === 'LIVE'
    ? `This flare really happened on ${niceDate(flare.peakTime)}.`
    : `This is a real flare from ${niceDate(flare.peakTime)}, saved inside the game.`;
  return `<p class="data-source">${tagHtml(flare.tag)} ${when} Source: ${esc(flare.source)}.</p>`;
}

// Title screen "Today's real Sun" panel. sun = null while still loading.
export function renderSunPanel(sun) {
  const panel = $('sun-panel');
  if (!sun) {
    panel.innerHTML = `<h2 class="panel-title">☀️ Today's real Sun</h2>
      <p>Checking the Sun with NASA…</p>`;
    return;
  }
  const cCount = sun.flares.filter((f) => f.classType.startsWith('C')).length;
  const period = `${niceDate(sun.windowStart)} to ${niceDate(sun.windowEnd)}`;
  const intro = sun.tag === 'LIVE'
    ? `In the last 30 days the Sun made <strong>${sun.flares.length}</strong> flares:`
    : `We could not reach NASA just now, so the game is using real flares saved from ${period}. In those 30 days the Sun made <strong>${sun.flares.length}</strong> flares:`;
  panel.innerHTML = `
    <h2 class="panel-title">☀️ Today's real Sun ${tagHtml(sun.tag)}</h2>
    <p>A <strong>solar flare</strong> is a sudden flash of energy from the Sun.</p>
    <p>${intro}</p>
    <ul class="flare-counts">
      <li>💥 ${sun.xCount} huge (X class)</li>
      <li>🔥 ${sun.mCount} medium (M class)</li>
      <li>✨ ${cCount} small (C class)</li>
    </ul>
    <p>So on your mission there is a <strong>${Math.round(sun.chance * 100)}%</strong> chance of a flare each day.</p>
    <p class="data-source">Source: ${esc(sun.source)}, ${period}.</p>`;
}

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
  // Only show what Mission Control knows: a surprise flare stays hidden,
  // and the forecast is worked out without it.
  const event = morningEvent(state);
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
    <p>${esc(event.news)}</p>
    ${event.flare ? flareSourceHtml(event.flare) : ''}
    <p class="delay-note">📡 Messages from Earth take ${state.messageDelay.text} to reach your base.${
      site.lateWarningChance > 0 ? ' Some flare warnings arrive too late, so you may get a surprise.' : ' Warnings always arrive in time.'}</p>`;

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
    ${report.event.hidden ? `<p class="surprise">😮 Surprise! The warning about this flare arrived too late. Messages from Earth take ${report.messageDelay.text} to reach Mars, and the flare got here first.</p>` : ''}
    <p class="news-title">${report.event.emoji} ${esc(report.event.title)}</p>
    ${report.event.flare ? flareSourceHtml(report.event.flare) : ''}
    <table class="report-table">
      <thead><tr><th scope="col">Meter</th><th scope="col">Before</th><th></th><th scope="col">After</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <ul class="report-lines">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
    <p class="why"><strong>Why?</strong> ${esc(report.why)}</p>
    ${report.messageDelay.minutes !== null ? `<p class="delay-note">📡 Your report reached Earth in ${report.messageDelay.text}.</p>` : ''}`;
  $('report-next').textContent = isOver ? 'See mission results' : `Start ${report.dayName} ${report.day + 1}`;

  dialog.showModal();
  $('report-next').focus();
}

export function renderResults(state) {
  const site = getSite(state);
  const m = state.meters;
  const daysDone = state.history.length;
  const days = `${RULES.days} ${site.dayName.toLowerCase()}s`;
  let headline;
  let message;
  if (state.status === 'won') {
    headline = '🎉 Mission complete!';
    message = m.science >= RULES.scienceGoal
      ? `Your crew lived ${site.onPlace} for ${days} and reached the science goal. Amazing work, Commander!`
      : `Your crew lived ${site.onPlace} for ${days}. Next time, try to reach ${RULES.scienceGoal} science too.`;
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

  const other = SITES[site.id === 'moon' ? 'mars' : 'moon'];
  $('btn-other-base').textContent = `Try the other base: ${other.emoji} ${other.name}`;
  $('btn-other-base').dataset.site = other.id;
}

// Screen 2: the two base cards, built from the numbers in SITES.
export function renderChooseBase() {
  $('base-cards').innerHTML = Object.values(SITES).map((s) => `
    <button type="button" class="base-card" data-site="${s.id}">
      <span class="base-card-title">${s.emoji} ${s.name}</span>
      <span class="base-card-place">${s.place}</span>
      <span>⚡ Power: <strong>${s.dailyPower}</strong> each ${s.dayName.toLowerCase()}. ${s.powerReason}</span>
      <span>☢️ Radiation: <strong>${s.baseRadiation}</strong> each ${s.dayName.toLowerCase()}. ${s.radiationReason}</span>
      <span>📡 Messages from Earth take <strong>${s.messageDelay.text ?? `${s.messageDelay.minMinutes} to ${s.messageDelay.maxMinutes} minutes`}</strong>. ${
        s.lateWarningChance > 0 ? 'Half of the flare warnings arrive too late!' : 'Flare warnings always arrive in time.'}</span>
      <span>${s.badPowerEvent.emoji} ${s.badPowerEvent.title} can cut your power.</span>
      ${s.dayLength ? `<span>🕐 A day on Mars is called a <strong>sol</strong>. It lasts ${s.dayLength}.</span>` : ''}
    </button>`).join('');
}

// Screen 3: CAPCOM Kemi's briefing for the chosen base.
export function renderBriefing(site) {
  const last = site.lateWarningChance > 0
    ? `Messages from Earth take minutes to reach Mars, so sometimes you must decide on your own. Keep your crew safe and try to reach ${RULES.scienceGoal} science!`
    : `Keep your crew safe and try to reach ${RULES.scienceGoal} science. Good luck!`;
  $('briefing-lines').innerHTML = `
    <p>Welcome, Commander! You are in charge of a base ${site.onPlace} for ${RULES.days} ${site.dayName.toLowerCase()}s.</p>
    <p>Each ${site.dayName.toLowerCase()} you get a little power. Split it between air, food, the radiation shield and science.</p>
    <p>${last}</p>`;
  $('base-name').value = `${site.name} Base One`;
}
