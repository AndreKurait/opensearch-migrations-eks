---
title: Troubleshooting
description: Common issues and solutions for Migration Assistant on EKS.
---

## Connectivity Issues

### Cannot reach source/target cluster

```bash
# Verify from the Migration Console
console clusters connection-check
```

**Common causes:**
- Security group rules not allowing traffic from EKS cluster
- VPC peering or transit gateway not configured
- DNS resolution failing inside the pod

### Get EKS cluster security group

```bash
aws eks describe-cluster \
  --name migration-eks-cluster-dev-us-east-1 \
  --query 'cluster.resourcesVpcConfig.clusterSecurityGroupId' \
  --output text
```

## Authentication Failures

### Basic Auth

Verify the Kubernetes secret exists and contains correct credentials:

```bash
kubectl get secret source-auth -n ma -o jsonpath='{.data.username}' | base64 -d
```

### SigV4

Ensure the Migration Console pod's service account has the correct IAM role annotation:

```bash
kubectl describe sa migration-console -n ma
```

## Workflow Failures

### Check workflow status

```bash
workflow status
```

### View Argo Workflows UI

Port-forward the Argo server:

```bash
kubectl port-forward svc/argo-workflows-server -n ma 2746:2746
```

Then open `https://localhost:2746` in your browser.

### View pod logs

```bash
kubectl logs migration-console-0 -n ma
kubectl logs -l app=rfs-worker -n ma
```

## Pod Issues

### Pods stuck in Pending

Check node resources:

```bash
kubectl describe nodes
kubectl get events -n ma --sort-by='.lastTimestamp'
```

### Pods in CrashLoopBackOff

Check logs for the failing pod:

```bash
kubectl logs <pod-name> -n ma --previous
```

## Performance Tuning

### RFS Backfill Slow

- Increase worker count (max 1 per primary shard)
- Increase node resources (CPU/memory)
- Check target cluster indexing throughput

### Replay Falling Behind

- Increase `speedupFactor` in configuration
- Scale replayer resources
- Check Kafka consumer lag:
  ```bash
  kubectl exec -it migration-console-0 -n ma -- \
    kafka-consumer-groups.sh --bootstrap-server kafka:9092 \
    --describe --group replayer
  ```
