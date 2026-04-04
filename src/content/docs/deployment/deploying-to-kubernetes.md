---
title: Deploying to Kubernetes
description: Deploy Migration Assistant to any Kubernetes cluster using Helm.
---


This guide covers deploying Migration Assistant to a generic Kubernetes cluster (non-EKS). For Amazon EKS, see [Deploying to EKS](/opensearch-migrations-eks/deployment/deploying-to-eks/).

## Prerequisites

- Kubernetes cluster (1.24+) with a default StorageClass that supports `ReadWriteOnce` PersistentVolumeClaims
- Helm 3 installed
- `kubectl` configured for your cluster
- S3-compatible object storage for snapshots (AWS S3, GCS, MinIO, etc.)
- *(Optional, for Capture and Replay)* Kafka cluster, or willingness to use the bundled [Strimzi](https://strimzi.io/) operator

:::note
The Helm chart includes Argo Workflows CRDs and controller. If your cluster already has Argo Workflows installed, set `argo-workflows.enabled: false` in your `values.yaml` to avoid conflicts.
:::

## Installation


1. **Add the Helm Repository**

   ```bash
   helm repo add opensearch-migrations https://opensearch-project.github.io/opensearch-migrations
   helm repo update
   ```

2. **Create the Namespace**

   ```bash
   kubectl create namespace ma
   ```

3. **Configure Authentication Secrets**

   Create Kubernetes secrets for source and target cluster authentication:

   ```bash
   # Basic auth
   kubectl create secret generic source-auth -n ma \
     --from-literal=username=admin \
     --from-literal=password=<PASSWORD>

   kubectl create secret generic target-auth -n ma \
     --from-literal=username=admin \
     --from-literal=password=<PASSWORD>
   ```

   ```bash
   # mTLS
   kubectl create secret generic source-tls -n ma \
     --from-file=tls.crt=client.crt \
     --from-file=tls.key=client.key \
     --from-file=ca.crt=ca.crt
   ```

   ```bash
   # SigV4 (AWS)
   kubectl create secret generic source-sigv4 -n ma \
     --from-literal=region=us-east-1 \
     --from-literal=service=es
   ```

4. **Create your `values.yaml`**

   See the [Helm Values](#helm-values) section below for configuration details.

5. **Install the Chart**

   ```bash
   helm install migration-assistant opensearch-migrations/migrationAssistantWithArgo \
     -n ma \
     -f values.yaml
   ```

6. **Verify the Deployment**

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

7. **Access the Migration Console**

   ```bash
   kubectl exec -it migration-console-0 -n ma -- bash
   ```


## Helm Values

Key values to configure in your `values.yaml`:

```yaml
sourceCluster:
  endpoint: https://source-cluster:9200
  auth:
    type: basic          # basic, mtls, sigv4, or none
    secretName: source-auth
  version: ES_7_10       # See Migration Paths for version strings

targetCluster:
  endpoint: https://target-cluster:9200
  auth:
    type: basic
    secretName: target-auth
  version: OS_2_11

s3:
  bucket: my-migration-bucket
  region: us-east-1
  # For non-AWS S3-compatible storage (e.g., MinIO):
  # endpoint: https://minio.example.com:9000
```

See [Configuration Options](/opensearch-migrations-eks/deployment/configuration-options/) for the full list of Helm values including RFS worker count, capture proxy replicas, and Kafka configuration.

:::caution
The configuration schema changes between Migration Assistant versions. After deploying, run `workflow configure sample` on the Migration Console to get the accurate schema for your installed version.
:::

### Storage

The Migration Console is deployed as a StatefulSet and requires a PersistentVolumeClaim. Ensure your cluster has a default StorageClass, or specify one explicitly:

```yaml
migrationConsole:
  storage:
    storageClass: standard    # Your cluster's StorageClass name
    size: 1Gi
```

### Kafka for Capture and Replay

If you plan to use Capture and Replay, the chart can deploy a Kafka cluster via the bundled Strimzi operator:

```yaml
strimzi:
  enabled: true               # Deploy Strimzi Kafka operator and cluster

captureProxy:
  enabled: true
  replicas: 2

trafficReplayer:
  enabled: true
```

To use an external Kafka cluster instead:

```yaml
strimzi:
  enabled: false

kafka:
  brokerEndpoints: "kafka-1.example.com:9092,kafka-2.example.com:9092"
```

## Troubleshooting

If pods are stuck in `Pending`, check for resource or storage issues:

```bash
# Check pod events
kubectl describe pod <pod-name> -n ma

# Check PVC status (Migration Console requires a PVC)
kubectl get pvc -n ma
```

If the Argo Workflows controller fails to start, verify that CRDs were installed:

```bash
kubectl get crd | grep argoproj
```

## Next Steps

- [Configuration Options](/opensearch-migrations-eks/deployment/configuration-options/) — full Helm values reference and workflow YAML schema
- [Workflow CLI Getting Started](/opensearch-migrations-eks/workflow-cli/getting-started/) — configure and run your first migration
