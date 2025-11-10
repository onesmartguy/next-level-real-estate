# Variables for Debug Environment (Local Kubernetes + ngrok)

# ==============================================================================
# Kubernetes Configuration
# ==============================================================================

variable "kubeconfig_path" {
  description = "Path to kubeconfig file"
  type        = string
  default     = "~/.kube/config"
}

variable "kube_context" {
  description = "Kubernetes context to use"
  type        = string
  default     = "docker-desktop"  # or "minikube", "k3s", etc.
}

variable "kubernetes_namespace" {
  description = "Kubernetes namespace for deployment"
  type        = string
  default     = "nlre"
}

# ==============================================================================
# ngrok Configuration
# ==============================================================================

variable "install_ngrok_ingress" {
  description = "Whether to install ngrok Ingress Controller"
  type        = bool
  default     = true
}

variable "ngrok_api_key" {
  description = "ngrok API key (get from https://dashboard.ngrok.com/api)"
  type        = string
  sensitive   = true
}

variable "ngrok_authtoken" {
  description = "ngrok authtoken (get from https://dashboard.ngrok.com/get-started/your-authtoken)"
  type        = string
  sensitive   = true
}

variable "ngrok_domain" {
  description = "Custom ngrok domain (optional, leave empty for auto-generated)"
  type        = string
  default     = ""
}

variable "allowed_ip_ranges" {
  description = "IP ranges allowed to access the application (optional)"
  type        = list(string)
  default     = []
}

variable "oauth_client_id" {
  description = "OAuth client ID for authentication (optional)"
  type        = string
  default     = ""
}

variable "oauth_client_secret" {
  description = "OAuth client secret for authentication (optional)"
  type        = string
  sensitive   = true
  default     = ""
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
  description = "Twilio phone number"
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
