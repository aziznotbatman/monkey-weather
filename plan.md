# plan.md — Monkey Weather build plan

Owner: Aziz · Built in one day, **Wed 11 Nov 2026** (original target Fri 13 Nov), buffer Sat 14 Nov, SUPSI portfolio deadline **Sun 15 Nov**.
This file is the working checklist for the build. The full brief is `MASTER_PROMPT.md`. Keep this file updated: tick boxes as you finish, append decisions to the log at the bottom.

## One-line goal
A mobile-first website where a hand-drawn monkey, wearing today's outfit, tells you what to wear and when to change it. Weather from Open-Meteo (browser-side), outfit logic from OpenAI (server-side, key hidden) with a rule-engine fallback. Hosted free on Vercel Hobby.

## Non-negotiables (quick recall)
- AI key only in server env `AI_API_KEY` (was `OPENAI_API_KEY`, see Decisions). Never client-side, never committed, never asked for in chat. Site works with no key (fallback).
- Open-Meteo called from the **browser** (avoid shared-IP limits). Visible CC BY attribution. Non-commercial: no ads/payments.
- Monkey is an **original character**. References = line quality + colour mood only.
- Wardrobe is a **fixed vocabulary**; AI picks ids, server validates, fallback on any failure.
- Honest claims only (no invented metrics or users).

## Schedule

| When | Phases |
|---|---|
| Wed 11 Nov (evening) | Phase 0, start Phase 1 |
| Thu 12 Nov | Phase 1 (checkpoint A), Phase 2, Phase 3 |
| Fri 13 Nov | Phase 4, Phase 5, Phase 6 (deploy), Phase 7 (assets + case study) |
| Sat 14 Nov | Buffer: fixes, polish, final check on phone, portfolio link |

---

## Phase 0 — Setup (≈ 45 min)
- [x] Restate understanding (~10 lines) and list assumptions at the top of the Decisions log.
- [x] Scaffold Next.js (latest stable, App Router, TypeScript strict) + chosen styling approach + eslint/prettier.
- [x] Add deps: `zod`, `openai`, `vitest`, `@playwright/test` (dev). Keep the list short.
- [x] `.gitignore` includes `.env*` (except `.env.example`); create `.env.example` with `OPENAI_API_KEY=`, `OPENAI_MODEL=`, `NEXT_PUBLIC_PORTFOLIO_URL=`.
- [x] Look up the **current** OpenAI model names and the recommended Structured Outputs API; choose a small, cheap default; record it in the Decisions log.
- [x] Design tokens file (colours, stroke width, radii, spacing, type scale). Load fonts with `next/font`.
- [x] `/api/health` returns only `{ aiConfigured }`.
- [x] Git init, first commit, `npm run build` passes.

## Phase 1 — The monkey and the wardrobe (biggest phase; ≈ 5–6 h)  ★ CHECKPOINT A at the end
- [x] Study the attached reference images; write a 6-line "style spec" (outline weight, wobble amount, palette, shading rule, face rules) into the Decisions log.
- [x] `anchors.ts`: skeleton anchor points for viewBox `0 0 600 800`.
- [x] Monkey base: body, head, ears, muzzle, tail, hands, feet, as hand-authored paths with separate **fill** and **line** layers.
- [x] Wobble filter (`feTurbulence` + `feDisplacementMap`) on the line layer; tune until it looks like the references' marker line.
- [x] Expressions: `happy`, `shivering`, `soggy`, `sweaty` (then `windblown`).
- [x] MVP wardrobe (13 items): `beanie`, `cap`, `sunglasses`, `scarf`, `tshirt`, `sweater`, `puffer`, `raincoat`, `shorts`, `trousers`, `sneakers`, `rainboots`, `umbrella`. Each fits the skeleton, correct z-order, same marker style.
- [x] Remaining items: `sunhat`, `longsleeve`, `hoodie`, `lightjacket`, `sandals`, `boots`, `gloves`.
- [x] `<Monkey outfit={...} mood={...} />` component: layering rules (one per slot, `outer` over `top`, `scarf` over collar), accessible `aria-label` from the outfit.
- [x] Weather effects as small SVG layers (rain, snow, sun disc, wind swooshes, clouds, stars).
- [x] `/design` page: all expressions, every item alone, a grid of ≥ 12 full outfits, palette swatches, stroke-width spec.
- [x] Screenshot the `/design` page and a few combinations. **Critique against the references** (outline weight, colour harmony, garment fit). Fix.
- [~] ★ Checkpoint: Aziz was away (asked to keep going). Mid-build he sent new references (vintage dressed-chimp photo); the character was redesigned as a deadpan chimp. Screenshots + self-critique in the final report; restyle on his notes.

## Phase 2 — Data and logic (≈ 3–4 h)
- [x] `weather.ts`: geocoding search, forecast fetch (browser-side), WMO code map, `DaySummary` builder (07:00–23:00, 2-hour steps, "after 20:00 → Tomorrow", "< 3 h left → Tomorrow", timezone-correct).
- [x] Types and zod schemas for `DaySummary`, `Profile`, `Outfit` (`schema.ts`).
- [x] `ruleEngine.ts` with thresholds from the brief, change detection with debounce, ≥ 25 one-liners.
- [x] `validateOutfit.ts`: wardrobe validity, always-filled slots, impossible combos, chronology, add/remove consistency, caps; repair or reject.
- [x] `prompt.ts` (versioned system prompt) and `openai.ts` (structured output, ~12 s timeout, one quick retry on 5xx, small max tokens).
- [x] `/api/outfit`: validate → rate-limit → cache → AI → validate/repair → fallback; never log bodies; `source` set by server.
- [x] `ratelimit.ts` (in-memory sliding window, documented as best-effort), `cache.ts` (TTL ~30 min), light origin check.
- [x] Unit tests (vitest): rule engine across fixtures, validator repair cases, summary builder edge cases, unit conversion. All green.
- [x] Fixtures 1–7 in `lib/fixtures/` + mocks for Open-Meteo and OpenAI.

## Phase 3 — The product UI (≈ 5–6 h)
- [x] Landing/empty state (waving monkey, two buttons, one-line location explanation).
- [x] City picker with debounced autocomplete; geolocation only after tap.
- [x] Loading state (thinking monkey; stable layout).
- [x] Outfit card: top row (location chip, Today/Tomorrow toggle, feels-like range, unit toggle), monkey with weather-coloured background and effects, headline, monkeyLine.
- [x] Change notes (≤ 4 sticky-note chips) + **tap-to-preview** (monkey swaps layers with a small pop; "Back to morning").
- [x] Day strip SVG: feels-like curve, rain bars, UV marker, change markers; screen-reader list alternative.
- [x] Preferences sheet (sensitivity, getAround, style, units), saved to `localStorage` (try/catch; works without it), applied instantly.
- [x] Error states with expressions: location denied, city not found, offline, forecast failed, AI failed (honest "backup brain" note), rate-limited.
- [x] Footer: Open-Meteo attribution (link), privacy line, optional portfolio link (`NEXT_PUBLIC_PORTFOLIO_URL`), "Made by Aziz".
- [x] Reuse last result from `localStorage` if < 30 min old.
- [x] Responsive check: 360, 390, 430, 768, 1280 px.

## Phase 4 — Polish and QA (≈ 3 h)
- [x] Playwright scenarios for fixtures 1–7 + all edge states, mobile and desktop; **open the screenshots and critique them**; fix overlaps, contrast, fit.
- [~] Animations: idle bob, item pop, note previews, sky colour transition, rain fall; all disabled under `prefers-reduced-motion`. **Blink not done** (the first version scaled the whole face; removed).
- [x] Accessibility pass: contrast ≥ 4.5:1 on every background colour, focus rings, keyboard flow, labels, 44 px targets, `lang`.
- [x] Metadata: title, description, Open Graph image (static monkey card), favicon (monkey face).
- [x] Security headers/CSP; `npm audit` (production deps: 0 vulnerabilities after upgrading zod; 8 moderate remain in dev-only eslint tooling, fix needs a breaking downgrade); runtime deps pinned.
- [x] Lighthouse mobile run: record the **real** numbers in the README.
- [~] Fallback path tested; client bundle grepped (no secret). **AI path waits for Aziz's key** (mocked in tests).

## Phase 5 — Deploy (≈ 1–2 h)
- [x] README: local setup; env vars; where to paste the key (local `.env.local`, Vercel project settings → Environment Variables for Production and Preview); how to set an OpenAI monthly budget limit; how to change `OPENAI_MODEL`; how to add a Vercel Firewall rate-limit rule.
- [x] Step-by-step deploy guide for a non-developer: push to GitHub → Vercel "Add New Project" → import → add env vars → Deploy → open URL.
- [~] Live `/api/health` → `{"aiConfigured":false}` (no key yet); demo scenarios checked on the live URL. Real-phone test: Aziz.
- [x] Confirm the build output and the git history contain no key.

## Phase 6 — Portfolio assets (≈ 2 h)
- [x] `npm run assets` (Playwright) writes to `docs/assets/`: monkey sheet; six scenario cards at 390×844 @2×; six desktop shots; and **2800×1700 landscape composites per scenario** (card + day strip on the weather background) for Figma/Behance.
- [x] A short list of "design decisions" with the screenshot each one is visible in (feeds the case study).

## Phase 7 — Case study draft (≈ 1 h)
- [x] `docs/case-study.md`, first person for Aziz: Problem → Insight → Concept → Design decisions → How the AI fits (and where it must not decide alone: fixed vocabulary, validation, fallback) → Build → Testing → Next steps.
- [x] Only true statements. Mark every item that needs my real input with `TODO(Aziz)`. No invented users, quotes or numbers.
- [x] Short Behance-style description (≤ 150 words) plus a list of 6 portfolio images in recommended order.

---

## Cut list (if time runs short, cut from the top, and tell Aziz)
1. `windblown` expression and wind effects.
2. Shareable/exportable card image.
3. °F unit toggle (keep °C only).
4. Extra items: `sunhat`, `hoodie`, `sandals`, `gloves` (keep the MVP 13).
5. Day strip UV marker.
6. Tap-to-preview animation (keep the notes themselves).
**Never cut:** fallback engine, validation, rate limiting, attribution, accessibility basics, README, secret handling.

## Acceptance checks (final)
- [x] Seven fixture scenarios produce sensible, different outfits; big-swing day shows the right changes.
- [~] Works without key ✓, every failure degrades gracefully ✓ (e2e). With key: pending Aziz's key.
- [x] Monkey matches the reference line/colour mood; garments fit; consistent outline weight.
- [x] Lighthouse mobile numbers measured and reported.
- [x] No secrets in client, repo, logs or history.
- [~] Live URL works at phone sizes in a browser; a real phone check is for Aziz.

## Decisions log
_(Append assumptions and decisions here: date, decision, why.)_

- 2026-11-11 — Hosting: Vercel Hobby (free, non-commercial personal use; fits portfolio). Alternative considered: Cloudflare Pages/Workers. Chosen Vercel for zero-config Next.js.
- 2026-11-11 — Open-Meteo is called **from the browser**, not the server, because its free tier limits by IP and shared hosts can hit limits sooner; only the OpenAI call is server-side.
- 2026-11-11 — The AI chooses only from a fixed wardrobe vocabulary; server validates and falls back to a deterministic rule engine, so the site never depends on the AI being right or available.
- 2026-11-11 — Art direction: original monkey, drawn in thick wobbly marker line with flat fills on solid saturated backgrounds, based on the mood (not the characters) of the reference images.

- 2026-11-11 — Restated understanding: one outfit card, one character; the browser fetches Open-Meteo; one server route asks OpenAI for a plan from a fixed wardrobe; server validates/repairs; deterministic rule engine as fallback (also in-browser if the server is unreachable). Built today instead of over three days, per Aziz.
- 2026-11-11 — Assumptions: no key during the build (Aziz adds it later); reference images arrived in chat (cow head, brown bear on blue), then a second set (Prague Zoo matchbox chimp, vintage dressed-chimp photo) that redefined the character.
- 2026-11-11 — Model: `gpt-6-luna` default (OpenAI models page on 11 Nov 2026: "most efficient model for focused, high-volume tasks", $0.10/$0.50 per M tokens, reasoning effort `none` available). Responses API + `responses.parse` with `zodTextFormat` (Structured Outputs, strict). Configurable via `OPENAI_MODEL`.
- 2026-11-11 — Style spec (from the references): (1) one constant ink outline, 10 units on a 600×800 canvas (~4 % of head width), round caps/joins; (2) wobble via feTurbulence 0.022 / 2 octaves / seed 11 → displacement 6, on ink layers only; (3) flat fills plus one consistent faint inner edge-darkening band (from the bear), applied to every fill; (4) tiny solid eyes set close, minimal face marks; (5) solid saturated weather backgrounds, reference blue #0563C5 as home, pink #FFB3D6 as UI accent; (6) asymmetry: head tilted −4°, lopsided ears.
- 2026-11-11 — Character: first draft was a cute generic monkey. Aziz asked for "funny, a little bit ugly", pointing at a dressed-chimp photo. Redesigned as an original deadpan chimp: jug ears, heavy brow, dark mask, big pale muzzle, pouty lip, long arms, big hands. **No tail** (chimps don't have one): `SHOW_TAIL` in body.ts switches it back on.
- 2026-11-11 — Sensitivity: the brief's rule-engine formula says "+3 cold / −3 warm" while the prompt says "cold ≈ treat as 3 °C colder". Implemented the prompt's meaning (runs cold → effective temp −3), consistently in both paths.
- 2026-11-11 — Change semantics: `add` puts an item into its slot, replacing what was there (a swap costs one note, e.g. "light jacket instead of puffer jacket"); `remove` empties a slot and is never allowed on top/bottom/footwear.
- 2026-11-11 — Rule engine: each 2-hour point aggregates its window (mean feels-like, max rain chance, summed rain). Temperature changes need 2 consecutive steps (debounce); rain items need 1 step (= 2 h). Snow → boots, never umbrella. Cycling never gets an umbrella. Notes ranked by significance (rain > outer > top/accessories), max 4.
- 2026-11-11 — Units: default °F only when the locale region uses °F **and** the device timezone matches (a Rome browser in en-US got °F otherwise).
- 2026-11-11 — CSP: static policy with `'unsafe-inline'` scripts rather than per-request nonces. Nonces force dynamic rendering of every page; the app renders no user HTML. connect-src limited to self + Open-Meteo; frame-ancestors none.
- 2026-11-11 — Rate limit: in-memory sliding window 20/10 min per IP (best-effort on serverless, documented); `OUTFIT_RATE_LIMIT` env override exists only so the e2e server isn't throttled. README explains the Vercel Firewall rule.
- 2026-11-11 — Demo mode `?demo=<scenario>`: the fixture days re-dated to today. Lets reviewers see the hero day whatever the real weather is; also used for the landing "See the monkey on a tricky day" link.
- 2026-11-11 — "Use my location" shows "Your location": Open-Meteo has no reverse geocoding, and a third-party reverse geocoder would mean sending coordinates elsewhere.
- 2026-11-11 — Scope: nothing from the cut list was cut. Windblown, °F, all 20 items, UV marker and tap-to-preview are all in. Not built: the shareable/exportable card image (cut-list item 2).
- 2026-11-11 — Vercel ↔ GitHub auto-deploy couldn't be linked from the CLI (the account needs a GitHub login connection). Deployed with `vercel deploy --prod`; README section E explains the one-time fix.
- 2026-11-11 — Provider switch: no OpenAI API credit, so the AI now uses Google Gemini's free tier (`gemini-3.5-flash-lite`, no billing attached = no possible charge) through Gemini's OpenAI-compatible endpoint. The call moved from the OpenAI-only Responses API to Chat Completions + `zodResponseFormat` (JSON-schema structured output), which Gemini, OpenAI, Groq and OpenRouter all accept. Env vars renamed to provider-neutral `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `AI_REASONING_EFFORT` (default `low`; `off` omits it). Output cap raised 600 → 2000 tokens because Gemini counts thinking tokens as output. New failure kinds `auth` / `bad_request` so a wrong key or model id shows up in the fallback reason. Validation, repair and rule-engine fallback unchanged.
