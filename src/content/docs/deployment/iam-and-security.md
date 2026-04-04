---
title: IAM & Security
description: Configure IAM roles, security groups, and authentication for EKS deployments.
---

## EKS IAM Access Entries

The bootstrap script configures IAM access entries for the EKS cluster. To grant additional users access:

```bash
aws eks create-access-entry \
  --cluster-name migration-eks-cluster-dev-us-east-1 \
  --principal-arn arn:aws:iam::123456789:user/developer \
  --type STANDARD
```

## Security Groups

When connecting to an existing Amazon OpenSearch Service domain, ensure the EKS cluster's security group allows traffic to the domain:

```bash
# Get the EKS cluster security group
aws eks describe-cluster \
  --name migration-eks-cluster-dev-us-east-1 \
  --query 'cluster.resourcesVpcConfig.clusterSecurityGroupId' \
  --output text
```

Add an inbound rule to the OpenSearch domain's security group allowing traffic from the EKS cluster security group on port 443.

## Snapshot IAM Role

The snapshot role must have permissions to read/write to the S3 bucket:

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

## SigV4 Authentication

For Amazon OpenSearch Service targets, configure SigV4 authentication in your workflow configuration:

```yaml
target:
  auth:
    type: sigv4
    region: us-east-1
    service: es          # "es" for managed, "aoss" for serverless
```

The Migration Console pod's service account must have an IAM role with permissions to access the target domain.
