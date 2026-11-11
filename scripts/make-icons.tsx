/**
 * Generates app/icon.svg, app/apple-icon.png and app/opengraph-image.png from the real artwork.
 * Run: npx tsx scripts/make-icons.tsx  (after `npm run assets`, which makes the poster)
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "@playwright/test";
import { Monkey } from "../components/monkey/Monkey";
import { sky } from "../lib/tokens";

const face = renderToStaticMarkup(<Monkey uid="icon" outfit={{}} mood="happy" decorative />)
  .replace(/viewBox="[^"]+"/, 'viewBox="80 40 440 360" xmlns="http://www.w3.org/2000/svg"')
  .replace(/ aria-hidden="true"/, "");

const icon = face.replace(
  /<defs>/,
  `<rect x="80" y="40" width="440" height="360" rx="90" fill="${sky.partly.bg}"/><defs>`,
);
writeFileSync("app/icon.svg", icon);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 180, height: 180 } });
  await page.setContent(
    `<html><body style="margin:0">${icon.replace("<svg", '<svg width="180" height="180"')}</body></html>`,
  );
  await page.screenshot({ path: "app/apple-icon.png" });
  await browser.close();
  // OG image: crop the hero poster (2800×1700) to 1.9:1 and scale to 1200×630.
  execFileSync("sips", [
    "-c",
    "1474",
    "2800",
    "docs/assets/poster-big-swing-2800x1700.png",
    "--out",
    "/tmp/mw-og.png",
  ]);
  execFileSync("sips", ["-z", "630", "1200", "/tmp/mw-og.png", "--out", "app/opengraph-image.png"]);
  console.info("icons written");
})();
