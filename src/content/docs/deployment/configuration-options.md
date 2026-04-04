---
title: Configuration Options
description: Configure Migration Assistant for your environment.
---

Migration Assistant uses a declarative YAML configuration that defines source and target clusters, authentication, and migration behavior.

## Workflow Configuration

Generate a sample configuration:

```bash
workflow configure sample --load
```

Edit the configuration:

```bash
workflow configure edit
```

## Key Configuration Sections

### Source Cluster

```yaml
source:
  host: https://source-cluster:9200
  auth:
    type: basic          # basic | sigv4 | none
    username: admin
    passwordSecret: source-auth
  version: ES_7_10
```

### Target Cluster

```yaml
target:
  host: https://target-cluster:9200
  auth:
    type: sigv4
    region: us-east-1
    service: es
  version: OS_2_15
```

### Snapshot Configuration

```yaml
snapshot:
  s3:
    bucket: migrations-default-123456789-dev-us-east-1
    region: us-east-1
    roleArn: arn:aws:iam::123456789:role/snapshot-role
```

### Backfill Options

```yaml
backfill:
  type: reindex_from_snapshot
  reindexFromSnapshot:
    workerCount: 4
    indexAllowlist:
      - my-index-*
      - other-index
```

### Capture & Replay Options

```yaml
captureAndReplay:
  kafka:
    brokerEndpoints: kafka-bootstrap:9092
  replayer:
    speedupFactor: 2.0
```

## Authentication Types

| Type | Configuration | Use Case |
|------|--------------|----------|
| `none` | No auth required | Development/testing |
| `basic` | Username + K8s Secret | Self-managed clusters |
| `sigv4` | IAM role + region | Amazon OpenSearch Service |
