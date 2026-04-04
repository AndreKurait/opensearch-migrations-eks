---
title: Configuration Options
description: Configuration options for Migration Assistant deployment and workflows.
---

Migration Assistant is configured through Helm values and workflow YAML configuration.

## Helm Chart Configuration

### Source and Target Clusters

```yaml
sourceCluster:
  endpoint: https://source-cluster:9200
  auth:
    type: basic       # basic, mtls, sigv4, or none
    secretName: source-auth
  version: ES_7_10    # Source version identifier

targetCluster:
  endpoint: https://target-cluster:9200
  auth:
    type: sigv4
    secretName: target-sigv4
  version: OS_2_11
```

### Authentication Types

| Type | Description | Secret Fields |
|------|-------------|---------------|
| `none` | No authentication | — |
| `basic` | Username/password | `username`, `password` |
| `mtls` | Mutual TLS | `tls.crt`, `tls.key`, `ca.crt` |
| `sigv4` | AWS Signature V4 | `region`, `service` |

### Snapshot Configuration

```yaml
snapshot:
  s3:
    bucket: migrations-default-123456789-dev-us-east-1
    region: us-east-1
    roleArn: arn:aws:iam::123456789:role/snapshot-role
```

### RFS (Backfill) Configuration

```yaml
rfs:
  workers: 4              # Number of parallel workers
  maxShardSizeGb: 80      # Max shard size to process
  indexAllowlist:          # Optional: only migrate specific indices
    - my-index-*
    - other-index
```

### Capture and Replay Configuration

```yaml
captureProxy:
  replicas: 2             # Number of proxy instances
  
trafficReplayer:
  replicas: 1
  speedupFactor: 1.0      # Replay speed multiplier
  joltTransforms: []      # Optional request transforms
```

## Workflow Configuration

The Workflow CLI uses a YAML configuration file that defines the migration parameters:

```bash
# Generate a sample configuration
workflow configure sample --load

# Edit the configuration
workflow configure edit
```

See [Workflow CLI Getting Started](/opensearch-migrations-eks/workflow-cli/getting-started/) for details.
