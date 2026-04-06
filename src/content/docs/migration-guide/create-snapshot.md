---
title: Create Snapshot
description: Create a point-in-time snapshot of the source cluster for backfill migration.
---
A snapshot captures every index on your source cluster at a point in time.
[Reindex-from-Snapshot (RFS)](/opensearch-migrations-eks/migration-guide/backfill/) reads raw Lucene
segment files directly from the snapshot in S3 — the source cluster is only loaded during
the snapshot itself.

:::note
You only need a snapshot if you plan to use **backfill**. If you are doing a
live-traffic-only migration (Capture & Replay without historical data), you can
skip this step.
:::

## Prerequisites

Before creating the snapshot, confirm:

- The **S3 repository plugin** is installed on every data node of the source cluster.
- The source cluster's IAM role (or instance profile) has `s3:PutObject` and `s3:GetObject`
  permissions on the snapshot bucket.
- The Migration Console can reach the source cluster (`console clusters connection-check`).

## Creating a Snapshot

1. **Start the snapshot:**

   ```bash
   console snapshot create
   ```

   This registers the S3 repository (if not already registered) and triggers a
   cluster-wide snapshot.

2. **Monitor progress:**

   ```bash
   console snapshot status
   ```

   Sample output:

   ```text
   Snapshot: migration-assistant-snap-20240615
   State:    IN_PROGRESS
   Indices:  142 / 142
   Shards:   480 / 710  (67.6%)
   Duration: 14m 32s
   ```

3. **Wait for completion.** The snapshot is finished when `State` changes to `SUCCESS`.
:::tip
**Estimating time:** Snapshot speed depends on data size and network throughput to S3.
A rough baseline is **~500 GB/hour** on a well-provisioned cluster with a 10 Gbps link.
:::

## Snapshot Storage

Snapshots are stored in the S3 bucket provisioned during deployment:

```

s3://migrations-default-<ACCOUNT>-<STAGE>-<REGION>/snapshots/
```

:::caution
This bucket is **not** automatically deleted during [Teardown](/opensearch-migrations-eks/migration-guide/teardown/).
Delete it manually when you no longer need the snapshot data.
:::

## Troubleshooting Slow Snapshots

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Throughput < 100 GB/hour | Network bottleneck between source and S3 | Verify the source cluster is in the same region as the bucket; check VPC endpoints |
| Individual shard stuck at 0 % | Large shard with heavy write load | Reduce indexing rate or set `indices.memory.index_buffer_size` lower temporarily |
| `RepositoryMissingException` | S3 plugin not installed | Install the `repository-s3` plugin on every data node and restart |
| `AccessDenied` on S3 put | IAM permissions missing | Add `s3:PutObject`, `s3:GetObject`, and `s3:ListBucket` to the source cluster's role |

### Verifying the S3 Repository Plugin

```bash
console clusters connection-check
```

The connection check reports whether the plugin is detected. You can also verify directly:

```bash
curl -s https://<source-cluster>:9200/_cat/plugins?v | grep repository-s3
```

## Next Steps

After the snapshot completes, proceed to
[Migrate Metadata](/opensearch-migrations-eks/migration-guide/migrate-metadata/).
