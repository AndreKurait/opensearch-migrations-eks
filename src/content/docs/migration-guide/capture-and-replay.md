---
title: Capture & Replay
description: Capture live traffic and replay it against the target cluster.
---

Capture and Replay enables zero-downtime migration validation by recording live traffic and replaying it against the target.

## Architecture

```
Clients → Capture Proxy Fleet → Source Cluster
              │
              └── records → Kafka (Strimzi)
                               │
                               └── replays → Traffic Replayer → Target Cluster
```

## Start Capture & Replay

### Using the Workflow CLI

```bash
workflow configure edit    # Configure proxy and replayer settings
workflow submit            # Submit the capture-and-replay workflow
```

### Using Console Commands

```bash
console replay start
```

## Monitor Replay

```bash
console replay status
```

## Time Scaling

Speed up replay to catch up with real-time traffic:

```yaml
captureAndReplay:
  replayer:
    speedupFactor: 2.0    # Replay at 2x speed
```

## Jolt Transforms

Apply request transformations during replay using Jolt:

```json
{
  "transforms": [
    {
      "operation": "shift",
      "spec": {
        "old_field": "new_field"
      }
    }
  ]
}
```

## Tuple Logs

View captured request/response pairs:

```bash
console tuples show --last 10
```

## Stop Replay

```bash
console replay stop
```

:::caution
Document ID requirements: For accurate replay validation, documents must have explicit `_id` fields. Auto-generated IDs will differ between source and target.
:::

## Kafka Management

On EKS, Kafka is managed by the **Strimzi operator**. Verify Kafka topics:

```bash
kubectl get kafkatopics -n ma
```
