---
banner:
  content: 'Frozen documentation prototype — November 2026. For current releases, see <a href="https://github.com/opensearch-project/opensearch-migrations">OpenSearch Migrations</a>.'
title: IAM & Security
description: IAM roles, security groups, and authentication configuration for EKS deployments.
---
:::note
This page covers AWS-specific IAM and security configuration for EKS deployments. For generic Kubernetes deployments, authentication is handled through Kubernetes secrets — see [Deploying to Kubernetes](/opensearch-migrations-eks/deployment/deploying-to-kubernetes/#3-configure-authentication-secrets).
:::

This page contains IAM and IRSA configuration examples for Migration Assistant on EKS.
The current upstream EKS path uses Pod Identity; older or custom installations may use
IRSA. Match the setup to your installed release and verify credentials separately in
the console and workflow executor pods. These examples are not evidence that bootstrap
has configured every workload automatically.

## IAM Roles

The following are role categories used by the examples. Exact roles and associations
depend on the deployment version and configuration:

| Role | Purpose | Used by |
|------|---------|---------|
| **EKS Node Role** | Base permissions for EKS managed node group instances | EC2 instances in the node group |
| **Snapshot Role** | S3 access for snapshot creation and RFS reading | Passed to OpenSearch snapshot repository registration |
| **Migration Console Role** | Permissions for migration operations, S3 access, and OpenSearch API calls | Migration Console pod; executor pods also need their own configured credentials |

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

### Migration Console Role Policy

The Migration Console role needs permissions to interact with S3, the source/target clusters, and EKS:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3SnapshotAccess",
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
    },
    {
      "Sid": "OpenSearchAccess",
      "Effect": "Allow",
      "Action": [
        "es:ESHttp*"
      ],
      "Resource": "arn:aws:es:<REGION>:<ACCOUNT>:domain/*"
    },
    {
      "Sid": "PassSnapshotRole",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::<ACCOUNT>:role/snapshot-role-<STAGE>-<REGION>"
    }
  ]
}
```

:::tip
Scope the `OpenSearchAccess` statement to specific domain ARNs in production rather than using a wildcard.
:::

## IRSA (IAM Roles for Service Accounts)

For an installation that uses [IAM Roles for Service Accounts (IRSA)](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html), pods authenticate through a service-account-bound role. The following is an IRSA example, not a description of every bootstrap release.

The setup involves:
1. **OIDC provider** — The EKS cluster needs a corresponding IAM OIDC identity provider.

2. **IAM role trust policy** — Each role includes a trust policy that allows the Kubernetes service account to assume it:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::<ACCOUNT>:oidc-provider/oidc.eks.<REGION>.amazonaws.com/id/<OIDC_ID>"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "oidc.eks.<REGION>.amazonaws.com/id/<OIDC_ID>:sub": "system:serviceaccount:ma:migration-console"
           }
         }
       }
     ]
   }
   ```

3. **Service account annotation** — The Kubernetes service account is annotated with the IAM role ARN:

   ```bash
   # Verify the IRSA annotation

   kubectl get serviceaccount migration-console -n ma \
     -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}'
   ```

:::note
A successful console connection check does not prove workflow executor pods have
credentials. Verify the identity mechanism and permissions for each workload using the
[upstream workflow setup guide](https://docs.opensearch.org/latest/migration-assistant/workflow-cli/getting-started/).
:::

## Security Groups

### EKS Cluster Security Group

The EKS cluster security group must allow the following network access:

| Direction | Port | Source / Destination | Purpose |
|-----------|------|----------------------|---------|
| Inbound | 443 | Source cluster security group | Snapshot repository registration API calls |
| Inbound | 443 | Target cluster security group | Migration operations |
| Outbound | 9200 (or 443) | Source cluster | Snapshot creation |
| Outbound | 9200 (or 443) | Target cluster | Document indexing, metadata migration |
| Outbound | 443 | S3 (via VPC endpoint or NAT) | Snapshot storage |

```bash
# Look up the cluster security group

aws eks describe-cluster --name migration-eks-cluster-<STAGE>-<REGION> \
  --query 'cluster.resourcesVpcConfig.clusterSecurityGroupId' --output text
```

:::tip
If your source or target clusters are in a different VPC, ensure VPC peering or Transit Gateway is configured, and that the security groups on both sides allow the required traffic.
:::

### OpenSearch Service Configuration

For Amazon OpenSearch Service targets, configure the domain access policy to allow the Migration Console role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<ACCOUNT>:role/migration-console-role-<STAGE>-<REGION>"
      },
      "Action": "es:ESHttp*",
      "Resource": "arn:aws:es:<REGION>:<ACCOUNT>:domain/<DOMAIN>/*"
    }
  ]
}
```

If using fine-grained access control, also map the Migration Console role to an OpenSearch backend role:

```bash
# On the target OpenSearch cluster, map the IAM role to the all_access backend role

curl -XPUT "https://<TARGET_ENDPOINT>/_plugins/_security/api/rolesmapping/all_access" \
  -H 'Content-Type: application/json' \
  -u admin:<PASSWORD> \
  -d '{
    "backend_roles": [
      "arn:aws:iam::<ACCOUNT>:role/migration-console-role-<STAGE>-<REGION>"
    ]
  }'
```

## Authentication Methods

Migration Assistant supports four authentication methods for connecting to source and target clusters. See [Configuration Options](/opensearch-migrations-eks/deployment/configuration-options/#authentication-types) for the full configuration reference.

### Creating Authentication Secrets
#### Basic Auth

```bash
kubectl create secret generic source-auth -n ma \
  --from-literal=username=admin \
  --from-literal=password='<PASSWORD>'

kubectl create secret generic target-auth -n ma \
  --from-literal=username=admin \
  --from-literal=password='<PASSWORD>'
```

#### Mutual TLS

```bash
kubectl create secret generic source-auth -n ma \
  --from-file=tls.crt=/path/to/client.crt \
  --from-file=tls.key=/path/to/client.key \
  --from-file=ca.crt=/path/to/ca.crt
```

#### SigV4

For EKS deployments using SigV4 with Amazon OpenSearch Service, configure a credential
source such as Pod Identity or IRSA for every workload making signed requests.
The following is an IRSA-oriented values example; confirm the schema for your release:

```yaml
sourceCluster:
  auth:
    type: sigv4
    # No secretName required — IRSA provides credentials

targetCluster:
  auth:
    type: sigv4
```

For IRSA, verify the service account annotation. Pod Identity uses role associations
instead and is not validated by this annotation check:

```bash
kubectl get serviceaccount migration-console -n ma \
  -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}'
```

#### No Auth

```yaml
sourceCluster:
  auth:
    type: none
```

:::caution
Only use `none` for development or testing. Production clusters should always require authentication.
:::
### SigV4 Authentication Flow (EKS)

When using SigV4 authentication with Amazon OpenSearch Service:
1. The console and workflow executor pods obtain credentials from their configured Pod Identity associations or IRSA roles.

2. The IAM role must be mapped to an OpenSearch backend role in the target domain's security configuration (see [OpenSearch Service Configuration](#opensearch-service-configuration) above).

3. The Snapshot role must be registered as a snapshot repository role on the source cluster.

