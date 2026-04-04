import { chromium } from 'playwright';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { readFileSync } from 'fs';

const BASE_URL = 'https://andrekurait.github.io/opensearch-migrations-eks';
const SCREENSHOT_DIR = '/tmp/screenshots';

// Pages to capture
const pages = [
  { name: 'landing', path: '/', desc: 'Landing/splash page' },
  { name: 'landing-dark-scroll', path: '/', desc: 'Landing page scrolled down (dark mode)', scroll: true },
  { name: 'overview', path: '/overview/', desc: 'Overview docs page' },
  { name: 'what-is-migration', path: '/overview/what-is-a-migration/', desc: 'What Is a Migration page' },
  { name: 'deploying-eks', path: '/deployment/deploying-to-eks/', desc: 'Deploying to EKS page' },
  { name: 'migration-paths', path: '/overview/migration-paths/', desc: 'Migration Paths page' },
];

async function takeScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });

  const files = [];

  for (const page of pages) {
    const p = await context.newPage();
    await p.goto(`${BASE_URL}${page.path}`, { waitUntil: 'networkidle' });

    if (page.scroll) {
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await p.waitForTimeout(500);
    }

    const filepath = `${SCREENSHOT_DIR}/${page.name}.png`;
    await p.screenshot({ path: filepath, fullPage: !page.scroll });
    files.push({ ...page, filepath });
    console.log(`📸 ${page.name}: ${filepath}`);
    await p.close();
  }

  // Light mode version of landing
  const lightCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const lp = await lightCtx.newPage();
  await lp.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const lightPath = `${SCREENSHOT_DIR}/landing-light.png`;
  await lp.screenshot({ path: lightPath, fullPage: true });
  files.push({ name: 'landing-light', path: '/', desc: 'Landing page (light mode)', filepath: lightPath });
  console.log(`📸 landing-light: ${lightPath}`);

  // Mobile version
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    isMobile: true,
  });
  const mp = await mobileCtx.newPage();
  await mp.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const mobilePath = `${SCREENSHOT_DIR}/landing-mobile.png`;
  await mp.screenshot({ path: mobilePath, fullPage: true });
  files.push({ name: 'landing-mobile', path: '/', desc: 'Landing page (mobile, dark mode)', filepath: mobilePath });
  console.log(`📸 landing-mobile: ${mobilePath}`);

  await browser.close();
  return files;
}

async function analyzeWithBedrock(screenshots) {
  const client = new BedrockRuntimeClient({ region: 'us-west-2' });

  // Build image content blocks
  const imageBlocks = screenshots.map(s => [
    { type: 'text', text: `--- Screenshot: ${s.desc} (${s.name}) ---` },
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: readFileSync(s.filepath).toString('base64'),
      },
    },
  ]).flat();

  const prompt = `You are a senior UX designer and technical documentation expert reviewing a documentation website for "OpenSearch Migration Assistant — EKS Release".

I'm showing you screenshots of the live site in different states (dark mode, light mode, mobile, various pages).

Please analyze these screenshots and provide:

1. **Visual Design Assessment** — How does the site look? Color scheme, typography, spacing, visual hierarchy. Rate it 1-10.

2. **Content & Marketing Pitch Assessment** — Is the value proposition clear? Does the landing page effectively communicate why someone should use this tool? What's working and what's missing?

3. **UX & Navigation Assessment** — Is the information architecture intuitive? Can users find what they need? How's the mobile experience?

4. **Specific Improvements** — List the top 5-10 concrete, actionable improvements ranked by impact. Be specific (e.g., "Add a hero image showing the architecture diagram" not "improve visuals").

5. **Competitive Comparison** — How does this compare to other developer documentation sites (e.g., Kubernetes docs, Terraform docs, AWS docs)? What are they doing that this site should adopt?

Be direct and critical. I want honest feedback, not praise.`;

  const response = await client.send(new InvokeModelCommand({
    modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [...imageBlocks, { type: 'text', text: prompt }],
      }],
    }),
  }));

  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text;
}

// Main
import { mkdirSync } from 'fs';
mkdirSync(SCREENSHOT_DIR, { recursive: true });

console.log('🔍 Taking screenshots...\n');
const screenshots = await takeScreenshots();
console.log(`\n✅ ${screenshots.length} screenshots captured\n`);

console.log('🤖 Sending to Bedrock Claude for analysis...\n');
const analysis = await analyzeWithBedrock(screenshots);

console.log('='.repeat(80));
console.log('CLAUDE VISION ANALYSIS');
console.log('='.repeat(80));
console.log(analysis);

// Save analysis
import { writeFileSync } from 'fs';
writeFileSync('/tmp/screenshots/analysis.md', analysis);
console.log('\n📄 Analysis saved to /tmp/screenshots/analysis.md');
