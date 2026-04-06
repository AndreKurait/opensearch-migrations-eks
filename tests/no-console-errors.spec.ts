import { test, expect } from '@playwright/test';

const pages = [
  './',
  './overview/',
  './overview/what-is-a-migration/',
  './overview/architecture/',
  './overview/migration-paths/',
  './deployment/deploying-to-eks/',
  './deployment/deploying-to-kubernetes/',
  './deployment/configuration-options/',
  './deployment/iam-and-security/',
  './migration-guide/assessment/',
  './migration-guide/create-snapshot/',
  './migration-guide/migrate-metadata/',
  './migration-guide/backfill/',
  './migration-guide/capture-and-replay/',
  './migration-guide/traffic-routing/',
  './migration-guide/teardown/',
  './workflow-cli/overview/',
  './workflow-cli/getting-started/',
  './workflow-cli/command-reference/',
  './reference/key-components/',
  './reference/troubleshooting/',
  './reference/security-patching/',
];

for (const path of pages) {
  test(`no console errors on ${path}`, async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        const text = msg.text();
        // Ignore known benign warnings
        if (text.includes('DevTools') || text.includes('third-party cookie')) return;
        errors.push(`[${msg.type()}] ${text}`);
      }
    });

    page.on('pageerror', (err) => {
      errors.push(`[exception] ${err.message}`);
    });

    const response = await page.goto(path, { waitUntil: 'networkidle' });

    expect(response?.status(), `${path} returned ${response?.status()}`).toBeLessThan(400);

    if (errors.length > 0) {
      throw new Error(
        `Console errors on ${path}:\n${errors.map((e) => `  ${e}`).join('\n')}`
      );
    }
  });
}
