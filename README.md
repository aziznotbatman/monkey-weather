# Monkey Weather

**What should I wear today? Ask the monkey.**
A mobile-first website where a hand-drawn chimp wears today's outfit and tells you when to change it ("drop the scarf at 13:00", "umbrella from 17:00").

- Live: **https://monkey-weather.vercel.app**
- Demo day (no location needed): **https://monkey-weather.vercel.app/?demo=big-swing**
- Monkey sheet (design system): **https://monkey-weather.vercel.app/design**

Weather data by [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0). Portfolio project by Aziz.

---

## How it works (one paragraph)

The visitor taps **Use my location** or types a city. The **browser** fetches the hourly forecast from Open-Meteo (each visitor's own IP, no key needed) and squeezes the day into ~9 two-hour steps. That small summary goes to our one server route, `POST /api/outfit`, which asks OpenAI to pick an outfit **only from a fixed wardrobe of 20 items**, then **validates and repairs** the answer. If there is no key, the AI is slow, or its answer is wrong, a deterministic **rule engine** (the "monkey's backup brain") produces the same kind of plan, so the site never breaks. The page dresses the monkey from that plan.

---

## The 3 things to do by hand

1. **Add your OpenAI key** to Vercel (section B below). Until you do, the site runs on the backup brain and says so on the card.
2. **Set a monthly spending limit** in OpenAI (section C).
3. **Add your portfolio link** (`NEXT_PUBLIC_PORTFOLIO_URL`, section B) so the footer links to your case study.

Optional, recommended: connect GitHub to Vercel so every push deploys automatically (section E), and add a Firewall rate-limit rule (section D).

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

**To use the AI locally:** make a copy of `.env.example` named `.env.local` (same folder), open it in TextEdit, and paste your key after `OPENAI_API_KEY=` (no quotes, no spaces). Save, then stop and restart `npm run dev`. `.env.local` is ignored by git, so the key never leaves your Mac.

Check it worked: open http://localhost:3000/api/health. It should say `{"aiConfigured":true}`. (This page never shows the key itself.)

---

## B. Put the key on the live site (Vercel)

1. Go to https://vercel.com → your project **monkey-weather** → **Settings** → **Environment Variables**.
2. Add a variable:
   - **Key:** `OPENAI_API_KEY`
   - **Value:** your secret key (starts with `sk-`)
   - **Environments:** tick **Production** and **Preview**
   - Save.
3. Optional variables (same screen):
   - `OPENAI_MODEL`: leave empty to use the default, `gpt-6-luna` (the cheapest current model). To change it, type another model id, e.g. `gpt-6.1-terra`.
   - `NEXT_PUBLIC_PORTFOLIO_URL`: your case-study or portfolio link (must start with `https://`). Leave empty to hide it.
4. Variables only apply to new deployments: go to **Deployments**, click the **⋯** on the latest one, then **Redeploy**.
5. Open https://monkey-weather.vercel.app/api/health. It should say `{"aiConfigured":true}`.
6. Open the site and get a forecast: the "backup brain" note under the headline should be gone.

Never paste the key into chat, code, GitHub, or any variable whose name starts with `NEXT_PUBLIC_` (those are visible to visitors).

## C. Set an OpenAI spending limit

1. Go to https://platform.openai.com and sign in.
2. Open **Settings** → **Limits** (in some accounts it is under **Organization → Billing / Usage limits**; the names change from time to time).
3. Set a **monthly budget** you're comfortable with (a few euros is plenty for a portfolio site), plus an email alert threshold.
4. When the budget is reached, OpenAI rejects requests. The site notices and switches to the backup brain automatically. Nothing breaks.

How much does one outfit cost? Each request sends roughly 1–2k tokens and receives up to 600. With `gpt-6-luna` at $0.10 / $0.50 per million tokens (input / output, as listed on OpenAI's model page on 11 Nov 2026), that is a small fraction of a cent. Identical requests are cached for 30 minutes on the server and reused from the visitor's browser.

## D. Abuse protection

Built in:
- Per-IP rate limit on `/api/outfit`: 20 requests per 10 minutes. **Honest caveat:** it lives in server memory, and Vercel runs several short-lived copies of the server, so it only slows down one noisy visitor. Treat it as best-effort.
- Strict input checks (sizes, ranges), small AI output limit, a 12-second timeout, at most one quick retry, only same-site requests accepted, nothing logged except status, duration and source.

The real backstop is a **Vercel Firewall rule**:
1. Vercel → project → **Firewall** → **Configure** (or **Rules**) → **New Rule**.
2. Name: `Limit outfit API`. Condition: **Request Path** · **equals** · `/api/outfit`.
3. Action: **Rate Limit**: e.g. 30 requests per 600 seconds, keyed by **IP**, then **Deny** (429).
4. Save and **Publish**.
Hobby plans allow a small number of custom rules. If the Rate Limit action isn't offered on your plan, the OpenAI budget limit (section C) still caps your cost.

## E. Deploy from scratch (for a non-developer)

The project is already deployed. These steps are for redeploying, or for setting it up on another account.

1. **GitHub:** the code lives at https://github.com/aziznotbatman/monkey-weather.
2. **Vercel:** https://vercel.com → **Add New… → Project** → **Import** the `monkey-weather` repository. (If Vercel asks you to connect GitHub first, do that. Your Vercel account currently needs a *GitHub login connection* before it can import or auto-deploy: Account Settings → Authentication → connect GitHub.)
3. Framework: Next.js (detected automatically). Don't change the build settings.
4. Add the environment variables from section B.
5. Click **Deploy**. Wait about a minute, then open the URL Vercel shows.
6. From then on, every push to `main` deploys automatically.

From Terminal, the same deploy is: `npx vercel deploy --prod`.

---

## Change the monkey

- **Colours:** everything lives in [`lib/tokens.ts`](lib/tokens.ts). `art.fur`, `art.skin`, `art.skinDark`, … are the chimp; `art.red`, `art.mustard`, … the garments; `sky` holds the weather backgrounds and their text colours. Change a hex value, save, and the whole site follows. (`npm test` checks every sky's text still has enough contrast.)
- **Line weight and wobble:** `stroke` in the same file (`line`, `wobbleScale`, …).
- **Shapes:** the body is in [`components/monkey/body.ts`](components/monkey/body.ts), faces in `expressions.ts`, garments in `components/monkey/items/`. All are drawn for a 600 × 800 canvas against the skeleton in `anchors.ts`.
- Check everything at `/design` (the monkey sheet).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm test` | 88 unit tests (rule engine, validator, summary builder, API service, units, contrast) |
| `npm run test:e2e` | 44 Playwright tests: the 7 fixture days and every error state, on mobile and desktop |
| `npm run assets` | Regenerates the portfolio images in `docs/assets/` |
| `npm run lint` / `npm run typecheck` | Code checks |

First time running Playwright: `npx playwright install chromium`.

## What's where

```
app/                 page.tsx (the app), design/ (monkey sheet), poster/[id] (portfolio composites),
                     api/outfit (the only AI route), api/health ({ aiConfigured } only)
components/monkey/   the character: anchors, body, expressions, effects, items/
components/app/      outfit card, change notes, day strip, city picker, preferences, states
lib/                 weather.ts (Open-Meteo + DaySummary), ruleEngine.ts, validateOutfit.ts,
                     prompt.ts, openai.ts, outfitService.ts, ratelimit.ts, cache.ts, tokens.ts
lib/fixtures/        7 reproducible weather days (also used by ?demo=<id>)
tests/               unit/ (vitest), e2e/ (playwright), assets/ (image generator)
docs/                case-study.md, assets/, lighthouse/
```

## Measured quality (11 Nov 2026, live site, Lighthouse 12, mobile)

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Landing `/` | 98 | 100 | 96 | 100 |
| Outfit card `/?demo=big-swing` | 98 | 100 | 96 | 100 |

Landing: FCP 1.2 s, LCP 2.4 s, TBT 30 ms, CLS 0. Card: FCP 1.1 s, LCP 2.4 s, TBT 60 ms, CLS 0 (an earlier build measured CLS 0.125 on the card; fixed by giving the loading state the card's layout). Best Practices loses points on a "Content security policy" DevTools issue that doesn't appear in normal browsing; it is most likely Lighthouse's own injected scripts hitting the CSP. Full reports: `docs/lighthouse/*.report.html`.

`npm audit`: 0 vulnerabilities in production dependencies. 8 moderate ones remain in dev-only lint tooling (eslint's minimatch); the suggested fix is a breaking downgrade, so it was left.

## Privacy

No accounts, no database, no cookies, no analytics. Your preferences and last city are saved in your own browser (`localStorage`). Your coordinates go only from your browser to Open-Meteo. Our server receives a small weather summary and a city name, never coordinates, and logs nothing about you.

## Known limitations

- The rate limiter is per server instance (see D).
- "Use my location" shows "Your location" rather than a town name: Open-Meteo has no reverse geocoding, and adding another service would mean sending coordinates somewhere else.
- The AI path was built against OpenAI's current Responses API and Structured Outputs, but it has **not been run with a real key yet**. It is covered by tests with a mocked model. Test it once your key is in (section B).
