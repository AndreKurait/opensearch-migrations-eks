---
title: Architecture
description: Kubernetes architecture, component overview, and Argo Workflows orchestration.
---

Migration Assistant runs on Kubernetes and uses Argo Workflows for orchestration. It works on any Kubernetes distribution — Amazon EKS, GKE, AKS, OpenShift, or self-managed clusters.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Kubernetes Cluster                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Namespace: ma                               │  │
│  │                                                               │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐  │  │
│  │  │ Migration Console│  │  Argo Workflows  │  │  Monitoring │  │  │
│  │  │  (StatefulSet)   │  │ Server+Controller│  │ OTel+Grafana│  │  │
│  │  └────────┬─────────┘  └────────┬─────────┘  └─────────────┘  │  │
│  │           │                     │                              │  │
│  │  ┌────────┴─────────────────────┴──────────────────────────┐  │  │
│  │  │              Managed by Argo Workflows                   │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │  │
│  │  │  │  RFS Workers │  │Capture Proxy │  │   Traffic    │  │  │  │
│  │  │  │   (Jobs)     │  │ (Deployment) │  │  Replayer    │  │  │  │
│  │  │  │  1 per shard │  │  + Service   │  │ (Deployment) │  │  │  │
│  │  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │  │  │
│  │  └─────────┼─────────────────┼─────────────────┼───────────┘  │  │
│  └────────────┼─────────────────┼─────────────────┼──────────────┘  │
└───────────────┼─────────────────┼─────────────────┼─────────────────┘
                │                 │                 │
        ┌───────┴───────┐  ┌─────┴─────┐  ┌───────┴───────┐
        │  Object Store │  │   Kafka    │  │ Target Cluster│
        │  (S3 / GCS /  │  │ (Strimzi / │  │  (OpenSearch) │
        │   MinIO)      │  │  external) │  │               │
        └───────┬───────┘  └─────┬─────┘  └───────────────┘
                │                │
        ┌───────┴───────┐  ┌────┴────────────┐
        │    Snapshot    │  │  Source Cluster  │
        │  (from source)│  │ (ES / OpenSearch)│
        └───────────────┘  └─────────────────┘
```

## Data Flow

### Step 1: Prepare

Decide how to handle ongoing writes — pause them (simplest) or capture them via the proxy fleet for zero-downtime migration.

### Step 2: Configure and Submit

From the Migration Console, configure your migration in YAML and submit it to Argo Workflows:

```bash
workflow configure edit    # Edit configuration
workflow submit            # Submit to Argo Workflows
```

### Step 3: Monitor

The workflow orchestrates each phase with approval gates:

1. **Snapshot** — Point-in-time snapshot of the source cluster → object storage
2. **Metadata** — Index settings, mappings, templates, aliases → target cluster
3. **⏸ Approval gate** — Review metadata results before proceeding
4. **Backfill** — RFS workers read Lucene files from snapshot → bulk index on target
5. **Scale-down** — Workers removed when backfill completes

```bash
workflow status            # Check progress
workflow manage            # Interactive TUI
workflow approve           # Approve a gate
```

### Step 4: Flush (if using external queue)

If you queued writes externally during migration, flush them to the target now.

### Step 5: Validate and Switch

Compare document counts and queries between source and target. When satisfied, redirect traffic.

## Component Details

| Component | K8s Resource | Description |
|-----------|-------------|-------------|
| **Migration Console** | StatefulSet | CLI for all migration operations (`console` + `workflow` commands) |
| **Argo Workflows** | Deployment (server + controller) | Orchestrates migration phases with parallel execution, retry, approval gates |
| **RFS Workers** | Jobs (managed by Argo) | Read Lucene segment files from snapshot in object storage. 1 worker per shard max. |
| **Capture Proxy** | Deployment + Service | Forwards requests to source while recording to Kafka. Stateless, horizontally scalable. |
| **Traffic Replayer** | Deployment | Reads from Kafka, replays against target with transforms and speedup factor. |
| **Kafka** | Strimzi operator or external | Durable message queue for traffic capture. Auto-managed or bring-your-own. |
| **Monitoring** | OTel Collector + Grafana | Metrics and dashboards for migration progress. CloudWatch on EKS. |

## Backfill Data Flow

```
Source Cluster → Snapshot → Object Storage (S3/GCS/MinIO) → RFS Workers → Target Cluster
```

RFS workers read raw Lucene segment files directly from the snapshot — the source cluster is never queried after the snapshot is taken.

## Capture and Replay Data Flow

```
Clients → Capture Proxy → Source Cluster
                ↓
              Kafka
                ↓
         Traffic Replayer → Target Cluster
```

The capture proxy is deployed as a separate fleet. The source cluster is never modified — traffic is routed to the proxy via DNS, load balancer, or Kubernetes Service changes.

## Platform-Specific Notes

| Platform | Notes |
|----------|-------|
| **Amazon EKS** | Bootstrap script automates cluster creation via CloudFormation. NLB for proxy service. S3 for snapshots. CloudWatch for monitoring. |
| **GKE / AKS** | Deploy via Helm chart. Use GCS or Azure Blob for snapshots. Standard LoadBalancer for proxy. |
| **OpenShift** | Deploy via Helm chart with appropriate SecurityContextConstraints. |
| **Self-managed** | Deploy via Helm chart. MinIO or any S3-compatible storage for snapshots. |
