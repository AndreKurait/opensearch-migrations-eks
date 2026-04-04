---
title: Deploying to EKS
description: Deploy Migration Assistant to Amazon EKS using CloudFormation and the bootstrap script.
---

This guide covers deploying Migration Assistant to Amazon Elastic Kubernetes Service (EKS) using CloudFormation and the bootstrap script.

## Prerequisites

- AWS CLI configured with appropriate permissions
- `kubectl` installed
- Helm 3 installed
- An AWS account with permissions to create EKS clusters, IAM roles, and S3 buckets

## Quick Start

### 1. Run the Bootstrap Script

The bootstrap script creates all required AWS infrastructure:

```bash
./aws-bootstrap.sh --stage dev --region us-east-1
```

This creates:
- **EKS Cluster:** `migration-eks-cluster-dev-us-east-1`
- **S3 Bucket:** `migrations-default-<ACCOUNT>-dev-us-east-1`
- **IAM Roles:** Snapshot role, node role
- **VPC:** New VPC or import existing

### 2. Configure kubectl

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name migration-eks-cluster-dev-us-east-1
```

### 3. Verify Deployment

```bash
kubectl get pods -n ma
```

Expected output:

```
NAME                                                  READY   STATUS    RESTARTS   AGE
argo-workflows-server-xxxxxxxxx-xxxxx                 1/1     Running   0          5m
argo-workflows-workflow-controller-xxxxxxxxx-xxxxx     1/1     Running   0          5m
migration-console-0                                    1/1     Running   0          5m
```

### 4. Access the Migration Console

```bash
kubectl exec -it migration-console-0 -n ma -- bash
```

## VPC Options

### Create a New VPC

```bash
./aws-bootstrap.sh --stage dev --region us-east-1 --deploy-create-vpc-cfn
```

### Import an Existing VPC

```bash
./aws-bootstrap.sh --stage dev --region us-east-1 \
  --vpc-id vpc-0123456789abcdef0
```

## Stage-Based Naming

All resources use the pattern: `migration-*-<STAGE>-<REGION>`

This allows multiple independent deployments in the same account (e.g., `dev`, `staging`, `prod`).

## Next Steps

- [Configure your migration](/opensearch-migrations-eks/deployment/configuration-options/)
- [Set up IAM and security](/opensearch-migrations-eks/deployment/iam-and-security/)
- [Start the Workflow CLI](/opensearch-migrations-eks/workflow-cli/getting-started/)
