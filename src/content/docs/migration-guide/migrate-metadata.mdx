---
title: Migrate Metadata
description: Migrate index settings, mappings, templates, and aliases with automatic field type transformations.
---

import { Steps, Aside, Tabs, TabItem } from '@astrojs/starlight/components';

Metadata migration transfers index settings, mappings, templates, component templates,
and aliases from the source to the target cluster. Incompatible field types are
transformed automatically (see [Automatic Field Type Transformations](#automatic-field-type-transformations)).

## Running Metadata Migration

<Steps>

1. **Evaluate** — preview what will be migrated and flag any issues:

   ```bash
   console metadata evaluate
   ```

   Review the output carefully. It lists every index, every transformation that will
   be applied, and any warnings that require manual action.

2. **Migrate** — apply the metadata to the target cluster:

   ```bash
   console metadata migrate
   ```

3. **Verify** — confirm the target cluster has the expected indices:

   ```bash
   console clusters cat-indices --target
   ```

</Steps>

<Aside type="tip">
You can re-run `metadata migrate` safely. It is idempotent — indices that already
exist on the target are skipped.
</Aside>

## What Gets Migrated

| Object | Notes |
|--------|-------|
| **Index settings** | Shard count, replica count, analysis configuration, refresh interval |
| **Index mappings** | Field types, analyzers, normalizers, dynamic templates |
| **Index templates** | Legacy templates and composable index templates |
| **Component templates** | Reusable mapping/settings fragments |
| **Aliases** | Including write-index and routing settings |

<Aside type="caution">
**Not migrated:** ingest pipelines, ILM/ISM policies, cluster settings, and security
configuration. Migrate those objects manually or with the OpenSearch API before
running backfill.
</Aside>

## Automatic Field Type Transformations

Migration Assistant detects the source and target versions and applies the appropriate
transformations automatically.

| Source type | Target type | When it applies |
|-------------|-------------|-----------------|
| `string` | `text` / `keyword` | ES 1.x–5.x → OS |
| `dense_vector` | `knn_vector` | ES 7.x → OS |
| `flattened` | `flat_object` | ES 7.3+ → OS 2.7+ |
| Multi-type mappings | Single `_doc` type | ES 5.x–6.x → OS |

### String to Text/Keyword

For Elasticsearch 1.x–5.x sources, the legacy `string` field type is converted based
on the `index` property:

| `index` value | Converted to |
|---------------|-------------|
| `"analyzed"` or `"yes"` | `text` |
| `"not_analyzed"` | `keyword` |
| *(not set)* | `text` (default) |

Sub-fields (`.raw`, `.keyword`) are preserved and re-typed accordingly.

### Dense Vector to KNN Vector

Elasticsearch 7.x `dense_vector` fields are converted to OpenSearch `knn_vector`.
The migration sets the HNSW engine and maps similarity functions:

| ES similarity | OS similarity |
|---------------|---------------|
| `cosine` | `cosinesimil` |
| `dot_product` | `dotProduct` |
| `l2_norm` | `l2` |

### Flattened to Flat Object

Elasticsearch 7.3+ `flattened` fields are replaced with OpenSearch 2.7+ `flat_object`.
No additional configuration is required.

### Custom JavaScript Transformations

For cases not handled by the built-in converters you can supply a custom
[Jolt transform](https://github.com/bazaarvoice/jolt) spec or a JavaScript script:

<Tabs>
<TabItem label="Jolt spec">

```json
{
  "transformations": [
    {
      "JsonJoltTransformerProvider": {
        "spec": [
          {
            "operation": "modify-overwrite-beta",
            "spec": {
              "mappings.properties.legacy_field.type": "keyword"
            }
          }
        ]
      }
    }
  ]
}
```

</TabItem>
<TabItem label="JavaScript script">

```json
{
  "transformations": [
    {
      "JsonJSTransformerProvider": {
        "script": "custom-field-converter.js"
      }
    }
  ]
}
```

Place the script file in the `/shared/` volume mounted into the Migration Console pod.

</TabItem>
</Tabs>

## Compatibility Mode

If the target OpenSearch cluster has `compatibility.override_main_response_version: true`,
it advertises itself as Elasticsearch 7.10. The metadata migrator accounts for this and
still applies the correct transformations. Check the `evaluate` output if you see
unexpected behavior.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| **Missing indices on target** | Source unreachable or snapshot incomplete | Run `console clusters connection-check` and `console snapshot status` |
| **Mapping conflict error** | An index with the same name but a different mapping already exists on the target | Delete the conflicting index on the target or use an index allowlist/blocklist |
| **Template pattern collision** | A migrated template overlaps with a default OpenSearch template | Rename the template or adjust its `index_patterns` before migrating |
| **`evaluate` shows 0 transformations but source is ES 5.x** | Version detection failed | Pass the source version explicitly: `console metadata evaluate --source-version ES_5_6` |

## Next Steps

After metadata migration, proceed to
[Backfill](/opensearch-migrations-eks/migration-guide/backfill/) to migrate the actual documents.
