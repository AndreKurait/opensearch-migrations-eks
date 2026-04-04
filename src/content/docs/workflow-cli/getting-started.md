---
title: Getting Started
description: Step-by-step guide to running your first migration workflow.
---

This tutorial walks through a complete backfill migration using the Workflow CLI.

## Step 1: Access the Migration Console

```bash
kubectl exec -it migration-console-0 -n ma -- bash
```

## Step 2: Load a Sample Configuration

```bash
workflow configure sample --load
```

This generates a YAML configuration with sensible defaults.

## Step 3: Edit the Configuration

```bash
workflow configure edit
```

Update the source and target cluster endpoints, authentication, and index allowlists for your environment.

## Step 4: Create Secrets

If your clusters require authentication, create Kubernetes secrets:

```bash
kubectl create secret generic source-auth \
  -n ma \
  --from-literal=username=admin \
  --from-literal=password=<PASSWORD>
```

## Step 5: Submit the Workflow

```bash
workflow submit
```

The workflow will begin executing in Argo Workflows.

## Step 6: Monitor Progress

Use the interactive TUI:

```bash
workflow manage
```

Or check status from the CLI:

```bash
workflow status
```

## Step 7: Approve the Gate

When the workflow reaches an approval gate (e.g., before starting document backfill), review the metadata migration results and approve:

```bash
workflow approve
```

## Step 8: Validate

After the workflow completes, validate your migration:

```bash
# Check document counts
console clusters compare --index my-index
```

## Next Steps

- [Backfill Workflow](/opensearch-migrations-eks/migration-guide/backfill/) for detailed backfill options
- [Capture & Replay](/opensearch-migrations-eks/migration-guide/capture-and-replay/) for live traffic migration
- [Command Reference](/opensearch-migrations-eks/workflow-cli/command-reference/) for all available commands
