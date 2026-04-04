---
title: Traffic Routing
description: Route traffic through the capture proxy and switch to the target cluster.
---

## Reroute to Capture Proxy

Before capturing traffic, route client requests through the proxy fleet.

### On EKS

The Capture Proxy is exposed via a Network Load Balancer (NLB). Update your client configuration or DNS to point to the NLB endpoint.

### Verify Capture

Confirm traffic is flowing through the proxy and being recorded to Kafka:

```bash
console replay status
kubectl get kafkatopics -n ma
```

### Host Header Configuration

If your source cluster requires a specific `Host` header, configure it in the proxy settings.

## Reroute to Target

Once validation is complete, switch traffic from the source to the target cluster.

### Gradual Switchover

Use weighted routing to gradually shift traffic:

1. Start with 10% to target, 90% to source
2. Monitor error rates and latency
3. Increase target weight incrementally
4. Complete switchover to 100% target

### Fallback Procedure

If issues are detected after switchover:

1. Immediately route traffic back to the source
2. Investigate errors on the target
3. Re-run validation before attempting switchover again

:::tip
Keep the capture proxy running during the switchover period so you can continue monitoring traffic patterns and quickly fall back if needed.
:::
