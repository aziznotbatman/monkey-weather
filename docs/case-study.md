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
| **Fixed wardrobe: 26 items in 9 slots, drawn on one skeleton.** | Every garment is authored against the same anchor points, so any combination fits, from ear muffs over jug ears to a full yellow rain suit. | `monkey-sheet.png` |
| **Location only after a tap; everything happens on the device.** | Trust. The forecast is fetched by the visitor's own browser and the outfit is worked out there too: the server only serves the page. | Landing screen |
| **Dress once, change layers.** Top, trousers and shoes are chosen for the whole day; only jackets and accessories change, at most four times. | Nobody changes trousers at 11:00. Early versions did; it read as a bug. | `card-*-mobile-full.png` |
| **"Wearing" list under the notes.** Every piece on the chimp as a small drawing with its name; it follows the tapped note and highlights what just changed. | The drawing is the fun part, the list is the scannable part: you can check the outfit in one glance, without decoding the illustration. | `card-*-mobile-full.png` |
| **Error states with a face.** Location denied, city not found, offline, forecast failed, too many requests: each has a chimp expression and a plain sentence with a next step. | No raw errors, no blank screens. | e2e screenshots |

TODO(Aziz): pick the 3–4 decisions you're proudest of for the portfolio page, and say in your words what you tried first and changed. (One real example from the build: the first character was a cute generic monkey. Seeing it next to the references, I redirected it to a funnier, slightly ugly chimp inspired by vintage dressed-chimp photography.)

## 5. Why there's no AI in the outfit

The outfit comes from a hand-written rule engine: an expert system, plain rules with no machine learning. It reads feels-like temperature, rain chance and amount, the weather code (drizzle, downpour, sleet, freezing rain, snow, thunderstorm, fog), wind and gusts, humidity and UV, adjusts for the person (runs cold or warm, walks, cycles or takes transit, casual or smart), and plans the day: what to put on, and the few moments to change it, with a debounce so nothing flickers.

It didn't start that way. The first version asked an LLM (Google Gemini Flash-Lite, free tier) for the plan, boxed in by a fixed vocabulary, a strict JSON schema and a server-side validator, with the rule engine as a fallback.

**What a side-by-side test showed (11 Nov 2026, 8 fixture days × profiles):** planning from scratch, the model made worse outfits than the rules (a light jacket at 4 °C, rain boots in snow, a forgotten umbrella on a rainy afternoon), wrote headlines that were titles rather than instructions ("Melting in Palermo"), and copied the example lines it was given. Giving it the rule engine's plan as a draft fixed the outfits, but then it was mostly rewording the rules, with 2–12 s waits and regular "model overloaded" errors on the free tier.

So the model was removed, and the effort went into the rules instead: more weather situations, six new garments, "dress once, change layers", and a much larger set of hand-written lines for the chimp, picked by the day's mood and its most notable weather. The result is instant, free to run, works offline once the forecast is loaded, gives the same answer every time, and sends nothing about the visitor to a server.

TODO(Aziz): your one-line takeaway, e.g. what this taught you about where AI belongs in a product.

## 6. Build

- Next.js + TypeScript on Vercel's free Hobby plan. No backend logic: weather from Open-Meteo, called from the browser; the rule engine runs in the browser too.
- The chimp is drawn **in code**: hand-authored SVG paths on a 600 × 800 skeleton, with a separate ink layer for the outline. An SVG turbulence filter wobbles only the ink, so the line looks like marker while fills stay clean.
- All colours, line widths, radii and type sizes live in one tokens file.
- Privacy: no accounts, cookies, analytics or database. Preferences live in the browser.

## 7. Testing

What was actually done (true as of this draft):
- **73 automated unit tests**: rule-engine thresholds and every weather condition (storm, gusts, drizzle, downpour, sleet, freezing rain, snow, muggy heat), the profile options, 9 fixture days (from freezing snow in Lugano to a thunderstorm in Genoa and a foggy-then-muggy day in Bologna), the forecast-to-summary builder (including "after 20:00, show tomorrow"), line and headline lengths, and colour contrast for every sky.
- **44 end-to-end browser tests** on phone and desktop sizes: every fixture day, the tap-to-preview interaction, "Use my location" with its town name, the wearing list, preferences, every error state, and a check that the page sends no requests to our own server.
- **Visual QA loop:** screenshots of every state were reviewed and fixed (e.g. overlapping day-strip markers, a confusing unit default for a European browser set to US English, a "tail" joke left over from the old monkey).
- **Lighthouse (mobile, live site, 11 Nov 2026):** landing page Performance 100 · Accessibility 100 · Best Practices 96 · SEO 100; outfit card 99 · 100 · 96 · 100, with zero layout shift on both. An earlier card measurement found a layout shift (CLS 0.125) when the result replaced the loading state; the loading state now mirrors the card.

TODO(Aziz): user testing. Even 3–5 people trying it on their phone would make this section much stronger: what did they expect, what confused them, did they trust the chimp? Add quotes only if you collected them.

## 8. What I'd do next

- Tune the thresholds with real people: when do *they* reach for a jacket?
- Morning notification ("Puffer today, umbrella at 17:00"), the natural next step for a habit product.
- A shareable card image.
- A wider wardrobe (layers for rain + cold together, a shell for cyclists) and more poses.
- TODO(Aziz): anything you learned from testing.

---

## Behance-style description (≤ 150 words)

Monkey Weather turns the forecast into an outfit. Weather apps give you numbers; this one gives you a hand-drawn chimp wearing exactly what to put on, plus a few sticky notes telling you when to change it ("17:00 · add umbrella · rain from 17:00"). Tap a note and the chimp changes clothes while the sky changes colour. A hand-written rule engine picks from a 26-item wardrobe and reacts to drizzle, downpours, storms, gusts, sleet, snow and muggy heat. I tried an LLM first; the rules dressed him better, so they stayed. The character is original, drawn entirely in code: SVG paths on one skeleton, with a marker-wobble filter on the ink. Built with Next.js on Vercel; weather by Open-Meteo. No accounts, no tracking; your location stays in your browser.

## Two overview slides (2800 × 1700)

- `docs/assets/slide-1-ui-bento-2800x1700.png`: the product as a bento grid: logo, the real card at 07:00 and with the 17:00 note tapped, four faces, the 7 skies and all 26 garments.
- `docs/assets/slide-2-how-its-built-2800x1700.png`: how it's built: services, the in-browser pipeline (forecast → summary → conditions → rule engine → words → chimp), stack, where AI fits, and measured numbers.

## Six portfolio images, in order

1. `docs/assets/poster-big-swing-2800x1700.png`: hero: the big-swing day, notes and day strip
2. `docs/assets/preview-big-swing-1700-mobile.png`: the signature moment: the 17:00 note tapped, rain sky
3. `docs/assets/monkey-sheet.png`: the character and wardrobe system
4. `docs/assets/card-freezing-snow-mobile.png` + `card-hot-mobile.png`: side by side, the range of the system
5. `docs/assets/poster-cool-rain-2800x1700.png`: a second composite
6. `docs/assets/landing-mobile.png`: first impression and the privacy promise
