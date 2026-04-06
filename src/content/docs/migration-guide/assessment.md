---
title: Assessment
description: Assess your source cluster for migration readiness and identify potential issues.
---
Before starting a migration, assess your source cluster to identify breaking changes,
unsupported features, and data transformation requirements. The assessment is
non-destructive and makes no changes to either cluster.

## Running the Assessment

1. **Verify connectivity** — confirm the Migration Console can reach both clusters:

   ```bash
   console clusters connection-check
   ```

2. **Evaluate metadata** — scan every index on the source cluster:

   ```bash
   console metadata evaluate
   ```

3. **Review the report** — the evaluate command prints a summary like the one below.
   Fix or acknowledge each issue before continuing.
### Sample output

```text
=== Migration Assessment Report ===
Cluster:  source-es-7x.example.com  (Elasticsearch 7.10.2)
Indices:  142    Total size: 1.8 TB    Shards: 710

Breaking changes found:
  • 3 indices use dense_vector → will convert to knn_vector
  • 1 index uses flattened     → will convert to flat_object

Unsupported plugins:
  • analysis-phonetic (used by 2 indices)

Recommended actions:
  1. Install the phonetic analysis plugin on the target cluster
  2. Review knn_vector dimension settings (see Migrate Metadata docs)
```

:::tip
Run the assessment early — even before you plan the maintenance window.
The report helps you size the target cluster and estimate migration time.
:::

### What the report covers

| Area | What it checks |
|------|----------------|
| **Index inventory** | Index count, total data size, shard count |
| **Mapping compatibility** | Field types that require transformation (see table below) |
| **Plugins & analyzers** | Custom plugins or analysis chains that must exist on the target |
| **Templates** | Index templates and component templates that will be migrated |
| **Aliases** | Alias definitions and any write-index settings |

## Breaking Changes Tool

The assessment flags every incompatibility between your source and target versions.
The table below lists the most common ones:

| Category | Source | Target | Auto-converted? |
|----------|--------|--------|:---------------:|
| **String fields** | `string` (ES 1.x–5.x) | `text` / `keyword` | ✅ |
| **Multi-type mappings** | Multiple `_type` values (ES 5.x–6.x) | Single type | ✅ |
| **Dense vector** | `dense_vector` (ES 7.x) | `knn_vector` | ✅ |
| **Flattened** | `flattened` (ES 7.3+) | `flat_object` (OS 2.7+) | ✅ |
| **Custom plugins** | Source-only plugins | — | ❌ Manual |

:::caution
Items marked **❌ Manual** require you to install the equivalent plugin on the
target cluster or rewrite the affected mappings before proceeding.
:::

## Supported Transformations

Migration Assistant handles these transformations automatically during the
[Migrate Metadata](/opensearch-migrations-eks/migration-guide/migrate-metadata/) step — no manual
intervention required:

- **`string` → `text`/`keyword`** — based on the `index` property (`analyzed` → `text`, `not_analyzed` → `keyword`).
- **`dense_vector` → `knn_vector`** — including similarity mapping and HNSW engine configuration.
- **`flattened` → `flat_object`** — direct type replacement.
- **Multi-type → single-type** — type mappings are merged into the `_doc` type.
- **Custom JavaScript transformations** — for anything not covered above.
  See [Custom JavaScript Transformations](/opensearch-migrations-eks/migration-guide/migrate-metadata/#custom-javascript-transformations).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `connection-check` fails for source | Network policy or security group blocks egress | Open port 9200 (or 443 for HTTPS) from the Migration Console pod to the source cluster |
| `connection-check` fails for target | Target cluster not yet provisioned | Deploy the target cluster first, then re-run |
| `evaluate` returns 0 indices | Snapshot not yet registered or IAM role lacks `s3:GetObject` | Run `console snapshot status` and check the IAM role policy |
| Report lists an unknown plugin | Plugin metadata not in the built-in catalog | File an issue or add a custom transformation |

## Next Steps

After assessment, proceed to:

1. [Create Snapshot](/opensearch-migrations-eks/migration-guide/create-snapshot/) — capture source data for backfill
2. [Migrate Metadata](/opensearch-migrations-eks/migration-guide/migrate-metadata/) — transfer index settings, mappings, and templates
