import { HEAD_CROP, ItemIcon, Monkey } from "@/components/monkey/Monkey";
import { Logo } from "./Logo";
import styles from "./build.module.css";

const STEPS = [
  { n: 1, title: "Forecast", body: "Hourly: feels-like, rain, wind, gusts, humidity, UV" },
  { n: 2, title: "Day summary", body: "07–23 h in 9 two-hour steps" },
  {
    n: 3,
    title: "Conditions",
    body: "drizzle · downpour · storm · sleet · ice · snow · gusty · muggy · fog",
  },
  {
    n: 4,
    title: "Rule engine",
    body: "5 bands × your profile. Dress once, ≤ 4 changes",
  },
  { n: 5, title: "Words", body: "116 hand-written headlines and lines" },
  { n: 6, title: "The chimp", body: "SVG, 26 garments on one skeleton" },
] as const;

const STACK = [
  ["Next.js 16", "App Router, every page prerendered"],
  ["React 19 + TypeScript", "strict mode"],
  ["Zod", "checks every forecast that comes in"],
  ["SVG by hand", "paths + a marker-wobble filter"],
  ["CSS Modules", "one tokens file for colour, line, type"],
  ["Vitest · Playwright", "73 unit + 44 browser tests"],
] as const;

/** Slide 2 (2800 × 1700 at 2×): how the project is built. */
export function BuildSlide() {
  return (
    <main className={styles.slide}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Monkey Weather · how it&rsquo;s built</p>
          <h1 className={styles.title}>From forecast to outfit, right on your phone.</h1>
        </div>
        <Logo uid="build-logo" />
      </header>

      <section className={styles.diagram} aria-label="Architecture">
        <div className={styles.services}>
          <div className={styles.service}>
            <h3>Open-Meteo</h3>
            <p>Forecast + city search · free · CC BY 4.0</p>
          </div>
          <div className={styles.service}>
            <h3>BigDataCloud</h3>
            <p>Town name for &ldquo;Use my location&rdquo; · free</p>
          </div>
        </div>
        <div className={styles.connectors}>
          <span>coordinates rounded to ~1 km ↓ ↑ weather</span>
          <span>↓ ↑ town name</span>
        </div>

        <div className={styles.browser}>
          <p className={styles.browserLabel}>
            <b>The visitor&rsquo;s browser</b> everything below runs here, nothing is sent back
          </p>
          <ol className={styles.steps}>
            {STEPS.map((s) => (
              <li key={s.n} className={styles.step}>
                <span className={styles.stepN}>{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                {s.n === 6 && (
                  <Monkey
                    uid="build-chimp"
                    outfit={{
                      top: "sweater",
                      outer: "raincoat",
                      bottom: "trousers",
                      footwear: "rainboots",
                      carry: "umbrella",
                    }}
                    mood="soggy"
                    decorative
                    className={styles.stepChimp}
                  />
                )}
                {s.n === 1 && (
                  <svg viewBox="0 0 120 70" className={styles.stepViz} aria-hidden="true">
                    {[4, 4, 6, 8, 10, 52, 48, 44, 40].map((h, i) => (
                      <rect
                        key={i}
                        x={4 + i * 13}
                        y={66 - h}
                        width="9"
                        height={h}
                        rx="2"
                        fill="#2f6fd6"
                      />
                    ))}
                    <path
                      d="M4 54 C24 52 34 30 52 18 C66 10 76 12 88 24 C100 34 108 40 118 44"
                      fill="none"
                      stroke="#0b0b0b"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {s.n === 2 && (
                  <div className={styles.timeline}>
                    {["07", "09", "11", "13", "15", "17", "19", "21", "23"].map((h) => (
                      <span key={h}>{h}</span>
                    ))}
                  </div>
                )}
                {s.n === 4 && (
                  <div className={styles.miniNotes}>
                    <span>
                      <b>07:00</b> puffer
                    </span>
                    <span>
                      <b>11:00</b> jacket
                    </span>
                    <span>
                      <b>17:00</b> umbrella
                    </span>
                  </div>
                )}
                {s.n === 5 && (
                  <p className={styles.bubble}>
                    &ldquo;Rain is just the sky being clingy.&rdquo;
                  </p>
                )}
                {s.n === 3 && (
                  <div className={styles.stepIcons}>
                    {(["umbrella", "windbreaker", "bottle", "earmuffs"] as const).map((i) => (
                      <ItemIcon key={i} item={i} uid={`b-${i}`} className={styles.stepIcon} />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.connectors}>
          <span>↑ serves the page, nothing else</span>
        </div>
        <div className={styles.hosting}>
          <div className={styles.service}>
            <h3>Vercel</h3>
            <p>Static hosting + CDN · Hobby plan</p>
          </div>
          <div className={styles.service}>
            <h3>GitHub</h3>
            <p>Public repo · every change committed</p>
          </div>
          <p className={styles.noServer}>
            Our server only serves files: no API, no database, no cookies. Cost: €0 a month.
          </p>
        </div>
      </section>

      <aside className={styles.side}>
        <section className={styles.panel}>
          <h2>Stack</h2>
          <dl className={styles.stack}>
            {STACK.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={`${styles.panel} ${styles.ai}`}>
          <h2>Where AI fits</h2>
          <div className={styles.aiRow}>
            <span className={`${styles.badge} ${styles.badgeYes}`}>build</span>
            <p>
              <b>Claude Code</b> (Anthropic) as coding partner: plan, code, tests, review, deploy.
            </p>
          </div>
          <div className={styles.aiRow}>
            <span className={`${styles.badge} ${styles.badgeNo}`}>tested, cut</span>
            <p>
              <b>Google Gemini Flash-Lite</b> as the outfit brain: worse outfits than the rules,
              2–12 s waits, overload errors.
            </p>
          </div>
          <div className={styles.aiRow}>
            <span className={`${styles.badge} ${styles.badgeRule}`}>product</span>
            <p>
              A hand-written <b>rule engine</b> (an expert system). No machine learning, instant,
              same answer every time.
            </p>
          </div>
        </section>
      </aside>

      <footer className={styles.stats}>
        <div>
          <b>100</b> Lighthouse performance
        </div>
        <div>
          <b>100</b> accessibility
        </div>
        <div>
          <b>117</b> automated tests
        </div>
        <div>
          <b>26</b> garments
        </div>
        <div>
          <b>9</b> demo days
        </div>
        <div>
          <b>0</b> cookies
        </div>
        <div className={styles.statsHead}>
          <Monkey uid="build-foot" outfit={{}} mood="happy" crop={HEAD_CROP} decorative />
        </div>
      </footer>
    </main>
  );
}
