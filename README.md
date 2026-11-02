# OpenSearch Migration Assistant documentation prototype

A personal documentation site exploring how to explain Migration Assistant
deployment and migration workflows on Kubernetes, including Amazon EKS.
The site uses Astro and Starlight.

The public implementation and releases are maintained in
[opensearch-project/opensearch-migrations](https://github.com/opensearch-project/opensearch-migrations).
This repository contains the documentation site, illustrations, styling, and site
checks. It is an independent documentation prototype, not an official release
or support channel for the upstream project.

## Scope and status

Content covers deployment, IAM, snapshots, metadata migration, document backfill,
traffic capture/replay, and the workflow CLI. Pages are draft guidance:
compatibility tables, performance figures, recovery claims, and commands need
verification against the exact upstream release and deployment environment.
Site checks do not test a migration or establish production safety.

The configured GitHub Pages location is
<https://andrekurait.github.io/opensearch-migrations-eks/>.
The `/opensearch-migrations-eks/` base path also applies during local development.

## Develop locally

Use Node.js 22, matching the PR workflow, and npm:

```sh
npm ci
npm run dev
```

Open `http://localhost:4321/opensearch-migrations-eks/`.

| Command | Purpose |
| --- | --- |
| `npm run build` | Generate the static site in `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm run lint` | Lint Markdown content and the Astro configuration |
| `npm run check` | Build, lint generated HTML, and check local links |
| `npm run check:a11y` | Run the accessibility checker against a local server |
| `npm test` | Run Playwright checks for mobile overflow and browser console errors |

Playwright starts a build and preview server through `playwright.config.ts`.
Install its headless Chromium browser first with
`npx playwright install --only-shell chromium`.
The accessibility command expects `npm run preview -- --host 127.0.0.1` on port
4321 after a build. It loads its pinned axe dependency locally and scans eight
representative pages; an automated scan does not establish full WCAG conformance.
PR checks run the linters, local link checker, accessibility scan, and existing
browser regression tests against the built site.

## Repository layout

- `src/content/docs/` — Markdown and MDX pages.
- `src/styles/`, `src/images/`, and `public/` — styling, illustrations, and static files.
- `astro.config.mjs` — navigation, metadata, and the site/base-path configuration.
- `tests/` — browser checks.
- `scripts/` — accessibility checks and separate analysis experiments.

Normal site development requires no AWS credentials. Some analysis scripts call
Amazon Bedrock; review their behavior and configuration before running them.

## Publishing and contributions

The existing Pages workflow builds and deploys on pushes to `main` or manual
dispatch. Local build and test commands do not publish the site.

Keep documentation changes tied to a specific upstream release or source.
Include reproduction details for command examples and measured conditions for
performance claims. Verify rendering and links under the configured base path
before opening a pull request.
