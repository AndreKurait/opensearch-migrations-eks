---
title: Deploying to Kubernetes
description: Deploy Migration Assistant to any Kubernetes cluster using Helm.
---

This guide covers deploying Migration Assistant to a generic Kubernetes cluster (non-EKS). For Amazon EKS, see [Deploying to EKS](/opensearch-migrations-eks/deployment/deploying-to-eks/).

## Prerequisites

- Kubernetes cluster (1.24+)
- Helm 3 installed
- `kubectl` configured for your cluster
- S3-compatible object storage for snapshots

## Installation

### 1. Add the Helm Repository

```bash
helm repo add opensearch-migrations https://opensearch-project.github.io/opensearch-migrations
helm repo update
```

### 2. Create the Namespace

```bash
kubectl create namespace ma
```

### 3. Configure Authentication Secrets

Create Kubernetes secrets for source and target cluster authentication:

```bash
# Basic auth
kubectl create secret generic source-auth -n ma \
  --from-literal=username=admin \
  --from-literal=password=<PASSWORD>

# Or mTLS
kubectl create secret tls source-tls -n ma \
  --cert=client.crt --key=client.key

# Or SigV4 (AWS)
kubectl create secret generic source-sigv4 -n ma \
  --from-literal=region=us-east-1 \
  --from-literal=service=es
```

### 4. Install the Chart

```bash
helm install migration-assistant opensearch-migrations/migrationAssistantWithArgo \
  -n ma \
  -f values.yaml
```

### 5. Verify

```bash
kubectl get pods -n ma
```

## Helm Values

Key values to configure in your `values.yaml`:

```yaml
sourceCluster:
  endpoint: https://source-cluster:9200
  auth:
    type: basic  # basic, mtls, or sigv4
    secretName: source-auth

targetCluster:
  endpoint: https://target-cluster:9200
  auth:
    type: basic
    secretName: target-auth

s3:
  bucket: my-migration-bucket
  region: us-east-1
```

## Next Steps

- [Configuration Options](/opensearch-migrations-eks/deployment/configuration-options/)
- [Workflow CLI Getting Started](/opensearch-migrations-eks/workflow-cli/getting-started/)
