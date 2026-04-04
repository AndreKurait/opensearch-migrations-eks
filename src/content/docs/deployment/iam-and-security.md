---
title: IAM & Security
description: IAM roles, security groups, and authentication configuration for EKS deployments.
---

This guide covers IAM configuration, security groups, and authentication setup for Migration Assistant on EKS.

## IAM Roles

The bootstrap script creates the following IAM roles:

| Role | Purpose |
|------|---------|
| **EKS Node Role** | Permissions for EKS worker nodes |
| **Snapshot Role** | S3 access for snapshot creation and RFS reading |
| **Migration Console Role** | Permissions for migration operations |

### Snapshot Role Policy

The snapshot role requires access to the S3 bucket used for snapshots:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::migrations-default-*",
        "arn:aws:s3:::migrations-default-*/*"
      ]
    }
  ]
}
```

## Security Groups

### EKS Cluster Security Group

The EKS cluster security group must allow:

- Inbound from source cluster (for snapshot registration)
- Inbound from target cluster (for migration operations)
- Outbound to source and target clusters

```bash
# Look up the cluster security group
aws eks describe-cluster --name migration-eks-cluster-<STAGE>-<REGION> \
  --query 'cluster.resourcesVpcConfig.clusterSecurityGroupId' --output text
```

### OpenSearch Service Configuration

For Amazon OpenSearch Service targets, configure the domain access policy to allow the Migration Console role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<ACCOUNT>:role/migration-console-role"
      },
      "Action": "es:*",
      "Resource": "arn:aws:es:<REGION>:<ACCOUNT>:domain/<DOMAIN>/*"
    }
  ]
}
```

## Authentication Methods

See [Configuration Options](/opensearch-migrations-eks/deployment/configuration-options/) for details on configuring `basic`, `mtls`, `sigv4`, or `none` authentication for source and target clusters.
