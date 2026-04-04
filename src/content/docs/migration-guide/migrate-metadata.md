---
title: Migrate Metadata
description: Migrate index settings, mappings, templates, and aliases with automatic field type transformations.
---

Metadata migration transfers index settings, mappings, templates, component templates, and aliases from the source to the target cluster.

## Running Metadata Migration

From the Migration Console:

```bash
# Evaluate what will be migrated
console metadata evaluate

# Execute the migration
console metadata migrate
```

## What Gets Migrated

- Index settings (number of shards, replicas, analysis configuration)
- Index mappings (field types, analyzers, normalizers)
- Index templates and component templates
- Aliases

## Automatic Field Type Transformations

Migration Assistant automatically transforms incompatible field types:

| Source Type | Target Type | Applies To |
|-------------|-------------|------------|
| `string` | `text` / `keyword` | ES 1.x–5.x → OS |
| `dense_vector` | `knn_vector` | ES 7.x → OS |
| `flattened` | `flat_object` | ES 7.3+ → OS 2.7+ |
| Multi-type mappings | Single-type | ES 6.x → OS |

### String to Text/Keyword

For Elasticsearch 1.x–5.x sources, the `string` field type is automatically converted:
- `"index": "analyzed"` or `"index": "yes"` → `text`
- `"index": "not_analyzed"` → `keyword`
- Default (no `index` property) → `text`

### Dense Vector to KNN Vector

Elasticsearch 7.x `dense_vector` fields are converted to OpenSearch `knn_vector` with appropriate similarity mapping and HNSW configuration.

### Flattened to Flat Object

Elasticsearch 7.3+ `flattened` fields are converted to OpenSearch 2.7+ `flat_object`.

### Custom JavaScript Transformations

For complex transformations not covered by built-in converters, use the JavaScript transformation framework:

```json
{
  "transformations": [
    {
      "JsonJoltTransformerProvider": {
        "script": "field-type-converter.js"
      }
    }
  ]
}
```

## Compatibility Mode

If the target cluster has compatibility mode enabled, some transformations may be handled differently. Check the evaluation output for details.

## Troubleshooting

- **Missing indices**: Verify the source cluster is accessible and the snapshot is complete
- **Mapping conflicts**: Review the evaluation output for incompatible field types
- **Template errors**: Check that template patterns don't conflict with existing target templates

## Next Steps

After metadata migration, proceed to [Backfill](/opensearch-migrations-eks/migration-guide/backfill/) to migrate documents.
