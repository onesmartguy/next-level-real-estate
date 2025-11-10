# Local Development Environment
# Purpose: Docker Compose on developer workstation
# Secrets: Stored in .env file (gitignored)

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Local backend (state file stored locally)
  backend "local" {
    path = "terraform.tfstate"
  }
}

module "secrets" {
  source = "../../modules/secrets"

  environment     = "local"
  env_file_path   = "../../../.env"

  # Database URLs (Docker Compose services)
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

  # Security (auto-generated if not provided)
  jwt_secret    = var.jwt_secret
  api_key_salt  = var.api_key_salt

  # Environment
  node_env  = "development"
  log_level = "debug"

  # Don't create Kubernetes resources for local
  create_kubernetes_resources = false
}

# Output the path to generated .env file
output "env_file" {
  description = "Path to generated .env file for Docker Compose"
  value       = module.secrets.env_file_path
}

output "setup_instructions" {
  description = "Next steps for local development"
  value       = <<-EOT
    ✅ Terraform configuration applied successfully!

    Generated files:
    - .env file: ${module.secrets.env_file_path}

    Next steps:
    1. Review the generated .env file
    2. Start Docker Compose:
       cd ../../..
       docker-compose up -d

    3. Verify services:
       docker-compose ps
       curl http://localhost:3000/health

    Generated secrets:
    ${module.secrets.jwt_secret_generated ? "- JWT Secret: Auto-generated" : "- JWT Secret: Using provided value"}
    ${module.secrets.api_key_salt_generated ? "- API Key Salt: Auto-generated" : "- API Key Salt: Using provided value"}

    To view generated secrets (if needed):
    terraform output -json

    To update configuration:
    1. Edit terraform.tfvars
    2. Run: terraform apply
  EOT
}
