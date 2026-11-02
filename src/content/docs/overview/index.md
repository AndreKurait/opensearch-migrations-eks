---
title: Overview
description: Introduction to Migration Assistant for OpenSearch — capabilities, architecture, performance, and getting started.
---

Migration Assistant is a tool for migrating data from Elasticsearch and OpenSearch clusters to OpenSearch. It provides a **Kubernetes-native, workflow-driven approach** to orchestrate migrations using declarative YAML configuration.

:::caution
The configuration schema changes between Migration Assistant versions. Do not copy YAML examples from documentation verbatim. After deploying, run `workflow configure sample` on the Migration Console to get the accurate schema for your installed version.
:::

## Key Capabilities

| Capability | Description |
|------------|-------------|
| **Metadata migration** | Migrate index templates, component templates, index settings, and aliases |
| **Document backfill** | Migrate existing documents using snapshot-based reindexing (RFS) |
| **Version compatibility** | Selected Elasticsearch/OpenSearch paths; see [Migration Paths](/opensearch-migrations-eks/overview/migration-paths/) and the installed release's limits |
| **Amazon OpenSearch Serverless** | Target support depends on the Migration Assistant release, collection type, and migration phase |

## Architecture Overview

Migration Assistant runs on Kubernetes and uses Argo Workflows for orchestration. Upstream documents EKS and generic Kubernetes deployment paths. This independent documentation site has not validated deployments across GKE, AKS, OpenShift, or other distributions.

### Core Components

- **Migration Console** — Kubernetes pod providing the CLI for configuring, submitting, and monitoring migrations
- **Workflow CLI** — Command-line tool for defining migrations in YAML and submitting them as workflows
- **Argo Workflows** — Kubernetes-native workflow engine that orchestrates migration tasks
- **RFS (Reindex-from-Snapshot)** — High-performance document migration using Lucene segment files

See [Architecture](/opensearch-migrations-eks/overview/architecture/) for the full component diagram and data flow.

## Migration Console Orientation

When you connect to the Migration Console pod, you'll find:

| Command | Purpose |
|---------|---------|
| `console` | Main CLI for migration operations and status |
| `workflow` | Configure and submit migration workflows |
| `kubectl` | Pre-configured for the migration namespace |
| `aws` | Available on EKS deployments for AWS operations |

Connect with:

```bash
kubectl exec -it migration-console-0 -n ma -- bash
```

## Performance Planning

This site does not include a reproducible benchmark for fixed throughput figures. Run a representative pilot and record document sizes, transformations, shard distribution, worker resources, target capacity, errors, and observed throughput. Use those measurements to estimate duration and select concurrency; increasing worker count can saturate the target.

## Getting Started

1. **Understand** — [What Is a Migration](/opensearch-migrations-eks/overview/what-is-a-migration/) — the three aspects, RFS internals, choosing your scenario
2. **Check compatibility** — [Migration Paths](/opensearch-migrations-eks/overview/migration-paths/) — version matrix and pre-migration checklist
3. **Deploy** — [Deploying to EKS](/opensearch-migrations-eks/deployment/deploying-to-eks/) or [Deploying to Kubernetes](/opensearch-migrations-eks/deployment/deploying-to-kubernetes/)
4. **Run** — [Workflow CLI Getting Started](/opensearch-migrations-eks/workflow-cli/getting-started/) — configure and execute your migration
