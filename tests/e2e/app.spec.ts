import { expect, test } from "@playwright/test";
import { SCENARIOS } from "../../lib/fixtures";
import { mockWeather, savedPlace } from "./mocks";

const shot = (name: string, project: string) => `tests/.output/shots/${project}-${name}.png`;

test.describe("landing", () => {
  test("asks for nothing on load and offers two ways in", async ({ page }, info) => {
    let geoAsked = false;
    await page.exposeFunction("__geoAsked", () => (geoAsked = true));
    await page.addInitScript(() => {
      const orig = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = (...a: Parameters<typeof orig>) => {
        (window as unknown as { __geoAsked: () => void }).__geoAsked();
        return orig(...a);
      };
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "What should I wear today?",
    );
    await expect(page.getByRole("button", { name: "Use my location" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Type a city" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Weather data by Open-Meteo.com" })).toBeVisible();
    expect(geoAsked).toBe(false);
    await page.screenshot({ path: shot("landing", info.project.name), fullPage: true });
  });

  test("city search → outfit card", async ({ page }) => {
    await mockWeather(page, "big-swing");
    await page.goto("/");
    await page.getByRole("button", { name: "Type a city" }).click();
    await page.getByRole("combobox").fill("Tur");
    await page.getByRole("option").first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("umbrella at 17:00");
    await expect(page.getByRole("img", { name: /monkey/i }).first()).toBeVisible();
  });
});

for (const s of SCENARIOS) {
  test(`scenario ${s.id} renders a sensible card`, async ({ page }, info) => {
    await mockWeather(page, s.id);
    await savedPlace(page, s.place);
    await page.goto("/");
    const card = page.locator("article");
    await expect(card.getByRole("heading", { level: 1 })).toBeVisible();
    const label = await card.getByRole("img").first().getAttribute("aria-label");
    expect(label).toMatch(/wearing .*(T-shirt|sweater|hoodie|long-sleeve)/);
    await page.screenshot({ path: shot(`card-${s.id}`, info.project.name), fullPage: true });
  });
}

test("big swing: tapping a note previews the monkey at that time", async ({ page }, info) => {
  await mockWeather(page, "big-swing");
  await savedPlace(page);
  await page.goto("/");
  const monkey = page.locator("article").getByRole("img").first();
  await expect(monkey).toHaveAttribute("aria-label", /puffer jacket/);
  const worn = page.getByRole("region", { name: /Wearing from 07:00/ });
  await expect(worn.getByRole("listitem")).toHaveText([
    "Puffer jacket",
    "Sweater",
    "Trousers",
    "Boots",
    "Beanie",
    "Scarf",
  ]);
  const note = page.getByRole("button", { name: /17:00/ });
  await note.click();
  await expect(note).toHaveAttribute("aria-pressed", "true");
  await expect(monkey).toHaveAttribute("aria-label", /umbrella/);
  await expect(page.getByText(/At 17:00 ·/)).toBeVisible();
  const wornLater = page.getByRole("region", { name: "Wearing at 17:00" });
  await expect(wornLater.getByText("Umbrella")).toBeVisible();
  await expect(wornLater.getByText("Puffer jacket")).toHaveCount(0);
  await page.screenshot({ path: shot("preview-17", info.project.name) });
  await page.getByRole("button", { name: "← Back to morning" }).first().click();
  await expect(monkey).toHaveAttribute("aria-label", /puffer jacket/);
});

test("preferences apply instantly and persist", async ({ page }) => {
  await mockWeather(page, "mild-clear");
  await savedPlace(page);
  await page.goto("/");
  const monkey = page.locator("article").getByRole("img").first();
  await expect(monkey).toHaveAttribute("aria-label", /long-sleeve top/);
  await page.getByRole("button", { name: "Monkey's preferences" }).click();
  await page.getByRole("radio", { name: "Run cold" }).check();
  await expect(monkey).toHaveAttribute("aria-label", /hoodie/);
  await page.getByRole("radio", { name: "°F" }).check();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.locator("article")).toContainText("°");
  const stored = await page.evaluate(() => localStorage.getItem("mw:profile"));
  expect(stored).toContain('"sensitivity":"cold"');
  expect(stored).toContain('"units":"F"');
});

test("today / tomorrow toggle and unit button", async ({ page }) => {
  await mockWeather(page, "cold-dry");
  await savedPlace(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Tomorrow" }).click();
  await expect(page.getByText(/^Tomorrow,/)).toBeVisible();
  await page.getByRole("button", { name: /switch to Fahrenheit/ }).click();
  await expect(page.getByRole("button", { name: /switch to Celsius/ })).toBeVisible();
});

test.describe("edge states", () => {
  test("location denied → friendly message, city search offered", async ({ page }, info) => {
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (_ok, fail) =>
        fail?.({
          code: 1,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: "denied",
        } as GeolocationPositionError);
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Use my location" }).click();
    await expect(page.locator("section[role=alert]")).toContainText("No location, no problem.");
    await expect(page.getByRole("button", { name: "Type a city" })).toBeVisible();
    await page.screenshot({ path: shot("err-denied", info.project.name) });
  });

  test("city not found", async ({ page }, info) => {
    await mockWeather(page, "mild-clear", { geocode: {} });
    await page.goto("/");
    await page.getByRole("button", { name: "Type a city" }).click();
    await page.getByRole("combobox").fill("Atlantisxx");
    await expect(page.getByText(/can.t find/)).toBeVisible();
    await page.screenshot({ path: shot("err-notfound", info.project.name) });
  });

  test("offline", async ({ page }, info) => {
    await savedPlace(page);
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "onLine", { get: () => false }),
    );
    await page.route("https://api.open-meteo.com/**", (r) => r.abort("internetdisconnected"));
    await page.goto("/");
    await expect(page.locator("section[role=alert]")).toContainText("offline");
    await page.screenshot({ path: shot("err-offline", info.project.name) });
  });

  test("forecast failed", async ({ page }) => {
    await savedPlace(page);
    await page.route("https://api.open-meteo.com/**", (r) =>
      r.fulfill({ status: 503, body: "busy" }),
    );
    await page.goto("/");
    await expect(page.locator("section[role=alert]")).toContainText(
      "weather service didn't answer",
    );
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});

test("demo mode shows the hero day without any location", async ({ page }) => {
  await page.goto("/?demo=big-swing");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("umbrella at 17:00");
});

test("the outfit is worked out in the browser: no requests to our server", async ({ page }) => {
  const ownApi: string[] = [];
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api/")) ownApi.push(r.url());
  });
  await mockWeather(page, "big-swing");
  await savedPlace(page);
  await page.goto("/");
  await expect(page.locator("article").getByRole("heading", { level: 1 })).toBeVisible();
  expect(ownApi).toEqual([]);
});
