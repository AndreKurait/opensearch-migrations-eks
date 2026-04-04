---
title: Command Reference
description: Complete CLI reference for console and workflow commands.
---

import { Aside, Tabs, TabItem, LinkCard, CardGrid } from '@astrojs/starlight/components';

Migration Assistant provides two command namespaces:

- **`console`** — Direct, imperative operations for immediate execution against clusters and infrastructure
- **`workflow`** — Declarative configuration and Argo-orchestrated workflow management

All commands run inside the Migration Console pod:

```bash
kubectl exec -it migration-console-0 -n ma -- bash
```

## Console Commands

### Cluster Operations

Verify connectivity and inspect cluster state. Run these before starting any migration.

```bash
console clusters connection-check          # Test connectivity to source and target
console clusters cat-indices               # List indices on source
console clusters cat-indices --target      # List indices on target
```

| Flag | Command | Description |
|------|---------|-------------|
| `--target` | `cat-indices` | Query the target cluster instead of the source |

**Example output for `cat-indices`:**

```
health status index           uuid                   pri rep docs.count docs.deleted store.size
green  open   my-logs-2024.01 abc123def456           5   1    2340000            0      1.2gb
green  open   my-logs-2024.02 def456ghi789           5   1    1890000            0      980mb
```

<Aside type="tip">
Run `console clusters connection-check` as the first step after accessing the Migration Console. It validates both cluster endpoints and authentication.
</Aside>

### Snapshot Operations

Create and monitor snapshots of the source cluster. Snapshots are stored in S3 and used by the backfill process.

```bash
console snapshot create                    # Create a snapshot of the source cluster
console snapshot status                    # Check snapshot progress
```

**Example output for `snapshot status`:**

```
Snapshot: migration-snapshot-20240115
State:    IN_PROGRESS
Shards:   45/120 completed (37%)
```

<Aside>
For detailed snapshot configuration, see [Create Snapshot](/opensearch-migrations-eks/migration-guide/create-snapshot/).
</Aside>

### Metadata Operations

Evaluate compatibility and migrate index settings, mappings, templates, and aliases.

```bash
console metadata evaluate                  # Evaluate metadata for compatibility issues
console metadata migrate                   # Migrate metadata to the target cluster
```

The `evaluate` command reports incompatibilities without making changes. Always run it before `migrate`.

**Example output for `metadata evaluate`:**

```
Evaluating 12 indices, 3 templates, 2 aliases...

Warnings:
  - index 'legacy-data': field 'description' uses deprecated type 'string'
    → Will be transformed to 'text' with 'keyword' sub-field

Transformations:
  - 3 fields: string → text/keyword
  - 1 field: dense_vector → knn_vector

Result: All indices can be migrated with automatic transformations.
```

<Aside>
For details on metadata transformations, see [Migrate Metadata](/opensearch-migrations-eks/migration-guide/migrate-metadata/).
</Aside>

### Backfill Operations

Control the Reindex-from-Snapshot document migration process.

```bash
console backfill start                     # Start RFS backfill workers
console backfill status                    # Check backfill progress
console backfill scale <COUNT>             # Scale worker count (up to 1 per shard)
console backfill pause                     # Pause backfill (workers stop pulling new work)
console backfill resume                    # Resume a paused backfill
console backfill stop                      # Stop and remove all backfill workers
```

| Flag / Argument | Command | Description |
|-----------------|---------|-------------|
| `<COUNT>` | `scale` | Number of workers (integer, max = shard count) |

**Example output for `backfill status`:**

```
Backfill Status:
  Workers:    4/4 running
  Progress:   67,234,000 / 98,500,000 docs (68.3%)
  Throughput: ~590,000 docs/min
  ETA:        ~53 minutes
```

<Aside>
For backfill tuning and scaling guidance, see [Backfill](/opensearch-migrations-eks/migration-guide/backfill/).
</Aside>

### Replay Operations

Control traffic replay from captured Kafka topics to the target cluster.

```bash
console replay start                       # Start traffic replay
console replay status                      # Check replay progress and lag
console replay stop                        # Stop traffic replay
```

**Example output for `replay status`:**

```
Replay Status:
  State:        Running
  Kafka Lag:    12,450 messages
  Replayed:     1,234,567 requests
  Error Rate:   0.02%
```

<Aside>
For replay configuration and time-scaling, see [Capture & Replay](/opensearch-migrations-eks/migration-guide/capture-and-replay/).
</Aside>

### Tuple Operations

Inspect captured request/response pairs for debugging replay issues.

```bash
console tuples show                        # Show recent request/response tuple logs
```

Tuple logs contain the original source request and the replayed target response side-by-side, useful for identifying transformation or compatibility issues.

### Kafka Operations

Inspect the Kafka topics used for traffic capture.

```bash
console kafka describe-topics              # List Kafka topics, partitions, and consumer lag
```

**Example output:**

```
Topic: logging-traffic-topic
  Partitions: 6
  Total Messages: 4,567,890
  Consumer Lag:   12,450
```

---

## Workflow Commands

### Configuration

Manage the YAML configuration that defines your migration workflow.

```bash
workflow configure sample                  # Print sample configuration to stdout
workflow configure sample --load           # Load sample as the active configuration
workflow configure edit                    # Open active configuration in $EDITOR
workflow configure show                    # Print active configuration to stdout
```

| Flag | Command | Description |
|------|---------|-------------|
| `--load` | `sample` | Load sample directly instead of printing it |

<Aside type="tip">
Use `workflow configure show` to verify your configuration before submitting. Pipe it through a YAML validator for extra safety: `workflow configure show | python -c "import sys, yaml; yaml.safe_load(sys.stdin)"`.
</Aside>

### Execution

Submit, monitor, and manage Argo-orchestrated workflows.

```bash
workflow submit                            # Submit the workflow to Argo Workflows
workflow status                            # Check workflow status and step progress
workflow manage                            # Launch interactive TUI for management
workflow approve                           # Approve a paused approval gate
workflow cancel                            # Cancel a running workflow
```

**Example output for `workflow status`:**

```
Workflow: migration-20240115-143022
Status:  Running
Phase:   backfill-start

Steps:
  ✓ snapshot-create          Completed  (2m 34s)
  ✓ metadata-migrate         Completed  (0m 45s)
  ✓ approval-gate-metadata   Approved   (manual)
  ● backfill-start           Running    (12m 05s)
  ○ approval-gate-backfill   Pending
```

<Aside type="caution">
`workflow cancel` stops all running steps immediately. In-progress backfill workers will terminate. The workflow can be re-submitted and will resume where it left off due to idempotent step design.
</Aside>

---

## Quick Reference

### Pre-migration checklist

```bash
console clusters connection-check
console clusters cat-indices
console metadata evaluate
```

### Full workflow sequence

```bash
workflow configure sample --load
workflow configure edit
workflow submit
workflow status
workflow approve          # at each gate
workflow status           # verify completion
```

### Debugging a failed workflow

```bash
workflow status
kubectl logs -n ma -l workflows.argoproj.io/workflow=<WORKFLOW_NAME>
console clusters cat-indices --target
```

## Next Steps

<CardGrid>
  <LinkCard
    title="Getting Started tutorial"
    description="Walk through a complete migration using these commands."
    href="/opensearch-migrations-eks/workflow-cli/getting-started/"
  />
  <LinkCard
    title="Troubleshooting"
    description="Common errors and resolution steps."
    href="/opensearch-migrations-eks/reference/troubleshooting/"
  />
</CardGrid>
