---
title: Assessment
description: Assess your source cluster for migration readiness and identify potential issues.
---

Before starting a migration, assess your source cluster to identify breaking changes, unsupported features, and data transformation requirements.

## Running the Assessment

From the Migration Console:

```bash
console clusters connection-check
console metadata evaluate
```

The `evaluate` command analyzes your source cluster and reports:

- Index count and total data size
- Mapping compatibility issues
- Required field type transformations
- Unsupported features or plugins

## Breaking Changes Tool

The assessment identifies breaking changes between your source and target versions:

| Category | Examples |
|----------|----------|
| **Field type changes** | `string` → `text`/`keyword` (ES 1.x–5.x) |
| **Type mapping deprecation** | Multi-type indices (ES 6.x) |
| **Vector field changes** | `dense_vector` → `knn_vector` |
| **Flattened field changes** | `flattened` → `flat_object` |

## Supported Transformations

Migration Assistant automatically handles these transformations during metadata migration:

- `string` → `text`/`keyword` based on the `index` property
- `dense_vector` → `knn_vector` with similarity mapping
- `flattened` → `flat_object`
- Multi-type index mappings → single-type
- Custom JavaScript transformations for complex cases

## Next Steps

After assessment, proceed to:

1. [Create Snapshot](/opensearch-migrations-eks/migration-guide/create-snapshot/) — if using backfill
2. [Migrate Metadata](/opensearch-migrations-eks/migration-guide/migrate-metadata/) — migrate index settings and mappings
