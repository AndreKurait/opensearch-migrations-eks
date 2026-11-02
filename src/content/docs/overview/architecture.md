---
banner:
  content: 'Frozen documentation prototype — November 2026. For current releases, see <a href="https://github.com/opensearch-project/opensearch-migrations">OpenSearch Migrations</a>.'
title: Architecture
description: Kubernetes architecture, component overview, and Argo Workflows orchestration.
---

Migration Assistant runs on Kubernetes and uses Argo Workflows for orchestration. Upstream documents EKS and generic Kubernetes paths; this site does not establish compatibility with every distribution, storage backend, or network configuration.

## Architecture Overview

![Migration Assistant Architecture](/opensearch-migrations-eks/images/architecture.svg)

## Workflow Phases

Depending on the selected configuration and release, a migration workflow can include these phases:

| Phase | What happens | Components involved |
|-------|-------------|---------------------|
| **1. Snapshot** | Snapshot of source shards is written to object storage; shard capture times can differ | Source cluster → Object storage |
| **2. Metadata migration** | Index settings, mappings, templates, and aliases are applied to the target | Migration Console → Target cluster |
| **3. ⏸ Approval gate** | A configured gate pauses for human review | Argo Workflows |
| **4. Backfill** | RFS worker jobs read Lucene segment files from the snapshot and bulk-index documents on the target | RFS Workers ← Object storage → Target cluster |
| **5. Scale-down** | Worker jobs are removed after backfill completes | Argo Workflows |

If Capture and Replay is enabled, two additional components run throughout:

| Phase | What happens | Components involved |
|-------|-------------|---------------------|
| **Capture** (continuous) | Proxy fleet records traffic routed through it to Kafka | Capture Proxy → Kafka |
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
  Snapshot ──► Snapshot Storage (S3) ──► RFS Workers ──────┘
                  (Lucene segment files)         (1 per shard)
```

RFS workers read bulk document data from the snapshot rather than the source's live search APIs. Snapshot creation, metadata queries, and validation can still use the source. Each worker processes one primary shard at a time; shard count, target capacity, and network bandwidth limit useful concurrency.

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

The capture proxy is deployed as a separate fleet in front of the source cluster. It forwards routed requests to the source while recording them to Kafka; forwarded writes still modify source data. Traffic reaches the proxy through DNS, load balancer, or Kubernetes Service changes. Verify that no relevant client bypasses it.

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

These are deployment considerations, not a tested platform compatibility matrix. Verify storage support, networking, and monitoring integrations against your Migration Assistant release.

| Platform | Object Storage | Proxy Service | Monitoring | Deployment Method |
|----------|---------------|---------------|------------|-------------------|
| **Amazon EKS** | S3 | NLB | CloudWatch | [Bootstrap script](/opensearch-migrations-eks/deployment/deploying-to-eks/) automates cluster + CloudFormation |
| **GKE / AKS** | Verify storage support for the installed release | Standard LoadBalancer | Environment-specific | [Helm chart](/opensearch-migrations-eks/deployment/deploying-to-kubernetes/) requires platform configuration |
| **OpenShift** | S3-compatible | Route | Grafana | [Helm chart](/opensearch-migrations-eks/deployment/deploying-to-kubernetes/) with SecurityContextConstraints |
| **Self-managed** | MinIO or S3-compatible | NodePort / Ingress | Grafana | [Helm chart](/opensearch-migrations-eks/deployment/deploying-to-kubernetes/) |

:::tip
EKS bootstrap automation is release-specific. Review the generated resources and verify identity from both the console and workflow executor pods; a successful console connection check does not establish executor permissions. See [IAM & Security](/opensearch-migrations-eks/deployment/iam-and-security/) and the [upstream workflow setup](https://docs.opensearch.org/latest/migration-assistant/workflow-cli/getting-started/).
:::
