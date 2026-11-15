// donki.js
// Gets real solar flares from NASA DONKI. It tries each source in
// DONKI_SOURCES in order (CCMC first, then api.nasa.gov). If they all fail
// (no internet, timeout, error, bad data), it returns the archived real
// flares from archive.js instead, so the game always works.
// No DOM code here, so it can be tested in Node.

import { NASA_API_KEY, DONKI_SOURCES, DONKI_DAYS_BACK, DONKI_TIMEOUT_MS } from '../config.js';
import { ARCHIVED_FLARES } from './archive.js';
import { flareChance } from '../events.js';

const VALID_CLASS = /^[XMCBA]\d/;

// Date as YYYY-MM-DD in UTC (the format DONKI wants).
function ymd(date) {
  return date.toISOString().slice(0, 10);
}

// Turn a flare list into the "sun" summary the game uses.
// Every flare carries its own tag and source so the game can show them.
function summarise(rawFlares, tag, source, windowStart, windowEnd, reason = null) {
  const flares = rawFlares
    .filter((f) => f && typeof f.classType === 'string' && VALID_CLASS.test(f.classType))
    .map((f) => ({ classType: f.classType, peakTime: f.peakTime ?? null, tag, source }));
  const mCount = flares.filter((f) => f.classType.startsWith('M')).length;
  const xCount = flares.filter((f) => f.classType.startsWith('X')).length;
  return {
    tag,              // 'LIVE' or 'ARCHIVED'
    source,           // e.g. 'NASA DONKI (CCMC)'
    windowStart,
    windowEnd,
    flares,
    mCount,
    xCount,
    chance: flareChance(mCount, xCount),
    reason,           // why we fell back to archived data (null when LIVE)
  };
}

export function archivedSun(reason = null) {
  const a = ARCHIVED_FLARES;
  return summarise(a.flares, 'ARCHIVED', a.source, a.windowStart, a.windowEnd, reason);
}

// The web address for one source, asking for the last 30 days.
// The NASA key is only added for sources that need it.
export function donkiUrl(source, today = new Date()) {
  const start = new Date(today.getTime() - DONKI_DAYS_BACK * 24 * 60 * 60 * 1000);
  let url = `${source.url}?startDate=${ymd(start)}&endDate=${ymd(today)}`;
  if (source.needsKey) url += `&api_key=${NASA_API_KEY}`;
  return { url, windowStart: ymd(start), windowEnd: ymd(today) };
}

// Ask one source. Throws an error if it fails or takes longer than timeoutMs.
async function fetchFromSource(source, fetchFn, today, timeoutMs) {
  const { url, windowStart, windowEnd } = donkiUrl(source, today);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchFn(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`answered with error ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('sent data in a shape we did not expect');
    return summarise(data, 'LIVE', source.name, windowStart, windowEnd);
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`did not answer within ${timeoutMs / 1000} seconds`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Try each source in order. Always resolves (never throws): if every source
// fails, it gives back the archived flares with the reasons.
export async function loadSun({
  fetchFn = globalThis.fetch,
  today = new Date(),
  timeoutMs = DONKI_TIMEOUT_MS,
  sources = DONKI_SOURCES,
} = {}) {
  const problems = [];
  for (const source of sources) {
    try {
      return await fetchFromSource(source, fetchFn, today, timeoutMs);
    } catch (err) {
      problems.push(`${source.name} ${err.message}`);
    }
  }
  return archivedSun(problems.join('; '));
}
