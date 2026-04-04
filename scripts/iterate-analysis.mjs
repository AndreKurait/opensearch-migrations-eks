import { chromium } from 'playwright';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';

const BASE_URL = 'https://andrekurait.github.io/opensearch-migrations-eks';
const MODEL_ID = 'us.anthropic.claude-opus-4-6-v1';
const FALLBACK_MODEL = 'us.anthropic.claude-sonnet-4-20250514-v1:0';
const client = new BedrockRuntimeClient({ region: 'us-west-2' });

async function takeScreenshots(round) {
  const dir = `/tmp/screenshots/round-${round}`;
  mkdirSync(dir, { recursive: true });

  const browser = await chromium.launch();
  const files = [];

  // Dark desktop - landing full page
  const darkCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  const dp = await darkCtx.newPage();
  await dp.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await dp.screenshot({ path: `${dir}/landing-dark.png`, fullPage: true });
  files.push({ name: 'landing-dark', filepath: `${dir}/landing-dark.png`, desc: 'Landing page (dark, full)' });

  // Light desktop - landing
  const lightCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  const lp = await lightCtx.newPage();
  await lp.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await lp.screenshot({ path: `${dir}/landing-light.png`, fullPage: true });
  files.push({ name: 'landing-light', filepath: `${dir}/landing-light.png`, desc: 'Landing page (light, full)' });

  // Mobile
  const mobCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true });
  const mp = await mobCtx.newPage();
  await mp.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await mp.screenshot({ path: `${dir}/landing-mobile.png`, fullPage: true });
  files.push({ name: 'landing-mobile', filepath: `${dir}/landing-mobile.png`, desc: 'Landing page (mobile dark)' });

  // A docs page
  const docsPage = await darkCtx.newPage();
  await docsPage.goto(`${BASE_URL}/overview/what-is-a-migration/`, { waitUntil: 'networkidle' });
  await docsPage.screenshot({ path: `${dir}/docs-page.png`, fullPage: true });
  files.push({ name: 'docs-page', filepath: `${dir}/docs-page.png`, desc: 'What Is a Migration docs page (dark)' });

  await browser.close();
  return { files, dir };
}

async function analyzeWithClaude(screenshots, round, previousChanges, modelId) {
  const imageBlocks = screenshots.map(s => [
    { type: 'text', text: `--- ${s.desc} ---` },
    { type: 'image', source: { type: 'base64', media_type: 'image/png', data: readFileSync(s.filepath).toString('base64') } },
  ]).flat();

  const prompt = `You are a senior UX designer and developer reviewing iteration ${round}/5 of a documentation website for "OpenSearch Migration Assistant".

${previousChanges ? `CHANGES ALREADY MADE IN PREVIOUS ROUNDS:\n${previousChanges}\n\nDo NOT repeat suggestions that have already been implemented. Focus on NEW improvements only.` : ''}

Look at these screenshots and give me EXACTLY 3 concrete, implementable changes. For each:
1. What file to change (e.g., src/content/docs/index.mdx, src/styles/custom.css)
2. What specifically to change (be precise — exact text, CSS properties, component changes)
3. Why it matters (one sentence)

Focus on the HIGHEST IMPACT changes that haven't been done yet. Be specific enough that a developer can implement each change in under 2 minutes.

Format as:
### Change 1: [title]
**File:** ...
**What:** ...
**Why:** ...`;

  try {
    const response = await client.send(new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2048,
        messages: [{ role: 'user', content: [...imageBlocks, { type: 'text', text: prompt }] }],
      }),
    }));
    const result = JSON.parse(new TextDecoder().decode(response.body));
    return { text: result.content[0].text, model: modelId };
  } catch (e) {
    if (modelId !== FALLBACK_MODEL) {
      console.log(`⚠️  Opus failed (${e.message}), falling back to Sonnet...`);
      return analyzeWithClaude(screenshots, round, previousChanges, FALLBACK_MODEL);
    }
    throw e;
  }
}

// Main
const allChanges = [];

for (let round = 1; round <= 5; round++) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`ROUND ${round}/5`);
  console.log('='.repeat(60));

  console.log('📸 Taking screenshots...');
  const { files, dir } = await takeScreenshots(round);

  console.log(`🤖 Analyzing with Claude...`);
  const previousChanges = allChanges.length > 0 ? allChanges.join('\n\n') : '';
  const { text: analysis, model } = await analyzeWithClaude(files, round, previousChanges, MODEL_ID);

  console.log(`✅ Analysis from ${model}:`);
  console.log(analysis);

  writeFileSync(`${dir}/analysis.md`, analysis);
  allChanges.push(`Round ${round}: ${analysis}`);

  // Output for the caller to implement
  writeFileSync(`/tmp/screenshots/round-${round}-analysis.md`, analysis);
  console.log(`\n📄 Saved to /tmp/screenshots/round-${round}-analysis.md`);
  console.log(`\n⏳ Implement changes, then the next round will screenshot the updated site.`);

  // Signal that this round's analysis is ready
  writeFileSync(`/tmp/screenshots/current-round.txt`, String(round));

  if (round < 5) {
    // Wait marker for implementation
    writeFileSync(`/tmp/screenshots/round-${round}-ready.txt`, 'ready');
  }
}

console.log('\n' + '='.repeat(60));
console.log('ALL 5 ROUNDS COMPLETE');
console.log('='.repeat(60));
