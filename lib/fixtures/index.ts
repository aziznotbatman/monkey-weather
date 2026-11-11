import type { Forecast } from "../weather";

/**
 * Seven reproducible weather scenarios shaped exactly like Open-Meteo responses.
 * Used by unit tests, the /design sheet and the Playwright screenshots.
 * "Today" is FIXTURE_DATE in Europe/Rome (UTC+1); FIXTURE_NOW is 06:30 local.
 */
export const FIXTURE_DATE = "2026-11-12";
export const FIXTURE_TOMORROW = "2026-11-13";
export const FIXTURE_UTC_OFFSET = 3600;
export const FIXTURE_NOW_MS = Date.parse("2026-11-12T05:30:00Z");

type Keys = Array<[hour: number, value: number]>;

/** Piecewise-linear curve through keyframes. */
function curve(keys: Keys): (h: number) => number {
  return (h) => {
    if (h <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [h1, v1] = keys[i];
      const [h0, v0] = keys[i - 1];
      if (h <= h1) return v0 + ((v1 - v0) * (h - h0)) / (h1 - h0);
    }
    return keys[keys.length - 1][1];
  };
}

export interface ScenarioSpec {
  id: string;
  title: string;
  place: string;
  feels: Keys;
  /** Air temperature offset from feels-like (wind chill / humidity). */
  airOffset?: number;
  rainProb: Keys;
  rainMm: Keys;
  wind: Keys;
  uv: Keys;
  code: (h: number) => number;
}

const flat = (v: number): Keys => [[0, v]];
const dayUv = (peak: number): Keys => [
  [6, 0],
  [8, peak * 0.2],
  [12, peak],
  [14, peak * 0.9],
  [17, peak * 0.2],
  [19, 0],
];

export const SCENARIOS: ScenarioSpec[] = [
  {
    id: "freezing-snow",
    title: "Freezing, snowy",
    place: "Lugano",
    feels: [
      [0, -5],
      [7, -4],
      [13, -2],
      [17, -3],
      [23, -5],
    ],
    airOffset: 4,
    rainProb: flat(75),
    rainMm: flat(0.6),
    wind: flat(25),
    uv: dayUv(1),
    code: () => 73,
  },
  {
    id: "cold-dry",
    title: "Cold, dry and sunny",
    place: "Milan",
    feels: [
      [0, 3],
      [7, 4],
      [13, 8],
      [17, 6],
      [23, 3],
    ],
    airOffset: 1,
    rainProb: flat(5),
    rainMm: flat(0),
    wind: flat(8),
    uv: dayUv(2),
    code: () => 0,
  },
  {
    id: "cool-rain",
    title: "Cool, rain from midday",
    place: "Zurich",
    feels: [
      [0, 10],
      [7, 10],
      [13, 12],
      [17, 11],
      [23, 9],
    ],
    airOffset: 1,
    rainProb: [
      [0, 10],
      [10, 20],
      [11, 80],
      [23, 85],
    ],
    rainMm: [
      [0, 0],
      [10, 0],
      [11, 1.2],
      [23, 1],
    ],
    wind: flat(15),
    uv: dayUv(1),
    code: (h) => (h >= 11 ? 63 : 3),
  },
  {
    id: "mild-clear",
    title: "Mild and clear",
    place: "Rome",
    feels: [
      [0, 15],
      [7, 16],
      [13, 19],
      [17, 18],
      [23, 16],
    ],
    airOffset: 0,
    rainProb: flat(5),
    rainMm: flat(0),
    wind: flat(10),
    uv: dayUv(4),
    code: (h) => (h < 12 ? 1 : 0),
  },
  {
    id: "warm-uv",
    title: "Warm, high UV",
    place: "Naples",
    feels: [
      [0, 19],
      [7, 19],
      [11, 25],
      [13, 26],
      [17, 25],
      [21, 22],
      [23, 21],
    ],
    airOffset: 0,
    rainProb: flat(5),
    rainMm: flat(0),
    wind: flat(10),
    uv: dayUv(8),
    code: () => 0,
  },
  {
    id: "hot",
    title: "Hot",
    place: "Palermo",
    feels: [
      [0, 27],
      [7, 29],
      [13, 34],
      [17, 33],
      [23, 28],
    ],
    airOffset: -2,
    rainProb: flat(0),
    rainMm: flat(0),
    wind: flat(8),
    uv: dayUv(9),
    code: () => 0,
  },
  {
    id: "big-swing",
    title: "Big swing day",
    place: "Turin",
    feels: [
      [0, 3],
      [7, 4],
      [9, 7],
      [11, 12],
      [13, 17],
      [15, 18],
      [17, 15],
      [19, 12],
      [23, 9],
    ],
    airOffset: 1,
    rainProb: [
      [0, 5],
      [15, 20],
      [16, 35],
      [17, 85],
      [23, 80],
    ],
    rainMm: [
      [0, 0],
      [16, 0],
      [17, 1.6],
      [23, 1],
    ],
    wind: [
      [0, 8],
      [15, 12],
      [17, 22],
      [23, 18],
    ],
    uv: dayUv(3),
    code: (h) => (h >= 17 ? 63 : h >= 13 ? 2 : 1),
  },
];

const pad = (n: number) => String(n).padStart(2, "0");
const r1 = (n: number) => Math.round(n * 10) / 10;

function nextDay(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Build an Open-Meteo-shaped forecast (two identical days) from a scenario. */
export function scenarioForecast(spec: ScenarioSpec, today: string = FIXTURE_DATE): Forecast {
  const tomorrow = nextDay(today);
  const feels = curve(spec.feels);
  const prob = curve(spec.rainProb);
  const mm = curve(spec.rainMm);
  const wind = curve(spec.wind);
  const uv = curve(spec.uv);
  const time: string[] = [];
  const out = {
    temperature_2m: [] as number[],
    apparent_temperature: [] as number[],
    precipitation_probability: [] as number[],
    precipitation: [] as number[],
    weather_code: [] as number[],
    wind_speed_10m: [] as number[],
    uv_index: [] as number[],
    is_day: [] as number[],
  };
  for (const date of [today, tomorrow]) {
    for (let h = 0; h < 24; h++) {
      time.push(`${date}T${pad(h)}:00`);
      out.apparent_temperature.push(r1(feels(h)));
      out.temperature_2m.push(r1(feels(h) + (spec.airOffset ?? 0)));
      out.precipitation_probability.push(Math.round(prob(h)));
      out.precipitation.push(r1(mm(h)));
      out.weather_code.push(spec.code(h));
      out.wind_speed_10m.push(Math.round(wind(h)));
      out.uv_index.push(r1(uv(h)));
      out.is_day.push(h >= 7 && h < 17 ? 1 : 0);
    }
  }
  return {
    utc_offset_seconds: FIXTURE_UTC_OFFSET,
    timezone: "Europe/Rome",
    hourly: { time, ...out },
    daily: {
      time: [today, tomorrow],
      sunrise: [`${today}T06:58`, `${tomorrow}T06:59`],
      sunset: [`${today}T16:52`, `${tomorrow}T16:51`],
      uv_index_max: [Math.max(...out.uv_index.slice(0, 24)), Math.max(...out.uv_index.slice(24))],
    },
  };
}

export function scenarioById(id: string): ScenarioSpec | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

/** Demo mode (?demo=big-swing): the scenario re-dated to the visitor's today, viewed at 06:30. */
export function demoForecast(
  id: string,
  nowMs: number = Date.now(),
): { forecast: Forecast; nowMs: number; place: string } | null {
  const spec = scenarioById(id);
  if (!spec) return null;
  const today = new Date(nowMs + FIXTURE_UTC_OFFSET * 1000).toISOString().slice(0, 10);
  return {
    forecast: scenarioForecast(spec, today),
    nowMs: Date.parse(`${today}T05:30:00Z`),
    place: spec.place,
  };
}
