import { defineConfig, devices } from "@playwright/test";

const chromiumExecutable =
  process.env.PW_CHROMIUM_EXECUTABLE_PATH ??
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    launchOptions: {
      executablePath: chromiumExecutable
    },
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
