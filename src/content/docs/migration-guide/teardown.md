---
title: Teardown
description: Remove migration infrastructure after a successful migration.
---

After completing and validating your migration, remove the migration infrastructure.

## Remove EKS Resources

### Uninstall Helm Chart

```bash
helm uninstall migration-assistant -n ma
```

### Delete the Namespace

```bash
kubectl delete namespace ma
```

### Delete CloudFormation Stack

```bash
aws cloudformation delete-stack \
  --stack-name migration-eks-cluster-dev-us-east-1
```

## Clean Up S3

The S3 bucket containing snapshots is not automatically deleted. Remove it manually:

```bash
aws s3 rb s3://migrations-default-123456789-dev-us-east-1 --force
```

:::caution
Ensure you no longer need the snapshot data before deleting the S3 bucket. This action is irreversible.
:::

## Verify Cleanup

Confirm all resources have been removed:

```bash
# Check for remaining pods
kubectl get pods -n ma

# Check CloudFormation stack status
aws cloudformation describe-stacks \
  --stack-name migration-eks-cluster-dev-us-east-1
```
