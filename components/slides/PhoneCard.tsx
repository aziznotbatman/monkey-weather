"use client";

import type { CSSProperties } from "react";
import { OutfitCard } from "@/components/app/OutfitCard";
import appStyles from "@/components/app/app.module.css";
import { FIXTURE_NOW_MS, scenarioById, scenarioForecast } from "@/lib/fixtures";
import { ruleEngine } from "@/lib/ruleEngine";
import { DEFAULT_PROFILE } from "@/lib/schema";
import { skyFor } from "@/lib/theme";
import { sky } from "@/lib/tokens";
import { buildDaySummary } from "@/lib/weather";
import styles from "./slides.module.css";

const noop = () => {};

/** The real outfit card for a fixture day, inside a phone frame (390 × 844 screen). */
export function PhoneCard({ id, tapped }: { id: string; tapped?: number }) {
  const spec = scenarioById(id);
  const summary = spec
    ? buildDaySummary(scenarioForecast(spec), {
        choice: "today",
        placeLabel: spec.place,
        nowMs: FIXTURE_NOW_MS,
      })
    : null;
  if (!spec || !summary) return null;
  const outfit = ruleEngine(summary, DEFAULT_PROFILE);
  const time = tapped !== undefined ? outfit.changes[tapped]?.time : summary.hours[0].time;
  const point = summary.hours.find((h) => h.time === time) ?? summary.hours[0];
  const theme = sky[skyFor(point)];
  const vars = {
    "--sky-bg": theme.bg,
    "--sky-text": theme.text,
    "--sky-muted": theme.muted,
  } as CSSProperties;
  return (
    <div className={styles.phone}>
      <div className={styles.phoneScreen}>
        <div className={appStyles.shell} style={vars}>
          <main className={appStyles.main}>
            <OutfitCard
              summary={summary}
              outfit={outfit}
              profile={DEFAULT_PROFILE}
              day="today"
              placeName={spec.place}
              onDay={noop}
              onUnits={noop}
              onChangePlace={noop}
              onOpenPrefs={noop}
              onSky={noop}
              initialActive={tapped}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
