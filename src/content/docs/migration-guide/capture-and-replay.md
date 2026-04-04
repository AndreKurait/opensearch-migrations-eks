---
title: Capture & Replay
description: Capture live traffic and replay it against the target cluster for zero-downtime migration validation.
---

Capture and Replay enables zero-downtime migration validation by recording live traffic from the source cluster and replaying it against the target.

## Architecture

```
Clients → Capture Proxy Fleet → Source Cluster
                  ↓
                Kafka (Strimzi)
                  ↓
           Traffic Replayer → Target Cluster
```

## Starting Capture

### Deploy the Proxy Fleet

The capture proxy fleet is deployed as a Kubernetes Deployment with a Service (NLB on EKS):

```bash
console replay start
```

### Verify Kafka Topics

```bash
console kafka describe-topics
```

## Replaying Traffic

### Start the Replayer

```bash
console replay start
```

### Check Replay Status

```bash
console replay status
```

### Time Scaling

The replayer supports a speedup factor to replay traffic faster than real-time:

```yaml
trafficReplayer:
  speedupFactor: 2.0    # Replay at 2x speed
```

## Jolt Transforms

Apply request transformations during replay using Jolt:

```json
{
  "transformations": [
    {
      "JsonJoltTransformerProvider": {
        "spec": [
          {
            "operation": "modify-overwrite-beta",
            "spec": {
              "index": "new-index-name"
            }
          }
        ]
      }
    }
  ]
}
```

## Tuple Logs

The replayer generates tuple logs that pair source requests with target responses for comparison:

```bash
console tuples show
```

## Monitoring

Monitor replay progress via:
- `console replay status` — summary statistics
- CloudWatch dashboards — detailed metrics
- Argo Workflows UI — workflow step status

## Document ID Requirements

:::caution
Capture and Replay requires that documents have stable IDs. If your application generates random document IDs on each request, replayed writes will create duplicate documents on the target.
:::

## Stopping Replay

```bash
console replay stop
```

## Next Steps

- [Traffic Routing](/opensearch-migrations-eks/migration-guide/traffic-routing/) — route traffic to the target cluster
