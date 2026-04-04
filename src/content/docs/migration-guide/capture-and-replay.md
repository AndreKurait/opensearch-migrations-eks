---
title: Capture & Replay
description: Capture live traffic and replay it against the target cluster for zero-downtime migration validation.
---


Capture and Replay records every request that hits the source cluster and replays it
against the target — giving you a side-by-side comparison before you cut over
production traffic.

## Architecture

```text
Clients → Capture Proxy Fleet → Source Cluster
                  │
                  ▼
            Kafka (Strimzi)
                  │
                  ▼
         Traffic Replayer → Target Cluster
```

- **Capture Proxy** — a transparent HTTP proxy deployed as a Kubernetes Deployment
  (with an NLB on EKS). It forwards every request to the source cluster *and* publishes
  a copy to Kafka.
- **Kafka (Strimzi)** — buffers captured traffic. Default retention is 3 days.
- **Traffic Replayer** — consumes from Kafka and replays requests against the target
  cluster, writing comparison results to tuple logs.

## Starting Capture


1. **Deploy the proxy fleet:**

   ```bash
   console capture start
   ```

   This creates the proxy Deployment, Service, and NLB.

2. **Route client traffic to the proxy.** See
   [Traffic Routing → Routing to the Capture Proxy](/opensearch-migrations-eks/migration-guide/traffic-routing/#routing-to-the-capture-proxy)
   for ALB/NLB and DNS instructions.

3. **Verify Kafka is receiving traffic:**

   ```bash
   console kafka describe-topics
   ```

   You should see a non-zero message count on the `logging-traffic-topic`.


:::tip
Start capture **before** backfill completes. This ensures that any writes that arrive
after the snapshot was taken are also delivered to the target.
:::

## Replaying Traffic


1. **Start the replayer:**

   ```bash
   console replay start
   ```

2. **Check status:**

   ```bash
   console replay status
   ```

   Sample output:

   ```text
   Replayer Status
     State:        RUNNING
     Lag:          1,240 messages (est. 8 s behind real-time)
     Replayed:     412,000 requests
     Errors:       12 (0.003%)
   ```

3. **Review tuple logs** (see [Tuple Logs](#tuple-logs)) to compare source and target
   responses.


### Time Scaling

The replayer supports a speedup factor to replay traffic faster than real-time.
This is useful for catching up after a long capture period:

```yaml title="replayer-config.yaml"
trafficReplayer:
  speedupFactor: 2.0    # Replay at 2x speed
```

:::caution
A high speedup factor increases load on the target cluster proportionally.
Monitor target cluster CPU and reject rate before exceeding `4.0`.
:::

## Jolt Transforms

Apply request transformations during replay using [Jolt](https://github.com/bazaarvoice/jolt)
specs. Common use cases: rewriting index names, removing deprecated query parameters,
or injecting authentication headers.

```json title="jolt-transform.json"
{
  "transformations": [
    {
      "JsonJoltTransformerProvider": {
        "spec": [
          {
            "operation": "modify-overwrite-beta",
            "spec": {
              "URI": "/new-index-name/_search"
            }
          }
        ]
      }
    }
  ]
}
```

## Tuple Logs

The replayer writes a **tuple log** for every request: the original source request,
the source response, and the target response. Use these logs to find behavioral
differences.

```bash
console tuples show --last 50
```

| Column | Meaning |
|--------|---------|
| `sourceRequest` | Method, URI, and body sent to the source |
| `sourceResponse` | Status code and latency from the source |
| `targetResponse` | Status code and latency from the target |
| `statusMatch` | `true` if both status codes are equal |

:::tip
Filter for mismatches to focus your investigation:
`console tuples show --status-mismatch`
:::

## Document ID Requirements

:::caution
Capture and Replay requires that documents have **stable IDs**. If your application
uses auto-generated IDs (`POST /index/_doc` without an `_id`), every replayed write
creates a duplicate document on the target.

**Mitigation:** assign explicit `_id` values in your application, or use a Jolt
transform to inject deterministic IDs during replay.
:::

## Monitoring

| Source | What it shows |
|--------|---------------|
| `console replay status` | High-level summary: lag, throughput, error rate |
| CloudWatch dashboards | Per-topic Kafka lag, replayer pod CPU/memory |
| Argo Workflows UI | Step-level status for long-running replay workflows |
| Tuple logs | Request-level comparison between source and target |

## Stopping Capture and Replay

```bash
console replay stop     # Stop the replayer
console capture stop    # Stop the proxy fleet (after traffic is routed away)
```

:::note
Stop the **replayer** first to let it drain the Kafka topic. Then stop capture
after you have routed traffic directly to the target
(see [Traffic Routing](/opensearch-migrations-eks/migration-guide/traffic-routing/)).
:::

## Next Steps

- [Traffic Routing](/opensearch-migrations-eks/migration-guide/traffic-routing/) — route
  production traffic to the target cluster.
