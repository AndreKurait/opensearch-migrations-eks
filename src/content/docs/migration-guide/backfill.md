---
title: Backfill
description: Migrate existing documents using Reindex-from-Snapshot (RFS) workers.
---

Backfill migrates existing documents from the source cluster to the target using Reindex-from-Snapshot (RFS). Workers read raw Lucene segment files directly from the snapshot in S3.

## Starting Backfill

### Using the Workflow CLI

```bash
workflow configure sample --load   # Load sample config
workflow configure edit            # Edit backfill settings
workflow submit                    # Submit to Argo Workflows
```

### Using Console Commands

```bash
console backfill start
```

## Monitoring Progress

```bash
console backfill status
```

Monitor via CloudWatch dashboards or the Argo Workflows UI for detailed progress per index and shard.

## Scaling Workers

RFS workers read from S3, not the source cluster. Scaling up workers has **zero impact on the source cluster**.

```yaml
# In workflow configuration
rfs:
  workers: 8              # Increase parallel workers
  indexAllowlist:
    - my-large-index-*    # Optional: target specific indices
```

:::note
Maximum 1 worker per shard. Adding workers beyond the shard count provides no benefit.
:::

## Pausing and Resuming

```bash
console backfill pause
console backfill resume
```

Backfill is resumable — workers track progress per shard and resume from where they left off.

## Stopping Backfill

```bash
console backfill stop
```

## Validation

After backfill completes, validate document counts:

```bash
# Check source document count
console clusters cat-indices --source

# Check target document count
console clusters cat-indices --target
```

## Performance Tuning

| Parameter | Default | Description |
|-----------|---------|-------------|
| `workers` | 4 | Number of parallel RFS workers |
| `maxShardSizeGb` | 80 | Maximum shard size to process |
| K8s resource limits | 2 vCPU / 4 GB | Per-worker resource allocation |

Peak throughput: **590,000 docs/min** per 2 vCPU worker.

## Next Steps

Before moving on, confirm your backfill is healthy:

1. **Document counts match** — run `console clusters cat-indices --source` and `console clusters cat-indices --target` and compare totals
2. **No failed shards** — check `console backfill status` shows all shards completed
3. **Spot-check queries** — run 3–5 representative queries against both clusters and compare results

Then continue:

- [Capture & Replay](/opensearch-migrations-eks/migration-guide/capture-and-replay/) — replay live traffic against the target to validate query compatibility
- [Traffic Routing](/opensearch-migrations-eks/migration-guide/traffic-routing/) — shift production traffic to the target cluster
