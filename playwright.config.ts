import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    launchOptions: {
      executablePath: existsSync(
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      )
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : undefined,
    },
  },
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
  reporter: "list",
});
