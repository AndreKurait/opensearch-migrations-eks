---
title: Create Snapshot
description: Create a point-in-time snapshot of the source cluster for backfill migration.
---

A snapshot captures the state of your source cluster at a point in time. RFS uses this snapshot to read Lucene segment files directly from S3.

## Creating a Snapshot

From the Migration Console:

```bash
console snapshot create
```

## Checking Snapshot Status

```bash
console snapshot status
```

The snapshot status shows progress for each index and shard.

## Snapshot Storage

Snapshots are stored in the S3 bucket configured during deployment:

```
s3://migrations-default-<ACCOUNT>-<STAGE>-<REGION>/snapshots/
```

## Slow Snapshots

If snapshot creation is slow:

- Check network bandwidth between the source cluster and S3
- Verify the S3 repository plugin is installed on the source cluster
- Consider reducing the number of concurrent shard snapshots
- Monitor CloudWatch metrics for I/O bottlenecks

## S3 Repository Plugin

The source cluster must have the S3 repository plugin installed. Verify:

```bash
console clusters connection-check
```

This checks for the plugin and reports any issues.

## Next Steps

After the snapshot completes, proceed to [Migrate Metadata](/opensearch-migrations-eks/migration-guide/migrate-metadata/).
