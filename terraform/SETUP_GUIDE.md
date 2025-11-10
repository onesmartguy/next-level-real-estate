# Terraform Setup Guide

Complete guide for managing secrets across all deployment environments.

## Quick Start by Environment

### Local Development (Docker Compose)

```bash
# 1. Navigate to local environment
cd terraform/environments/local

# 2. Copy and edit configuration
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your API keys

# 3. Initialize and apply
terraform init
terraform apply

# 4. Generated .env file will be at: ../../../.env
# 5. Start Docker Compose
cd ../../..
docker-compose up -d
```

### Debug (Local Kubernetes + ngrok Public Access)

```bash
# 1. Get ngrok credentials
# Visit: https://dashboard.ngrok.com
# - API Key: https://dashboard.ngrok.com/api
# - Authtoken: https://dashboard.ngrok.com/get-started/your-authtoken

# 2. Ensure Kubernetes is running
# Docker Desktop: Enable Kubernetes in settings
# OR
# minikube start
# OR
# k3s server

# 3. Configure Terraform
cd terraform/environments/debug
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars

# 4. Apply configuration
terraform init
terraform apply

# 5. Get your public URL
terraform output public_url

# 6. Deploy application
kubectl apply -f ../../../k8s/debug/

# 7. Access publicly via ngrok URL
```

### Production (Cloud Kubernetes + AWS)

```bash
# 1. Set up AWS backend
# Create S3 bucket and DynamoDB table for state

# 2. Configure Terraform
cd terraform/environments/production
cp terraform.tfvars.example terraform.tfvars
# Edit with production values

# 3. Initialize with backend
terraform init

# 4. Plan and review
terraform plan -out=plan.tfplan

# 5. Apply (with approval)
terraform apply plan.tfplan

# 6. Deploy to Kubernetes
kubectl apply -f ../../../k8s/production/
```

## Environment Comparison

| Feature | Local | Debug | Staging | Production |
|---------|-------|-------|---------|------------|
| **Platform** | Docker Compose | Local K8s | Cloud K8s | Cloud K8s |
| **Secrets** | .env file | K8s Secrets | Cloud Secrets | AWS/Azure |
| **Public Access** | localhost | ngrok | VPN | Load Balancer |
| **State** | Local file | Local file | Remote (S3) | Remote (S3) |
| **Auto-rotation** | No | No | No | Yes (90 days) |
| **Cost** | Free | Free | ~$50/mo | ~$500/mo |

## ngrok Setup (Debug Environment)

### 1. Create ngrok Account
Visit: https://dashboard.ngrok.com/signup

### 2. Get Credentials
- **API Key**: https://dashboard.ngrok.com/api
- **Authtoken**: https://dashboard.ngrok.com/get-started/your-authtoken

### 3. Optional: Reserve Domain (Paid Plans)
- Free plan: Random subdomain (e.g., `xyz123.ngrok.io`)
- Paid plan: Custom subdomain (e.g., `nlre.ngrok.io`)

### 4. Configure in terraform.tfvars
```hcl
ngrok_api_key   = "your_api_key"
ngrok_authtoken = "your_authtoken"
ngrok_domain    = ""  # Leave empty for free plan
```

### 5. Access Your Application
```bash
# Get public URL
terraform output public_url

# OR check ngrok dashboard
# https://dashboard.ngrok.com/tunnels/agents
```

## Common Operations

### Update Secrets

```bash
# Edit terraform.tfvars
vim terraform.tfvars

# Apply changes
terraform apply

# Restart pods (Kubernetes)
kubectl rollout restart deployment -n nlre
```

### Rotate Secrets

```bash
# Generate new secrets
export NEW_JWT_SECRET=$(openssl rand -base64 64)
export NEW_API_SALT=$(openssl rand -base64 32)

# Update terraform.tfvars
# Apply changes
terraform apply

# Update production (AWS)
aws secretsmanager rotate-secret \
  --secret-id nlre-production-secrets
```

### View Current Secrets

```bash
# Local (.env file)
cat ../../../.env

# Kubernetes
kubectl get secret -n nlre nlre-secrets -o jsonpath='{.data}' | jq

# AWS Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id nlre-production-secrets \
  --query SecretString --output text | jq
```

### Backup Secrets

```bash
# Export from Kubernetes
kubectl get secret -n nlre nlre-secrets -o yaml > secrets-backup.yaml

# Export from AWS
aws secretsmanager get-secret-value \
  --secret-id nlre-production-secrets > aws-secrets-backup.json

# Store backups securely (encrypted)
gpg --encrypt --recipient your@email.com secrets-backup.yaml
```

## Security Best Practices

### 1. Never Commit Secrets
```bash
# .gitignore already includes:
terraform.tfvars
*.tfstate
*.tfstate.*
.terraform/
.env*
```

### 2. Use Different Secrets Per Environment
```bash
# Local: Test API keys or mocks
# Debug: Development API keys
# Staging: Staging API keys
# Production: Production API keys (rotate regularly)
```

### 3. Enable Audit Logging

**Kubernetes:**
```bash
# Enable audit logging
kubectl create clusterrolebinding audit-log-access \
  --clusterrole=audit-log-reader \
  --serviceaccount=kube-system:audit-logger
```

**AWS:**
```bash
# Enable CloudTrail
aws cloudtrail create-trail \
  --name nlre-audit \
  --s3-bucket-name nlre-audit-logs
```

### 4. Restrict Access

**Kubernetes RBAC:**
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]
```

**AWS IAM:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "secretsmanager:GetSecretValue",
    "Resource": "arn:aws:secretsmanager:*:*:secret:nlre-*"
  }]
}
```

## Troubleshooting

### Terraform Errors

**Problem**: `Error: Failed to query available provider packages`
```bash
# Solution: Clear cache and re-init
rm -rf .terraform/
terraform init
```

**Problem**: `Error: Backend initialization required`
```bash
# Solution: Initialize backend
terraform init -reconfigure
```

**Problem**: `Error: state lock`
```bash
# Solution: Force unlock (use with caution!)
terraform force-unlock <lock-id>
```

### Kubernetes Errors

**Problem**: Secret not found
```bash
# Verify namespace
kubectl get namespaces

# Check secret exists
kubectl get secrets -n nlre

# Recreate secret
terraform destroy -target=module.secrets.kubernetes_secret.nlre_secrets
terraform apply
```

**Problem**: Pods can't access secrets
```bash
# Check pod environment
kubectl exec -n nlre <pod-name> -- env | grep ANTHROPIC

# Check secret mounted
kubectl describe pod -n nlre <pod-name>
```

### ngrok Errors

**Problem**: ngrok tunnel not starting
```bash
# Check ngrok pod logs
kubectl logs -n ngrok-ingress-controller -l app=ngrok-ingress-controller

# Verify credentials
kubectl get secret -n ngrok-ingress-controller ngrok-credentials

# Test ngrok connection
ngrok http 80 --authtoken=<your-token>
```

**Problem**: Can't access via ngrok URL
```bash
# Check ingress status
kubectl get ingress -n nlre

# Verify ngrok dashboard
# https://dashboard.ngrok.com/tunnels/agents

# Check application is running
kubectl get pods -n nlre
```

## Migration Guide

### From .env to Terraform

1. **Backup existing .env**
   ```bash
   cp .env .env.backup
   ```

2. **Extract values**
   ```bash
   cat .env | grep "^[A-Z]" > values.txt
   ```

3. **Create terraform.tfvars**
   ```bash
   cd terraform/environments/local
   cp terraform.tfvars.example terraform.tfvars
   # Manually transfer values from values.txt
   ```

4. **Apply Terraform**
   ```bash
   terraform init
   terraform apply
   ```

5. **Verify generated .env matches**
   ```bash
   diff .env .env.backup
   ```

### From Kubernetes Secrets to AWS Secrets Manager

1. **Export existing secrets**
   ```bash
   kubectl get secret -n nlre nlre-secrets -o json > k8s-secrets.json
   ```

2. **Configure Terraform for AWS**
   ```bash
   cd terraform/environments/production
   # Edit terraform.tfvars
   use_aws_secrets_manager = true
   ```

3. **Apply Terraform**
   ```bash
   terraform apply
   ```

4. **Enable External Secrets Operator**
   ```bash
   # Edit terraform.tfvars
   use_external_secrets_operator = true
   terraform apply
   ```

5. **Verify sync**
   ```bash
   kubectl get externalsecrets -n nlre
   kubectl get secret -n nlre nlre-secrets -o yaml
   ```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy Secrets

on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2

      - name: Terraform Apply
        working-directory: terraform/environments/production
        run: |
          terraform init
          terraform apply -auto-approve
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          TF_VAR_anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          TF_VAR_openai_api_key: ${{ secrets.OPENAI_API_KEY }}
```

### GitLab CI

```yaml
deploy-secrets:
  image: hashicorp/terraform:latest
  script:
    - cd terraform/environments/production
    - terraform init
    - terraform plan -out=plan.tfplan
    - terraform apply plan.tfplan
  only:
    - main
  variables:
    TF_VAR_anthropic_api_key: $ANTHROPIC_API_KEY
```

## Cost Optimization

### Local/Debug: Free
- Docker Compose: Free
- Docker Desktop K8s: Free
- ngrok: Free tier available

### Production: Optimize
```hcl
# Use Secrets Manager only for critical secrets
use_aws_secrets_manager = true

# Store non-sensitive config in ConfigMaps (free)
# Store sensitive secrets in Secrets Manager

# Estimated costs:
# - AWS Secrets Manager: $0.40/secret/month
# - Secret rotation Lambda: $0.20/month
# - Total: ~$5/month for secrets
```

## Support

- **Terraform**: https://www.terraform.io/docs
- **Kubernetes Secrets**: https://kubernetes.io/docs/concepts/configuration/secret/
- **ngrok**: https://ngrok.com/docs
- **AWS Secrets Manager**: https://docs.aws.amazon.com/secretsmanager/

---

**Last Updated**: November 10, 2025
