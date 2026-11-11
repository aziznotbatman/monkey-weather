import { test } from "@playwright/test";
import { mockWeather, savedPlace } from "../e2e/mocks";

/**
 * Portfolio images → docs/assets/
 *   monkey-sheet.png                 the /design system sheet (1440 wide @2x)
 *   card-<id>-mobile.png             390×844 @2x (as seen on a phone)
 *   card-<id>-mobile-full.png        the whole scrolling card @2x
 *   card-<id>-desktop.png            1280×800 @2x
 *   poster-<id>-2800x1700.png        landscape composite for Figma/Behance
 */
const OUT = "docs/assets";
const SIX = ["freezing-snow", "cool-rain", "mild-clear", "warm-uv", "hot", "big-swing"];

test.use({ deviceScaleFactor: 2 });

test("monkey sheet", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/design");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${OUT}/monkey-sheet.png`, fullPage: true });
});

test("landing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${OUT}/landing-mobile.png` });
});

for (const id of SIX) {
  test(`scenario ${id}`, async ({ page }) => {
    await mockWeather(page, id);
    await savedPlace(page, (await import("../../lib/fixtures")).scenarioById(id)?.place);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.locator("article h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${OUT}/card-${id}-mobile.png` });
    await page.screenshot({ path: `${OUT}/card-${id}-mobile-full.png`, fullPage: true });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({ path: `${OUT}/card-${id}-desktop.png` });

    await page.setViewportSize({ width: 1400, height: 850 });
    await page.goto(`/poster/${id}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${OUT}/poster-${id}-2800x1700.png` });
  });
}

test("hero preview: the 17:00 note tapped", async ({ page }) => {
  await mockWeather(page, "big-swing");
  await savedPlace(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /17:00/ }).click();
  await page.getByText(/At 17:00 ·/).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT}/preview-big-swing-1700-mobile.png` });
});
