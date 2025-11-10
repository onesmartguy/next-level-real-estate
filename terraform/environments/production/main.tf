# Production Environment - Cloud Kubernetes + AWS Secrets Manager
# Purpose: Production deployment with high availability
# Secrets: AWS Secrets Manager (or Azure Key Vault)
# Public Access: Load Balancer + DNS

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.24"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }

  # Remote backend (S3 + DynamoDB for locking)
  backend "s3" {
    bucket         = "nlre-terraform-state"
    key            = "production/secrets.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

# AWS Provider
provider "aws" {
  region = var.aws_region
}

# Kubernetes Provider
provider "kubernetes" {
  config_path    = var.kubeconfig_path
  config_context = var.kube_context
}

provider "helm" {
  kubernetes {
    config_path    = var.kubeconfig_path
    config_context = var.kube_context
  }
}

# ==============================================================================
# Secrets Module (AWS Secrets Manager + Kubernetes)
# ==============================================================================

module "secrets" {
  source = "../../modules/secrets"

  environment                     = "production"
  create_kubernetes_resources     = true
  use_aws_secrets_manager        = var.use_aws_secrets_manager
  use_external_secrets_operator  = var.use_external_secrets_operator

  kubernetes_namespace = var.kubernetes_namespace

  # Database URLs (production values)
  mongodb_uri   = var.mongodb_uri
  qdrant_url    = var.qdrant_url
  redis_url     = var.redis_url
  kafka_brokers = var.kafka_brokers

  # AI Services
  anthropic_api_key  = var.anthropic_api_key
  openai_api_key     = var.openai_api_key
  elevenlabs_api_key = var.elevenlabs_api_key

  # Communication
  twilio_account_sid  = var.twilio_account_sid
  twilio_auth_token   = var.twilio_auth_token
  twilio_phone_number = var.twilio_phone_number

  # Email
  protonmail_email        = var.protonmail_email
  protonmail_app_password = var.protonmail_app_password
  from_name               = var.from_name
  from_email              = var.from_email

  # Lead Sources
  google_ads_client_id       = var.google_ads_client_id
  google_ads_client_secret   = var.google_ads_client_secret
  google_ads_developer_token = var.google_ads_developer_token
  google_ads_refresh_token   = var.google_ads_refresh_token
  google_ads_customer_id     = var.google_ads_customer_id

  zillow_api_key        = var.zillow_api_key
  zillow_webhook_secret = var.zillow_webhook_secret

  realgeeks_api_username = var.realgeeks_api_username
  realgeeks_api_password = var.realgeeks_api_password

  # Security
  jwt_secret   = var.jwt_secret
  api_key_salt = var.api_key_salt

  # Environment
  node_env       = "production"
  log_level      = "warn"
  otel_endpoint  = var.otel_endpoint

  # AWS Secret Rotation
  enable_secret_rotation = var.enable_secret_rotation
  rotation_lambda_arn    = var.rotation_lambda_arn
}

# ==============================================================================
# External Secrets Operator (sync from AWS to Kubernetes)
# ==============================================================================

# Install External Secrets Operator
resource "helm_release" "external_secrets" {
  count = var.use_external_secrets_operator ? 1 : 0

  name       = "external-secrets"
  repository = "https://charts.external-secrets.io"
  chart      = "external-secrets"
  namespace  = "external-secrets"
  version    = "0.9.11"

  create_namespace = true

  values = [
    yamlencode({
      installCRDs = true
      serviceAccount = {
        create = true
        annotations = {
          "eks.amazonaws.com/role-arn" = var.external_secrets_role_arn
        }
      }
    })
  ]
}

# Create SecretStore for AWS Secrets Manager
resource "kubernetes_manifest" "aws_secret_store" {
  count = var.use_external_secrets_operator ? 1 : 0

  manifest = {
    apiVersion = "external-secrets.io/v1beta1"
    kind       = "SecretStore"

    metadata = {
      name      = "aws-secretsmanager"
      namespace = var.kubernetes_namespace
    }

    spec = {
      provider = {
        aws = {
          service = "SecretsManager"
          region  = var.aws_region
          auth = {
            jwt = {
              serviceAccountRef = {
                name = "external-secrets"
              }
            }
          }
        }
      }
    }
  }

  depends_on = [helm_release.external_secrets]
}

# ==============================================================================
# Outputs
# ==============================================================================

output "aws_secret_arn" {
  description = "ARN of AWS Secrets Manager secret"
  value       = module.secrets.aws_secret_arn
  sensitive   = true
}

output "aws_secret_name" {
  description = "Name of AWS Secrets Manager secret"
  value       = module.secrets.aws_secret_name
}

output "kubernetes_namespace" {
  description = "Kubernetes namespace"
  value       = var.kubernetes_namespace
}

output "kubernetes_secret_name" {
  description = "Name of Kubernetes secret"
  value       = module.secrets.kubernetes_secret_name
}

output "setup_instructions" {
  description = "Production environment setup instructions"
  value       = <<-EOT
    ✅ Production environment configured!

    AWS Resources:
    ${var.use_aws_secrets_manager ? "- Secrets Manager: ${module.secrets.aws_secret_name}" : ""}
    ${var.use_aws_secrets_manager ? "- ARN: ${module.secrets.aws_secret_arn}" : ""}

    Kubernetes Resources:
    - Namespace: ${var.kubernetes_namespace}
    - Secret: ${module.secrets.kubernetes_secret_name}
    ${var.use_external_secrets_operator ? "- External Secrets Operator: Installed" : ""}

    Security:
    ${var.enable_secret_rotation ? "✅ Automatic secret rotation enabled (90 days)" : "⚠️  Manual secret rotation required"}

    Next steps:
    1. Verify AWS secrets:
       aws secretsmanager describe-secret --secret-id ${module.secrets.aws_secret_name}

    2. Verify Kubernetes resources:
       kubectl get secrets,configmaps -n ${var.kubernetes_namespace}

    3. Deploy application:
       kubectl apply -f ../../../k8s/production/

    4. Monitor deployment:
       kubectl get pods -n ${var.kubernetes_namespace} -w

    5. Check application logs:
       kubectl logs -n ${var.kubernetes_namespace} -l app=api-gateway --tail=100

    Important:
    - Review AWS Secrets Manager access logs regularly
    - Monitor secret rotation status
    - Enable AWS CloudTrail for audit logging
    - Set up CloudWatch alarms for security events
  EOT
}
