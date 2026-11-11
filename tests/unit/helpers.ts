import { FIXTURE_NOW_MS, scenarioById, scenarioForecast } from "@/lib/fixtures";
import { DEFAULT_PROFILE, type DaySummary, type HourPoint, type Profile } from "@/lib/schema";
import { buildDaySummary } from "@/lib/weather";

export function summaryFor(id: string, choice: "today" | "tomorrow" = "today"): DaySummary {
  const spec = scenarioById(id);
  if (!spec) throw new Error(`unknown scenario ${id}`);
  const s = buildDaySummary(scenarioForecast(spec), {
    choice,
    placeLabel: spec.place,
    nowMs: FIXTURE_NOW_MS,
  });
  if (!s) throw new Error("no summary");
  return s;
}

export const profile = (p: Partial<Profile> = {}): Profile => ({ ...DEFAULT_PROFILE, ...p });

/** One 2-hour forecast step with calm, dry, mild defaults. */
export const point = (p: Partial<HourPoint> = {}): HourPoint => ({
  time: "09:00",
  feelsLikeC: 15,
  tempC: 15,
  rainProb: 0,
  rainMm: 0,
  windKmh: 5,
  gustKmh: 10,
  humidity: 50,
  uv: 1,
  weatherCode: 0,
  isDay: true,
  ...p,
});
