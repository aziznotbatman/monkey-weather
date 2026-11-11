import { z } from "zod";
import type { DaySummary, HourPoint } from "./schema";
import { roundHalf } from "./units";

/**
 * Open-Meteo is called from the visitor's browser (each visitor's own IP),
 * never from our server. Data: Open-Meteo.com, CC BY 4.0.
 */
export const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
export const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export const WINDOW_START_HOUR = 7;
export const WINDOW_END_HOUR = 23;
export const STEP_HOURS = 2;
export const LATE_EVENING_HOUR = 20;
export const MIN_HOURS_LEFT = 3;

export type DayChoice = "today" | "tomorrow";

export interface Place {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

const num = z.number().nullable();

export const ForecastSchema = z.object({
  utc_offset_seconds: z.number(),
  timezone: z.string().optional(),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(num),
    apparent_temperature: z.array(num),
    precipitation_probability: z.array(num),
    precipitation: z.array(num),
    weather_code: z.array(num),
    wind_speed_10m: z.array(num),
    // Optional so a partial response still works: gusts fall back to wind, humidity to 50 %.
    wind_gusts_10m: z.array(num).optional(),
    relative_humidity_2m: z.array(num).optional(),
    uv_index: z.array(num),
    is_day: z.array(num),
  }),
  daily: z.object({
    time: z.array(z.string()),
    sunrise: z.array(z.string().nullable()),
    sunset: z.array(z.string().nullable()),
    uv_index_max: z.array(num).optional(),
  }),
});
export type Forecast = z.infer<typeof ForecastSchema>;

const GeocodeSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string().optional(),
        admin1: z.string().optional(),
      }),
    )
    .optional(),
});

export function forecastUrl(lat: number, lon: number): string {
  const p = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lon.toFixed(3),
    hourly:
      "temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,uv_index,is_day",
    daily: "sunrise,sunset,uv_index_max",
    timezone: "auto",
    forecast_days: "2",
  });
  return `${FORECAST_URL}?${p.toString()}`;
}

export class WeatherError extends Error {
  constructor(
    public readonly kind: "offline" | "failed" | "not_found",
    message: string,
  ) {
    super(message);
  }
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    throw new WeatherError(offline ? "offline" : "failed", "Network request failed");
  }
  if (!res.ok) throw new WeatherError("failed", `Weather service answered ${res.status}`);
  return res.json();
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim().slice(0, 60);
  if (q.length < 2) return [];
  const p = new URLSearchParams({ name: q, count: "5", language: "en", format: "json" });
  const data = GeocodeSchema.safeParse(await getJson(`${GEOCODE_URL}?${p.toString()}`, signal));
  if (!data.success) throw new WeatherError("failed", "Unexpected geocoding response");
  return data.data.results ?? [];
}

export async function fetchForecast(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<Forecast> {
  const parsed = ForecastSchema.safeParse(await getJson(forecastUrl(lat, lon), signal));
  if (!parsed.success) throw new WeatherError("failed", "Unexpected forecast response");
  return parsed.data;
}

/** The location's local wall-clock time, from Open-Meteo's UTC offset. */
export function localNow(
  utcOffsetSeconds: number,
  nowMs: number = Date.now(),
): { dateISO: string; hour: number } {
  const d = new Date(nowMs + utcOffsetSeconds * 1000);
  return { dateISO: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
}

export function addDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Default to Tomorrow after 20:00, or when fewer than 3 hours of the window remain. */
export function defaultDay(hour: number): DayChoice {
  if (hour >= LATE_EVENING_HOUR) return "tomorrow";
  const start = Math.max(WINDOW_START_HOUR, hour);
  return WINDOW_END_HOUR - start < MIN_HOURS_LEFT ? "tomorrow" : "today";
}

export function windowStart(choice: DayChoice, hour: number): number {
  return choice === "today" ? Math.max(WINDOW_START_HOUR, hour) : WINDOW_START_HOUR;
}

const pad = (n: number) => String(n).padStart(2, "0");
const clean = (v: number | null | undefined, fallback = 0) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const round1 = (n: number) => Math.round(n * 10) / 10;

export interface BuildOptions {
  choice: DayChoice;
  placeLabel: string;
  nowMs?: number;
}

/**
 * Compress the hourly forecast into ~9 two-hour points for the chosen day.
 * Each point aggregates its 2-hour window: mean feels-like, max rain chance,
 * summed rain, max wind, gusts and UV, mean humidity, most severe weather code.
 */
export function buildDaySummary(fc: Forecast, opts: BuildOptions): DaySummary | null {
  const now = localNow(fc.utc_offset_seconds, opts.nowMs);
  let choice = opts.choice;
  if (choice === "today" && defaultDay(now.hour) === "tomorrow") choice = "tomorrow";
  const dateISO = choice === "today" ? now.dateISO : addDays(now.dateISO, 1);
  const start = windowStart(choice, now.hour);

  const idx = new Map<string, number>();
  fc.hourly.time.forEach((t, i) => idx.set(t, i));
  const at = (h: number) => idx.get(`${dateISO}T${pad(h)}:00`);

  const hourIdx: number[] = [];
  for (let h = start; h <= WINDOW_END_HOUR; h++) {
    const i = at(h);
    if (i !== undefined) hourIdx.push(i);
  }
  if (hourIdx.length < 2) return null;

  const H = fc.hourly;
  const points: HourPoint[] = [];
  for (let h = start; h <= WINDOW_END_HOUR; h += STEP_HOURS) {
    const ids = [at(h), h + 1 <= WINDOW_END_HOUR ? at(h + 1) : undefined].filter(
      (v): v is number => v !== undefined,
    );
    if (ids.length === 0) continue;
    const first = ids[0];
    points.push({
      time: `${pad(h)}:00`,
      feelsLikeC: roundHalf(
        avg(ids.map((i) => clean(H.apparent_temperature[i], clean(H.temperature_2m[i])))),
      ),
      tempC: roundHalf(avg(ids.map((i) => clean(H.temperature_2m[i])))),
      rainProb: Math.round(Math.max(...ids.map((i) => clean(H.precipitation_probability[i])))),
      rainMm: round1(ids.reduce((a, i) => a + clean(H.precipitation[i]), 0)),
      windKmh: Math.round(Math.max(...ids.map((i) => clean(H.wind_speed_10m[i])))),
      gustKmh: Math.round(
        Math.max(...ids.map((i) => clean(H.wind_gusts_10m?.[i], clean(H.wind_speed_10m[i])))),
      ),
      humidity: Math.round(avg(ids.map((i) => clean(H.relative_humidity_2m?.[i], 50)))),
      uv: round1(Math.max(...ids.map((i) => clean(H.uv_index[i])))),
      weatherCode: Math.round(Math.max(...ids.map((i) => clean(H.weather_code[i])))),
      isDay: clean(H.is_day[first], 1) === 1,
    });
  }

  const dayIdx = fc.daily.time.indexOf(dateISO);
  const hhmm = (s: string | null | undefined, fallback: string) =>
    s && /T\d{2}:\d{2}/.test(s) ? s.slice(11, 16) : fallback;
  const feels = points.map((p) => p.feelsLikeC);

  return {
    dateISO,
    placeLabel: sanitizePlaceLabel(opts.placeLabel),
    sunrise: hhmm(fc.daily.sunrise[dayIdx], "07:00"),
    sunset: hhmm(fc.daily.sunset[dayIdx], "18:00"),
    minFeelsLikeC: Math.min(...feels),
    maxFeelsLikeC: Math.max(...feels),
    maxRainProb: Math.max(...points.map((p) => p.rainProb)),
    totalRainMm: round1(hourIdx.reduce((a, i) => a + clean(H.precipitation[i]), 0)),
    maxWindKmh: Math.max(...points.map((p) => p.windKmh)),
    maxGustKmh: Math.max(...points.map((p) => p.gustKmh)),
    maxUv: Math.max(...points.map((p) => p.uv)),
    hours: points,
  };
}

/** Letters, spaces, hyphens, apostrophes, dots; max 60 chars. Anything else is dropped. */
export function sanitizePlaceLabel(label: string): string {
  const cleaned = label
    .normalize("NFC")
    .replace(/[^\p{L}\p{M} '’.-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return cleaned || "Your location";
}
