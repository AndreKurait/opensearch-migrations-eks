---
title: Architecture
description: EKS architecture and workflow orchestration for Migration Assistant.
---

Migration Assistant runs on Kubernetes and uses **Argo Workflows** for orchestration. The architecture works on AWS EKS, but Migration Assistant works equivalently on any Kubernetes distribution including GKE, AKS, OpenShift, and self-managed clusters.

## EKS Deployment Architecture

```
AWS CloudShell / Local Terminal
  └── aws-bootstrap.sh
       ├── CloudFormation Stack
       │   ├── VPC (create or import)
       │   ├── EKS Cluster
       │   ├── IAM Roles (snapshot, node)
       │   └── S3 Bucket
       └── Helm Chart Installation
            └── Namespace: ma
                 ├── argo-workflows-server
                 ├── argo-workflows-workflow-controller
                 └── migration-console-0
```

## Workflow Orchestration

Configure and submit a migration workflow from the Migration Console:

```bash
workflow configure edit    # Edit configuration
workflow submit            # Submit to Argo Workflows
```

The workflow orchestrates:

1. **Point-in-time snapshot** of the source cluster
2. **Metadata migration** — indexes, templates, component templates, aliases
3. **Approval gate** — workflow pauses for user confirmation
4. **Resource provisioning** for RFS backfill workers
5. **Resource scale-down** when backfill completes

## Data Flow: Capture & Replay

```
Clients → Capture Proxy Fleet → Source Cluster
              │
              └── records traffic → Kafka
                                      │
                                      └── replays → Traffic Replayer → Target Cluster
```

## Component Pods

After deployment, the `ma` namespace contains:

| Pod | Type | Purpose |
|-----|------|---------|
| `migration-console-0` | StatefulSet | CLI for all migration operations |
| `argo-workflows-server-*` | Deployment | Argo UI and API server |
| `argo-workflows-workflow-controller-*` | Deployment | Workflow execution engine |

Additional pods are created dynamically by workflows:

- **RFS workers** — K8s Jobs managed by Argo, one per shard
- **Capture Proxy** — Deployment with Service (NLB on EKS)
- **Traffic Replayer** — Deployment reading from Kafka
- **Kafka (Strimzi)** — Auto-managed or external message queue
