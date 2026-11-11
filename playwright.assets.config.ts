import { defineConfig } from "@playwright/test";

const PORT = 3210;

/** `npm run assets`: portfolio images into docs/assets/. */
export default defineConfig({
  testDir: "tests/assets",
  outputDir: "tests/.output",
  reporter: [["list"]],
  timeout: 120_000,
  use: { reducedMotion: "reduce", baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
