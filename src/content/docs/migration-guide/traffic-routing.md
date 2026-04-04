---
title: Traffic Routing
description: Route traffic from the source cluster through the capture proxy and to the target cluster.
---

Traffic routing manages the flow of client requests during migration — from the source cluster, through the capture proxy, and ultimately to the target cluster.

## Routing to the Capture Proxy

### ALB/NLB Configuration

On EKS, the capture proxy fleet is exposed via a Network Load Balancer (NLB). Route client traffic to the NLB endpoint:

1. Update your application's connection endpoint to point to the proxy NLB
2. Verify traffic is flowing through the proxy:

```bash
console kafka describe-topics
```

### Host Header Configuration

If your source cluster uses host-based routing, configure the proxy to forward the correct `Host` header:

```yaml
captureProxy:
  sourceClusterHost: source-cluster.example.com
```

## Routing to the Target

When you're ready to cut over to the target cluster:

### 1. Verify Target Readiness

```bash
console clusters cat-indices --target
console clusters connection-check --target
```

### 2. Switch Traffic

For ALB-based routing, adjust target group weights:

```bash
# Gradually shift traffic (e.g., 10% → 50% → 100%)
# This is done at the load balancer level
```

### 3. Scale Down Proxy

After confirming all traffic is flowing to the target:

```bash
# Scale down the capture proxy fleet
kubectl scale deployment capture-proxy -n ma --replicas=0
```

## Fallback Procedure

If issues are detected after cutover:

1. Route traffic back to the source cluster
2. Investigate issues using tuple logs and CloudWatch metrics
3. Address issues and retry the cutover

## Next Steps

- [Teardown](/opensearch-migrations-eks/migration-guide/teardown/) — remove migration infrastructure after successful cutover
