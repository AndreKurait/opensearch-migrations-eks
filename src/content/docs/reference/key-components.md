---
title: Key Components
description: Detailed reference for each Migration Assistant component.
---

## Migration Console

The central CLI for all migration operations. Deployed as a StatefulSet (`migration-console-0`) in the `ma` namespace.

**Access:**
```bash
kubectl exec -it migration-console-0 -n ma -- bash
```

Provides both `console` commands (direct operations) and `workflow` commands (Argo-orchestrated workflows).

## Argo Workflows

Kubernetes-native workflow engine providing:
- Parallel execution of migration steps
- Retry logic for transient failures
- Approval gates for human-in-the-loop confirmation
- Automatic resource provisioning and cleanup

Deployed as two pods: `argo-workflows-server` (UI/API) and `argo-workflows-workflow-controller` (execution engine).

## Capture Proxy

Stateless HTTP proxy fleet that:
- Forwards all requests to the source cluster
- Records request/response pairs to Kafka
- Deployed as a K8s Deployment with a Service (NLB on EKS)

## Traffic Replayer

Reads captured traffic from Kafka and replays it against the target cluster. Supports:
- Time scaling (speedup factor)
- Jolt request transformations
- Response comparison for validation

## Reindex-from-Snapshot (RFS)

Document migration engine that reads raw Lucene segment files directly from S3 snapshots. Key characteristics:
- **Zero source cluster impact** — reads from S3, not the source
- **Parallel workers** — one worker per primary shard maximum
- **Automatic transformations** — field type conversions applied during indexing

## Metadata Migration Tool

Migrates index definitions from source to target:
- Index settings and mappings
- Index templates and component templates
- Aliases
- Automatic field type transformations

## Kafka (Strimzi)

Durable message queue for traffic capture. On EKS, managed by the Strimzi Kafka operator. Can also use an external Kafka cluster.
