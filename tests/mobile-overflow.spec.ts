import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const pages = [
  '',
  'overview/',
  'overview/architecture/',
  'overview/what-is-a-migration/',
  'overview/migration-paths/',
  'deployment/deploying-to-eks/',
  'deployment/deploying-to-kubernetes/',
  'deployment/configuration-options/',
  'deployment/iam-and-security/',
  'migration-guide/assessment/',
  'migration-guide/create-snapshot/',
  'migration-guide/migrate-metadata/',
  'migration-guide/backfill/',
  'migration-guide/capture-and-replay/',
  'migration-guide/traffic-routing/',
  'migration-guide/teardown/',
  'workflow-cli/overview/',
  'workflow-cli/getting-started/',
  'workflow-cli/command-reference/',
  'reference/key-components/',
];

for (const path of pages) {
  test(`no horizontal overflow on /${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (overflow) {
      const offender = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        let worst = { tag: 'none', width: vw, text: '' };
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > worst.width) {
            worst = {
              tag: `${el.tagName}.${el.className}`.slice(0, 80),
              width: Math.round(rect.width),
              text: (el.textContent || '').slice(0, 60),
            };
          }
        });
        return worst;
      });
      expect(overflow, `Overflow caused by <${offender.tag}> (${offender.width}px > viewport): "${offender.text}"`).toBe(false);
    }
  });
}
