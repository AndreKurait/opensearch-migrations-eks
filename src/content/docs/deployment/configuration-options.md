---
title: Configuration Options
description: Helm values, workflow YAML, and tuning guidance for Migration Assistant deployment.
---


Migration Assistant is configured through Helm values (cluster endpoints, authentication, infrastructure) and workflow YAML configuration (migration behavior, index scope, worker settings).

:::caution
The configuration schema changes between Migration Assistant versions. Do not copy YAML examples from this documentation verbatim. After deploying, run `workflow configure sample` on the Migration Console to get the accurate schema for your installed version.
:::

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

### Version Identifiers

The `version` field tells Migration Assistant how to interpret the source cluster's data formats and API behavior. See [Migration Paths](/opensearch-migrations-eks/overview/migration-paths/) for the full compatibility matrix.

| Identifier | Cluster Version |
|------------|----------------|
| `ES_5_6` | Elasticsearch 5.6.x |
| `ES_6_8` | Elasticsearch 6.8.x |
| `ES_7_10` | Elasticsearch 7.x (any minor version) |
| `ES_8_x` | Elasticsearch 8.x |
| `OS_1_3` | OpenSearch 1.x |
| `OS_2_11` | OpenSearch 2.x |

:::note
For Elasticsearch 7.x, use `ES_7_10` regardless of the exact minor version. Migration Assistant uses this identifier for compatibility behavior, not as a precise version match.
:::

### Authentication Types

| Type | Description | Secret Fields |
|------|-------------|---------------|
| `none` | No authentication | — |
| `basic` | Username/password | `username`, `password` |
| `mtls` | Mutual TLS | `tls.crt`, `tls.key`, `ca.crt` |
| `sigv4` | AWS Signature V4 | `region`, `service` |

See [Deploying to Kubernetes](/opensearch-migrations-eks/deployment/deploying-to-kubernetes/#3-configure-authentication-secrets) for examples of creating each secret type. For EKS deployments using SigV4, see [IAM & Security](/opensearch-migrations-eks/deployment/iam-security/).


#### Basic Auth
```yaml
sourceCluster:
  auth:
    type: basic
    secretName: source-basic-auth
# Secret must contain `username` and `password` keys
```

#### Mutual TLS
```yaml
sourceCluster:
  auth:
    type: mtls
    secretName: source-mtls
# Secret must contain `tls.crt`, `tls.key`, and `ca.crt` keys
```

#### SigV4 (AWS)
```yaml
targetCluster:
  auth:
    type: sigv4
    secretName: target-sigv4
# Secret must contain `region` and `service` keys
# Pod service account must have appropriate IAM role annotation
```



### Snapshot Configuration

```yaml
snapshot:
  s3:
    bucket: migrations-default-123456789-dev-us-east-1
    region: us-east-1
    roleArn: arn:aws:iam::123456789:role/snapshot-role
```

For non-AWS S3-compatible storage (MinIO, GCS with S3 compatibility):

```yaml
snapshot:
  s3:
    bucket: my-migration-bucket
    region: us-east-1
    endpoint: https://minio.example.com:9000
```

### RFS (Backfill) Configuration

```yaml
rfs:
  workers: 4              # Number of parallel workers
  maxShardSizeGb: 80      # Max shard size to process
  indexAllowlist:          # Optional: only migrate specific indexes
    - my-index-*
    - other-index
```

**Tuning guidance:**

| Setting | Guidance |
|---------|----------|
| `workers` | Set to the number of primary shards you're migrating, or fewer if target cluster throughput is the bottleneck. Each worker processes one shard at a time. Maximum useful value equals the number of primary shards in the indexes being migrated. |
| `maxShardSizeGb` | Shards larger than this value are skipped. Increase if you have very large shards. Default: 80 GB. |
| `indexAllowlist` | Supports glob patterns (`*`, `?`). If omitted, all non-system indexes are migrated. System indexes (those starting with `.`) are excluded by default. |

:::tip
To exclude specific indexes instead of listing everything you want, use `indexAllowlist` with a broad pattern and omit the unwanted ones. There is no separate denylist — scope control is done entirely through the allowlist. To migrate everything except system indexes, omit `indexAllowlist` entirely (the default behavior).
:::

### Capture and Replay Configuration

```yaml
captureProxy:
  replicas: 2             # Number of proxy instances

trafficReplayer:
  replicas: 1
  speedupFactor: 1.0      # Replay speed multiplier
  joltTransforms: []      # Optional request transforms
```

**Tuning guidance:**

| Setting | Guidance |
|---------|----------|
| `captureProxy.replicas` | Match the number of source cluster data nodes, or scale based on request throughput. Each proxy instance handles traffic independently. |
| `trafficReplayer.replicas` | Start with 1. Increase if replay falls behind capture — monitor the Kafka consumer lag to determine this. |
| `speedupFactor` | Values greater than `1.0` replay traffic faster than it was captured. Use `2.0` to replay at double speed during catch-up. Use `1.0` for steady-state replay. |
| `joltTransforms` | [JOLT](https://github.com/bazaarvoice/jolt) transformation specs applied to each request before replay. Use for index name remapping, field transformations, or header modifications. |

:::caution
Capture and Replay requires that clients include explicit document IDs in index and update operations. Auto-generated IDs are not preserved during replay, which would cause duplicate documents on the target.
:::

### Kafka Configuration (Capture and Replay)

When using Capture and Replay, Kafka stores the captured traffic. The Helm chart can deploy Kafka via the bundled Strimzi operator, or you can point to an external Kafka cluster:


#### Bundled (Strimzi)
```yaml
kafka:
  enabled: true           # Deploy Kafka via Strimzi
  replicas: 3
  storage:
    size: 100Gi           # Per-broker storage
    storageClass: gp3     # Must support ReadWriteOnce
```

#### External Kafka
```yaml
kafka:
  enabled: false
  externalEndpoint: my-kafka-cluster:9092
```



## Workflow YAML Configuration

The workflow YAML file controls migration behavior at runtime. It is separate from the Helm values and is edited on the Migration Console after deployment.


1. **Generate a sample configuration** for your installed version:

   ```bash
   workflow configure sample --load
   ```

2. **Edit the configuration** to match your migration:

   ```bash
   workflow configure edit
   ```

3. **Validate before submitting:**

   ```bash
   workflow configure show
   ```


The workflow configuration includes settings for each migration phase. Here is an annotated example of the structure (your installed version may differ):

```yaml
# Snapshot phase
snapshot:
  otel_endpoint: ""       # Optional: OpenTelemetry collector endpoint

# Metadata migration phase
metadata:
  otel_endpoint: ""
  config:
    index_allowlist:       # Same glob syntax as Helm indexAllowlist
      - "my-index-*"
    index_denylist:        # Exclude specific indexes from metadata migration
      - ".kibana*"
      - ".security*"
      - ".tasks"

# Backfill phase
backfill:
  otel_endpoint: ""
  reindex_from_snapshot:
    local:
      workers: 4           # Overrides Helm rfs.workers at runtime
      documents_per_bulk_request: 1000
      max_connections: 20   # Max concurrent connections to target per worker
```

:::note
The workflow YAML supports `index_allowlist` *and* `index_denylist` for the metadata phase, giving finer control than the Helm-level `indexAllowlist` alone. Use the denylist to exclude system indexes like `.kibana`, `.security`, and `.tasks` while migrating everything else.
:::

See [Workflow CLI Getting Started](/opensearch-migrations-eks/workflow-cli/getting-started/) for the full workflow lifecycle including submission, monitoring, and approval gates.
