# Debug Environment - Local Kubernetes with ngrok Ingress
# Purpose: Local Kubernetes (Docker Desktop/Minikube/k3s) accessible publicly via ngrok
# Secrets: Kubernetes Secrets
# Public Access: ngrok Ingress Controller

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.24"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Local backend
  backend "local" {
    path = "terraform.tfstate"
  }
}

# Kubernetes provider (assumes kubectl is configured)
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
# Secrets Module
# ==============================================================================

module "secrets" {
  source = "../../modules/secrets"

  environment                 = "debug"
  create_kubernetes_resources = true
  kubernetes_namespace        = var.kubernetes_namespace

  # Database URLs (Kubernetes service names)
  mongodb_uri   = "mongodb://mongodb:27017/next_level_real_estate"
  qdrant_url    = "http://qdrant:6333"
  redis_url     = "redis://redis:6379"
  kafka_brokers = "kafka:9092"

  # AI Services (required)
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
  node_env       = "development"
  log_level      = "debug"
  otel_endpoint  = "http://otel-collector:4317"
}

# ==============================================================================
# ngrok Ingress Controller
# ==============================================================================

# Install ngrok Ingress Controller via Helm
resource "helm_release" "ngrok_ingress" {
  count = var.install_ngrok_ingress ? 1 : 0

  name       = "ngrok-ingress-controller"
  repository = "https://ngrok.github.io/kubernetes-ingress-controller"
  chart      = "kubernetes-ingress-controller"
  namespace  = "ngrok-ingress-controller"
  version    = "0.11.0"

  create_namespace = true

  values = [
    yamlencode({
      credentials = {
        apiKey    = var.ngrok_api_key
        authtoken = var.ngrok_authtoken
      }

      # Controller configuration
      controller = {
        replicaCount = 1

        # Resource limits for local development
        resources = {
          limits = {
            cpu    = "500m"
            memory = "512Mi"
          }
          requests = {
            cpu    = "100m"
            memory = "128Mi"
          }
        }
      }
    })
  ]

  depends_on = [module.secrets]
}

# ==============================================================================
# ngrok Domain Configuration
# ==============================================================================

# Create Kubernetes secret for ngrok domain configuration
resource "kubernetes_secret" "ngrok_domain_config" {
  count = var.ngrok_domain != "" ? 1 : 0

  metadata {
    name      = "ngrok-domain-config"
    namespace = var.kubernetes_namespace
  }

  data = {
    domain = var.ngrok_domain
  }

  depends_on = [module.secrets]
}

# ==============================================================================
# Ingress Resources (using ngrok)
# ==============================================================================

# API Gateway Ingress
resource "kubernetes_ingress_v1" "api_gateway" {
  count = var.install_ngrok_ingress ? 1 : 0

  metadata {
    name      = "api-gateway-ingress"
    namespace = var.kubernetes_namespace

    annotations = {
      "k8s.ngrok.com/modules" = "ngrok-module-set"  # Reference to module configuration
    }
  }

  spec {
    ingress_class_name = "ngrok"

    rule {
      host = var.ngrok_domain != "" ? var.ngrok_domain : null

      http {
        path {
          path      = "/"
          path_type = "Prefix"

          backend {
            service {
              name = "api-gateway"
              port {
                number = 3000
              }
            }
          }
        }
      }
    }

    # TLS configuration (ngrok provides automatic HTTPS)
    dynamic "tls" {
      for_each = var.ngrok_domain != "" ? [1] : []
      content {
        hosts = [var.ngrok_domain]
      }
    }
  }

  depends_on = [helm_release.ngrok_ingress]
}

# ngrok Module Set (for authentication, compression, etc.)
resource "kubernetes_manifest" "ngrok_module_set" {
  count = var.install_ngrok_ingress ? 1 : 0

  manifest = {
    apiVersion = "ingress.k8s.ngrok.com/v1alpha1"
    kind       = "NgrokModuleSet"

    metadata = {
      name      = "ngrok-module-set"
      namespace = var.kubernetes_namespace
    }

    modules = {
      # Enable compression
      compression = {
        enabled = true
      }

      # Add security headers
      headers = {
        request = {
          add = {
            "X-Forwarded-Proto" = "https"
          }
        }
        response = {
          add = {
            "X-Frame-Options"           = "DENY"
            "X-Content-Type-Options"    = "nosniff"
            "X-XSS-Protection"          = "1; mode=block"
            "Strict-Transport-Security" = "max-age=31536000; includeSubDomains"
          }
        }
      }

      # Optional: Add OAuth authentication
      # oauth = {
      #   provider = "google"
      #   clientId = var.oauth_client_id
      #   clientSecret = var.oauth_client_secret
      #   scopes = ["openid", "email", "profile"]
      # }

      # Optional: Add IP restrictions
      # ipRestriction = {
      #   allow = var.allowed_ip_ranges
      # }
    }
  }

  depends_on = [helm_release.ngrok_ingress]
}

# ==============================================================================
# Outputs
# ==============================================================================

output "kubernetes_namespace" {
  description = "Kubernetes namespace where resources are deployed"
  value       = var.kubernetes_namespace
}

output "secret_name" {
  description = "Name of the Kubernetes secret"
  value       = module.secrets.kubernetes_secret_name
}

output "config_map_name" {
  description = "Name of the Kubernetes ConfigMap"
  value       = module.secrets.kubernetes_config_map_name
}

output "ngrok_status" {
  description = "ngrok Ingress Controller installation status"
  value       = var.install_ngrok_ingress ? "Installed" : "Not installed"
}

output "public_url" {
  description = "Public URL for accessing the application"
  value = var.install_ngrok_ingress ? (
    var.ngrok_domain != "" ?
      "https://${var.ngrok_domain}" :
      "Check ngrok dashboard at https://dashboard.ngrok.com for auto-generated URL"
  ) : "ngrok not installed"
}

output "setup_instructions" {
  description = "Next steps for debug environment"
  value       = <<-EOT
    ✅ Terraform configuration applied successfully!

    Kubernetes Resources:
    - Namespace: ${var.kubernetes_namespace}
    - Secret: ${module.secrets.kubernetes_secret_name}
    - ConfigMap: ${module.secrets.kubernetes_config_map_name}
    ${var.install_ngrok_ingress ? "- ngrok Ingress: Installed" : ""}

    Public Access:
    ${var.install_ngrok_ingress ? "✅ ngrok Ingress Controller installed" : "⚠️  ngrok not installed"}
    ${var.ngrok_domain != "" ? "URL: https://${var.ngrok_domain}" : "URL: Check ngrok dashboard"}

    Next steps:
    1. Verify Kubernetes resources:
       kubectl get secrets,configmaps -n ${var.kubernetes_namespace}

    2. Check ngrok status:
       kubectl get pods -n ngrok-ingress-controller

    3. Get ngrok public URL:
       kubectl get ingress -n ${var.kubernetes_namespace}

    4. View ngrok tunnels:
       https://dashboard.ngrok.com/tunnels/agents

    5. Deploy application:
       kubectl apply -f ../../../k8s/debug/

    6. Access your application:
       ${var.ngrok_domain != "" ? "https://${var.ngrok_domain}" : "Check ngrok dashboard for URL"}

    To update configuration:
    1. Edit terraform.tfvars
    2. Run: terraform apply

    Generated secrets:
    ${module.secrets.jwt_secret_generated ? "- JWT Secret: Auto-generated" : "- JWT Secret: Using provided value"}
    ${module.secrets.api_key_salt_generated ? "- API Key Salt: Auto-generated" : "- API Key Salt: Using provided value"}
  EOT
}
