# Variables for Production Environment (Cloud Kubernetes + AWS/Azure)

# ==============================================================================
# AWS Configuration
# ==============================================================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "use_aws_secrets_manager" {
  description = "Whether to use AWS Secrets Manager"
  type        = bool
  default     = true
}

variable "use_external_secrets_operator" {
  description = "Whether to install External Secrets Operator (sync AWS to Kubernetes)"
  type        = bool
  default     = true
}

variable "external_secrets_role_arn" {
  description = "IAM role ARN for External Secrets Operator"
  type        = string
}

variable "enable_secret_rotation" {
  description = "Whether to enable automatic secret rotation"
  type        = bool
  default     = true
}

variable "rotation_lambda_arn" {
  description = "Lambda function ARN for secret rotation"
  type        = string
  default     = ""
}

# ==============================================================================
# Kubernetes Configuration
# ==============================================================================

variable "kubeconfig_path" {
  description = "Path to kubeconfig file"
  type        = string
  default     = "~/.kube/config"
}

variable "kube_context" {
  description = "Kubernetes context (EKS cluster ARN or context name)"
  type        = string
}

variable "kubernetes_namespace" {
  description = "Kubernetes namespace for deployment"
  type        = string
  default     = "nlre"
}

# ==============================================================================
# Database Configuration (Production)
# ==============================================================================

variable "mongodb_uri" {
  description = "MongoDB connection URI (production cluster)"
  type        = string
  sensitive   = true
}

variable "qdrant_url" {
  description = "Qdrant vector database URL (production)"
  type        = string
}

variable "redis_url" {
  description = "Redis cache URL (production, use rediss:// for TLS)"
  type        = string
  sensitive   = true
}

variable "kafka_brokers" {
  description = "Kafka broker addresses (comma-separated)"
  type        = string
}

# ==============================================================================
# Observability
# ==============================================================================

variable "otel_endpoint" {
  description = "OpenTelemetry collector endpoint (production)"
  type        = string
  default     = "https://otel-collector.prod:4317"
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
# Communication - Twilio (Required)
# ==============================================================================

variable "twilio_account_sid" {
  description = "Twilio Account SID"
  type        = string
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token"
  type        = string
  sensitive   = true
}

variable "twilio_phone_number" {
  description = "Twilio phone number"
  type        = string
}

# ==============================================================================
# Email - ProtonMail (Required)
# ==============================================================================

variable "protonmail_email" {
  description = "ProtonMail email address"
  type        = string
}

variable "protonmail_app_password" {
  description = "ProtonMail Bridge app password"
  type        = string
  sensitive   = true
}

variable "from_name" {
  description = "Email from name"
  type        = string
  default     = "Next Level Real Estate"
}

variable "from_email" {
  description = "Email from address"
  type        = string
}

# ==============================================================================
# Lead Sources (Optional)
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
# Security (Required for Production)
# ==============================================================================

variable "jwt_secret" {
  description = "JWT secret for authentication (generate with: openssl rand -base64 64)"
  type        = string
  sensitive   = true
}

variable "api_key_salt" {
  description = "API key salt (generate with: openssl rand -base64 32)"
  type        = string
  sensitive   = true
}
