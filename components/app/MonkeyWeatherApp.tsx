"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { demoForecast } from "@/lib/fixtures";
import { loadPlace, loadProfile, saveProfile, savePlace, type SavedPlace } from "@/lib/client";
import { placeNameFor } from "@/lib/placeName";
import { ruleEngine } from "@/lib/ruleEngine";
import { DEFAULT_PROFILE, type DaySummary, type Outfit, type Profile } from "@/lib/schema";
import { skyFor } from "@/lib/theme";
import { sky as skies, type SkyKind } from "@/lib/tokens";
import {
  buildDaySummary,
  defaultDay,
  fetchForecast,
  localNow,
  WeatherError,
  type DayChoice,
  type Forecast,
  type Place,
} from "@/lib/weather";
import { CityPicker } from "./CityPicker";
import { OutfitCard } from "./OutfitCard";
import { PrefsSheet } from "./PrefsSheet";
import { ErrorView, Footer, Landing, Loading, type ErrorKind } from "./States";
import styles from "./app.module.css";

type View =
  | { kind: "landing" }
  | { kind: "loading"; place: SavedPlace }
  | {
      kind: "result";
      place: SavedPlace;
      forecast: Forecast;
      day: DayChoice;
      summary: DaySummary;
      outfit: Outfit;
    }
  | { kind: "error"; error: ErrorKind; place?: SavedPlace };

const GEO_TIMEOUT_MS = 10_000;

export function MonkeyWeatherApp({ portfolioUrl }: { portfolioUrl?: string }) {
  const [view, setView] = useState<View>({ kind: "landing" });
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [picker, setPicker] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [locating, setLocating] = useState(false);
  const [skyKind, setSkyKind] = useState<SkyKind>("partly");
  const run = useRef<AbortController | null>(null);
  /** Demo mode pins the clock to 06:30 on the demo day so the whole day is visible. */
  const demoNow = useRef<number | undefined>(undefined);

  const fresh = () => {
    run.current?.abort();
    run.current = new AbortController();
    return run.current.signal;
  };

  /** The rule engine runs right here in the browser: instant, offline-safe, nothing sent anywhere. */
  const showOutfit = useCallback(
    (place: SavedPlace, forecast: Forecast, day: DayChoice, p: Profile) => {
      const summary = buildDaySummary(forecast, {
        choice: day,
        placeLabel: place.label,
        nowMs: demoNow.current,
      });
      if (!summary) {
        setView({ kind: "error", error: "forecast", place });
        return;
      }
      const actualDay: DayChoice =
        summary.dateISO === localNow(forecast.utc_offset_seconds, demoNow.current).dateISO
          ? "today"
          : "tomorrow";
      setSkyKind(skyFor(summary.hours[0]));
      setView({
        kind: "result",
        place,
        forecast,
        day: actualDay,
        summary,
        outfit: ruleEngine(summary, p),
      });
    },
    [],
  );

  const load = useCallback(
    async (place: SavedPlace, p: Profile, day?: DayChoice) => {
      const signal = fresh();
      setView({ kind: "loading", place });
      setPicker(false);
      try {
        const demo = place.demo ? demoForecast(place.demo) : null;
        demoNow.current = demo?.nowMs;
        const forecast = demo
          ? demo.forecast
          : await fetchForecast(place.latitude, place.longitude, signal);
        const choice =
          day ?? defaultDay(localNow(forecast.utc_offset_seconds, demoNow.current).hour);
        if (signal.aborted) return;
        showOutfit(place, forecast, choice, p);
      } catch (err) {
        if (signal.aborted) return;
        const offline =
          (err instanceof WeatherError && err.kind === "offline") ||
          (typeof navigator !== "undefined" && !navigator.onLine);
        setView({ kind: "error", error: offline ? "offline" : "forecast", place });
      }
    },
    [showOutfit],
  );

  // On first visit nothing loads until the visitor taps. Returning visitors get their last city.
  useEffect(() => {
    queueMicrotask(() => init());
    function init() {
      const p = loadProfile();
      setProfile(p);
      const demoId = new URLSearchParams(window.location.search).get("demo");
      const demo = demoId ? demoForecast(demoId) : null;
      if (demoId && demo) {
        void load({ label: demo.place, latitude: 0, longitude: 0, demo: demoId }, p);
        return;
      }
      const last = loadPlace();
      if (last) void load(last, p);
    }
  }, [load]);

  const pickPlace = (pl: Place) => {
    clearDemo();
    const place: SavedPlace = { label: pl.name, latitude: pl.latitude, longitude: pl.longitude };
    savePlace(place);
    void load(place, profile);
  };

  const locate = () => {
    setPicker(false);
    clearDemo();
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setView({ kind: "error", error: "geo_unavailable" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // A town name instead of "Your location" (gives up after 2.5 s, never errors).
        const label = await placeNameFor(latitude, longitude);
        setLocating(false);
        const place: SavedPlace = { label, latitude, longitude, fromGeolocation: true };
        savePlace(place);
        void load(place, profile);
      },
      (err) => {
        setLocating(false);
        setView({
          kind: "error",
          error: err.code === err.PERMISSION_DENIED ? "denied" : "geo_unavailable",
        });
      },
      { timeout: GEO_TIMEOUT_MS, maximumAge: 15 * 60 * 1000, enableHighAccuracy: false },
    );
  };

  const clearDemo = () => {
    demoNow.current = undefined;
    if (window.location.search.includes("demo="))
      window.history.replaceState(null, "", window.location.pathname);
  };

  const updateProfile = (next: Profile) => {
    const onlyUnits =
      next.units !== profile.units &&
      JSON.stringify({ ...next, units: profile.units }) === JSON.stringify(profile);
    setProfile(next);
    saveProfile(next);
    if (onlyUnits || view.kind !== "result") return;
    showOutfit(view.place, view.forecast, view.day, next);
  };

  const changeDay = (d: DayChoice) => {
    if (view.kind !== "result") return;
    showOutfit(view.place, view.forecast, d, profile);
  };

  const theme = skies[view.kind === "result" ? skyKind : "partly"];
  const vars = {
    "--sky-bg": theme.bg,
    "--sky-text": theme.text,
    "--sky-muted": theme.muted,
  } as CSSProperties;

  return (
    <div
      className={styles.shell}
      style={vars}
      data-sky={view.kind === "result" ? skyKind : "partly"}
    >
      <main className={styles.main} id="main">
        {view.kind === "landing" && (
          <Landing onLocate={locate} onSearch={() => setPicker(true)} locating={locating} />
        )}
        {view.kind === "loading" && <Loading placeName={view.place.label} />}
        {view.kind === "error" && (
          <ErrorView
            kind={view.error}
            onSearch={() => setPicker(true)}
            onRetry={
              view.place && view.error !== "denied"
                ? () => view.place && void load(view.place, profile)
                : undefined
            }
          />
        )}
        {view.kind === "result" && (
          <OutfitCard
            key={`${view.summary.dateISO}-${view.place.label}-${JSON.stringify(view.outfit.changes)}`}
            summary={view.summary}
            outfit={view.outfit}
            profile={profile}
            day={view.day}
            placeName={view.place.label}
            onDay={changeDay}
            onUnits={(units) => updateProfile({ ...profile, units })}
            onChangePlace={() => setPicker(true)}
            onOpenPrefs={() => setPrefs(true)}
            onSky={setSkyKind}
          />
        )}
      </main>
      <Footer portfolioUrl={portfolioUrl} />
      <CityPicker
        open={picker}
        onPick={pickPlace}
        onUseLocation={locate}
        onClose={() => setPicker(false)}
      />
      <PrefsSheet
        open={prefs}
        profile={profile}
        onChange={updateProfile}
        onClose={() => setPrefs(false)}
      />
    </div>
  );
}
