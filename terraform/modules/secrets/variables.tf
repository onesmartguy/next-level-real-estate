# Variables for Secrets Module

variable "environment" {
  description = "Environment name (local, debug, staging, production)"
  type        = string

  validation {
    condition     = contains(["local", "debug", "staging", "production"], var.environment)
    error_message = "Environment must be one of: local, debug, staging, production"
  }
}

variable "env_file_path" {
  description = "Path to .env file for local development"
  type        = string
  default     = "../../.env"
}

# ==============================================================================
# Provider Configuration
# ==============================================================================

variable "create_kubernetes_resources" {
  description = "Whether to create Kubernetes resources"
  type        = bool
  default     = false
}

variable "use_aws_secrets_manager" {
  description = "Whether to use AWS Secrets Manager"
  type        = bool
  default     = false
}

variable "use_azure_key_vault" {
  description = "Whether to use Azure Key Vault"
  type        = bool
  default     = false
}

variable "use_external_secrets_operator" {
  description = "Whether to use External Secrets Operator for Kubernetes"
  type        = bool
  default     = false
}

# ==============================================================================
# Kubernetes Configuration
# ==============================================================================

variable "kubernetes_namespace" {
  description = "Kubernetes namespace for secrets"
  type        = string
  default     = "nlre"
}

# ==============================================================================
# Database Configuration
# ==============================================================================

variable "mongodb_uri" {
  description = "MongoDB connection URI"
  type        = string
  sensitive   = true
}

variable "qdrant_url" {
  description = "Qdrant vector database URL"
  type        = string
  default     = "http://qdrant:6333"
}

variable "redis_url" {
  description = "Redis URL"
  type        = string
  default     = "redis://redis:6379"
}

variable "kafka_brokers" {
  description = "Kafka broker addresses"
  type        = string
  default     = "kafka:9092"
}

# ==============================================================================
# AI Services (Required)
# ==============================================================================

variable "anthropic_api_key" {
  description = "Anthropic Claude API key"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key for embeddings"
  type        = string
  sensitive   = true
}

variable "elevenlabs_api_key" {
  description = "ElevenLabs API key for voice"
  type        = string
  sensitive   = true
  default     = ""
}

# ==============================================================================
# Communication - Twilio
# ==============================================================================

variable "twilio_account_sid" {
  description = "Twilio Account SID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "twilio_phone_number" {
  description = "Twilio phone number for outbound calls"
  type        = string
  default     = ""
}

# ==============================================================================
# Email - ProtonMail
# ==============================================================================

variable "protonmail_email" {
  description = "ProtonMail email address"
  type        = string
  default     = ""
}

variable "protonmail_app_password" {
  description = "ProtonMail Bridge app password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "from_name" {
  description = "Email from name"
  type        = string
  default     = "Next Level Real Estate"
}

variable "from_email" {
  description = "Email from address"
  type        = string
  default     = "noreply@nextlevelre.com"
}

# ==============================================================================
# Lead Sources
# ==============================================================================

variable "google_ads_client_id" {
  description = "Google Ads Client ID"
  type        = string
  default     = ""
}

variable "google_ads_client_secret" {
  description = "Google Ads Client Secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_ads_developer_token" {
  description = "Google Ads Developer Token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_ads_refresh_token" {
  description = "Google Ads Refresh Token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_ads_customer_id" {
  description = "Google Ads Customer ID"
  type        = string
  default     = ""
}

variable "zillow_api_key" {
  description = "Zillow API Key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "zillow_webhook_secret" {
  description = "Zillow Webhook Secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "realgeeks_api_username" {
  description = "RealGeeks API Username"
  type        = string
  default     = ""
}

variable "realgeeks_api_password" {
  description = "RealGeeks API Password"
  type        = string
  sensitive   = true
  default     = ""
}

# ==============================================================================
# Security
# ==============================================================================

variable "jwt_secret" {
  description = "JWT secret for authentication (auto-generated if empty)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "api_key_salt" {
  description = "API key salt (auto-generated if empty)"
  type        = string
  sensitive   = true
  default     = ""
}

# ==============================================================================
# Environment Configuration
# ==============================================================================

variable "node_env" {
  description = "Node environment (development, staging, production)"
  type        = string
  default     = "development"
}

variable "log_level" {
  description = "Logging level"
  type        = string
  default     = "info"
}

variable "otel_endpoint" {
  description = "OpenTelemetry collector endpoint"
  type        = string
  default     = "http://otel-collector:4317"
}

# ==============================================================================
# AWS Configuration
# ==============================================================================

variable "enable_secret_rotation" {
  description = "Enable automatic secret rotation (AWS only)"
  type        = bool
  default     = false
}

variable "rotation_lambda_arn" {
  description = "ARN of Lambda function for secret rotation"
  type        = string
  default     = ""
}

# ==============================================================================
# Azure Configuration
# ==============================================================================

variable "azure_location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "azure_resource_group" {
  description = "Azure resource group name"
  type        = string
  default     = ""
}

variable "azure_tenant_id" {
  description = "Azure tenant ID"
  type        = string
  default     = ""
}
