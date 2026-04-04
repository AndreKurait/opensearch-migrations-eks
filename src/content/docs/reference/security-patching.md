---
title: Security Patching
description: Keep Migration Assistant components up to date.
---

## Updating Container Images

Migration Assistant components run as container images. To apply security patches:

### 1. Clear Docker Cache

```bash
docker system prune -a
```

### 2. Rebuild Images

```bash
./gradlew clean
./gradlew docker
```

### 3. Update Helm Release

```bash
helm upgrade migration-assistant \
  opensearch-migrations/migrationAssistantWithArgo \
  -n ma \
  -f values.yaml
```

### 4. Verify Updated Pods

```bash
kubectl get pods -n ma -o wide
kubectl describe pod migration-console-0 -n ma | grep Image
```

## OS-Level Patching

For EKS managed node groups, update the AMI:

```bash
aws eks update-nodegroup-version \
  --cluster-name migration-eks-cluster-dev-us-east-1 \
  --nodegroup-name <NODEGROUP_NAME>
```

## Checking for Updates

Monitor the [GitHub Releases](https://github.com/opensearch-project/opensearch-migrations/releases) page for new versions and security advisories.
