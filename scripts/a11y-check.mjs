import { chromium } from 'playwright';
import { execSync } from 'child_process';

const BASE = 'http://localhost:4321/opensearch-migrations-eks';
const pages = [
  '/', '/overview/', '/overview/what-is-a-migration/',
  '/deployment/deploying-to-eks/', '/migration-guide/assessment/',
  '/migration-guide/backfill/', '/workflow-cli/getting-started/',
  '/reference/troubleshooting/',
];

const browser = await chromium.launch();
let totalIssues = 0;

for (const path of pages) {
  const page = await browser.newPage();
  await page.goto(BASE + path, { waitUntil: 'networkidle' });

  const violations = await page.evaluate(async () => {
    // Inject axe-core
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
    document.head.appendChild(script);
    await new Promise(r => script.onload = r);
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

await browser.close();

if (totalIssues > 0) {
  console.log(`\n⚠️  ${totalIssues} total accessibility issue(s) found`);
  process.exit(1);
} else {
  console.log('\n✅ All pages pass WCAG 2.0 AA');
}
