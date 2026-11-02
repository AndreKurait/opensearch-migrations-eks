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
| **Capture and Replay (live traffic)** | Records routed traffic and replays it on the target | When writes continue during backfill and you need to reduce the cutover pause |

## Why Not Just Snapshot/Restore or the Reindex API?

### Native snapshot/restore

- **Version compatibility**: Restore compatibility depends on the engine and the version that created each index. Check the [upstream snapshot/restore requirements](https://docs.opensearch.org/latest/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/) for your source and target.
- **Target conflicts and ongoing writes**: Restore can run on a running cluster, but conflicting index names need to be handled, for example by renaming restored indexes. Restore alone does not synchronize writes made after the snapshot.
- **No transformation**: If field types or mappings need to change between versions, snapshot/restore can't help.

### The `_reindex` API

- **Source cluster load**: Every document is read through the source cluster's HTTP and search layers, putting significant load on production.
- **Fragile**: Sensitive to source node failures, network interruptions, and cluster instability.
- **Slow**: Works through the distributed system's HTTP layer on both sides.
- **Version limits**: Remote reindex has its own compatibility constraints and may not work across large version gaps.
- **No parallelism control**: Limited ability to fan out across shards. Scaling up means more load on the source.

### How RFS Is Different

**Reindex-from-Snapshot (RFS)** takes a fundamentally different approach:

1. Creates or reuses a **snapshot** of the source cluster
2. Reads the **raw Lucene segment files** directly from the snapshot in S3
3. Extracts documents, applies transformations, and **bulk-indexes them on the target**

RFS reads bulk document data from the snapshot rather than the source's live search APIs. Supported version paths, snapshot codecs, shard sizes, and retry behavior still impose limits. Check the [upstream compatibility guidance](https://docs.opensearch.org/latest/migration-assistant/is-migration-assistant-right-for-you/) and validate a representative subset first.

## How RFS Works

### The Process

1. **Snapshot** — A snapshot of the source cluster is created and stored in S3; shards can represent different moments during snapshot creation
2. **Shard splitting** — The snapshot is split into its component shards. Each shard is an independent unit of work.
3. **Parallel processing** — A fleet of RFS workers each pick up a shard, extract documents from the raw Lucene files, apply transformations, and bulk-index them on the target
4. **Coordination** — Workers track shard progress; recovery depends on the installed version and retained coordination state

### Why This Matters

- **Parallelism**: Workers can process different shards concurrently. Target indexing capacity, shard count, and network throughput limit useful concurrency.
- **Recovery**: Failed shard work may be retried. Check workflow status, retained checkpoints, and document-level failures before resuming.
- **Reduced source read load**: Bulk reads come from the snapshot. Snapshot creation, metadata queries, and validation can still use the source.
- **Version migration**: RFS supports the paths listed for your Migration Assistant release, subject to codec and feature limitations.

### Performance Characteristics

| Factor | Impact |
|--------|--------|
| Number of primary shards | Determines maximum parallelism (1 worker per shard max) |
| Shard size | Larger shards take longer per worker |
| Target cluster capacity | Indexing throughput is usually the bottleneck |
| Network/S3 bandwidth | Affects snapshot read speed |
| Worker count | More workers = more parallel shards processed |

## How Capture and Replay Works

1. **Capture Proxy** — A fleet deployed in front of the source cluster. It forwards traffic routed through it while recording to Kafka. Clients that bypass the proxy are not captured.
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

Useful when the target already has the required historical baseline, or when captured traffic is sufficient for a behavior-validation experiment. Replay does not recover existing documents that are never present in captured writes; a small source dataset alone does not remove the need for backfill.

```

Start capturing → Migrate metadata → Replay traffic → Verify → Switch traffic
```

### Scenario 3: Backfill + Capture and Replay

Start and verify capture before creating the snapshot. Before cutover, verify capture coverage, retention, replay lag, failed writes, and target data. This approach can reduce the write pause; the workflow alone does not guarantee a lossless or uninterrupted cutover.

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

- **RFS backfill failed mid-shard**: Inspect the failure, retained coordination state, and failed-document records. Use the recovery procedure for your installed version; resubmitting is not a universal guarantee that only incomplete work runs.
- **Metadata migration had errors**: Fix the configuration, clear the problematic indexes on the target, and resubmit.
- **Wrong indexes migrated**: Clear the target indexes and resubmit with corrected allowlists.
- **Re-run with fresh data**: Delete the target indexes first, then resubmit. RFS only performs puts — it does not delete documents removed from the source.

## Choosing Your Scenario

| Question | If yes... |
|----------|-----------|
| Can you pause writes during migration? | Scenario 1 (Backfill only) is simplest |
| Do writes need to continue during backfill? | Evaluate Scenario 3 and validate the cutover procedure |
| Does the target already have the required historical baseline? | Scenario 2 may suffice for subsequent captured writes |
| Just upgrading versions with the same data? | Scenario 1 with a fresh snapshot |
