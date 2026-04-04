---
title: Backfill
description: Migrate existing data using Reindex-from-Snapshot (RFS).
---

RFS migrates historical documents by reading raw Lucene segment files directly from S3 snapshots.

## Using the Workflow CLI

The recommended approach uses the Workflow CLI:

```bash
workflow configure edit    # Set index allowlists, parallelism
workflow submit            # Submit the backfill workflow
workflow manage            # Monitor with the TUI
```

The workflow orchestrates: Snapshot → Register → Metadata → RFS Load → Cleanup.

## Using Console Commands

Alternatively, manage backfill directly:

### Start Backfill

```bash
console backfill start
```

### Scale Workers

```bash
console backfill scale --workers 8
```

:::note
Maximum 1 worker per primary shard. Scaling beyond this has no effect.
:::

### Monitor Progress

```bash
console backfill status
```

### Pause and Resume

```bash
console backfill pause
console backfill start    # Resume
```

### Stop Backfill

```bash
console backfill stop
```

## Index Allowlists

Limit backfill to specific indexes:

```yaml
backfill:
  reindexFromSnapshot:
    indexAllowlist:
      - my-index-*
      - important-data
```

## Validation

After backfill completes, validate document counts:

```bash
# On source
curl -s source:9200/_cat/indices?v

# On target
curl -s target:9200/_cat/indices?v
```

## Performance Tuning

| Setting | Default | Description |
|---------|---------|-------------|
| `workerCount` | 1 | Number of parallel RFS workers |
| Node resources | 2 vCPU / 4 GB | K8s resource limits per worker |

At 2 vCPU / 4 GB per worker, expect ~590K docs/min throughput.
