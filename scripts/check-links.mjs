import { preview } from 'astro';
import { LinkChecker, LinkState } from 'linkinator';

// Astro serves the configured base path; a generic static server does not.
const origin = 'http://127.0.0.1:4322';
const server = await preview({
  server: { host: '127.0.0.1', port: 4322 },
  vite: { preview: { strictPort: true } },
});

try {
  const checker = new LinkChecker();
  const result = await checker.check({
    path: `${origin}/opensearch-migrations-eks/`,
    recurse: true,
    timeout: 10_000,
    // This is an offline site check. Check every local URL, skip external sites.
    linksToSkip: async (url) => new URL(url).origin !== origin,
  });
  const checked = result.links.filter((link) => link.state !== LinkState.SKIPPED);
  for (const link of checked.filter((link) => link.state === LinkState.BROKEN)) {
    console.error(`${link.status ?? 'ERROR'} ${link.url} (from ${link.parent ?? 'entry page'})`);
  }
  console.log(`Checked ${checked.length} local URLs.`);
  if (!result.passed || checked.length === 0) process.exitCode = 1;
} finally {
  await server.stop();
}
