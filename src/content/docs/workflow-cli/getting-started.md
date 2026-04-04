---
title: Workflow CLI Getting Started
description: Step-by-step tutorial for configuring and running your first migration workflow.
---


This tutorial walks through configuring and running a backfill migration workflow using the Workflow CLI.

## Prerequisites

- Migration Assistant deployed ([EKS](/opensearch-migrations-eks/deployment/deploying-to-eks/) or [K8s](/opensearch-migrations-eks/deployment/deploying-to-kubernetes/))
- Access to the Migration Console pod
- Source and target clusters accessible

## Tutorial


1. **Access the Migration Console**

   ```bash
   kubectl exec -it migration-console-0 -n ma -- bash
   ```

2. **Load Sample Configuration**

   ```bash
   workflow configure sample --load
   ```

   This creates a sample YAML configuration with common defaults.

3. **Edit Configuration**

   ```bash
   workflow configure edit
   ```

   Update the configuration with your source and target cluster details, authentication, and migration parameters.

   Key fields to configure:

   ```yaml
   source:
     endpoint: https://source-cluster:9200
     auth:
       type: basic

   target:
     endpoint: https://target-cluster:9200
     auth:
       type: sigv4

   backfill:
     enabled: true
     indexAllowlist:
       - my-index-*
   ```

4. **Create Secrets**

   If using authentication, create the required Kubernetes secrets:

   ```bash
   kubectl create secret generic source-auth -n ma \
     --from-literal=username=admin \
     --from-literal=password=<PASSWORD>
   ```

5. **Submit the Workflow**

   ```bash
   workflow submit
   ```

   The workflow is submitted to Argo Workflows and begins execution.

6. **Monitor Progress**

   ```bash
   # Check overall status
   workflow status

   # Interactive management TUI
   workflow manage
   ```

7. **Approve Gates**

   When the workflow reaches an approval gate, review the results and approve:

   ```bash
   workflow approve
   ```

   The workflow pauses at approval gates to let you verify:
   - Metadata migration results
   - Document counts
   - Any errors or warnings

8. **Verify Completion**

   ```bash
   workflow status
   console clusters cat-indices --target
   ```


## Next Steps

- [Backfill](/opensearch-migrations-eks/migration-guide/backfill/) — detailed backfill configuration
- [Command Reference](/opensearch-migrations-eks/workflow-cli/command-reference/) — full CLI reference
