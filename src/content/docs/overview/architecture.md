---
title: Architecture
description: Kubernetes architecture, component overview, and Argo Workflows orchestration.
---

Migration Assistant runs on Kubernetes and uses Argo Workflows for orchestration. It works on any Kubernetes distribution — Amazon EKS, GKE, AKS, OpenShift, or self-managed clusters.

## Architecture Overview

![Migration Assistant Architecture](/opensearch-migrations-eks/images/architecture.svg)

## Workflow Phases

When a migration workflow is submitted, Argo Workflows orchestrates the following phases:

| Phase | What happens | Components involved |
|-------|-------------|---------------------|
| **1. Snapshot** | Point-in-time snapshot of the source cluster is written to object storage | Source cluster → Object storage |
| **2. Metadata migration** | Index settings, mappings, templates, and aliases are applied to the target | Migration Console → Target cluster |
| **3. ⏸ Approval gate** | Workflow pauses for human review of metadata results | Argo Workflows |
| **4. Backfill** | RFS worker jobs read Lucene segment files from the snapshot and bulk-index documents on the target | RFS Workers ← Object storage → Target cluster |
| **5. Scale-down** | Worker jobs are removed after backfill completes | Argo Workflows |

If Capture and Replay is enabled, two additional components run throughout:

| Phase | What happens | Components involved |
|-------|-------------|---------------------|
| **Capture** (continuous) | Proxy fleet records all traffic to Kafka | Capture Proxy → Kafka |
| **Replay** (continuous) | Replayer reads from Kafka and writes to target | Kafka → Traffic Replayer → Target cluster |

See [Workflow CLI Getting Started](/opensearch-migrations-eks/workflow-cli/getting-started/) for the commands to configure, submit, and monitor workflows.

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

Source Cluster                                          Target Cluster
     │                                                       ▲
     │ (one-time)                                            │ (bulk index)
     ▼                                                       │
  Snapshot ──► Object Storage (S3/GCS/MinIO) ──► RFS Workers ┘
                  (Lucene segment files)         (1 per shard)
```

RFS workers read raw Lucene segment files directly from the snapshot — the source cluster is never queried after the snapshot is taken. Each worker processes one primary shard at a time. The maximum useful worker count equals the number of primary shards in the indexes being migrated.

## Capture and Replay Data Flow

```

Clients ──► Capture Proxy ──► Source Cluster
                 │
                 │ (record)
                 ▼
               Kafka
                 │
                 │ (replay)
                 ▼
          Traffic Replayer ──► Target Cluster
```

The capture proxy is deployed as a separate fleet in front of the source cluster. It forwards every request to the source unchanged while writing a copy to Kafka. The source cluster itself is never modified. Traffic is routed to the proxy via DNS, load balancer, or Kubernetes Service changes.

:::caution
Capture and Replay requires that clients include explicit document IDs in index and update operations. Auto-generated IDs are not preserved during replay, which would cause duplicate documents on the target.
:::

## Resource Requirements

Minimum resources for the Migration Assistant infrastructure components (not including RFS workers):

| Component | Replicas | CPU (request) | Memory (request) | Storage |
|-----------|----------|---------------|-------------------|---------|
| Migration Console | 1 | 0.5 | 512 Mi | 1 Gi |
| Argo Workflows Server | 1 | 0.25 | 256 Mi | — |
| Argo Workflows Controller | 1 | 0.25 | 256 Mi | — |
| Kafka (Strimzi, if using Capture) | 3 | 1 | 2 Gi | 100 Gi per broker |
| Capture Proxy (if using Capture) | 2+ | 0.5 | 512 Mi | — |
| Traffic Replayer (if using Capture) | 1+ | 2 | 4 Gi | — |

RFS worker resources are configured separately. Each worker defaults to 2 vCPU and 4 GB memory. Scale the number of workers based on your primary shard count (maximum 1 worker per shard).

## Platform-Specific Notes

| Platform | Object Storage | Proxy Service | Monitoring | Deployment Method |
|----------|---------------|---------------|------------|-------------------|
| **Amazon EKS** | S3 | NLB | CloudWatch | [Bootstrap script](/opensearch-migrations-eks/deployment/deploying-to-eks/) automates cluster + CloudFormation |
| **GKE / AKS** | GCS / Azure Blob | Standard LoadBalancer | Grafana | [Helm chart](/opensearch-migrations-eks/deployment/deploying-to-kubernetes/) |
| **OpenShift** | S3-compatible | Route | Grafana | [Helm chart](/opensearch-migrations-eks/deployment/deploying-to-kubernetes/) with SecurityContextConstraints |
| **Self-managed** | MinIO or S3-compatible | NodePort / Ingress | Grafana | [Helm chart](/opensearch-migrations-eks/deployment/deploying-to-kubernetes/) |

:::tip
For EKS deployments, the bootstrap script handles IAM roles, security groups, and S3 bucket creation automatically. See [IAM & Security](/opensearch-migrations-eks/deployment/iam-and-security/) for details on the roles and policies created.
:::
