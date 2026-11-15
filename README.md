# Junior Astronaut Mission Trainer

A browser game for kids aged 7 to 12, made for the NASA Space Apps Challenge 2026 challenge "Build a Junior Astronaut Mission Trainer".

**Play it here: https://arfaaah.github.io/mission-trainer/**

It runs in any modern browser on a phone or a laptop. There is nothing to install, no login, and no tracking.

## What the game teaches

Power on a space base is limited, so every day the player has to choose between keeping the crew alive (air, food, a radiation shield) and doing science. Radiation is a real danger on the Moon and Mars, and the solar flares in the game are real flares recorded by NASA, so players see that the real Sun really does throw out bursts of energy. Messages from Earth take time to arrive, so on Mars a flare warning can come too late and the crew has to be ready on their own.

## How to play

1. Press **Play** and choose your base: the **Moon** or **Mars**. Each card shows how much power you get, how much radiation reaches the base, and how long messages from Earth take.
2. Read the briefing from Mission Control (CAPCOM Kemi) and give your base a name.
3. Each day (on Mars a day is called a **sol**), CAPCOM Kemi tells you the news: a solar flare, a dust storm, a lettuce harvest, an air leak, a strange rock, or a quiet day.
4. Share out your power (the lightning tokens) between four systems with the plus and minus buttons:
   - **Life support** makes air.
   - **Greenhouse** grows food.
   - **Radiation shield** blocks radiation.
   - **Science lab** makes science points.

   Each meter shows a forecast, for example "If all goes to plan: 73 (+3)". A warning appears if air or food is going down, and another if any power is not being used (unused power is wasted).
5. Press **Run the day**. A report shows what changed and explains why.
6. Survive 10 days. Air at 0 or crew health at 0 ends the mission early. The crew always flies home safely, and the game asks what you would change.
7. At the end you get 0 to 3 stars, 1 to 3 tips for next time, and badges.

| Stars | What you need |
|---|---|
| 1 star | Survive all 10 days |
| 2 stars | Survive and make 45 science |
| 3 stars | Survive and make 70 science |

Badges (you must finish all 10 days to earn any badge): Flare Survivor, Green Thumb, Moon Commander, Mars Commander, Perfect Shield and Scientist. Badges are saved only in your own browser.

### Moon or Mars?

| | Moon | Mars |
|---|---|---|
| Power each day | 10 | 9 (weaker sunlight) |
| Radiation each day | 6 | 4 (thin air blocks a little) |
| Bad power event | Long shadows (4 less power) | Dust storm (4 less power) |
| Messages from Earth | about 1.3 seconds, warnings always arrive | 3 to 22 minutes, half of flare warnings arrive too late |
| Name for a day | Day | Sol (24 h 39 min) |

On Mars, a flare whose warning arrives too late looks like a quiet day in the morning. The forecast cannot see it either. When the day runs, a "Surprise!" message explains that the warning was slower than the flare.

The game can be played with a keyboard alone (Tab to move, Enter to press). It respects the "reduce motion" setting.

## NASA data used, and why

### Solar flares from NASA DONKI (live)

DONKI is NASA's Space Weather Database Of Notifications, Knowledge, Information, run by the Community Coordinated Modeling Center (CCMC) at NASA Goddard.

When the game opens, it asks DONKI for every solar flare in the last 30 days. The title screen panel "Today's real Sun" shows how many huge (X class), medium (M class) and small (C class) flares the real Sun made. That number sets the chance of a flare on each day of the mission:

> flare chance per day = 0.10 + 0.01 x (number of M flares) + 0.04 x (number of X flares), kept between 0.10 and 0.35

When a flare happens in the game, it is a real flare picked from that list. The game shows its class, its date and its source. Bigger classes add more radiation (C adds 10, M adds 18, X adds 30).

**Why:** we wanted the danger in the game to come from the real Sun, not from a random number. A player who opens the game during a busy month on the Sun will face more flares than one who plays in a quiet month.

### Three sources, tried in order

The game tries these one after the other, waiting up to 8 seconds for each:

1. **NASA DONKI (CCMC)**: `https://ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR`. No key needed.
2. **NASA DONKI (api.nasa.gov)**: `https://api.nasa.gov/DONKI/FLR`, with our free NASA API key.
3. **Archived flares** stored inside the game: all 34 real flares that DONKI recorded from 1 to 30 March 2025 (1 X class, 20 M class, 13 C class). We downloaded them from CCMC during development.

Every piece of flare data on screen carries a **LIVE** or **ARCHIVED** tag and its source, for example "NASA DONKI (CCMC)". Stored data is never shown as live.

**Why we built this fallback:** our plan was to use only api.nasa.gov. During the hackathon (15 November 2026), `https://api.nasa.gov/DONKI/FLR` returned "404 Not Found" for every request, while other DONKI data from the same address (geomagnetic storms) still worked. The same flare data was still available directly from CCMC, which runs DONKI. So we made CCMC the first choice, kept api.nasa.gov as a backup in case it comes back, and kept the archived flares so the game works with no internet at all. We also found that the shared DEMO_KEY allows very few requests per hour, so the game uses its own free key.

## Real science facts in the game, with sources

| Fact in the game | Source |
|---|---|
| Solar flares are sorted into classes. C, M and X are the biggest, and each class is 10 times stronger than the one before. | NOAA Space Weather Prediction Center, [Solar Flares (Radio Blackouts)](https://www.swpc.noaa.gov/phenomena/solar-flares-radio-blackouts) |
| The flares in the game are real flares with their real class and date. | NASA CCMC, [DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) |
| A day on Mars is called a sol and lasts about 24 hours 39 minutes. | NASA Goddard Institute for Space Studies, [Mars24 technical notes](https://www.giss.nasa.gov/tools/mars24/help/notes.html) ("24 hours 39 minutes 35.244 seconds") |
| Mars has a thin atmosphere, which blocks a little radiation. | NASA, [Mars Facts](https://science.nasa.gov/mars/facts/) |
| Mars is about 1.5 times as far from the Sun as Earth, so its sunlight is weaker and a Mars base gets less solar power. | NASA, [Mars Facts](https://science.nasa.gov/mars/facts/) |
| The Moon has only a very thin exosphere that is not breathable, so it does almost nothing to block radiation. | NASA, [Moon Facts](https://science.nasa.gov/moon/facts/) |
| A radio message takes about 1.3 seconds to travel from Earth to the Moon. | NASA, [Basics of Space Flight, Chapter 1](https://science.nasa.gov/learn/basics-of-space-flight/chapter1-1/) (light time table: an Earth to Moon round trip takes about 3 seconds) |
| The Mars base is in Jezero crater, where NASA's Perseverance rover landed. | NASA, [Mars 2020 Perseverance](https://science.nasa.gov/mission/mars-2020-perseverance/) |
| A message between Earth and Mars takes 3 to 22 minutes, depending on where the two planets are in their orbits. | **Source still to be confirmed by the team** |
| The Moon base is on the rim of Shackleton crater, near the Moon's south pole. | **Source still to be confirmed by the team** |

**Please note:**
- The meter numbers in the game (for example "6 radiation a day") are simple game points, not real radiation doses.
- Every fact above must be checked against its source by a team member before the final submission.

## Run it on your own computer

You need [Python](https://www.python.org/) (to run a small local web server) and, for the tests, [Node.js](https://nodejs.org/) version 20 or newer. There is nothing to install with npm.

```
git clone https://github.com/Arfaaah/mission-trainer.git
cd mission-trainer
python -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

The game uses JavaScript modules, so it must be opened through a web server like this. Double-clicking `index.html` will not work.

Two handy extras:
- **http://localhost:8000/?archived** skips NASA and plays with the archived flares, to test the game with no internet.
- To clear your saved badges, open the browser's developer tools (F12), go to the Console and type `localStorage.removeItem('junior-astronaut-badges')`.

### Run the tests

```
node --test
```

This runs 53 tests on the game rules, with no browser and no internet needed. They cover:
- the air, food, shield and science maths;
- the forced flare by day 6 and the flare chance limits;
- Moon and Mars differences, including surprise flares;
- the DONKI source order and every fallback, using a fake NASA (timeouts, errors, bad data);
- stars, badges, tips and badge saving.

## How the code is organised

Plain HTML, CSS and JavaScript. No framework, no build step, no backend.

```
index.html            screens and layout
css/style.css         all styles, colours as CSS variables
js/main.js            screen switching and button wiring
js/config.js          all the game numbers, the two bases, badges and the NASA key
js/game.js            game rules, daily results, stars, badges and tips (no page code)
js/events.js          the event deck and how each day's event is picked
js/ui.js              everything drawn on screen (no game rules)
js/data/donki.js      loads DONKI flares from CCMC, then api.nasa.gov, then the archive
js/data/archive.js    archived real flares used when NASA cannot be reached
tests/                tests that run with node --test
CLAUDE.md             the full game design, which we used as our plan
```

## Privacy

- No game data is ever sent anywhere.
- The only requests the game makes are to NASA, to fetch the public solar flare list.
- Badges are saved in your browser's local storage and never leave your device.

## What is not built yet

Our plan (see `CLAUDE.md`) has more steps that we have not finished:
- fact cards and experiment cards based on real NASA studies (NASA OSDR);
- a comparison with real radiation measured on the International Space Station (NASA RadLab);
- Cadet and Commander difficulty levels;
- Space Words and Data Sources screens;
- optional sound.

What is in the game today is complete and fully playable.

## The team

Made by **Core Dev 5**, from Kano.

## How we built it: Claude Code

We built this game with **Claude Code**, Anthropic's AI coding assistant.

Our team wrote the game design (`CLAUDE.md`) and made the decisions, including the rules, the balance, which data to use and in what order. We played and checked every step in the browser before it was committed.

Claude Code wrote most of the code and the tests under our direction. It also explained each change in plain words, and helped us investigate the api.nasa.gov 404 and build the fallback.
