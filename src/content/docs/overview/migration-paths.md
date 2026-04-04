---
title: Migration Paths
description: Supported source and target versions, platforms, and compatibility matrix.
---

Migration Assistant supports a wide range of source and target versions across multiple platforms.

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

**Source platforms:**
- Self-managed (cloud or on-premises)
- Amazon OpenSearch Service
- Elastic Cloud
- AWS EC2

**Target platforms:**
- Self-managed (cloud or on-premises)
- Amazon OpenSearch Service
- Amazon OpenSearch Serverless (target only)

## Feature Support by Migration Path

| Feature | Backfill (RFS) | Live Capture & Replay |
|---------|---------------|----------------------|
| ES 1.x–2.x → OS | ✓ | Limited (no zero-downtime guarantee) |
| ES 5.x–8.x → OS | ✓ | ✓ |
| OS 1.x–2.x → OS | ✓ | ✓ |
| Metadata migration | ✓ | N/A |
| Field type transforms | ✓ | N/A |

:::caution
Migration Assistant does not guarantee zero-downtime migration through live traffic Capture and Replay when migrating from Elasticsearch 1.x or Elasticsearch 2.x.
:::

## Choosing a Migration Path

Use the [Assessment](/opensearch-migrations-eks/migration-guide/assessment/) phase to evaluate your source cluster and determine the best migration approach for your use case.
