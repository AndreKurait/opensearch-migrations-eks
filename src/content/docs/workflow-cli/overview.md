---
title: Workflow CLI Overview
description: Declarative YAML configuration and Argo Workflows orchestration.
---

The Workflow CLI provides a declarative, YAML-driven approach to orchestrating migrations on Kubernetes.

## How It Works

1. **Configure** — Define your migration as YAML
2. **Submit** — Send the workflow to Argo Workflows
3. **Monitor** — Track progress with the TUI or CLI
4. **Approve** — Confirm approval gates before proceeding
5. **Complete** — Workflow handles cleanup automatically

## Key Commands

| Command | Description |
|---------|-------------|
| `workflow configure sample --load` | Generate and load a sample configuration |
| `workflow configure edit` | Edit the current configuration |
| `workflow submit` | Submit the workflow to Argo |
| `workflow status` | Check workflow status |
| `workflow manage` | Interactive TUI for monitoring |
| `workflow approve` | Approve a pending approval gate |

## Argo Workflows Features

- **Parallel execution** — Multiple RFS workers run simultaneously
- **Retry logic** — Failed steps are automatically retried
- **Progress tracking** — Real-time status of each workflow step
- **Resource management** — Automatic provisioning and scale-down
- **Approval gates** — Workflow pauses for human confirmation before critical steps

## Accessing the CLI

```bash
# Connect to the Migration Console
kubectl exec -it migration-console-0 -n ma -- bash

# Or via kubectl context
aws eks update-kubeconfig \
  --region us-east-1 \
  --name migration-eks-cluster-dev-us-east-1
```
