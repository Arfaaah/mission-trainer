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
5. If you like, run **today's experiment**. Each day offers one experiment card based on a real NASA study, for example "Grow tomatoes under red and blue light". It costs extra power (or air) and gives bonus science.
6. Press **Run the day**. A report shows what changed, explains why, and ends with a "Real space science" fact card with its source.
7. Survive 10 days. Air at 0 or crew health at 0 ends the mission early. The crew always flies home safely, and the game asks what you would change.
8. At the end you get 0 to 3 stars, 1 to 3 tips for next time, badges, a comparison of your crew's radiation with real radiation measured on the International Space Station, and 3 more real science fact cards.

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

### Radiation on the International Space Station from NASA OSDR RadLab (archived)

RadLab is part of NASA's Open Science Data Repository (OSDR). It collects radiation measurements from detectors on spacecraft.

During development we used the [RadLab data API](https://visualization.osdr.nasa.gov/radlab/) once to download one week of readings from the **DosTel1** detector, which sits in the **Columbus** module of the International Space Station. RadLab gives the absorbed dose rate in microgray per hour, about once every 100 seconds. We added up each day's readings over time to get the dose for each whole day:

| Date (2024) | 1 June | 2 June | 3 June | 4 June | 5 June | 6 June | 7 June |
|---|---|---|---|---|---|---|---|
| Absorbed dose (microgray) | 170 | 211 | 213 | 227 | 208 | 243 | 193 |

The average is **about 209 microgray a day**. The results screen shows this next to how much radiation reached the player's crew, with an ARCHIVED tag and the source. The game never calls RadLab while you play.

**Why:** players spend the whole game managing radiation. We wanted them to see that real astronauts get radiation every day too, and that scientists really measure it. The game makes clear that its radiation points are made up for the game and are not the same unit as microgray.

**Notes for checking:**
- The RadLab website and its help pages returned server errors (500) while we worked, but the data API itself answered normally.
- The unit (microgray per hour) comes from the RadLab knowledge base entry "Absorbed radiation dose rate in μGy/hour". We could only read it through a search engine's copy, because the page itself was down.
- 209 microgray a day is about 0.2 milligray, which is in line with published measurements inside the space station.

### Real NASA studies from NASA OSDR (archived)

We used the [OSDR search API](https://osdr.nasa.gov/osdr/data/search?term=plant&type=cgene) during development with the search terms plant, lettuce, muscle, bone, radiation and sleep. We picked 8 real studies that match what happens on the base: growing food, keeping the crew strong, and radiation. ("Sleep" found only 3 studies and none of them was about sleep, so we did not use it.) We wrote one sentence for kids from each study's own description. The game stores the study ID, its title and that sentence.

| Study | What it found, for kids | Used for |
|---|---|---|
| [OSD-267](https://osdr.nasa.gov/bio/repo/data/studies/OSD-267) | Astronauts grew red romaine lettuce in a plant box called Veggie on the space station, and scientists found it was safe and healthy to eat. | Experiment "Check the space lettuce", fact card |
| [OSD-767](https://osdr.nasa.gov/bio/repo/data/studies/OSD-767) | Tomatoes were grown on the space station under different colours of light, red or blue, to see how light and space change the plants. | Experiment "Grow tomatoes under red and blue light", fact card |
| [OSD-772](https://osdr.nasa.gov/bio/repo/data/studies/OSD-772) | Chile peppers grew on the space station for 137 days and made 26 peppers. It was one of the longest plant experiments in space. | Experiment "Grow chile peppers", fact card |
| [OSD-476](https://osdr.nasa.gov/bio/repo/data/studies/OSD-476) | Scientists grew small plants in real Moon soil brought back by Apollo astronauts. The plants grew, but slowly, and they showed signs of stress. | Experiment "Plant seeds in Moon soil" (Moon base only), fact card |
| [OSD-714](https://osdr.nasa.gov/bio/repo/data/studies/OSD-714) | On the space station, a spinning machine gave some mice Moon-strength gravity. A leg muscle shrank in mice that floated, but not in mice that had Moon gravity. | Experiment "Spin test for muscles", fact card |
| [OSD-342](https://osdr.nasa.gov/bio/repo/data/studies/OSD-342) | Mice that spent 33 days on the space station lost muscle and bone. | Experiment "Crew fitness test" (costs air instead of power), fact card |
| [OSD-937](https://osdr.nasa.gov/bio/repo/data/studies/OSD-937) | Tiny pieces of human muscle grown on a chip were sent to the space station. In weightlessness they squeezed more weakly than on Earth. | Experiment "Muscle on a chip", fact card |
| [OSD-210](https://osdr.nasa.gov/bio/repo/data/studies/OSD-210) | Seeds flew on a giant balloon high above Antarctica so scientists could study how cosmic radiation from space damages living things. | Experiment "Seeds and cosmic rays", fact card |

**Why:** we wanted every bit of science in the game to point to real research that a child or a teacher can look up. Each experiment card and fact card shows its study ID as its source, with a link.

Each experiment costs 1 to 3 power (or 6 air for the fitness test) and gives 4 to 12 science. That is a little more science per power than the Science lab, so experiments are worth trying but never free.

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
| A message between Earth and Mars takes 3 to 22 minutes, depending on where the two planets are in their orbits. | NASA Langley Research Center, McBrayer, Chai and Judd (2022), [Communication Delays, Disruptions, and Blackouts for Crewed Mars Missions](https://ntrs.nasa.gov/api/citations/20220013418/downloads/ASCEND-Communication%20Delays%2C%20Disruptions%2C%20and%20Blackouts%20for%20Crewed%20Mars%20Missions.pdf): the one-way delay reaches up to 22 minutes. The 3 minute minimum comes from the closest distance between Earth and Mars, about 55 million km, divided by the speed of light (about 300,000 km each second): 55,000,000 ÷ 300,000 = about 183 seconds, or about 3 minutes. |
| The Moon base is at Peak Near Shackleton, one of NASA's Artemis III candidate landing regions near the Moon's south pole. | NASA news release 22-089 (19 August 2022), [NASA Identifies Candidate Regions for Landing Next Americans on Moon](https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-Moon/) |
| Fact card: NASA's Curiosity rover measured about 0.67 millisieverts of radiation every day on the surface of Mars. One chest X-ray is about 0.02 millisievert, so a day on Mars is like about 33 chest X-rays. | NASA news release, 9 December 2013, [NASA Rover Results Include First Age Measurement on Mars and Help for Human Exploration](https://www.nasa.gov/news-release/nasa-rover-results-include-first-age-measurement-on-mars-and-help-for-human-exploration/) ("an average of 0.67 millisieverts per day from August 2012 to June 2013") |
| Fact card: in June 2018 a huge dust storm covered Mars, and NASA's Opportunity rover stopped talking to Earth. Engineers sent more than a thousand commands, but it never woke up. | NASA news release, 13 February 2019, [NASA's Record-Setting Opportunity Rover Mission on Mars Comes to End](https://www.nasa.gov/news-release/nasas-record-setting-opportunity-rover-mission-on-mars-comes-to-end/) |
| Fact card: the DosTel1 detector inside the space station measured about 209 microgray a day from 1 to 7 June 2024. | NASA OSDR [RadLab](https://visualization.osdr.nasa.gov/radlab/) (see above) |
| Fact card: the Canadian Space Agency made a free toolkit about growing food on the Moon and in faraway places on Earth. | Canadian Space Agency, [Food production on the Moon and in remote areas](https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/) |
| Fact cards and experiment cards from 8 NASA studies | NASA OSDR, see the study table above |

The game picks a fact card that fits the day when it can:
- a flare day gets a flare fact;
- a Mars dust storm gets the Opportunity fact;
- a surprise flare gets the message delay fact;
- a lettuce harvest gets a food fact.

No fact repeats in a mission until all of them have been shown. All fact cards carry an ARCHIVED tag and a link to their source.

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

This runs 70 tests on the game rules, with no browser and no internet needed. They cover:
- the air, food, shield and science maths;
- the forced flare by day 6 and the flare chance limits;
- Moon and Mars differences, including surprise flares;
- the DONKI source order and every fallback, using a fake NASA (timeouts, errors, bad data);
- stars, badges, tips and badge saving;
- the archived RadLab and OSDR data, experiment cards and fact cards.

## How the code is organised

Plain HTML, CSS and JavaScript. No framework, no build step, no backend.

```
index.html            screens and layout
css/style.css         all styles, colours as CSS variables
js/main.js            screen switching and button wiring
js/config.js          all the game numbers, the two bases, badges, experiment cards and the NASA key
js/game.js            game rules, daily results, stars, badges, tips and fact picking (no page code)
js/events.js          the event deck and how each day's event and experiment are picked
js/ui.js              everything drawn on screen (no game rules)
js/data/donki.js      loads DONKI flares from CCMC, then api.nasa.gov, then the archive
js/data/archive.js    archived real data: flares, ISS radiation (RadLab), NASA studies (OSDR), fact cards
tests/                tests that run with node --test
CLAUDE.md             the full game design, which we used as our plan
```

## Privacy

- No game data is ever sent anywhere.
- The only requests the game makes are to NASA, to fetch the public solar flare list.
- Badges are saved in your browser's local storage and never leave your device.

## What is not built yet

Our plan (see `CLAUDE.md`) has more steps that we have not finished:
- Cadet and Commander difficulty levels (step 6 of our plan). We decided not to build this during the hackathon. So every player gets the same game: experiment cards every day, and surprise flares on Mars. In our plan, these would be for Commander (ages 10 to 12) only, and Cadet (ages 7 to 9) would also start with fuller meters and bigger text;
- Space Words and Data Sources screens;
- optional sound.

What is in the game today is complete and fully playable.

## The team

Made by **Core Dev 5**, from Kano.

## How we built it: Claude Code

We built this game with **Claude Code**, Anthropic's AI coding assistant.

Our team wrote the game design (`CLAUDE.md`) and made the decisions, including the rules, the balance, which data to use and in what order. We played and checked every step in the browser before it was committed.

Claude Code wrote most of the code and the tests under our direction. It also explained each change in plain words, and helped us investigate the api.nasa.gov 404 and build the fallback.
