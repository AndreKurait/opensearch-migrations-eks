import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  webServer: {
    command: 'npm run build && npx astro preview --port 4321',
    port: 4321,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:4321/opensearch-migrations-eks/',
  },
});
