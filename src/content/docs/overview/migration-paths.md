---
banner:
  content: 'Frozen documentation prototype — November 2026. For current releases, see <a href="https://github.com/opensearch-project/opensearch-migrations">OpenSearch Migrations</a>.'
title: Migration Paths
description: Supported source and target versions, platforms, component support, and pre-migration checklist.
---

## Determining Your Source Version

Before configuring a migration, identify your source cluster version:

```bash
# Query the cluster directly

curl -s <source-endpoint>/ | jq '.version.number'
```

Use the version string format expected by Migration Assistant: `ES 7.10`, `ES 6.8`, `OS 1.3`, `OS 2.11`.

## Supported Source and Target Versions

The following summarizes the [upstream compatibility matrix](https://docs.opensearch.org/latest/migration-assistant/is-migration-assistant-right-for-you/) reviewed in November 2026. Check the documentation for your installed release before selecting a path.

| Source Platform | Source Versions | Target Versions | Phase limitation |
|-----------------|-----------------|-----------------|------------------|
| Elasticsearch | 1.x – 2.x | OpenSearch 1.x, 2.x, 3.x | Backfill only |
| Elasticsearch | 5.x – 7.x | OpenSearch 1.x, 2.x, 3.x | Check release-specific capabilities |
| Elasticsearch | 8.x | OpenSearch 2.x, 3.x | OpenSearch 1.x is not supported |
| OpenSearch | 1.x – 2.x | OpenSearch 2.x, 3.x | Check release-specific capabilities |

Version numbers alone are insufficient. For example, the upstream guide excludes snapshots using `zstd` and `zstd_no_dict` codecs; index features and shard sizes also require review.

### Version-Specific Guidance

**Elasticsearch 1.x–5.x:**
- Legacy versions with significant mapping and settings differences
- Test with a subset of indexes first using index allowlists
- Some index settings may not be compatible and will be skipped

**Elasticsearch 6.x:**
- Generally uses single-type indexes; upgraded or legacy datasets may need type-handling decisions
- Run metadata evaluation first and configure `multiTypeBehavior` only when multi-type issues are reported

**Elasticsearch 7.x:**
- Most compatible path due to shared codebase with OpenSearch 1.0
- Generally requires no special configuration

**Elasticsearch 8.x:**
- Supported with compatibility handling for post-fork features
- Some 8.x-specific features may not have OpenSearch equivalents
- Test metadata migration first to identify incompatibilities

**OpenSearch to OpenSearch:**
- Useful for cluster consolidation or major version upgrades
- Most straightforward migration path

## Supported Platforms

| Platform | Source | Target |
|----------|--------|--------|
| Self-managed (on-premises) | ✓ | ✓ |
| Self-managed (cloud-hosted) | ✓ | ✓ |
| Amazon OpenSearch Service | ✓ | ✓ |
| Amazon OpenSearch Serverless | ✗ | Release/collection-dependent |
| AWS EC2 | ✓ | ✓ |

:::note
Check the upstream compatibility guide for supported Serverless collection generations, document-ID behavior, and migration phases. Do not assume all collection types preserve IDs or support the same metadata operations.
:::

## Component Support

### Objects to Evaluate

Migration Assistant handles these object categories, subject to source/target features and release-specific transformations. Evaluate the actual metadata before migration.

| Component | Description |
|-----------|-------------|
| **Documents** | All documents in selected indexes |
| **Index settings** | Shard count, replica count, refresh interval, and other index-level settings |
| **Index mappings** | Field mappings, dynamic templates, and mapping parameters |
| **Index templates** | Legacy index templates |
| **Component templates** | Reusable template components (ES 7.8+ / OpenSearch) |
| **Composable index templates** | Templates that reference component templates |
| **Aliases** | Index aliases and their configurations |

### Not Supported

| Component | Reason | Workaround |
|-----------|--------|------------|
| **Data streams** | Not currently supported | Manually recreate on target |
| **ISM policies** | OpenSearch-specific syntax | Manually recreate on target |
| **ILM policies** | Elasticsearch-specific, replaced by ISM | Create equivalent ISM policies |
| **Security configuration** | Cluster-specific, security-sensitive | Configure separately on target |
| **Kibana / Dashboards objects** | Separate application data | Export/import using Dashboards UI |
| **Ingest pipelines** | May contain version-specific processors | Manually recreate or export/import |
| **Snapshot repositories** | Cluster-specific configuration | Configure separately on target |
| **Cluster settings** | Cluster-specific tuning | Configure separately on target |

## Pre-Migration Checklist

- [ ] **Verify versions and codecs**: Confirm the path and snapshot format against the upstream documentation for your installed release
- [ ] **Determine source version**: Run `curl <source-endpoint>/` and note the version string
- [ ] **Identify unsupported components**: Review the "Not Supported" table and plan manual migration
- [ ] **Plan index scope**: Decide which indexes to migrate; use index allowlists to exclude system indexes
- [ ] **Test with subset**: Configure an index allowlist with 1–2 representative indexes and run a test migration
- [ ] **Check for multi-type indexes** (ES 6.x): Identify indexes with multiple mapping types and configure `multiTypeBehavior`

## Next Steps

1. [Deploying to EKS](/opensearch-migrations-eks/deployment/deploying-to-eks/) or [Deploying to Kubernetes](/opensearch-migrations-eks/deployment/deploying-to-kubernetes/)
2. [Workflow CLI Overview](/opensearch-migrations-eks/workflow-cli/overview/)
3. [Workflow CLI Getting Started](/opensearch-migrations-eks/workflow-cli/getting-started/)
