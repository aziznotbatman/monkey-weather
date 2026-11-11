# Monkey Weather: a case study (draft)

> First-person draft for Aziz to adapt. Everything stated here is true of the build as of 11 Nov 2026.
> Items marked **TODO(Aziz)** need your own experience, research or data. Nothing here invents users, quotes or numbers.

**Role:** Product & service design, illustration direction, build (with an AI coding assistant)
**Timeline:** TODO(Aziz): e.g. "one intensive day, November 2026"
**Live:** https://monkey-weather.vercel.app · **Demo day:** https://monkey-weather.vercel.app/?demo=big-swing · **Code:** https://github.com/aziznotbatman/monkey-weather

---

## 1. Problem

Weather apps answer a question most people aren't really asking. They show numbers (12°, 60 %, 18 km/h), and leave the actual decision to you: *what do I put on, and will I regret it at 5 pm?* The translation from forecast to outfit happens in your head every morning, usually in a hurry, and it breaks down on exactly the days that matter: the cold morning that turns warm by lunch, the dry afternoon that ends in rain.

TODO(Aziz): a sentence or two from your own life in Rome / your observations. When did a forecast fail you? Keep it honest and specific.

## 2. Insight

The useful unit isn't the temperature, it's **the outfit**. And the hard part isn't the morning, it's **the change**: when to take something off or add something.

So the product should say two things clearly:
1. what to wear when you leave, and
2. the few moments in the day when that should change, and why.

TODO(Aziz): if you talked to anyone (friends, classmates) about how they decide what to wear, summarise what you heard here. If you didn't, say so and frame this as a design hypothesis.

## 3. Concept

**One card, one character.** A hand-drawn chimp wears exactly what you should wear. Under him are up to four sticky notes ("11:00 · light jacket instead of puffer jacket · warming up to 14°", "17:00 · add umbrella · rain from 17:00"). Tap a note and the chimp changes clothes for that moment, and the sky behind him changes with the weather.

The character carries the personality: deadpan, a bit ugly, dry-witted ("My ears are filing a formal complaint about the cold."). He makes a utility product feel like something you'd want to open.

## 4. Design decisions (and where you can see them)

| Decision | Why | See it in |
|---|---|---|
| **The outfit is the interface.** Numbers are secondary (a small "5° → 18°" range). | People act on clothes, not degrees. | `card-*-mobile.png` |
| **Changes as tappable sticky notes, max 4.** | Fewer, meaningful changes beat an hourly list. Tapping one previews the chimp at that time: the signature interaction. | `preview-big-swing-1700-mobile.png` |
| **The sky colour is the weather.** Warm yellow for sun, deep blue for rain, icy blue for snow, navy at night. | You read the day from across the room. Every background has its text colour checked for WCAG AA contrast in an automated test. | `poster-*-2800x1700.png` |
| **A day strip, not a chart.** Feels-like curve, rain bars, one UV marker, numbered change markers. | Shows *why* the notes exist. It also has a screen-reader list version. | `card-*-mobile-full.png` |
| **An original, deadpan chimp in thick marker line with flat fills.** | Reference images set the line quality and mood (fat wobbly outline, flat colour, strong blue ground), not the character. The chimp is new: big jug ears, heavy brow, long pouty muzzle, long arms. | `monkey-sheet.png` |
| **Fixed wardrobe: 20 items in 9 slots, drawn on one skeleton.** | Every garment is authored against the same anchor points, so any combination fits. It also makes the AI's job safe (see 5). | `monkey-sheet.png` |
| **Location only after a tap; nothing stored on the server.** | Trust. The forecast is fetched by the visitor's own browser; the server never sees coordinates. | Landing screen |
| **Honest fallback.** When the rule engine answers instead of the AI, the card says "Monkey's backup brain is on duty". | Being upfront about what produced the answer. | Any card without a key |
| **Error states with a face.** Location denied, city not found, offline, forecast failed, too many requests: each has a chimp expression and a plain sentence with a next step. | No raw errors, no blank screens. | e2e screenshots |

TODO(Aziz): pick the 3–4 decisions you're proudest of for the portfolio page, and say in your words what you tried first and changed. (One real example from the build: the first character was a cute generic monkey. Seeing it next to the references, I redirected it to a funnier, slightly ugly chimp inspired by vintage dressed-chimp photography.)

## 5. How the AI fits, and where it must not decide alone

The AI (Google Gemini Flash-Lite on its free tier, through an OpenAI-compatible API so the provider can be swapped) is used for one thing: turning a compact day summary plus a tiny profile (runs cold/warm, walks/cycles/takes transit, casual/smart) into an outfit plan and a line of copy in the chimp's voice.

It is deliberately **boxed in**:
- **Fixed vocabulary.** It can only choose item ids from the 20-item wardrobe, slot by slot, through a strict JSON schema (Structured Outputs). It can't invent a garment the chimp can't wear.
- **Validation and repair on the server.** Every answer is checked: right item in the right slot, top/bottom/shoes always present, no impossible combinations (puffer + shorts), change times inside the day and in order, only removing what's worn, max four changes, text length caps. Small problems are repaired; anything too broken is thrown away.
- **A deterministic fallback.** A rule engine (thresholds on feels-like temperature, rain, wind and UV, with a debounce so the outfit doesn't flicker) produces the same kind of plan. It runs whenever there's no key, the model is slow (12 s timeout), errors, or returns nonsense. It also runs in the visitor's browser if our server can't be reached.
- **The server decides the source**, not the model. The card's "backup brain" note is set by the server.
- **Prompt-injection hygiene.** The only free text sent to the model is the city name, which is stripped to letters, spaces, hyphens and apostrophes.

The result: the AI can make the outfit *smarter and the copy warmer*, but it can never make the product *wrong or broken*.

TODO(Aziz): once the key is in, compare a few AI plans with the rule engine on the same days and write one honest paragraph on what the AI adds (or doesn't).

## 6. Build

- Next.js + TypeScript on Vercel's free Hobby plan; one server route for the AI. Weather from Open-Meteo, called from the browser.
- The chimp is drawn **in code**: hand-authored SVG paths on a 600 × 800 skeleton, with a separate ink layer for the outline. An SVG turbulence filter wobbles only the ink, so the line looks like marker while fills stay clean.
- All colours, line widths, radii and type sizes live in one tokens file.
- Abuse and cost protection: input limits, rate limiting, a 30-minute cache, a same-site check, small output limits, and a free-tier AI key with no billing attached.
- Privacy: no accounts, cookies, analytics or database. Preferences live in the browser.

## 7. Testing

What was actually done (true as of this draft):
- **88 automated unit tests**: rule-engine thresholds across 7 fixture days (freezing snow, cold dry, cool rain, mild, warm with high UV, hot, and a "big swing" day from 4 °C to 18 °C with rain at 17:00), the validator's repair logic, the forecast-to-summary builder (including "after 20:00, show tomorrow"), the API's fallback paths, and colour contrast for every sky.
- **44 end-to-end browser tests** on phone and desktop sizes: every fixture day, the tap-to-preview interaction, preferences, and every error state.
- **Visual QA loop:** screenshots of every state were reviewed and fixed (e.g. overlapping day-strip markers, a confusing unit default for a European browser set to US English, a "tail" joke left over from the old monkey).
- **Lighthouse (mobile, live site, 11 Nov 2026):** landing page and outfit card both scored Performance 98 · Accessibility 100 · Best Practices 96 · SEO 100. The first card measurement found a layout shift (CLS 0.125) when the result replaced the loading state; the loading state now mirrors the card, and CLS is 0.

TODO(Aziz): user testing. Even 3–5 people trying it on their phone would make this section much stronger: what did they expect, what confused them, did they trust the chimp? Add quotes only if you collected them.

## 8. What I'd do next

- Test the AI path with real days and tune the prompt against the rule engine.
- Morning notification ("Puffer today, umbrella at 17:00"), the natural next step for a habit product.
- A shareable card image.
- A wider wardrobe (layers for rain + cold together, a shell for cyclists) and more poses.
- TODO(Aziz): anything you learned from testing.

---

## Behance-style description (≤ 150 words)

Monkey Weather turns the forecast into an outfit. Weather apps give you numbers; this one gives you a hand-drawn chimp wearing exactly what to put on, plus a few sticky notes telling you when to change it ("17:00 · add umbrella · rain from 17:00"). Tap a note and the chimp changes clothes while the sky changes colour. AI picks the outfit, but only from a fixed 20-item wardrobe, and every answer is validated, with a rule-based "backup brain" when the AI is unavailable or wrong. The character is original, drawn entirely in code: SVG paths on one skeleton, with a marker-wobble filter on the ink. Built with Next.js on Vercel; weather by Open-Meteo. No accounts, no tracking; your location stays in your browser.

## Six portfolio images, in order

1. `docs/assets/poster-big-swing-2800x1700.png`: hero: the big-swing day, notes and day strip
2. `docs/assets/preview-big-swing-1700-mobile.png`: the signature moment: the 17:00 note tapped, rain sky
3. `docs/assets/monkey-sheet.png`: the character and wardrobe system
4. `docs/assets/card-freezing-snow-mobile.png` + `card-hot-mobile.png`: side by side, the range of the system
5. `docs/assets/poster-cool-rain-2800x1700.png`: a second composite
6. `docs/assets/landing-mobile.png`: first impression and the privacy promise
