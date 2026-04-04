---
title: Teardown
description: Remove migration infrastructure after a successful migration.
---


After a successful migration and cutover, remove the migration infrastructure to stop
incurring compute and storage costs.

:::caution
Teardown is **destructive and irreversible**. Make sure you have completed the
pre-flight checklist below before running any delete commands.
:::

## Pre-flight Checklist

Before removing anything, confirm:

- ✅ All indices are migrated and document counts match.
- ✅ Production traffic is flowing exclusively to the target cluster.
- ✅ No active backfill or replay workflows are running.

```bash
console backfill status    # should show COMPLETED or STOPPED
console replay status      # should show STOPPED
workflow status            # should show no active workflows
```

## Teardown Steps


1. **Remove the Helm release** (deletes all migration pods, services, and workflows):

   ```bash
   helm uninstall migration-assistant -n ma
   ```

   Verify:

   ```bash
   kubectl get pods -n ma    # should return "No resources found"
   ```

2. **Delete the Kubernetes namespace:**

   ```bash
   kubectl delete namespace ma
   ```

3. **Delete the CloudFormation stack** (EKS cluster, VPC, IAM roles created by the
   bootstrap script):

   ```bash
   aws cloudformation delete-stack \
     --stack-name migration-eks-<STAGE>-<REGION>
   ```

   Monitor progress:

   ```bash
   aws cloudformation wait stack-delete-complete \
     --stack-name migration-eks-<STAGE>-<REGION>
   ```

4. **Delete the S3 snapshot bucket:**

   :::caution
   This permanently removes **all snapshots**. Confirm you no longer need the snapshot
   data before proceeding. The bucket can be several terabytes and will continue to
   incur S3 storage charges until deleted.
   :::

   ```bash
   aws s3 rb s3://migrations-default-<ACCOUNT>-<STAGE>-<REGION> --force
   ```

5. **Remove manually-created IAM roles** (if any). Roles created by the CloudFormation
   stack are deleted automatically in step 3. Any roles you created outside the stack
   must be removed separately:

   ```bash
   aws iam delete-role --role-name <custom-role-name>
   ```


## Partial Teardown

If you want to keep the EKS cluster for future migrations but remove only the migration
workloads:

```bash
helm uninstall migration-assistant -n ma
```

This removes all migration pods, services, and CRDs while preserving the EKS cluster,
node groups, and networking.

:::tip
After a partial teardown, you can redeploy later with
`helm install migration-assistant ./chart -n ma` without recreating the cluster.
:::
