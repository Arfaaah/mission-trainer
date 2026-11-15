# Junior Astronaut Mission Trainer: Project Guide for Claude Code

This file is the single source of truth for the game. Read it fully before writing code. When something here conflicts with a prompt, ask before changing the design.

## 1. What we are building

A browser game for kids aged 7 to 12 for the NASA Space Apps Challenge 2026 challenge "Build a Junior Astronaut Mission Trainer". The player commands a base on the Moon or Mars for 10 days and decides each day how to split limited power between life support, food, radiation shielding and science. Every choice has a cost. Real NASA data drives the radiation events and the science content.

The player should leave understanding three true things:
1. Power is limited, so keeping people alive competes with doing science.
2. Radiation is a real danger on the Moon and Mars, and solar flares make it worse.
3. Messages from Earth take time to arrive, so astronauts on Mars sometimes must decide on their own.

## 2. Hard constraints

- Plain HTML, CSS and JavaScript (ES modules). No framework, no build step, no backend, no login.
- Must run by opening index.html through a local server and on GitHub Pages.
- Must work on a phone screen (360px wide) and a laptop.
- All text in plain language a 7 year old can follow. Every science word gets a short explanation in context.
- Never present stored data as live. Every piece of NASA data shows a LIVE or ARCHIVED tag and its source.
- If any API call fails, the game must keep working using embedded archived data.
- No game state is ever sent anywhere. No tracking.

## 3. File structure

```
index.html            screens and layout
css/style.css         all styles, colours as CSS variables
js/main.js            screen switching and event wiring
js/config.js          RULES, SITES, API key, all tunable numbers
js/game.js            game state, daily resolution, win and lose logic (no DOM code)
js/events.js          event deck and event drawing
js/ui.js              all rendering (no game rules)
js/data/donki.js      DONKI fetch plus fallback
js/data/archive.js    embedded real data used offline (flares, radiation, science cards)
assets/               images and icons
README.md             how to play, how to run, datasets used and why
```

Keep game rules out of ui.js and DOM code out of game.js so the rules can be tested in Node.

## 4. Game design

### 4.1 Screens

1. **Title**: game name, "Today's real Sun" panel (DONKI result), Play button, Space Words button, Data Sources button.
2. **Choose your base**: Moon (Shackleton crater rim, south pole) or Mars (Jezero crater). Each card shows power, radiation and message delay in kid language. Choose difficulty: Cadet (ages 7 to 9) or Commander (ages 10 to 12).
3. **Mission briefing**: Mission Control character "CAPCOM Kemi" explains the goal in 3 short lines. Player names their base.
4. **Daily base screen** (main loop, see 4.3).
5. **Day report** (popup after each day).
6. **Mission results**: stars, badges earned, tips, 3 real science fact cards, Play again, Try the other base.

### 4.2 Resources (keep it to these)

| Meter | Start | What lowers it | What raises it |
|---|---|---|---|
| Air | 70 | crew breathes 15 per day, leaks | Life support power (6 per unit) |
| Food | 70 | crew eats 10 per day | Greenhouse power (5 per unit), harvest events |
| Crew health | 100 | radiation that gets through, no food (minus 8) | Rest day action (Commander mode only) |
| Science | 0 | nothing | Science lab power (3 per unit), experiment cards |

All meters run 0 to 100. Science goal is 40. Air at 0 or health at 0 ends the mission early.

### 4.3 The daily loop

1. **Morning news**: CAPCOM Kemi reads today's event (or "no warnings received" if the event is a hidden surprise).
2. **Power plan**: player gets today's power (Moon 10, Mars 9, minus event effects) shown as lightning tokens. Four systems with plus and minus buttons: Life support, Greenhouse, Radiation shield, Science lab. Each row shows its effect in plain words, for example "Makes 18 air. Crew breathes 15." Each meter shows a forecast: "If all goes to plan: 73 (+3)".
3. **Optional experiment card** (Commander mode): one experiment offered per day, based on a real NASA study. Running it costs extra power or air but gives bonus science. Example: "Grow plants under red light (based on NASA Veggie). Costs 2 power. +8 science."
4. **Run the day** button.
5. **Day report popup**: what happened, before and after values for each meter, one sentence explaining WHY in cause and effect terms, a "Real space science" fact with source, and on Mars "Your report reached Earth in N minutes".

Unused power is wasted, and the UI must say so.

### 4.4 Sites

| | Moon | Mars |
|---|---|---|
| Daily power | 10 | 9 |
| Base radiation per day | 6 | 4 |
| Bad power event | Long shadows (minus 4 power) | Dust storm (minus 4 power) |
| Warning delay | about 1.3 seconds, warnings always arrive | 3 to 22 minutes, 50% of flare warnings arrive too late |
| Day name | Day | Sol (24 h 39 min) |

### 4.5 Events (one per day, day 1 is always calm)

| Event | Effect | Weight |
|---|---|---|
| Quiet day | none | 5 |
| Solar flare (from DONKI) | adds radiation: X class 30, M class 18, C class 10 | chance set by real Sun, see 5.1 |
| Long shadows / Dust storm | minus 4 power today | 18% chance |
| Lettuce harvest | plus 10 food | 1.5 |
| Small air leak | minus 10 air | 1.2 |
| Strange rock found | science power counts double today | 1.5 |

If no flare has happened by day 6, force one so every player meets the core lesson. Shield blocks 5 radiation per power unit.

### 4.6 Scoring and replay

- 3 stars: survive 10 days and reach 40 science. 2 stars: survive and reach 24. 1 star: survive.
- Badges (saved in localStorage, wrapped in try/catch): Flare Survivor, Green Thumb (never ran out of food), Mars Commander, Moon Commander, Perfect Shield (no radiation got through for a whole mission), Scientist (60+ science).
- Failure is never scary: "The crew flew home safely. Real missions run into trouble too. What would you change?"
- Results screen gives 1 to 3 specific tips based on what went wrong.

### 4.7 Difficulty

- **Cadet**: no experiment cards, flare warnings always arrive (even on Mars), meters start at 80, bigger text.
- **Commander**: experiment cards, Mars surprise flares, Rest day action (spend the whole day resting: plus 15 health, no science, systems still run on minimum power).

## 5. Real NASA data

### 5.1 DONKI solar flares (LIVE)

- Fetch the last 30 days on page load. Try these sources in order, with an 8 second timeout on each attempt:
  1. CCMC (no key needed): `https://ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
  2. api.nasa.gov (with the NASA key): `https://api.nasa.gov/DONKI/FLR?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=KEY`
  3. If both fail: archived real flares in archive.js, tagged ARCHIVED.
- Show the source on screen as "NASA DONKI (CCMC)" or "NASA DONKI (api.nasa.gov)", depending on which one answered.
- Use field `classType` (for example "M1.2") and `peakTime`.
- Flare chance per day = 0.10 + 0.01 x (number of M flares) + 0.04 x (number of X flares), clamped between 0.10 and 0.35.
- In-game flares pick a real flare from that list and show its class, date, LIVE or ARCHIVED tag and source.
- Optional: also fetch geomagnetic storms `https://api.nasa.gov/DONKI/GST?...` to show "Earth's last space weather storm" on the title screen.

### 5.2 RadLab radiation (ARCHIVED)

- Source: https://visualization.osdr.nasa.gov/radlab/gui/data-api/
- Use once, during development, to pull a small sample of real ISS absorbed dose rates. Store a few values in archive.js with the instrument name and date range.
- In game: the results screen compares the player's radiation to a real ISS daily dose. Do not call this API at runtime.

### 5.3 OSDR studies (ARCHIVED)

- Search API: `https://osdr.nasa.gov/osdr/data/search?term=KEYWORD`
- Use during development with terms like "bone", "muscle", "plant", "radiation", "sleep". Pick 6 to 10 real studies. Store the study ID, title and a one sentence kid explanation in archive.js.
- These power the experiment cards and fact cards, each showing the OSDR study ID as its source.

### 5.4 Other sources to cite in fact cards

- Curiosity RAD: about 0.64 mSv per day on the Mars surface.
- NASA Veggie experiment: astronauts grew and ate lettuce on the ISS.
- Opportunity rover: lost power in the 2018 Mars dust storm.
- CSA food production toolkit for greenhouse content.
Every fact must be checked against its source by a human before submission.

### 5.5 API key

- Put the NASA key in js/config.js as `NASA_API_KEY`. A free personal key from https://api.nasa.gov is fine to ship in a static site because it is free and rate limited. Do not use DEMO_KEY in the final version.

## 6. Accessibility and design

- Buttons at least 44px tall. Colour is never the only signal; every meter also shows its number.
- Dark space theme, high contrast, friendly rounded shapes, emoji or simple icons.
- Respect prefers-reduced-motion.
- Keyboard playable: Tab to every control, Enter to press.

## 7. Build order (finish each before starting the next)

1. MVP loop: base screen, power plan, daily resolution, report popup, results. Hardcoded data.
2. DONKI live data with fallback and LIVE or ARCHIVED tags.
3. Moon vs Mars differences including Mars surprise flares.
4. Results screen tips, stars, badges.
5. Archived RadLab and OSDR data, experiment cards, fact cards.
6. Cadet and Commander difficulty.
7. Visual polish, sound (optional, off by default).
8. README with datasets used and why.

A playable step 1 to 4 is worth more than a broken step 1 to 8.

## 8. Testing

- Write tests/game.test.js that runs with `node --test` and checks: air math, shield blocking, food running out lowers health, game ends at air 0, forced flare by day 6, flare chance clamping.
- Before each commit, play one full Moon and one full Mars mission in the browser.

## 9. Working rules for Claude Code

- Make small changes and explain them in plain words; the team is new to coding.
- After each feature, tell us exactly how to test it in the browser.
- Do not add libraries, frameworks or a backend without asking.
- Commit after each working feature with a clear message.
