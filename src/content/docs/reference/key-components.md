---
title: Key Components
description: Detailed reference for each Migration Assistant component.
---

Migration Assistant consists of several components that work together to orchestrate migrations.

## Migration Console

The central CLI for all migration operations. Provides `console` and `workflow` command namespaces.

- **K8s resource:** StatefulSet `migration-console-0` in namespace `ma`
- **Access:** `kubectl exec -it migration-console-0 -n ma -- bash`
- **Contains:** CLI tools, workflow configuration, Argo client

## Argo Workflows

Kubernetes-native workflow engine that orchestrates migration steps.

- **K8s resources:** `argo-workflows-server` and `argo-workflows-workflow-controller` Deployments
- **Features:** Parallel execution, retry logic, approval gates, progress tracking
- **UI:** Accessible via port-forward to the Argo server pod

## Capture Proxy

Stateless HTTP proxy fleet that forwards requests to the source cluster while recording them to Kafka.

- **K8s resource:** Deployment with Service (NLB on EKS)
- **Scaling:** Horizontal scaling based on traffic volume
- **Protocol:** HTTP/HTTPS passthrough

## Traffic Replayer

Reads captured traffic from Kafka and replays it against the target cluster.

- **K8s resource:** Deployment
- **Features:** Time scaling (speedup factor), Jolt transforms, tuple logging
- **Monitoring:** CloudWatch metrics, tuple logs for request/response comparison

## Reindex-from-Snapshot (RFS)

Document migration engine that reads raw Lucene segment files from S3 snapshots.

- **K8s resource:** Jobs managed by Argo Workflows
- **Scaling:** Up to 1 worker per shard, reads from S3 (zero source cluster impact)
- **Performance:** 590,000 docs/min per 2 vCPU worker

## Metadata Migration Tool

Migrates index settings, mappings, templates, and aliases with automatic field type transformations.

- **Runs inside:** Migration Console pod
- **Transforms:** `string` → `text`/`keyword`, `dense_vector` → `knn_vector`, `flattened` → `flat_object`, multi-type mappings
- **Custom transforms:** JavaScript transformation framework

## Kafka (Strimzi)

Durable message queue for traffic capture between the proxy fleet and the replayer.

- **K8s resource:** Strimzi operator-managed or external Kafka cluster
- **Purpose:** Buffers captured traffic for reliable replay
- **Configuration:** Auto-managed topic creation and retention
