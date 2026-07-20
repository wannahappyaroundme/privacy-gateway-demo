import {defineConfig} from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173/privacy-gateway-demo/';

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  workers: 1,
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: {width: 1440, height: 900},
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview',
    url: baseURL,
    reuseExistingServer: false,
  },
});
