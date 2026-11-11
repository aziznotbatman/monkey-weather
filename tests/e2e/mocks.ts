import type { Page } from "@playwright/test";
import { FIXTURE_NOW_MS, scenarioById, scenarioForecast } from "../../lib/fixtures";

export const GEO_RESULTS = {
  results: [
    { name: "Turin", latitude: 45.07, longitude: 7.69, country: "Italy", admin1: "Piedmont" },
    {
      name: "Turin",
      latitude: 36.84,
      longitude: -76.23,
      country: "United States",
      admin1: "Virginia",
    },
  ],
};

/** Freeze the clock at 06:30 Rome time on the fixture day and serve a scenario as the forecast. */
export async function mockWeather(
  page: Page,
  scenarioId: string,
  opts: { geocode?: unknown } = {},
) {
  const spec = scenarioById(scenarioId);
  if (!spec) throw new Error(`unknown scenario ${scenarioId}`);
  await page.clock.setFixedTime(new Date(FIXTURE_NOW_MS));
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({ json: scenarioForecast(spec) }),
  );
  await page.route("https://geocoding-api.open-meteo.com/**", (route) =>
    route.fulfill({
      json: opts.geocode ?? { results: [{ ...GEO_RESULTS.results[0], name: spec.place }] },
    }),
  );
}

/** Start as a returning visitor with a saved place (skips the landing). */
export async function savedPlace(page: Page, label = "Turin") {
  // "x" means: use the scenario's own place name (set by mockWeather's geocode).
  await page.addInitScript((l) => {
    window.localStorage.setItem(
      "mw:place",
      JSON.stringify({ label: l, latitude: 45.07, longitude: 7.69 }),
    );
    window.localStorage.setItem(
      "mw:profile",
      JSON.stringify({ sensitivity: "normal", getAround: "walking", style: "casual", units: "C" }),
    );
  }, label);
}

/** Grant geolocation at the given point and answer the town-name lookup. */
export async function mockLocation(
  page: Page,
  answer: { status?: number; json?: unknown } = { json: { city: "Turin", locality: "Turin" } },
) {
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({ latitude: 45.0703, longitude: 7.6869 });
  await page.route("https://api.bigdatacloud.net/**", (route) =>
    answer.status
      ? route.fulfill({ status: answer.status, body: "" })
      : route.fulfill({ json: answer.json }),
  );
}
