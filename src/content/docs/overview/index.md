---
title: Introduction
description: Overview of Migration Assistant for OpenSearch on EKS.
---

Migration Assistant is a tool for migrating data from Elasticsearch and OpenSearch clusters to OpenSearch. It provides a **Kubernetes-native, workflow-driven approach** to orchestrate migrations using declarative YAML configuration.

## Three Aspects of Migration

Every migration involves up to three aspects:

1. **Metadata migration** — Index settings, mappings, templates, aliases, and component templates
2. **Backfill (existing data)** — Historical documents migrated via Reindex-from-Snapshot (RFS)
3. **Live traffic capture & replay** — Real-time request capture, buffering, and replay for zero-downtime validation

## Three Migration Scenarios

| Scenario | Metadata | Backfill | Live Traffic |
|----------|----------|----------|--------------|
| **Backfill only** | ✓ | ✓ | — |
| **Live capture only** | ✓ | — | ✓ |
| **Combined** | ✓ | ✓ | ✓ |

## Key Components

| Component | Description |
|-----------|-------------|
| **Migration Console** | CLI pod (`migration-console-0`) for all migration operations |
| **Workflow CLI** | Declarative YAML config with `workflow configure`, `submit`, `manage` |
| **Argo Workflows** | K8s-native orchestration with parallel execution and approval gates |
| **Capture Proxy** | Stateless HTTP proxy fleet recording traffic to Kafka |
| **Traffic Replayer** | Reads from Kafka, replays against target with optional transforms |
| **RFS** | Document migration via raw Lucene segment files from S3 snapshots |
| **Metadata Migration Tool** | Migrates index settings, mappings, templates with auto field type transforms |

## Next Steps

- [What Is a Migration](/opensearch-migrations-eks/overview/what-is-a-migration/) — Understand how RFS and traffic replay work
- [Migration Paths](/opensearch-migrations-eks/overview/migration-paths/) — Check version compatibility
- [Deploying to EKS](/opensearch-migrations-eks/deployment/deploying-to-eks/) — Get started with deployment
