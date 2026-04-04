---
title: Migrate Metadata
description: Migrate index settings, mappings, templates, and aliases.
---

Metadata migration transfers index definitions from source to target before document data.

## Evaluate Metadata

```bash
console metadata evaluate
```

## Migrate Metadata

```bash
console metadata migrate
```

## Automatic Transformations

Migration Assistant automatically handles these field type changes:

| Source Type | Target Type | Versions |
|------------|-------------|----------|
| `string` | `text` / `keyword` | ES 1.x–5.x → OS |
| `flattened` | `flat_object` | ES 7.3+ → OS 2.7+ |
| `dense_vector` | `knn_vector` | ES 7.x → OS |
| Multi-type mappings | Single-type | ES 5.x–6.x → OS |

### String to Text/Keyword

ES 1.x–5.x `string` fields are automatically converted based on the `index` property:
- `"index": "analyzed"` → `text`
- `"index": "not_analyzed"` → `keyword`

### Dense Vector to KNN Vector

ES 7.x `dense_vector` fields are converted to OpenSearch `knn_vector` with appropriate similarity mapping and HNSW configuration.

### Flattened to Flat Object

ES 7.3+ `flattened` fields are converted to OpenSearch 2.7+ `flat_object`.

## Custom Transformations

For custom field type changes, use the JavaScript transformation framework:

```json
{
  "transformations": [
    {
      "type": "field-type-converter",
      "config": {
        "mappings": {
          "my_field": { "type": "keyword" }
        }
      }
    }
  ]
}
```

## Troubleshooting

If metadata migration fails:
- Check **compatibility mode** settings on the target
- Verify the target cluster is reachable from the Migration Console
- Review logs with `console metadata evaluate` for specific errors
