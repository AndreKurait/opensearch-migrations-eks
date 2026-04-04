---
title: Security Patching
description: Updating and patching Migration Assistant components.
---

Keep Migration Assistant components up to date with security patches and updates.

## Updating Container Images

Migration Assistant components run as container images. To update:

### 1. Clear Docker Cache

```bash
docker system prune -a
```

### 2. Rebuild Images

```bash
# Clean build artifacts
./gradlew clean

# Rebuild all images
./gradlew buildDockerImages
```

### 3. Push to Registry

If using a private ECR registry:

```bash
# Mirror images to ECR
./deployment/k8s/charts/aggregates/migrationAssistantWithArgo/scripts/mirrorToEcr.sh
```

### 4. Update Helm Release

```bash
helm upgrade migration-assistant opensearch-migrations/migrationAssistantWithArgo \
  -n ma \
  -f values.yaml
```

## OS-Level Patching

For EKS managed node groups, update the AMI:

```bash
aws eks update-nodegroup-version \
  --cluster-name migration-eks-cluster-<STAGE>-<REGION> \
  --nodegroup-name <NODEGROUP_NAME>
```

## Checking Current Versions

```bash
# Check running image versions
kubectl get pods -n ma -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].image}{"\n"}{end}'
```

## Security Considerations

- Rotate authentication secrets regularly
- Use SigV4 authentication where possible (avoids storing credentials)
- Enable encryption in transit (TLS) for all cluster connections
- Review IAM role permissions periodically
- Keep EKS cluster version up to date
