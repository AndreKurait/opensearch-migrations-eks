---
title: Command Reference
description: Complete CLI reference for console and workflow commands.
---

## Workflow Commands

| Command | Description |
|---------|-------------|
| `workflow configure sample` | Generate a sample configuration |
| `workflow configure sample --load` | Generate and load a sample configuration |
| `workflow configure edit` | Open the configuration in an editor |
| `workflow submit` | Submit the workflow to Argo Workflows |
| `workflow status` | Display current workflow status |
| `workflow manage` | Launch the interactive TUI |
| `workflow approve` | Approve a pending approval gate |

## Console Commands

### Cluster Operations

| Command | Description |
|---------|-------------|
| `console clusters connection-check` | Verify connectivity to source and target |
| `console clusters compare` | Compare document counts between clusters |

### Snapshot Operations

| Command | Description |
|---------|-------------|
| `console snapshot create` | Create a snapshot of the source cluster |
| `console snapshot status` | Check snapshot progress |

### Metadata Operations

| Command | Description |
|---------|-------------|
| `console metadata evaluate` | Evaluate metadata compatibility |
| `console metadata migrate` | Migrate metadata to the target |

### Backfill Operations

| Command | Description |
|---------|-------------|
| `console backfill start` | Start RFS backfill |
| `console backfill status` | Check backfill progress |
| `console backfill scale --workers N` | Scale RFS worker count |
| `console backfill pause` | Pause backfill |
| `console backfill stop` | Stop backfill |

### Replay Operations

| Command | Description |
|---------|-------------|
| `console replay start` | Start traffic replay |
| `console replay status` | Check replay status |
| `console replay stop` | Stop traffic replay |

### Tuple Operations

| Command | Description |
|---------|-------------|
| `console tuples show` | Display captured request/response pairs |
| `console tuples show --last N` | Show the last N tuples |
