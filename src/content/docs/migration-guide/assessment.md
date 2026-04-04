---
title: Assessment
description: Evaluate your migration before starting.
---

Before migrating, assess your source cluster to identify potential issues.

## Breaking Changes Tool

Run the assessment from the Migration Console:

```bash
console metadata evaluate --source-cluster
```

This identifies:
- **Field type incompatibilities** between source and target versions
- **Deprecated mappings** (e.g., multi-type indexes in ES 5.x–6.x)
- **Plugin dependencies** that may not exist on the target
- **Index settings** that need adjustment

## Checklist

- [ ] Verify source and target versions are [compatible](/opensearch-migrations-eks/overview/migration-paths/)
- [ ] Run the breaking changes assessment
- [ ] Review [field type transformations](/opensearch-migrations-eks/migration-guide/migrate-metadata/) needed
- [ ] Estimate data volume and plan worker scaling
- [ ] Confirm network connectivity between EKS and source/target clusters
- [ ] Set up IAM roles and security groups
