# Variables for Local Development Environment

# ==============================================================================
# Database Configuration (Docker Compose)
# ==============================================================================

variable "mongodb_uri" {
  description = "MongoDB connection URI"
  type        = string
  default     = "mongodb://localhost:27017/next_level_real_estate"
}

variable "qdrant_url" {
  description = "Qdrant vector database URL"
  type        = string
  default     = "http://localhost:6333"
}

variable "redis_url" {
  description = "Redis URL"
  type        = string
  default     = "redis://localhost:6379"
}

variable "kafka_brokers" {
  description = "Kafka broker addresses"
  type        = string
  default     = "localhost:9092"
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
  description = "ElevenLabs API key for voice (optional)"
  type        = string
  sensitive   = true
  default     = ""
}

# ==============================================================================
# Communication - Twilio (Optional for local)
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
  description = "Twilio phone number"
  type        = string
  default     = ""
}

# ==============================================================================
# Email - ProtonMail (Optional for local)
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
# Lead Sources (Optional for local)
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
# Security (Auto-generated if not provided)
# ==============================================================================

variable "jwt_secret" {
  description = "JWT secret for authentication (leave empty to auto-generate)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "api_key_salt" {
  description = "API key salt (leave empty to auto-generate)"
  type        = string
  sensitive   = true
  default     = ""
}
