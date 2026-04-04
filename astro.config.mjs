// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://andrekurait.github.io',
	base: '/opensearch-migrations-eks',
	integrations: [
		starlight({
			title: 'Migration Assistant — EKS',
			description:
				'Deploy and operate OpenSearch migrations on Amazon EKS. Kubernetes-native workflow orchestration for Elasticsearch to OpenSearch migrations.',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/opensearch-project/opensearch-migrations',
				},
			],
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Overview',
					items: [
						{ label: 'Introduction', slug: 'overview' },
						{ label: 'What Is a Migration', slug: 'overview/what-is-a-migration' },
						{ label: 'Architecture', slug: 'overview/architecture' },
						{ label: 'Migration Paths', slug: 'overview/migration-paths' },
					],
				},
				{
					label: 'Deployment',
					items: [
						{ label: 'Deploying to EKS', slug: 'deployment/deploying-to-eks' },
						{ label: 'Deploying to Kubernetes', slug: 'deployment/deploying-to-kubernetes' },
						{ label: 'Configuration Options', slug: 'deployment/configuration-options' },
						{ label: 'IAM & Security', slug: 'deployment/iam-and-security' },
					],
				},
				{
					label: 'Migration Guide',
					items: [
						{ label: 'Assessment', slug: 'migration-guide/assessment' },
						{ label: 'Create Snapshot', slug: 'migration-guide/create-snapshot' },
						{ label: 'Migrate Metadata', slug: 'migration-guide/migrate-metadata' },
						{ label: 'Backfill', slug: 'migration-guide/backfill' },
						{ label: 'Capture & Replay', slug: 'migration-guide/capture-and-replay' },
						{ label: 'Traffic Routing', slug: 'migration-guide/traffic-routing' },
						{ label: 'Teardown', slug: 'migration-guide/teardown' },
					],
				},
				{
					label: 'Workflow CLI',
					items: [
						{ label: 'Overview', slug: 'workflow-cli/overview' },
						{ label: 'Getting Started', slug: 'workflow-cli/getting-started' },
						{ label: 'Command Reference', slug: 'workflow-cli/command-reference' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Key Components', slug: 'reference/key-components' },
						{ label: 'Troubleshooting', slug: 'reference/troubleshooting' },
						{ label: 'Security Patching', slug: 'reference/security-patching' },
					],
				},
			],
		}),
	],
});
