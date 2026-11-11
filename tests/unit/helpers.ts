import { FIXTURE_NOW_MS, scenarioById, scenarioForecast } from "@/lib/fixtures";
import { DEFAULT_PROFILE, type DaySummary, type Profile } from "@/lib/schema";
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
