---
title: Migration Paths
description: Supported source and target versions, platforms, and feature compatibility.
---

## Version Compatibility Matrix

| Source | → OS 1.x | → OS 2.x | → OS 3.x |
|--------|----------|----------|----------|
| ES 1.x | ✓ | ✓ | ✓ |
| ES 2.x | ✓ | ✓ | ✓ |
| ES 5.x | ✓ | ✓ | ✓ |
| ES 6.x | ✓ | ✓ | ✓ |
| ES 7.x | ✓ | ✓ | ✓ |
| ES 8.x | — | ✓ | ✓ |
| OS 1.x | — | ✓ | ✓ |
| OS 2.x | — | ✓ | ✓ |

## Supported Platforms

| Platform | As Source | As Target |
|----------|----------|-----------|
| Self-managed (cloud/on-prem) | ✓ | ✓ |
| Amazon OpenSearch Service | ✓ | ✓ |
| Amazon OpenSearch Serverless | — | ✓ |
| Elastic Cloud | ✓ | — |
| AWS EC2 | ✓ | ✓ |

## Feature Support

| Feature | Backfill (RFS) | Capture & Replay |
|---------|---------------|-----------------|
| Index data | ✓ | ✓ |
| Index mappings | ✓ | ✓ |
| Index settings | ✓ | ✓ |
| Aliases | ✓ | ✓ |
| Templates | ✓ | — |
| Component templates | ✓ | — |
| ISM policies | — | — |

## Automatic Field Type Transformations

Migration Assistant automatically handles these breaking changes:

| Transformation | Source | Target |
|---------------|--------|--------|
| `string` → `text`/`keyword` | ES 1.x–5.x | OS all |
| `flattened` → `flat_object` | ES 7.3+ | OS 2.7+ |
| `dense_vector` → `knn_vector` | ES 7.x | OS all |
| Type mapping sanitization | ES 5.x–6.x multi-type | OS single-type |

:::caution
Migration Assistant does not guarantee zero-downtime migration through live traffic Capture and Replay when migrating from Elasticsearch 1.x or 2.x.
:::
