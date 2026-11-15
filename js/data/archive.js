// archive.js
// Real NASA data stored inside the game, used when the live data cannot be
// reached. Everything here is shown with an ARCHIVED tag and its source.

// Solar flares: every flare in NASA DONKI for 1 to 30 March 2025.
// Downloaded on 2026-11-15 from the DONKI web service run by NASA's
// Community Coordinated Modeling Center (CCMC):
// https://ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR?startDate=2025-03-01&endDate=2025-03-30
// Only classType and peakTime are kept (the two fields the game uses).
export const ARCHIVED_FLARES = {
  source: 'NASA DONKI (CCMC)',
  windowStart: '2025-03-01',
  windowEnd: '2025-03-30',
  flares: [
    { classType: 'C9.5', peakTime: '2025-03-01T23:01Z' },
    { classType: 'C2.4', peakTime: '2025-03-02T03:50Z' },
    { classType: 'C1.1', peakTime: '2025-03-02T05:57Z' },
    { classType: 'C2.9', peakTime: '2025-03-02T09:38Z' },
    { classType: 'M1.7', peakTime: '2025-03-05T11:50Z' },
    { classType: 'M1.6', peakTime: '2025-03-07T21:00Z' },
    { classType: 'M1.1', peakTime: '2025-03-11T13:04Z' },
    { classType: 'C9.6', peakTime: '2025-03-11T21:22Z' },
    { classType: 'M1.1', peakTime: '2025-03-14T22:21Z' },
    { classType: 'C9.8', peakTime: '2025-03-17T19:19Z' },
    { classType: 'M1.0', peakTime: '2025-03-17T19:33Z' },
    { classType: 'M1.5', peakTime: '2025-03-19T20:40Z' },
    { classType: 'C6.0', peakTime: '2025-03-20T00:07Z' },
    { classType: 'C4.4', peakTime: '2025-03-20T17:10Z' },
    { classType: 'M1.2', peakTime: '2025-03-21T15:58Z' },
    { classType: 'C4.4', peakTime: '2025-03-25T09:49Z' },
    { classType: 'C9.5', peakTime: '2025-03-25T12:29Z' },
    { classType: 'M1.0', peakTime: '2025-03-26T08:09Z' },
    { classType: 'C6.5', peakTime: '2025-03-26T09:12Z' },
    { classType: 'M2.0', peakTime: '2025-03-27T00:37Z' },
    { classType: 'C3.9', peakTime: '2025-03-27T03:01Z' },
    { classType: 'X1.1', peakTime: '2025-03-28T15:20Z' },
    { classType: 'M1.0', peakTime: '2025-03-28T18:01Z' },
    { classType: 'M1.1', peakTime: '2025-03-28T19:26Z' },
    { classType: 'M1.7', peakTime: '2025-03-28T23:39Z' },
    { classType: 'M1.4', peakTime: '2025-03-29T21:38Z' },
    { classType: 'M1.9', peakTime: '2025-03-29T23:00Z' },
    { classType: 'M1.5', peakTime: '2025-03-30T01:48Z' },
    { classType: 'C3.5', peakTime: '2025-03-30T04:16Z' },
    { classType: 'M1.6', peakTime: '2025-03-30T16:42Z' },
    { classType: 'M1.4', peakTime: '2025-03-30T17:07Z' },
    { classType: 'M1.4', peakTime: '2025-03-30T22:50Z' },
    { classType: 'M1.5', peakTime: '2025-03-30T23:19Z' },
    { classType: 'M1.0', peakTime: '2025-03-30T23:48Z' },
  ],
};

// ---------------------------------------------------------------------------
// ISS radiation from NASA OSDR RadLab (section 5.2 of CLAUDE.md). ARCHIVED.
// Pulled once during development on 2026-11-15. Never called while playing.
// Query used (one day at a time, 1 to 7 June 2024):
// https://visualization.osdr.nasa.gov/radlab/api/?spacecraft=ISS&instrument=DosTel1&timestamp>=2024-06-01&timestamp<2024-06-02&absorbed_dose_rate&format=tsv
// RadLab gives absorbed_dose_rate in microgray per hour, about one reading
// every 100 seconds. We added up each day's readings over time (rate x time
// between readings) to get the dose for the whole day, in microgray (µGy).
export const ISS_RADIATION = {
  source: 'NASA OSDR RadLab',
  sourceUrl: 'https://visualization.osdr.nasa.gov/radlab/',
  instrument: 'DosTel1',
  spacecraft: 'ISS',
  module: 'Columbus',
  windowStart: '2024-06-01',
  windowEnd: '2024-06-07',
  unit: 'µGy per day',
  dailyDose: [
    { date: '2024-06-01', microgray: 170 },
    { date: '2024-06-02', microgray: 211 },
    { date: '2024-06-03', microgray: 213 },
    { date: '2024-06-04', microgray: 227 },
    { date: '2024-06-05', microgray: 208 },
    { date: '2024-06-06', microgray: 243 },
    { date: '2024-06-07', microgray: 193 },
  ],
  averagePerDay: 209,
};

// ---------------------------------------------------------------------------
// Real NASA studies from the OSDR search API (section 5.3 of CLAUDE.md). ARCHIVED.
// Found on 2026-11-15 with https://osdr.nasa.gov/osdr/data/search?term=KEYWORD&type=cgene
// using the terms plant, lettuce, muscle, bone and radiation. ("sleep" found no
// study about sleep, so none is used.) Each kid sentence was written from the
// study's own description. A human must check each one before submission.
const osdrUrl = (id) => `https://osdr.nasa.gov/bio/repo/data/studies/${id}`;

export const OSDR_STUDIES = [
  {
    id: 'OSD-267',
    title: 'Microbiological and nutritional analysis of lettuce crops grown on the International Space Station (VEG-01A)',
    kid: 'Astronauts grew red romaine lettuce in a plant box called Veggie on the space station, and scientists found it was safe and healthy to eat.',
  },
  {
    id: 'OSD-767',
    title: 'Stress and light spectral quality influence the transcriptome of a tomato crop on the International Space Station',
    kid: 'Tomatoes were grown on the space station under different colours of light, red or blue, to see how light and space change the plants.',
  },
  {
    id: 'OSD-772',
    title: 'PH-04 Chile Peppers in Space',
    kid: 'Chile peppers grew on the space station for 137 days and made 26 peppers. It was one of the longest plant experiments in space.',
  },
  {
    id: 'OSD-476',
    title: 'Plants grown in Apollo lunar regolith present stress-associated transcriptomes that inform prospects for lunar exploration',
    kid: 'Scientists grew small plants in real Moon soil brought back by Apollo astronauts. The plants grew, but slowly, and they showed signs of stress.',
  },
  {
    id: 'OSD-714',
    title: 'Lunar gravity prevents skeletal muscle atrophy but not myofiber type shift in mice',
    kid: 'On the space station, a spinning machine gave some mice Moon-strength gravity. A leg muscle shrank in mice that floated, but not in mice that had Moon gravity.',
  },
  {
    id: 'OSD-342',
    title: 'Targeting myostatin/activin A protects against skeletal muscle and bone loss during spaceflight',
    kid: 'Mice that spent 33 days on the space station lost muscle and bone.',
  },
  {
    id: 'OSD-937',
    title: 'Microgravity accelerates skeletal muscle degeneration: Functional and transcriptomic insights from an ISS muscle lab-on-chip model',
    kid: 'Tiny pieces of human muscle grown on a chip were sent to the space station. In weightlessness they squeezed more weakly than on Earth.',
  },
  {
    id: 'OSD-210',
    title: 'Approaches for Surveying Cosmic Radiation Damage in Large Populations of Arabidopsis thaliana Seeds: Antarctic Balloons and Particle Beams',
    kid: 'Seeds flew on a giant balloon high above Antarctica so scientists could study how cosmic radiation from space damages living things.',
  },
].map((s) => ({ ...s, source: `NASA OSDR study ${s.id}`, url: osdrUrl(s.id) }));

// ---------------------------------------------------------------------------
// Fact cards: real science facts with their sources. Each one was checked
// against the linked page on 2026-11-15, and a human must check them again
// before submission. "tags" link a fact to things that happen in the game.
const studyFact = (id, tags) => {
  const s = OSDR_STUDIES.find((x) => x.id === id);
  return { id: s.id, text: s.kid, source: s.source, url: s.url, tags };
};

export const SCIENCE_FACTS = [
  {
    id: 'flare-classes',
    text: 'Scientists sort solar flares into classes. C flares are small, M flares are 10 times stronger, and X flares are 10 times stronger again.',
    source: 'NOAA Space Weather Prediction Center',
    url: 'https://www.swpc.noaa.gov/phenomena/solar-flares-radio-blackouts',
    tags: ['flare'],
  },
  {
    id: 'mars-radiation',
    text: "NASA's Curiosity rover measured radiation on the surface of Mars: about 0.67 millisieverts every day. A millisievert measures how much radiation can affect a body. One chest X-ray is about 0.02, so a day on Mars is like about 33 chest X-rays.",
    source: 'NASA news release, 9 December 2013 (Curiosity RAD results)',
    url: 'https://www.nasa.gov/news-release/nasa-rover-results-include-first-age-measurement-on-mars-and-help-for-human-exploration/',
    tags: ['flare-mars', 'mars'],
  },
  {
    id: 'iss-radiation',
    text: 'A radiation detector called DosTel1 sits inside the Columbus module of the space station. From 1 to 7 June 2024 it measured about 209 microgray every day. A microgray is a tiny unit for how much radiation energy something soaks up.',
    source: 'NASA OSDR RadLab',
    url: 'https://visualization.osdr.nasa.gov/radlab/',
    tags: ['flare'],
  },
  {
    id: 'opportunity-dust',
    text: "In June 2018 a huge dust storm covered the whole of Mars. NASA's Opportunity rover stopped talking to Earth. Engineers sent more than a thousand commands, but it never woke up again.",
    source: 'NASA news release, 13 February 2019',
    url: 'https://www.nasa.gov/news-release/nasas-record-setting-opportunity-rover-mission-on-mars-comes-to-end/',
    tags: ['lowPower-mars'],
  },
  {
    id: 'mars-delay',
    text: 'A message between Earth and Mars can take up to 22 minutes to arrive, because the planets can be very far apart. Astronauts on Mars will sometimes have to decide things on their own.',
    source: 'NASA Langley Research Center, McBrayer, Chai and Judd (2022)',
    url: 'https://ntrs.nasa.gov/api/citations/20220013418/downloads/ASCEND-Communication%20Delays%2C%20Disruptions%2C%20and%20Blackouts%20for%20Crewed%20Mars%20Missions.pdf',
    tags: ['surprise', 'mars'],
  },
  {
    id: 'csa-food',
    text: 'The Canadian Space Agency made a free toolkit for kids and teachers about growing food on the Moon and in faraway places on Earth.',
    source: 'Canadian Space Agency, Food production toolkit',
    url: 'https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/',
    tags: ['harvest'],
  },
  studyFact('OSD-267', ['harvest']),
  studyFact('OSD-767', []),
  studyFact('OSD-772', []),
  studyFact('OSD-476', ['moon']),
  studyFact('OSD-714', ['moon']),
  studyFact('OSD-342', []),
  studyFact('OSD-937', []),
  studyFact('OSD-210', ['flare']),
];
