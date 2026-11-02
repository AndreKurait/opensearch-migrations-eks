import { chromium } from 'playwright';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const BASE = 'http://127.0.0.1:4321/opensearch-migrations-eks';
const pages = [
  '/', '/overview/', '/overview/what-is-a-migration/',
  '/deployment/deploying-to-eks/', '/migration-guide/assessment/',
  '/migration-guide/backfill/', '/workflow-cli/getting-started/',
  '/reference/troubleshooting/',
];

const browser = await chromium.launch();
let totalIssues = 0;

try {
  for (const path of pages) {
    const page = await browser.newPage();
    const response = await page.goto(BASE + path, { waitUntil: 'networkidle' });
    if (!response?.ok()) {
      throw new Error(`${path} returned HTTP ${response?.status() ?? 'no response'}`);
    }
    await page.addScriptTag({ path: axePath });

    const violations = await page.evaluate(async () => {
      const results = await window.axe.run(document, {
        runOnly: ['wcag2a', 'wcag2aa'],
      });
      return results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      }));
    });

    if (violations.length > 0) {
      console.log(`\n❌ ${path} — ${violations.length} violation(s):`);
      for (const v of violations) {
        console.log(`   [${v.impact}] ${v.id}: ${v.description} (${v.nodes} element(s))`);
        totalIssues += v.nodes;
      }
    } else {
      console.log(`✅ ${path}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}

if (totalIssues > 0) {
  console.log(`\n⚠️  ${totalIssues} total accessibility issue(s) found`);
  process.exit(1);
} else {
  console.log(`\n✅ No automated WCAG 2.0 A/AA violations on ${pages.length} checked pages`);
}
