---
title: Architecture
description: EKS architecture, component overview, and Argo Workflows orchestration.
---

Migration Assistant runs on Kubernetes and uses Argo Workflows for orchestration. The architecture below shows the deployment on AWS EKS, but Migration Assistant works equivalently on any Kubernetes distribution.

## EKS Architecture

```
AWS EKS Cluster (namespace: ma)
├── argo-workflows-server          (Deployment)
├── argo-workflows-workflow-controller (Deployment)
├── migration-console-0            (StatefulSet)
├── capture-proxy                  (Deployment + NLB Service)
├── traffic-replayer               (Deployment)
├── rfs-workers                    (Jobs managed by Argo)
└── kafka (Strimzi)                (StatefulSet)
```

## Component Overview

| Component | Description | K8s Resource |
|-----------|-------------|--------------|
| **Migration Console** | CLI for all migration operations (`console` and `workflow` commands) | StatefulSet |
| **Argo Workflows** | K8s-native workflow engine with parallel execution, retry logic, approval gates | Deployment (server + controller) |
| **Capture Proxy** | HTTP proxy fleet forwarding to source while recording to Kafka | Deployment with Service (NLB on EKS) |
| **Traffic Replayer** | Reads from Kafka, replays against target with transforms and speedup factor | Deployment |
| **RFS Workers** | Document migration via raw Lucene segment files from S3 snapshots (1 worker/shard max) | Jobs managed by Argo |
| **Kafka (Strimzi)** | Durable message queue for traffic capture | Strimzi operator or external |
| **Metadata Migration Tool** | Migrates index settings, mappings, templates, aliases with auto field type transforms | Runs inside Migration Console |

## Workflow Orchestration

Configure and submit a migration workflow from the Migration Console:

```bash
workflow configure edit    # Edit configuration
workflow submit            # Submit to Argo Workflows
```

The workflow orchestrates:

1. Point-in-time snapshot of the source cluster
2. Metadata migration (indexes, templates, component templates, aliases)
3. **Approval gate** — workflow pauses for user confirmation before document migration
4. Resource provisioning for Reindex-from-Snapshot (RFS) backfill
5. Resource scale-down when backfill completes

## Data Flow

### Backfill Path

```
Source Cluster → Snapshot (S3) → RFS Workers → Target Cluster
```

### Capture and Replay Path

```
Clients → Capture Proxy → Source Cluster
                ↓
              Kafka
                ↓
         Traffic Replayer → Target Cluster
```
