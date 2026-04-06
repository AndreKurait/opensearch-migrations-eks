---
title: Deploying to EKS
description: Deploy Migration Assistant to Amazon EKS using CloudFormation and the bootstrap script.
---
This guide covers deploying Migration Assistant to Amazon Elastic Kubernetes Service (EKS) using CloudFormation and the bootstrap script.

## Prerequisites

- AWS CLI configured with appropriate permissions
- `kubectl` installed
- Helm 3 installed
- An AWS account with permissions to create EKS clusters, CloudFormation stacks, and IAM roles

## Quick Start

1. **Run the Bootstrap Script**

   The bootstrap script creates the EKS cluster, VPC, IAM roles, and S3 bucket via CloudFormation, then installs the Helm chart.

   ```bash
   # Create a new VPC and EKS cluster

   ./aws-bootstrap.sh --stage dev --region us-east-1 --deploy-create-vpc-cfn

   # Or import an existing VPC

   ./aws-bootstrap.sh --stage dev --region us-east-1 --deploy-import-vpc-cfn \
     --vpc-id vpc-xxxxx --private-subnet-ids subnet-aaa,subnet-bbb
   ```

2. **Verify Deployment**

   ```bash
   # Configure kubectl

   aws eks update-kubeconfig --region <REGION> --name migration-eks-cluster-<STAGE>-<REGION>

   # Check pods

   kubectl get pods -n ma
   ```

   Expected output:

   ```

   NAME                                                  READY   STATUS    RESTARTS   AGE
   argo-workflows-server-xxxxxxxxx-xxxxx                 1/1     Running   0          5m
   argo-workflows-workflow-controller-xxxxxxxxx-xxxxx     1/1     Running   0          5m
   migration-console-0                                    1/1     Running   0          5m
   ```

3. **Access the Migration Console**

   ```bash
   kubectl exec -it migration-console-0 -n ma -- bash
   ```

## CloudFormation Resources

The bootstrap script creates:

| Resource | Naming Convention |
|----------|-------------------|
| EKS Cluster | `migration-eks-cluster-<STAGE>-<REGION>` |
| S3 Bucket | `migrations-default-<ACCOUNT>-<STAGE>-<REGION>` |
| IAM Roles | Snapshot role, node role |
| VPC | Created or imported |

## Stage-Based Naming

The `--stage` parameter controls resource naming and allows multiple deployments in the same account/region. Use descriptive stage names like `dev`, `staging`, or `prod`.

## IAM Access Entries

The bootstrap script configures IAM access entries for the EKS cluster. Additional users or roles can be granted access:

```bash
aws eks create-access-entry \
  --cluster-name migration-eks-cluster-<STAGE>-<REGION> \
  --principal-arn arn:aws:iam::<ACCOUNT>:role/<ROLE_NAME> \
  --type STANDARD
```

## Next Steps

- [Configure your migration](/opensearch-migrations-eks/deployment/configuration-options/)
- [Set up IAM and security](/opensearch-migrations-eks/deployment/iam-and-security/)
- [Start with the Workflow CLI](/opensearch-migrations-eks/workflow-cli/getting-started/)
