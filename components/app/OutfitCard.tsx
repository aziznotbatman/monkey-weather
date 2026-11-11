"use client";

import { useMemo, useRef, useState } from "react";
import { Monkey } from "@/components/monkey/Monkey";
import { PinIcon, SlidersIcon } from "@/components/ui/Icons";
import { changedSlots, outfitAt } from "@/lib/outfitState";
import { moodFor } from "@/lib/ruleEngine";
import type { DaySummary, Outfit, Profile } from "@/lib/schema";
import { isWindy } from "@/lib/conditions";
import { skyFor, WINDY_KMH } from "@/lib/theme";
import type { SkyKind } from "@/lib/tokens";
import { formatTemp } from "@/lib/units";
import type { DayChoice } from "@/lib/weather";
import { ChangeNotes } from "./ChangeNotes";
import { DayStrip } from "./DayStrip";
import { WornList } from "./WornList";
import styles from "./app.module.css";

interface OutfitCardProps {
  summary: DaySummary;
  outfit: Outfit;
  profile: Profile;
  day: DayChoice;
  placeName: string;
  onDay: (d: DayChoice) => void;
  onUnits: (u: Profile["units"]) => void;
  onChangePlace: () => void;
  onOpenPrefs: () => void;
  onSky: (s: SkyKind) => void;
}

function dayTitle(day: DayChoice, dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00Z`);
  const date = d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return `${day === "today" ? "Today" : "Tomorrow"}, ${date}`;
}

/** "4° → 18°": the start of the window and the feels-like furthest from it. */
function feelsRange(summary: DaySummary): { from: number; to: number } {
  const from = summary.hours[0].feelsLikeC;
  const to = summary.hours.reduce(
    (far, h) => (Math.abs(h.feelsLikeC - from) > Math.abs(far - from) ? h.feelsLikeC : far),
    from,
  );
  return { from, to };
}

export function OutfitCard(props: OutfitCardProps) {
  const { summary, outfit, profile, day } = props;
  const [active, setActive] = useState<number | null>(null);
  const [popKey, setPopKey] = useState(0);
  const [prevShown, setPrevShown] = useState(outfit.base);
  const stageRef = useRef<HTMLDivElement>(null);

  const activeChange = active !== null ? outfit.changes[active] : null;
  const time = activeChange?.time ?? summary.hours[0].time;
  const point = summary.hours.find((h) => h.time === time) ?? summary.hours[0];
  const shown = useMemo(
    () => (activeChange ? outfitAt(outfit.base, outfit.changes, activeChange.time) : outfit.base),
    [activeChange, outfit],
  );
  const mood = activeChange ? moodFor(point, profile) : outfit.mood;
  const sky = skyFor(point);
  const popSlots = changedSlots(prevShown, shown);

  const select = (i: number | null) => {
    setPrevShown(shown);
    setActive(i);
    setPopKey((k) => k + 1);
    const next =
      i === null
        ? summary.hours[0]
        : (summary.hours.find((h) => h.time === outfit.changes[i].time) ?? summary.hours[0]);
    props.onSky(skyFor(next));
    // On phones the notes sit below the monkey: bring the monkey into view for the preview.
    const stage = stageRef.current;
    if (i !== null && stage && stage.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      stage.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };

  const startHour = Number(summary.hours[0].time.slice(0, 2));
  const startLabel = startHour < 12 ? "Back to morning" : `Back to ${summary.hours[0].time}`;
  const u = profile.units;
  const range = feelsRange(summary);

  return (
    <article className={styles.card}>
      <div className={styles.topRow}>
        <button
          type="button"
          className={styles.chip}
          onClick={props.onChangePlace}
          aria-label={`${props.placeName}, change location`}
        >
          <PinIcon size={20} />
          <span className={styles.chipText}>{props.placeName}</span>
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={props.onOpenPrefs}
          aria-label="Monkey's preferences"
        >
          <SlidersIcon />
        </button>
      </div>

      <div className={styles.secondRow}>
        <div className={styles.segmented} role="group" aria-label="Which day">
          {(["today", "tomorrow"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={day === d}
              onClick={() => day !== d && props.onDay(d)}
            >
              {d === "today" ? "Today" : "Tomorrow"}
            </button>
          ))}
        </div>
        <p className={styles.range}>
          <span className="visually-hidden">Feels like </span>
          {formatTemp(range.from, u)} <span aria-hidden="true">→</span>
          <span className="visually-hidden"> to </span> {formatTemp(range.to, u)}
        </p>
        <button
          type="button"
          className={styles.unitBtn}
          onClick={() => props.onUnits(u === "C" ? "F" : "C")}
          aria-label={u === "C" ? "°C, switch to Fahrenheit" : "°F, switch to Celsius"}
        >
          °{u}
        </button>
      </div>

      <p className={styles.dayTitle}>{dayTitle(day, summary.dateISO)}</p>

      <div className={styles.stage} ref={stageRef}>
        {activeChange && (
          <button type="button" className={styles.stageBack} onClick={() => select(null)}>
            ← {startLabel}
          </button>
        )}
        <span className={styles.timeTag} aria-live="polite">
          {activeChange ? `At ${activeChange.time}` : `From ${summary.hours[0].time}`} · feels{" "}
          {formatTemp(point.feelsLikeC, u)}
        </span>
        <Monkey
          uid="card"
          outfit={shown}
          mood={mood}
          sky={sky}
          windy={point.windKmh >= WINDY_KMH || isWindy(point)}
          popSlots={active === null && popKey === 0 ? [] : popSlots}
          popKey={popKey}
          className={`${styles.monkey} mw-animated`}
        />
      </div>

      <h1 className={styles.headline}>{outfit.headline}</h1>
      <p className={styles.monkeyLine}>&ldquo;{outfit.monkeyLine}&rdquo;</p>

      <ChangeNotes plan={outfit} activeIndex={active} onSelect={select} startLabel={startLabel} />
      <WornList
        outfit={shown}
        changedSlots={popSlots}
        popKey={popKey}
        time={time}
        isPreview={activeChange !== null}
      />
      <DayStrip
        summary={summary}
        changes={outfit.changes}
        units={u}
        activeTime={activeChange?.time ?? null}
      />
    </article>
  );
}
