---
title: Traffic Routing
description: Route traffic from the source cluster through the capture proxy and to the target cluster.
---


Traffic routing manages the flow of client requests during migration — from the source
cluster, through the capture proxy, and ultimately to the target cluster.

## Routing to the Capture Proxy

### ALB/NLB Configuration

On EKS, the capture proxy fleet is exposed via a Network Load Balancer (NLB). The NLB
DNS name is printed when you run `console capture start`, and it is also available as a
Kubernetes Service:

```bash
kubectl get svc -n ma capture-proxy-svc \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```


1. **Update your application's connection endpoint** to point to the proxy NLB.

2. **Verify traffic is flowing through the proxy:**

   ```bash
   console kafka describe-topics
   ```

   A rising message count on `logging-traffic-topic` confirms that requests are being
   captured.


### Host Header Configuration

If the source cluster uses host-based routing (for example, behind an ALB with
host-condition rules), configure the proxy to forward the correct `Host` header:

```yaml title="values.yaml (Helm)"
captureProxy:
  sourceClusterHost: source-cluster.example.com
```

:::note
Without the correct `Host` header the source cluster may return `404` or route the
request to the wrong virtual host.
:::

## Routing to the Target

When backfill is complete and replay shows an acceptable error rate, you can cut over.


1. **Verify target readiness:**

   ```bash
   console clusters cat-indices --target
   console clusters connection-check --target
   ```

   Confirm index count and document counts match expectations.

2. **Switch traffic.** The exact mechanism depends on your load balancer:

   | Load balancer | How to switch |
   |---------------|---------------|
   | **AWS ALB** (weighted target groups) | Set the target-cluster target group weight to `100` and the proxy target group to `0` in the ALB listener rule. |
   | **AWS NLB** (DNS swap) | Update the CNAME or alias record to point to the target cluster's endpoint. |
   | **Route 53 weighted routing** | Set the target record weight to `255` and the source record weight to `0`. |

   :::tip
   For a gradual cutover, shift traffic in increments (e.g., 10 % → 50 % → 100 %)
   and monitor error rates at each step.
   :::

3. **Verify traffic is hitting the target:**

   ```bash
   # On the target cluster
   curl -s https://<target-cluster>:9200/_cat/nodes?v
   ```

   Confirm active connections and indexing rates are increasing.

4. **Scale down the capture proxy** once all traffic has moved:

   ```bash
   kubectl scale deployment capture-proxy -n ma --replicas=0
   ```


## Fallback Procedure

If you detect elevated error rates or data issues after cutover:


1. **Route traffic back** to the source cluster (reverse the DNS/ALB change from step 2).

2. **Investigate** using tuple logs and CloudWatch metrics:

   ```bash
   console tuples show --status-mismatch --last 200
   ```

3. **Fix the root cause** — common issues include missing indices, incompatible query
   syntax, or security-plugin rejections.

4. **Re-attempt cutover** after the fix is validated.


:::caution
If you fall back, any writes that already reached the target but not the source
will diverge. You may need to re-run backfill for the affected indices or replay
the captured traffic again.
:::

## Next Steps

- [Teardown](/opensearch-migrations-eks/migration-guide/teardown/) — remove migration
  infrastructure after a successful cutover.
