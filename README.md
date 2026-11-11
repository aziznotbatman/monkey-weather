# Monkey Weather

**What should I wear today? Ask the monkey.**
A mobile-first website where a hand-drawn chimp wears today's outfit and tells you when to change it ("drop the scarf at 13:00", "umbrella from 17:00").

- Live: **https://monkey-weather.vercel.app**
- Demo days (no location needed): **[big swing](https://monkey-weather.vercel.app/?demo=big-swing)** · **[storm](https://monkey-weather.vercel.app/?demo=stormy)** · **[muggy](https://monkey-weather.vercel.app/?demo=muggy)** · **[snow](https://monkey-weather.vercel.app/?demo=freezing-snow)**
- Monkey sheet (design system): **https://monkey-weather.vercel.app/design**

Weather data by [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0). Portfolio project by Aziz.

---

## How it works (one paragraph)

The visitor taps **Use my location** or types a city. The **browser** fetches the hourly forecast from Open-Meteo (each visitor's own IP, no key needed) and squeezes the day into ~9 two-hour steps. A hand-written **rule engine** (an expert system: plain rules, no machine learning) then picks the outfit from a fixed wardrobe of **26 items**, decides the few moments when it should change, and writes the chimp's line. It all runs **in the browser**: instant, the same answer every time, and nothing about the visitor reaches our server.

An earlier version asked an AI model (Google Gemini) for the outfit. In a side-by-side test on the same days the rules made better outfits, answered instantly and never failed, so the AI was removed. The comparison is written up in [docs/case-study.md](docs/case-study.md).

---

## What the engine reacts to

| Weather | What the chimp does |
|---|---|
| Feels-like temperature (after "runs cold/warm" and cycling wind-chill) | 5 bands, from t-shirt and shorts to puffer, beanie, scarf and gloves |
| Rain chance ≥ 60 % or a rain code | Umbrella; raincoat instead when windy, gusty, stormy or cycling |
| Drizzle | A windbreaker, not an umbrella |
| Downpour (≥ 2 mm/h) | Raincoat **and** umbrella, rain boots, rain trousers on foot |
| Thunderstorm | Never an umbrella. Raincoat |
| Gusts ≥ 50 km/h | No umbrella, no cap or sun hat (beanies hold on) |
| Wind ≥ 25 km/h, mild | Windbreaker instead of a light jacket |
| Sleet, freezing rain, snow | Boots with grip, gloves below 5°, beanie (or ear muffs if smart) |
| Muggy (humidity ≥ 70 % and ≥ 24°) or hot (≥ 27°) | Water bottle, light clothes |
| UV ≥ 6 in daylight | Sunglasses, cap or sun hat |
| Fog | Mentioned by the chimp, no clothing change |

Profile: **runs cold / normal / runs warm** (±3°), **walk / cycle / transit** (cyclists get a vest or windbreaker, rain trousers, never an umbrella; transit gets layers that come off), **casual / smart** (shirt, sweater, boots, ear muffs instead of a beanie).

People get dressed once: the top, trousers and shoes are chosen for the whole day, and only layers and accessories change. At most four changes a day, the most important first.

---

## The 2 things to do by hand

1. **Add your portfolio link** (`NEXT_PUBLIC_PORTFOLIO_URL`, section B) so the footer links to your case study.
2. **Delete the old AI key**: it's no longer used. In Vercel → **monkey-weather** → **Settings** → **Environment Variables**, delete `AI_API_KEY`. Then in https://aistudio.google.com → **API keys**, delete that key too.

Optional: connect GitHub to Vercel so every push deploys automatically (section C).

---

## A. Run it on your Mac

You need [Node.js 20+](https://nodejs.org/) (download the "LTS" installer).

1. Open **Terminal** and go to the project folder:
   ```bash
   cd ~/Developer/monkey-weather
   ```
2. Install once:
   ```bash
   npm install
   ```
3. Start it:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 in your browser. Stop it with `Ctrl + C` in Terminal.

No keys or accounts are needed.

## B. Settings on the live site (Vercel)

There is one optional setting:

1. Go to https://vercel.com → your project **monkey-weather** → **Settings** → **Environment Variables**.
2. Add `NEXT_PUBLIC_PORTFOLIO_URL` with your case-study or portfolio link (must start with `https://`). Tick **Production** and **Preview**. Save.
3. Variables only apply to new deployments: go to **Deployments**, click the **⋯** on the latest one, then **Redeploy**.

## C. Deploy from scratch (for a non-developer)

The project is already deployed. These steps are for redeploying, or for setting it up on another account.

1. **GitHub:** the code lives at https://github.com/aziznotbatman/monkey-weather.
2. **Vercel:** https://vercel.com → **Add New… → Project** → **Import** the `monkey-weather` repository. (If Vercel asks you to connect GitHub first, do that. Your Vercel account currently needs a *GitHub login connection* before it can import or auto-deploy: Account Settings → Authentication → connect GitHub.)
3. Framework: Next.js (detected automatically). Don't change the build settings.
4. Click **Deploy**. Wait about a minute, then open the URL Vercel shows.
5. From then on, every push to `main` deploys automatically.

From Terminal, the same deploy is: `npx vercel deploy --prod`.

---

## Change the monkey

- **Colours:** everything lives in [`lib/tokens.ts`](lib/tokens.ts). `art.fur`, `art.skin`, `art.skinDark`, … are the chimp; `art.red`, `art.mustard`, … the garments; `sky` holds the weather backgrounds and their text colours. Change a hex value, save, and the whole site follows. (`npm test` checks every sky's text still has enough contrast.)
- **Line weight and wobble:** `stroke` in the same file (`line`, `wobbleScale`, …).
- **Shapes:** the body is in [`components/monkey/body.ts`](components/monkey/body.ts), faces in `expressions.ts`, garments in `components/monkey/items/`. All are drawn for a 600 × 800 canvas against the skeleton in `anchors.ts`.
- **What he says:** [`lib/lines.ts`](lib/lines.ts): headlines and one-liners by mood and by kind of weather.
- **The rules:** [`lib/ruleEngine.ts`](lib/ruleEngine.ts) (thresholds at the top) and [`lib/conditions.ts`](lib/conditions.ts) (what counts as drizzle, a downpour, gusty, muggy…).
- Check everything at `/design` (the monkey sheet).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm test` | 73 unit tests (rule engine and weather conditions, summary builder, town-name lookup, units, contrast) |
| `npm run test:e2e` | 44 Playwright tests: the 9 demo days, "Use my location", every error state, on mobile and desktop |
| `npm run assets` | Regenerates the portfolio images in `docs/assets/` |
| `npm run lint` / `npm run typecheck` | Code checks |

First time running Playwright: `npx playwright install chromium`.

## What's where

```
app/                 page.tsx (the app), design/ (monkey sheet), poster/[id] (portfolio composites)
components/monkey/   the character: anchors, body, expressions, effects, items/
components/app/      outfit card, change notes, wearing list, day strip, city picker, preferences, states
lib/                 weather.ts (Open-Meteo + DaySummary), placeName.ts (town name), conditions.ts, ruleEngine.ts, lines.ts,
                     wardrobe.ts, tokens.ts
lib/fixtures/        9 reproducible weather days (also used by ?demo=<id>)
tests/               unit/ (vitest), e2e/ (playwright), assets/ (image generator)
docs/                case-study.md, assets/, lighthouse/
```

## Measured quality (11 Nov 2026, live site, Lighthouse 12.8, mobile)

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Landing `/` | 100 | 100 | 96 | 100 |
| Outfit card `/?demo=big-swing` | 99 | 100 | 96 | 100 |

Landing: FCP 1.0 s, LCP 1.9 s, TBT 40 ms, CLS 0. Card: FCP 1.0 s, LCP 2.2 s, TBT 0 ms, CLS 0. (The AI version measured 98 / 98 with LCP 2.4 s on both.) Best Practices loses points on a "Content security policy" DevTools issue that doesn't appear in normal browsing; it is most likely Lighthouse's own injected scripts hitting the CSP. Full reports: `docs/lighthouse/*.report.html`.

`npm audit`: 0 vulnerabilities in production dependencies. 8 moderate ones remain in dev-only lint tooling (eslint's minimatch); the suggested fix is a breaking downgrade, so it was left.

## Privacy

No accounts, no database, no cookies, no analytics, no server-side processing. Your preferences and last city are saved in your own browser (`localStorage`). With **Use my location**, your browser sends the coordinates, rounded to about 1 km, to two services and nowhere else: Open-Meteo for the forecast and [BigDataCloud](https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api)'s free client-side reverse geocoder for the town name. If the name lookup fails or takes more than 2.5 s, the card just says "Your location". The outfit is worked out on your device; our server only serves the page.

## Known limitations

- The town name for "Use my location" depends on BigDataCloud's free service; if it is down, the card says "Your location" instead.
- Two-hour steps: a 30-minute shower can be averaged away, and the change times are always on even hours.
- The thresholds were tuned on the 9 demo days and common sense, not on user research.
