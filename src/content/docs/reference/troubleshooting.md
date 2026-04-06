---
title: Troubleshooting
description: Common issues and solutions for Migration Assistant on EKS.
---

This guide covers common issues encountered when deploying and operating Migration Assistant on EKS.

## Connectivity Issues

### Cannot Connect to Source/Target Cluster

```bash
console clusters connection-check
```

**Common causes:**
- Security group rules not allowing traffic from EKS nodes
- Incorrect endpoint URL or port
- Authentication credentials expired or incorrect

**Resolution:**
1. Verify the cluster security group allows inbound from the EKS node security group
2. Check the endpoint URL in your configuration
3. Verify authentication secrets are correctly created

### EKS Security Group Lookup

```bash
aws eks describe-cluster \
  --name migration-eks-cluster-<STAGE>-<REGION> \
  --query 'cluster.resourcesVpcConfig.clusterSecurityGroupId' \
  --output text
```

## Authentication Issues

### Basic Auth Failures

Verify the Kubernetes secret contains correct credentials:

```bash
kubectl get secret source-auth -n ma -o jsonpath='{.data.username}' | base64 -d
```

### SigV4 Auth Failures

- Verify the IAM role has the correct permissions
- Check that the region and service name are correct in the secret
- Ensure the EKS node role can assume the migration role

## Workflow Failures

### Workflow Stuck in Pending

```bash
workflow status
kubectl get pods -n ma
```

**Common causes:**
- Insufficient cluster resources (CPU/memory)
- Node pool not scaled up
- Image pull failures

**Resolution:**
1. Check node capacity: `kubectl describe nodes | grep -A 5 "Allocated resources"`
2. Verify images are pullable: `kubectl describe pod <POD_NAME> -n ma | grep -A 3 "Events"`
3. Scale the node group if needed

### Workflow Step Failed

```bash
# Check Argo workflow logs

kubectl logs -n ma -l workflows.argoproj.io/workflow=<WORKFLOW_NAME>
```

## Pod Issues

### Pods in CrashLoopBackOff

```bash
kubectl describe pod <POD_NAME> -n ma
kubectl logs <POD_NAME> -n ma --previous
```

**Common causes:**
- Configuration errors (bad endpoint, invalid YAML)
- Missing secrets
- Out-of-memory kills (check `kubectl describe pod` for OOMKilled)

### Pods Pending (Unschedulable)

```bash
kubectl describe pod <POD_NAME> -n ma
kubectl get nodes -o wide
```

**Common causes:**
- Insufficient CPU or memory on nodes
- Node affinity or taint mismatch
- PersistentVolumeClaim not bound

## Performance Issues

### Slow Backfill

- Increase worker count (up to 1 per shard)
- Check S3 throughput limits
- Verify target cluster can handle the indexing rate
- Monitor target cluster CPU and memory
- Check for index-level throttling on the target: `GET _cat/thread_pool/write?v`

### Slow Replay

- Check Kafka consumer lag: `console kafka describe-topics`
- Verify target cluster performance
- Consider adjusting the speedup factor
- Monitor replayer pod resource usage

## Debugging Commands

```bash
# Cluster status

kubectl get pods -n ma
kubectl get events -n ma --sort-by='.lastTimestamp'

# Argo workflows

kubectl get workflows -n ma
kubectl get pods -n ma -l workflows.argoproj.io/workflow

# Logs

kubectl logs migration-console-0 -n ma
kubectl logs -l app=capture-proxy -n ma
kubectl logs -l app=traffic-replayer -n ma

# Resource usage

kubectl top pods -n ma
kubectl top nodes
```
