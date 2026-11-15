// Run with: node --test
// These tests use a fake fetch, so they never call NASA.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadSun, archivedSun, donkiUrl } from '../js/data/donki.js';
import { drawEvent } from '../js/events.js';
import { SITES, DONKI_SOURCES } from '../js/config.js';

const today = new Date('2026-11-15T12:00:00Z');
const [CCMC, NASA_API] = DONKI_SOURCES;
const isCcmc = (url) => url.startsWith('https://ccmc.gsfc.nasa.gov/');
const isApi = (url) => url.startsWith('https://api.nasa.gov/');

// Fake answers
const good = (data) => async () => ({ ok: true, status: 200, json: async () => data });
const httpError = (status) => async () => ({ ok: false, status });
const noInternet = async () => { throw new TypeError('Failed to fetch'); };
const neverAnswers = (url, { signal }) => new Promise((_, reject) => {
  signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
});

// A fake fetch that answers differently for CCMC and api.nasa.gov,
// and records every address it was asked for.
function fakeFetch({ ccmc, api }) {
  const calls = [];
  const fn = (url, opts) => {
    calls.push(url);
    if (isCcmc(url)) return ccmc(url, opts);
    if (isApi(url)) return api(url, opts);
    throw new Error(`unexpected url ${url}`);
  };
  fn.calls = calls;
  return fn;
}

const SAMPLE = [
  { classType: 'X1.1', peakTime: '2026-11-01T10:00Z' },
  { classType: 'M2.0', peakTime: '2026-11-02T10:00Z' },
  { classType: 'M1.0', peakTime: '2026-11-03T10:00Z' },
  { classType: 'C5.0', peakTime: '2026-11-04T10:00Z' },
];

test('sources are tried in order: CCMC first, then api.nasa.gov', () => {
  assert.equal(CCMC.name, 'NASA DONKI (CCMC)');
  assert.equal(NASA_API.name, 'NASA DONKI (api.nasa.gov)');
});

test('CCMC address asks for the last 30 days with no key', () => {
  const { url } = donkiUrl(CCMC, today);
  assert.equal(url, 'https://ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR?startDate=2026-10-16&endDate=2026-11-15');
});

test('api.nasa.gov address asks for the last 30 days with the key', () => {
  const { url } = donkiUrl(NASA_API, today);
  assert.match(url, /^https:\/\/api\.nasa\.gov\/DONKI\/FLR\?startDate=2026-10-16&endDate=2026-11-15&api_key=.+/);
});

test('CCMC answers: LIVE from CCMC, api.nasa.gov is never asked', async () => {
  const f = fakeFetch({ ccmc: good(SAMPLE), api: good([]) });
  const sun = await loadSun({ fetchFn: f, today });
  assert.equal(sun.tag, 'LIVE');
  assert.equal(sun.source, 'NASA DONKI (CCMC)');
  assert.equal(sun.flares.length, 4);
  assert.equal(sun.xCount, 1);
  assert.equal(sun.mCount, 2);
  assert.ok(Math.abs(sun.chance - 0.16) < 1e-9); // 0.10 + 0.02 + 0.04
  assert.ok(sun.flares.every((fl) => fl.tag === 'LIVE' && fl.source === 'NASA DONKI (CCMC)'));
  assert.equal(f.calls.length, 1);
});

test('CCMC error: LIVE from api.nasa.gov', async () => {
  const f = fakeFetch({ ccmc: httpError(500), api: good(SAMPLE) });
  const sun = await loadSun({ fetchFn: f, today });
  assert.equal(sun.tag, 'LIVE');
  assert.equal(sun.source, 'NASA DONKI (api.nasa.gov)');
  assert.ok(sun.flares.every((fl) => fl.source === 'NASA DONKI (api.nasa.gov)'));
  assert.equal(f.calls.length, 2);
});

test('CCMC too slow: times out, then api.nasa.gov is used', async () => {
  const f = fakeFetch({ ccmc: neverAnswers, api: good(SAMPLE) });
  const sun = await loadSun({ fetchFn: f, today, timeoutMs: 20 });
  assert.equal(sun.tag, 'LIVE');
  assert.equal(sun.source, 'NASA DONKI (api.nasa.gov)');
});

test('CCMC strange data: api.nasa.gov is used', async () => {
  const f = fakeFetch({ ccmc: good({ error: 'oops' }), api: good(SAMPLE) });
  const sun = await loadSun({ fetchFn: f, today });
  assert.equal(sun.source, 'NASA DONKI (api.nasa.gov)');
});

test('both fail (error and 404): ARCHIVED, with both reasons', async () => {
  const f = fakeFetch({ ccmc: httpError(503), api: httpError(404) });
  const sun = await loadSun({ fetchFn: f, today });
  assert.equal(sun.tag, 'ARCHIVED');
  assert.ok(sun.flares.length > 0);
  assert.match(sun.reason, /CCMC.*503/);
  assert.match(sun.reason, /api\.nasa\.gov.*404/);
});

test('no internet: ARCHIVED', async () => {
  const sun = await loadSun({ fetchFn: noInternet, today });
  assert.equal(sun.tag, 'ARCHIVED');
});

test('both too slow: each gets its own timeout, then ARCHIVED', async () => {
  const f = fakeFetch({ ccmc: neverAnswers, api: neverAnswers });
  const sun = await loadSun({ fetchFn: f, today, timeoutMs: 20 });
  assert.equal(sun.tag, 'ARCHIVED');
  assert.equal(f.calls.length, 2);
  assert.match(sun.reason, /\(CCMC\) did not answer.*\(api\.nasa\.gov\) did not answer/);
});

test('archived flares are real-looking and tagged ARCHIVED', () => {
  const sun = archivedSun();
  assert.ok(sun.flares.length > 0);
  assert.ok(sun.flares.every((f) => f.tag === 'ARCHIVED' && /^[XMC]\d/.test(f.classType) && f.peakTime));
});

test('flare events carry the tag and source of the flare they came from', async () => {
  const f = fakeFetch({ ccmc: good([{ classType: 'M3.0', peakTime: '2026-11-05T01:00Z' }]), api: good([]) });
  const live = await loadSun({ fetchFn: f, today });
  const ev = drawEvent(6, 0, SITES.moon, () => 0, live); // day 6, no flare yet: forced flare
  assert.equal(ev.id, 'flare');
  assert.equal(ev.flare.tag, 'LIVE');
  assert.equal(ev.flare.source, 'NASA DONKI (CCMC)');
  assert.equal(ev.flare.classType, 'M3.0');
});

test('quiet Sun (no live flares) still gives a forced flare, from the archive', async () => {
  const f = fakeFetch({ ccmc: good([]), api: good([]) });
  const live = await loadSun({ fetchFn: f, today });
  assert.equal(live.tag, 'LIVE');
  assert.equal(live.chance, 0.10);
  const ev = drawEvent(6, 0, SITES.moon, () => 0, live);
  assert.equal(ev.id, 'flare');
  assert.equal(ev.flare.tag, 'ARCHIVED');
});
