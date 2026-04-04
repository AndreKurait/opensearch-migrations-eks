---
title: Overview
description: Introduction to Migration Assistant for OpenSearch.
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
| **Version compatibility** | Support for Elasticsearch 1.x–8.x and OpenSearch 1.x–2.x → OpenSearch 1.x–3.x |
| **Amazon OpenSearch Serverless** | Supported as a migration target for document backfill and index metadata |

## Architecture Overview

Migration Assistant runs on Kubernetes and uses Argo Workflows for orchestration. It works on AWS EKS, GKE, AKS, OpenShift, and self-managed Kubernetes clusters.

### Core Components

- **Migration Console** — Kubernetes pod providing the CLI for configuring, submitting, and monitoring migrations
- **Workflow CLI** — Command-line tool for defining migrations in YAML and submitting them as workflows
- **Argo Workflows** — Kubernetes-native workflow engine that orchestrates migration tasks
- **RFS (Reindex-from-Snapshot)** — High-performance document migration using Lucene segment files

## Migration Console Orientation

When you connect to the Migration Console pod, you'll find:

- **`console`** — Main CLI for migration operations and status
- **`workflow`** — Configure and submit migration workflows
- **`kubectl`** — Pre-configured for the migration namespace
- **`aws` CLI** — Available on EKS deployments for AWS operations

## Performance

| Service | vCPU | Memory | Peak Docs/min | Primary Shard Rate (MBps) |
|---------|------|--------|---------------|---------------------------|
| RFS | 2 | 4 GB | 590,000 | 15.1 |
| RFS (w/ type mapping) | 2 | 4 GB | 546,000 | 14.0 |
| Traffic Replay | 8 | 48 GB | 1,694,000 | 43.5 |
| Traffic Replay (w/ type mapping) | 8 | 48 GB | 1,645,000 | 42.2 |

## Getting Started

1. **Understand** — [What Is a Migration](/opensearch-migrations-eks/overview/what-is-a-migration/) — the three aspects, RFS internals, choosing your scenario
2. **Check compatibility** — [Migration Paths](/opensearch-migrations-eks/overview/migration-paths/) — version matrix and pre-migration checklist
3. **Deploy** — [Deploying to EKS](/opensearch-migrations-eks/deployment/deploying-to-eks/) or [Deploying to Kubernetes](/opensearch-migrations-eks/deployment/deploying-to-kubernetes/)
4. **Run** — [Workflow CLI Getting Started](/opensearch-migrations-eks/workflow-cli/getting-started/) — configure and execute your migration
