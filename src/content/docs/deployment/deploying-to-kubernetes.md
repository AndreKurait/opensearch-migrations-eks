---
title: Deploying to Kubernetes
description: Deploy Migration Assistant to any Kubernetes cluster using Helm.
---

Migration Assistant can be deployed to any Kubernetes distribution — EKS, GKE, AKS, OpenShift, or self-managed clusters.

## Prerequisites

- Kubernetes 1.25+
- Helm 3
- `kubectl` configured for your cluster
- S3-compatible object storage for snapshots

## Install with Helm

### 1. Add the Helm Repository

```bash
helm repo add opensearch-migrations \
  https://opensearch-project.github.io/opensearch-migrations
helm repo update
```

### 2. Create the Namespace

```bash
kubectl create namespace ma
```

### 3. Create Secrets

Configure authentication for your source and target clusters:

```bash
# Basic auth
kubectl create secret generic source-auth \
  -n ma \
  --from-literal=username=admin \
  --from-literal=password=<PASSWORD>

# mTLS
kubectl create secret tls source-tls \
  -n ma \
  --cert=client.crt \
  --key=client.key
```

### 4. Install the Chart

```bash
helm install migration-assistant \
  opensearch-migrations/migrationAssistantWithArgo \
  -n ma \
  -f values.yaml
```

### 5. Verify

```bash
kubectl get pods -n ma
```

## Authentication Methods

| Method | Use Case |
|--------|----------|
| **Basic auth** | Username/password for source and target |
| **mTLS** | Mutual TLS certificate authentication |
| **SigV4** | AWS IAM-based authentication for Amazon OpenSearch Service |

## Next Steps

- [Deploying to EKS](/opensearch-migrations-eks/deployment/deploying-to-eks/) for AWS-specific setup
- [Configuration Options](/opensearch-migrations-eks/deployment/configuration-options/) for customization
