"use client";

import { ChangeNotes } from "@/components/app/ChangeNotes";
import { DayStrip } from "@/components/app/DayStrip";
import { Monkey } from "@/components/monkey/Monkey";
import { FIXTURE_NOW_MS, scenarioById, scenarioForecast } from "@/lib/fixtures";
import { ruleEngine } from "@/lib/ruleEngine";
import { DEFAULT_PROFILE } from "@/lib/schema";
import { skyFor, WINDY_KMH } from "@/lib/theme";
import { sky } from "@/lib/tokens";
import { formatTemp } from "@/lib/units";
import { buildDaySummary } from "@/lib/weather";
import styles from "./poster.module.css";

export function Poster({ id }: { id: string }) {
  const spec = scenarioById(id);
  const summary = spec
    ? buildDaySummary(scenarioForecast(spec), {
        choice: "today",
        placeLabel: spec.place,
        nowMs: FIXTURE_NOW_MS,
      })
    : null;
  if (!spec || !summary) return null;
  const plan = ruleEngine(summary, DEFAULT_PROFILE);
  const first = summary.hours[0];
  const kind = skyFor(first);
  const theme = sky[kind];
  return (
    <main
      className={styles.poster}
      style={{ background: theme.bg, color: theme.text }}
      data-poster={id}
    >
      <section className={styles.left}>
        <Monkey
          uid="poster"
          outfit={plan.base}
          mood={plan.mood}
          sky={kind}
          windy={first.windKmh >= WINDY_KMH}
          className={styles.monkey}
        />
      </section>
      <section className={styles.right}>
        <p className={styles.meta}>
          <span className={styles.chip}>{spec.place}</span>
          <span>
            {spec.title} · feels {formatTemp(summary.minFeelsLikeC, "C")} →{" "}
            {formatTemp(summary.maxFeelsLikeC, "C")}
          </span>
        </p>
        <h1 className={styles.headline}>{plan.headline}</h1>
        <p className={styles.line}>&ldquo;{plan.monkeyLine}&rdquo;</p>
        <div className={styles.notes}>
          <ChangeNotes
            plan={plan}
            activeIndex={null}
            onSelect={() => undefined}
            startLabel="Back to morning"
          />
        </div>
        <DayStrip summary={summary} changes={plan.changes} units="C" />
        <p className={styles.brand}>Monkey Weather</p>
      </section>
    </main>
  );
}
