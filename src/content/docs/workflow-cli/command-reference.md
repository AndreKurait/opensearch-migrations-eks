---
title: Command Reference
description: Complete CLI reference for console and workflow commands.
---

Migration Assistant provides two command namespaces: `console` for direct operations and `workflow` for Argo-orchestrated workflows.

## Console Commands

### Cluster Operations

```bash
console clusters connection-check          # Test connectivity to source and target
console clusters cat-indices               # List indices on source
console clusters cat-indices --target      # List indices on target
```

### Snapshot Operations

```bash
console snapshot create                    # Create a snapshot of the source cluster
console snapshot status                    # Check snapshot progress
```

### Metadata Operations

```bash
console metadata evaluate                  # Evaluate metadata for compatibility
console metadata migrate                   # Migrate metadata to target
```

### Backfill Operations

```bash
console backfill start                     # Start RFS backfill
console backfill status                    # Check backfill progress
console backfill scale <COUNT>             # Scale worker count
console backfill pause                     # Pause backfill
console backfill resume                    # Resume backfill
console backfill stop                      # Stop backfill
```

### Replay Operations

```bash
console replay start                       # Start traffic replay
console replay status                      # Check replay progress
console replay stop                        # Stop replay
```

### Tuple Operations

```bash
console tuples show                        # Show request/response tuple logs
```

### Kafka Operations

```bash
console kafka describe-topics              # List Kafka topics and offsets
```

## Workflow Commands

### Configuration

```bash
workflow configure sample                  # Show sample configuration
workflow configure sample --load           # Load sample into active config
workflow configure edit                    # Edit active configuration
workflow configure show                    # Display active configuration
```

### Execution

```bash
workflow submit                            # Submit workflow to Argo
workflow status                            # Check workflow status
workflow manage                            # Interactive TUI for management
workflow approve                           # Approve a paused gate
workflow cancel                            # Cancel a running workflow
```
