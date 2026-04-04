---
title: What Is a Migration
description: Understand how Migration Assistant moves data between clusters.
---

## How RFS Works

Reindex-from-Snapshot (RFS) takes a fundamentally different approach from traditional reindexing. Instead of reading documents through the source cluster's HTTP API, it:

1. Takes a **one-time snapshot** of the source cluster
2. Reads the **raw Lucene segment files** directly from the snapshot in S3
3. Extracts documents and applies transformations
4. Bulk-indexes them on the target cluster

Because workers read from object storage — not the source cluster — **scaling up workers has zero impact on the source cluster**.

## How Traffic Capture & Replay Works

For live traffic migration:

1. A **Capture Proxy fleet** sits between clients and the source cluster
2. All requests are forwarded to the source **and** recorded to **Kafka**
3. The **Traffic Replayer** reads from Kafka and replays requests against the target
4. Responses are compared for validation

This enables zero-downtime migration validation while the source cluster continues serving production traffic.

## Migration Scenarios

### Scenario 1: Backfill Only

Best for migrations where you can tolerate a maintenance window or where live traffic continuity is not required.

**Steps:** Snapshot → Metadata migration → RFS backfill → Validate → Switch traffic

### Scenario 2: Live Capture & Replay Only

Best when you need to validate the target cluster with real production traffic before switching.

**Steps:** Deploy proxy → Capture traffic → Replay against target → Validate → Switch traffic

### Scenario 3: Combined Migration

The most comprehensive approach — migrates historical data while simultaneously capturing and replaying live traffic.

**Steps:** Deploy proxy → Capture traffic → Snapshot → Metadata → RFS backfill → Replay → Validate → Switch traffic

## Performance Benchmarks

Tested 2025-03-10:

| Service | vCPU | Memory | Peak Docs/min | Primary Shard Rate (MBps) |
|---------|------|--------|---------------|---------------------------|
| RFS | 2 | 4 GB | 590,000 | 15.1 |
| RFS (w/ type mapping) | 2 | 4 GB | 546,000 | 14.0 |
| Traffic Replay | 8 | 48 GB | 1,694,000 | 43.5 |
| Traffic Replay (w/ type mapping) | 8 | 48 GB | 1,645,000 | 42.2 |
