---
title: Security Patching
description: Procedures for updating Migration Assistant container images, node AMIs, and security configurations.
---

import { Steps, Aside, Tabs, TabItem, LinkCard, CardGrid } from '@astrojs/starlight/components';

Keep Migration Assistant components up to date with security patches and updates. This guide covers container image updates, OS-level patching, and security best practices.

<Aside type="caution">
Plan patching during a maintenance window. Updating container images or node AMIs will restart pods, which temporarily interrupts any running migration. Workflow state is preserved—you can resume after patching.
</Aside>

## Updating Container Images

Migration Assistant includes several container images that should be updated when new releases or security patches are available:

| Component | Image | Update frequency |
|-----------|-------|-----------------|
| Migration Console | `migrations/migration_console` | Each release |
| Capture Proxy | `migrations/capture_proxy` | Each release |
| Traffic Replayer | `migrations/traffic_replayer` | Each release |
| Reindex-from-Snapshot | `migrations/reindex_from_snapshot` | Each release |
| Metadata Migration | `migrations/metadata_migration` | Each release |
| Argo Workflows | `quay.io/argoproj/workflow-controller` | Upstream releases |
| Kafka (Strimzi) | `quay.io/strimzi/kafka` | Upstream releases |

### Update Procedure

<Steps>

1. **Clear Docker cache** to ensure a clean build:

   ```bash
   docker system prune -a
   ```

2. **Rebuild images** from the latest source:

   ```bash
   # Pull latest source
   git pull origin main

   # Clean build artifacts
   ./gradlew clean

   # Rebuild all images
   ./gradlew buildDockerImages
   ```

3. **Push to your container registry:**

   <Tabs>
     <TabItem label="ECR (EKS)">
       ```bash
       # Mirror all images to your ECR registry
       ./deployment/k8s/charts/aggregates/migrationAssistantWithArgo/scripts/mirrorToEcr.sh
       ```

       The script automatically tags images and pushes to the ECR repositories created during deployment.
     </TabItem>
     <TabItem label="Other registries">
       ```bash
       # Tag and push each image
       docker tag migrations/migration_console:latest <REGISTRY>/migration_console:latest
       docker push <REGISTRY>/migration_console:latest

       # Repeat for each component image
       ```
     </TabItem>
   </Tabs>

4. **Update the Helm release** to pick up new images:

   ```bash
   helm upgrade migration-assistant opensearch-migrations/migrationAssistantWithArgo \
     -n ma \
     -f values.yaml
   ```

   <Aside type="tip">
   If you're pinning image tags in your `values.yaml` (recommended for production), update the tags before running `helm upgrade`.
   </Aside>

5. **Verify the update:**

   ```bash
   # Check that pods restarted with new images
   kubectl get pods -n ma -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].image}{"\n"}{end}'
   ```

   Confirm each pod shows the expected image tag.

</Steps>

### Rollback

If an update causes issues, roll back the Helm release:

```bash
# List release history
helm history migration-assistant -n ma

# Rollback to previous revision
helm rollback migration-assistant <REVISION_NUMBER> -n ma
```

## OS-Level Patching

### EKS Managed Node Groups

For EKS managed node groups, update the node AMI to pick up OS-level security patches:

```bash
aws eks update-nodegroup-version \
  --cluster-name migration-eks-cluster-<STAGE>-<REGION> \
  --nodegroup-name <NODEGROUP_NAME>
```

<Aside>
EKS managed node groups perform a rolling update by default—nodes are drained and replaced one at a time. This minimizes disruption but takes longer for large node groups.
</Aside>

### EKS Cluster Version

Keep the EKS control plane up to date with supported Kubernetes versions:

```bash
# Check current version
aws eks describe-cluster --name migration-eks-cluster-<STAGE>-<REGION> \
  --query 'cluster.version' --output text

# Update (plan carefully—this is a one-way operation)
aws eks update-cluster-version \
  --name migration-eks-cluster-<STAGE>-<REGION> \
  --kubernetes-version <NEW_VERSION>
```

<Aside type="caution">
EKS cluster version upgrades are irreversible. Test in a non-production environment first. After upgrading the control plane, update the node groups to match.
</Aside>

## Checking Current Versions

```bash
# All running image versions
kubectl get pods -n ma \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].image}{"\n"}{end}'

# Helm chart version
helm list -n ma

# EKS cluster version
aws eks describe-cluster --name migration-eks-cluster-<STAGE>-<REGION> \
  --query 'cluster.version' --output text

# Node AMI versions
aws eks describe-nodegroup \
  --cluster-name migration-eks-cluster-<STAGE>-<REGION> \
  --nodegroup-name <NODEGROUP_NAME> \
  --query 'nodegroup.releaseVersion' --output text
```

## Security Best Practices

### Authentication

| Practice | Rationale |
|----------|-----------|
| Use SigV4 authentication where possible | Avoids storing long-lived credentials; uses temporary IAM credentials |
| Rotate Kubernetes secrets regularly | Limits exposure window if credentials are compromised |
| Use separate credentials for source and target | Limits blast radius; allows independent rotation |

### Network Security

| Practice | Rationale |
|----------|-----------|
| Enable TLS for all cluster connections | Encrypts data in transit between Migration Assistant and clusters |
| Restrict security groups to minimum required ports | Reduces attack surface |
| Use private endpoints where available | Avoids exposing cluster APIs to the internet |

### IAM and RBAC

| Practice | Rationale |
|----------|-----------|
| Follow least-privilege for IAM roles | Migration roles should only have `es:ESHttp*` permissions on the specific domain |
| Review IAM role permissions periodically | Remove unused permissions as migration progresses |
| Use Kubernetes RBAC to restrict namespace access | Limit who can `exec` into the Migration Console pod |

<Aside type="tip">
For detailed IAM configuration, see [IAM & Security](/opensearch-migrations-eks/deployment/iam-and-security/).
</Aside>

### Monitoring for Vulnerabilities

- Subscribe to [OpenSearch security advisories](https://opensearch.org/security.html) for Migration Assistant updates
- Monitor [Argo Workflows releases](https://github.com/argoproj/argo-workflows/releases) for security patches
- Use container image scanning (e.g., Amazon ECR image scanning, Trivy) to detect known CVEs in running images:

  ```bash
  # Trigger ECR scan for a specific image
  aws ecr start-image-scan \
    --repository-name migration_console \
    --image-id imageTag=latest
  ```

## Next Steps

<CardGrid>
  <LinkCard
    title="IAM & Security"
    description="Configure IAM roles and security policies for your deployment."
    href="/opensearch-migrations-eks/deployment/iam-and-security/"
  />
  <LinkCard
    title="Configuration Options"
    description="All Helm chart values and environment configuration."
    href="/opensearch-migrations-eks/deployment/configuration-options/"
  />
</CardGrid>
