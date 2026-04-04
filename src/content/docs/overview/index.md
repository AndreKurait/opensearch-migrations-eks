---
title: Overview
description: Introduction to Migration Assistant for OpenSearch on EKS.
---

Migration Assistant is a tool for migrating data from Elasticsearch and OpenSearch clusters to OpenSearch. It provides a **Kubernetes-native, workflow-driven approach** to orchestrate migrations using declarative YAML configuration.

## What Migration Assistant Does

Migration Assistant addresses three aspects of migration:

1. **Metadata migration** — index settings, mappings, templates, and aliases
2. **Backfill (existing data)** — historical documents via Reindex-from-Snapshot (RFS)
3. **Live traffic capture and replay** — zero-downtime validation of the target cluster

## EKS Release

The EKS release deploys Migration Assistant on Amazon Elastic Kubernetes Service using Helm charts and Argo Workflows. It works equivalently on any Kubernetes distribution including GKE, AKS, OpenShift, and self-managed clusters.

### Key Capabilities

- **Workflow orchestration** with Argo Workflows — parallel execution, retry logic, approval gates
- **Declarative configuration** — define migrations as YAML, submit and manage from the CLI
- **Scalable workers** — RFS reads from S3, scaling has zero impact on the source cluster
- **Broad compatibility** — Elasticsearch 1.x–8.x and OpenSearch 1.x–2.x → OpenSearch 1.x–3.x

## Performance

| Service | vCPU | Memory | Peak Docs/min | Primary Shard Rate (MBps) |
|---------|------|--------|---------------|---------------------------|
| RFS | 2 | 4 GB | 590,000 | 15.1 |
| RFS (w/ type mapping) | 2 | 4 GB | 546,000 | 14.0 |
| Traffic Replay | 8 | 48 GB | 1,694,000 | 43.5 |
| Traffic Replay (w/ type mapping) | 8 | 48 GB | 1,645,000 | 42.2 |

## Next Steps

- [What Is a Migration](/opensearch-migrations-eks/overview/what-is-a-migration/) — understand the three migration aspects
- [Architecture](/opensearch-migrations-eks/overview/architecture/) — EKS architecture and component overview
- [Deploying to EKS](/opensearch-migrations-eks/deployment/deploying-to-eks/) — get started with deployment
