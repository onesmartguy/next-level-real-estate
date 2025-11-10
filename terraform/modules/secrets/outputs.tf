# Outputs for Secrets Module

output "kubernetes_secret_name" {
  description = "Name of the Kubernetes secret"
  value       = var.create_kubernetes_resources ? kubernetes_secret.nlre_secrets[0].metadata[0].name : null
}

output "kubernetes_namespace" {
  description = "Kubernetes namespace where secrets are stored"
  value       = var.create_kubernetes_resources ? kubernetes_namespace.nlre[0].metadata[0].name : null
}

output "kubernetes_config_map_name" {
  description = "Name of the Kubernetes ConfigMap"
  value       = var.create_kubernetes_resources ? kubernetes_config_map.nlre_config[0].metadata[0].name : null
}

output "aws_secret_arn" {
  description = "ARN of AWS Secrets Manager secret"
  value       = var.use_aws_secrets_manager ? aws_secretsmanager_secret.nlre_secrets[0].arn : null
  sensitive   = true
}

output "aws_secret_name" {
  description = "Name of AWS Secrets Manager secret"
  value       = var.use_aws_secrets_manager ? aws_secretsmanager_secret.nlre_secrets[0].name : null
}

output "azure_key_vault_id" {
  description = "ID of Azure Key Vault"
  value       = var.use_azure_key_vault ? azurerm_key_vault.nlre[0].id : null
}

output "azure_key_vault_uri" {
  description = "URI of Azure Key Vault"
  value       = var.use_azure_key_vault ? azurerm_key_vault.nlre[0].vault_uri : null
}

output "env_file_path" {
  description = "Path to generated .env file"
  value       = var.environment == "local" ? local_file.env_file[0].filename : null
}

output "jwt_secret_generated" {
  description = "Whether JWT secret was auto-generated"
  value       = length(random_password.jwt_secret) > 0
}

output "api_key_salt_generated" {
  description = "Whether API key salt was auto-generated"
  value       = length(random_password.api_key_salt) > 0
}

# Output generated secrets (for reference, but marked sensitive)
output "generated_jwt_secret" {
  description = "Auto-generated JWT secret (if applicable)"
  value       = length(random_password.jwt_secret) > 0 ? random_password.jwt_secret[0].result : null
  sensitive   = true
}

output "generated_api_key_salt" {
  description = "Auto-generated API key salt (if applicable)"
  value       = length(random_password.api_key_salt) > 0 ? random_password.api_key_salt[0].result : null
  sensitive   = true
}
