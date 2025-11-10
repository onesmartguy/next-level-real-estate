# Terraform Infrastructure as Code

**Purpose**: Manage secrets and infrastructure across all deployment environments

## Directory Structure

```
terraform/
├── modules/
│   ├── secrets/              # Reusable secret management module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   └── kubernetes/           # Kubernetes-specific resources
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── local/                # Local development (Docker Compose)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── .env.local
│   ├── debug/                # Debug environment (local Kubernetes)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/              # Staging environment
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── production/           # Production environment
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
└── README.md                 # This file
```

## Quick Start

### Prerequisites

```bash
# Install Terraform
# Windows (using Chocolatey):
choco install terraform

# Or download from: https://www.terraform.io/downloads

# Verify installation
terraform version
```

### Initialize Environment

```bash
# Navigate to desired environment
cd terraform/environments/local

# Initialize Terraform
terraform init

# Plan changes
terraform plan

# Apply configuration
terraform apply
```

## Environments

### 1. Local Development
**Location**: `terraform/environments/local/`
**Purpose**: Docker Compose on developer workstation
**Secrets**: Stored in `.env.local` (gitignored)
**Backend**: Local state file

### 2. Debug Environment
**Location**: `terraform/environments/debug/`
**Purpose**: Local Kubernetes (Docker Desktop, Minikube, or k3s)
**Secrets**: Kubernetes Secrets
**Backend**: Local state file
**Access**: localhost with port forwarding

### 3. Staging Environment
**Location**: `terraform/environments/staging/`
**Purpose**: Cloud Kubernetes cluster (testing)
**Secrets**: Cloud provider secret manager (AWS Secrets Manager, Azure Key Vault)
**Backend**: Remote state (S3, Azure Blob)
**Access**: Private network + VPN

### 4. Production Environment
**Location**: `terraform/environments/production/`
**Purpose**: Production Kubernetes cluster
**Secrets**: Cloud provider secret manager with rotation
**Backend**: Remote state with locking (S3 + DynamoDB, Azure Blob)
**Access**: Private network + strict access controls

## Secret Management Strategy

### Sensitive Secrets (Never in Git)
- API keys (Anthropic, OpenAI, ElevenLabs, Twilio)
- Database passwords
- JWT secrets
- Service account keys
- TLS certificates

### Non-Sensitive Configuration (OK in Git)
- Service ports
- Database hostnames (for dev/staging)
- Feature flags
- Log levels

### Secret Rotation
- Production: Automatic rotation every 90 days
- Staging: Manual rotation quarterly
- Local/Debug: As needed

## Usage by Environment

### Local Development (Docker Compose)

```bash
cd terraform/environments/local

# Create .env.local from template (do this once)
cp .env.local.example .env.local
# Edit .env.local with your actual secrets

# Generate docker-compose .env file
terraform init
terraform apply

# This creates: ../../.env
# Which docker-compose.yml will use
```

### Debug (Local Kubernetes)

```bash
cd terraform/environments/debug

# Initialize
terraform init

# Create secrets in Kubernetes
terraform apply

# Verify secrets created
kubectl get secrets -n nlre

# Deploy application
kubectl apply -f ../../k8s/debug/
```

### Production (Cloud Kubernetes)

```bash
cd terraform/environments/production

# Configure remote backend (S3 example)
# Edit backend.tf with your S3 bucket

# Initialize with backend
terraform init

# Import existing secrets (if any)
terraform import module.secrets.aws_secretsmanager_secret.anthropic_key <secret-arn>

# Plan and apply
terraform plan -out=plan.tfplan
terraform apply plan.tfplan

# Deploy to Kubernetes
kubectl apply -f ../../k8s/production/
```

## Security Best Practices

### 1. Never Commit Secrets
```bash
# .gitignore already includes:
*.tfvars      # May contain sensitive values
.env.*        # Local environment files
*.tfstate     # State files may contain secrets
.terraform/   # Provider plugins and modules
```

### 2. Use Variable Files for Sensitive Data
```hcl
# terraform.tfvars (gitignored)
anthropic_api_key = "sk-ant-..."
twilio_account_sid = "AC..."
```

### 3. Use Remote State for Team Collaboration
```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket = "nlre-terraform-state"
    key    = "production/secrets.tfstate"
    region = "us-west-2"
    encrypt = true
    dynamodb_table = "terraform-locks"
  }
}
```

### 4. Enable Audit Logging
- AWS: CloudTrail for Secrets Manager access
- Azure: Monitor logs for Key Vault access
- Kubernetes: Audit logs for secret access

## Common Commands

```bash
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Format code
terraform fmt -recursive

# Plan changes (dry run)
terraform plan

# Apply changes
terraform apply

# Apply with auto-approve (CI/CD)
terraform apply -auto-approve

# Destroy resources
terraform destroy

# Show current state
terraform show

# List resources
terraform state list

# Output values
terraform output

# Refresh state
terraform refresh

# Import existing resource
terraform import <resource_type>.<name> <resource_id>
```

## Troubleshooting

### State Lock Issues
```bash
# If state is locked from failed apply
terraform force-unlock <lock-id>
```

### Secret Not Found in Kubernetes
```bash
# Verify secret exists
kubectl get secret -n nlre nlre-secrets -o yaml

# Describe secret
kubectl describe secret -n nlre nlre-secrets

# Check if pods can access
kubectl exec -n nlre <pod-name> -- env | grep ANTHROPIC
```

### Terraform State Drift
```bash
# Check for drift
terraform plan -detailed-exitcode

# Refresh state from actual infrastructure
terraform refresh

# Import manually created resources
terraform import module.secrets.kubernetes_secret.nlre nlre/nlre-secrets
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Terraform Apply
  run: |
    cd terraform/environments/production
    terraform init
    terraform apply -auto-approve
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    TF_VAR_anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### GitLab CI Example
```yaml
terraform:
  script:
    - cd terraform/environments/production
    - terraform init
    - terraform plan -out=plan.tfplan
    - terraform apply plan.tfplan
  only:
    - main
```

## Migration Guide

### From .env to Terraform

1. **Audit current .env files**
   ```bash
   cat .env.example
   ```

2. **Create terraform.tfvars**
   ```bash
   cd terraform/environments/production
   cp terraform.tfvars.example terraform.tfvars
   # Add your actual values
   ```

3. **Run Terraform**
   ```bash
   terraform init
   terraform apply
   ```

4. **Update application deployment**
   - Change from .env file to environment variables from secrets

## Monitoring & Alerts

### Secret Expiration Alerts
- AWS: CloudWatch alarms for Secrets Manager rotation
- Azure: Azure Monitor for Key Vault access
- Kubernetes: Custom alerts for secret age

### Access Auditing
- Log all secret access
- Alert on unusual access patterns
- Regular access reviews

## Support

- **Terraform Documentation**: https://www.terraform.io/docs
- **Kubernetes Secrets**: https://kubernetes.io/docs/concepts/configuration/secret/
- **AWS Secrets Manager**: https://aws.amazon.com/secrets-manager/
- **Azure Key Vault**: https://azure.microsoft.com/en-us/services/key-vault/

---

**Last Updated**: November 10, 2025
**Maintained By**: DevOps Team
