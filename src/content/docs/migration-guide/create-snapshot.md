---
title: Create Snapshot
description: Create a point-in-time snapshot of your source cluster.
---

A snapshot captures the state of your source cluster at a point in time. RFS reads directly from this snapshot in S3.

## Create a Snapshot

From the Migration Console:

```bash
console snapshot create
```

## Check Snapshot Status

```bash
console snapshot status
```

## Managing Slow Snapshots

Large clusters may take hours to snapshot. Tips:

- **Monitor progress** with `console snapshot status`
- **Avoid heavy indexing** during the snapshot if possible
- **Use incremental snapshots** if you've previously snapshotted the cluster

:::note
The snapshot is read-only after creation. RFS workers read Lucene segment files directly from S3, so the source cluster is not impacted during backfill.
:::
