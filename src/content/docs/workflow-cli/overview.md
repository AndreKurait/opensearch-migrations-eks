---
banner:
  content: 'Frozen documentation prototype — November 2026. For current releases, see <a href="https://github.com/opensearch-project/opensearch-migrations">OpenSearch Migrations</a>.'
title: Workflow CLI Overview
description: Declarative YAML configuration and Argo Workflows orchestration for migrations.
---

The Workflow CLI provides a declarative, YAML-based approach to configuring and executing migrations. It integrates with Argo Workflows for orchestration.

## Key Concepts

- **Declarative configuration** — define your migration as YAML
- **Argo Workflows** — K8s-native workflow engine handles execution
- **Approval gates** — configured gates pause for user confirmation
- **Recorded progress** — inspect completed work and retained state before retrying; Argo orchestration does not make every operation idempotent

Use the [upstream Workflow CLI guide](https://docs.opensearch.org/latest/migration-assistant/workflow-cli/) and generated sample for your installed release. Review each failed step before rerunning operations that create resources or write target data.

## Commands

| Command | Description |
|---------|-------------|
| `workflow configure sample` | Generate a sample configuration |
| `workflow configure edit` | Edit the current configuration |
| `workflow submit` | Submit the workflow to Argo |
| `workflow status` | Check workflow status |
| `workflow manage` | Interactive TUI for workflow management |
| `workflow approve` | Approve a paused workflow step |

## Argo Workflows Features

Argo Workflows provides:

- **Parallel execution** — run multiple steps concurrently
- **Retry logic** — automatic retries with configurable backoff
- **Progress tracking** — real-time status for each workflow step
- **Resource management** — automatic provisioning and scale-down
- **Approval gates** — human-in-the-loop confirmation

## Accessing the Workflow CLI

The Workflow CLI runs inside the Migration Console pod:

```bash
# On EKS

aws eks update-kubeconfig --region <REGION> --name migration-eks-cluster-<STAGE>-<REGION>
kubectl exec -it migration-console-0 -n ma -- bash

# Then run workflow commands

workflow status
```

## Next Steps

- [Getting Started](/opensearch-migrations-eks/workflow-cli/getting-started/) — step-by-step tutorial
- [Command Reference](/opensearch-migrations-eks/workflow-cli/command-reference/) — full CLI reference
