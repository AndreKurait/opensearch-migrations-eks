---
title: What Is a Migration
description: The three aspects of migration, why RFS over reindex API, how RFS works, and choosing your scenario.
---

A migration moves your data, metadata, and (optionally) live traffic from one Elasticsearch or OpenSearch cluster to another.

## The Three Aspects of a Migration

Every migration involves up to three independent concerns. You may need all three, or just one or two.

| Aspect | What it does | When you need it |
|--------|-------------|-----------------|
| **Metadata migration** | Copies index settings, mappings, templates, component templates, and aliases | Always — the target needs to know how your data is structured before documents arrive |
| **Backfill (historical data)** | Moves existing documents from source to target | Always — unless starting fresh with an empty target |
| **Capture and Replay (live traffic)** | Records ongoing writes and replays them on the target | When you need zero-downtime migration and can't pause writes during backfill |

## Why Not Just Snapshot/Restore or the Reindex API?

### Native snapshot/restore

- **Major version gap**: Only works within the same major version or one major version up (e.g., ES 7.x → OS 1.x). Jumping further requires multiple intermediate upgrades.
- **Downtime**: Restore requires the target to be offline or empty. No built-in way to keep the target in sync with ongoing writes.
- **No transformation**: If field types or mappings need to change between versions, snapshot/restore can't help.

### The `_reindex` API

- **Source cluster load**: Every document is read through the source cluster's HTTP and search layers, putting significant load on production.
- **Fragile**: Sensitive to source node failures, network interruptions, and cluster instability.
- **Slow**: Works through the distributed system's HTTP layer on both sides.
- **Version limits**: Remote reindex has its own compatibility constraints and may not work across large version gaps.
- **No parallelism control**: Limited ability to fan out across shards. Scaling up means more load on the source.

### How RFS Is Different

**Reindex-from-Snapshot (RFS)** takes a fundamentally different approach:

1. Takes a **one-time snapshot** of the source cluster (the only time the source is touched)
2. Reads the **raw Lucene segment files** directly from the snapshot in S3
3. Extracts documents, applies transformations, and **bulk-indexes them on the target**

This means: **zero ongoing source load**, **no version compatibility limit** (e.g., ES 1.x → OS 3.x), **massive parallelism** (one worker per shard), and **full resumability** (failed shards are retried without restarting).

## How RFS Works

### The Process

1. **Snapshot** — A point-in-time snapshot of the source cluster is created and stored in S3
2. **Shard splitting** — The snapshot is split into its component shards. Each shard is an independent unit of work.
3. **Parallel processing** — A fleet of RFS workers each pick up a shard, extract documents from the raw Lucene files, apply transformations, and bulk-index them on the target
4. **Coordination** — Progress is tracked automatically so completed shards are not reprocessed on retry

### Why This Matters

- **Parallelism**: Each shard is independent. More workers = faster migration. Maximum useful worker count equals your primary shard count.
- **Resumability**: If a worker dies, its shard lease expires and another worker picks it up. Work is never lost.
- **No source impact**: After the initial snapshot, the source cluster is not touched.
- **Version independence**: Works across any supported version gap.

### Performance Characteristics

| Factor | Impact |
|--------|--------|
| Number of primary shards | Determines maximum parallelism (1 worker per shard max) |
| Shard size | Larger shards take longer per worker |
| Target cluster capacity | Indexing throughput is usually the bottleneck |
| Network/S3 bandwidth | Affects snapshot read speed |
| Worker count | More workers = more parallel shards processed |

## How Capture and Replay Works

1. **Capture Proxy** — An isolated fleet deployed alongside the source cluster. Forwards every request to the source while recording to Kafka. The source cluster is never modified.
2. **Kafka** — Durable message queue buffering captured traffic. Per-connection ordering is preserved.
3. **Traffic Replayer** — Reads from Kafka, reconstructs HTTP requests, applies transformations, and replays against the target. Can compare source and target responses.
4. **Switchover** — Once the target is caught up and validated, client traffic is redirected.

:::note
Capture and Replay requires that clients provide explicit document IDs for index and update operations. Automatically generated document IDs are not preserved during replay.
:::

## Three Migration Scenarios

### Scenario 1: Backfill Only

Best when you can tolerate a brief write pause or replay writes from an external queue.

```

Snapshot source → Migrate metadata → Backfill documents → Verify → Switch traffic
```

### Scenario 2: Capture and Replay Only

Best when data is small enough that live replay alone can synchronize the target, or when you only need to validate target behavior.

```

Start capturing → Migrate metadata → Replay traffic → Verify → Switch traffic
```

### Scenario 3: Backfill + Capture and Replay (Zero-Downtime)

The most comprehensive approach. Capture begins first so no writes are lost.

```

Start capturing → Snapshot source → Migrate metadata → Backfill → Replay catches up → Verify → Switch traffic
```

:::note
Capture and Replay support is version-dependent. Check your installed version's capabilities with `console --version`.
:::

## Iterative Migration Workflows

Migrations are rarely one-shot. Plan for iteration.

### Test with a Subset First

Use index allowlists to migrate a small representative set of indexes before doing the full migration:

- Validate field type compatibility
- Estimate total migration time
- Tune worker count and resource allocation
- Verify application behavior against the target

### The Iterative Cycle

```

Configure → Submit → Monitor → Validate → Adjust → Repeat
```

### When to Start Over vs. Resume

- **RFS backfill failed mid-shard**: Resubmit the workflow. RFS tracks completed shards automatically — only incomplete shards are reprocessed.
- **Metadata migration had errors**: Fix the configuration, clear the problematic indexes on the target, and resubmit.
- **Wrong indexes migrated**: Clear the target indexes and resubmit with corrected allowlists.
- **Re-run with fresh data**: Delete the target indexes first, then resubmit. RFS only performs puts — it does not delete documents removed from the source.

## Choosing Your Scenario

| Question | If yes... |
|----------|-----------|
| Can you pause writes during migration? | Scenario 1 (Backfill only) is simplest |
| Do you need zero downtime? | Scenario 3 (Backfill + Capture and Replay) |
| Is your data small and write-heavy? | Scenario 2 (Capture and Replay only) may suffice |
| Just upgrading versions with the same data? | Scenario 1 with a fresh snapshot |
