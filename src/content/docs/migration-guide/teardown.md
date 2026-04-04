---
title: Teardown
description: Remove migration infrastructure after a successful migration.
---

After a successful migration and cutover, remove the migration infrastructure to avoid unnecessary costs.

## Teardown Steps

### 1. Verify Migration Complete

Before removing infrastructure, confirm:

- All indices are migrated and validated
- Traffic is flowing to the target cluster
- No active workflows are running

```bash
console backfill status
console replay status
workflow status
```

### 2. Remove EKS Resources

For EKS deployments created with the bootstrap script:

```bash
# Delete the Helm release
helm uninstall migration-assistant -n ma

# Delete the namespace
kubectl delete namespace ma
```

### 3. Remove CloudFormation Stacks

```bash
# Delete the CloudFormation stack
aws cloudformation delete-stack \
  --stack-name migration-eks-<STAGE>-<REGION>
```

### 4. Clean Up S3

The S3 bucket containing snapshots is not automatically deleted. Remove it manually if no longer needed:

```bash
# Empty and delete the bucket
aws s3 rb s3://migrations-default-<ACCOUNT>-<STAGE>-<REGION> --force
```

:::caution
Deleting the S3 bucket permanently removes all snapshots. Ensure you no longer need the snapshot data before proceeding.
:::

### 5. Remove IAM Roles

If the IAM roles were created by the bootstrap script, they are deleted with the CloudFormation stack. Manually created roles must be removed separately.

## Partial Teardown

If you want to keep the EKS cluster for future migrations but remove the migration workloads:

```bash
helm uninstall migration-assistant -n ma
```

This removes all migration pods, services, and workflows while preserving the EKS cluster.
