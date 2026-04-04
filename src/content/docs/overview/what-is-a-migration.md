---
title: What Is a Migration
description: Understanding the three aspects of migration and the scenarios Migration Assistant supports.
---

A migration from Elasticsearch or OpenSearch to OpenSearch involves three distinct aspects, each of which can be performed independently or combined.

## Three Aspects of Migration

### 1. Metadata Migration

Migrates index settings, mappings, templates, component templates, and aliases from the source to the target cluster. Includes automatic field type transformations for compatibility (e.g., `string` → `text`/`keyword`, `dense_vector` → `knn_vector`).

### 2. Backfill (Existing Data)

Reindex-from-Snapshot (RFS) takes a fundamentally different approach from traditional reindexing. Instead of reading documents through the source cluster's HTTP API, it:

1. Takes a one-time snapshot of the source cluster
2. Reads the raw Lucene segment files directly from the snapshot in S3
3. Extracts documents and applies transformations
4. Bulk-indexes them on the target

Because workers read from object storage — not the source cluster — scaling up workers has **zero impact on the source cluster**.

### 3. Live Traffic Capture and Replay

A proxy fleet sits in front of the source cluster, forwarding all requests while recording them to Kafka. The Traffic Replayer reads from Kafka and replays requests against the target cluster, enabling zero-downtime migration validation.

## Three Migration Scenarios

### Scenario 1: Backfill Only

Migrate existing data without capturing live traffic. Best for clusters that can tolerate a maintenance window or where live traffic validation is not required.

**Steps:** Assessment → Snapshot → Metadata → Backfill → Validation → Cutover

### Scenario 2: Live Capture and Replay Only

Capture and replay live traffic without backfilling historical data. Useful for validating the target cluster with real traffic patterns before a full migration.

**Steps:** Assessment → Deploy Proxy → Capture Traffic → Replay → Validation

### Scenario 3: Combined (Backfill + Live Capture)

The complete migration path — backfill historical data while simultaneously capturing and replaying live traffic for zero-downtime migration.

**Steps:** Assessment → Deploy Proxy → Capture → Snapshot → Metadata → Backfill → Replay → Validation → Cutover

## Iterative Workflows

Migration Assistant supports iterative workflows. You can run metadata migration, backfill, or replay multiple times, adjusting configuration between runs. Argo Workflows provides approval gates so you can review results before proceeding to the next phase.
