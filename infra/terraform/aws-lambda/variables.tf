variable "aws_region" {
  type        = string
  description = "AWS region for Lambda and related resources."
  default     = "ap-southeast-1"
}

variable "name_prefix" {
  type        = string
  description = "Prefix for resource names (Lambda, secrets, policies)."
  default     = "runners-list-api"
}

variable "lambda_zip_path" {
  type        = string
  description = "Path to function.zip (bootstrap binary packaged for provided.al2023)."
}

variable "db_host" {
  type        = string
  description = "Postgres host (e.g. Supabase pooler)."
  sensitive   = true
}

variable "db_user" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_name" {
  type    = string
  default = "postgres"
}

variable "db_port" {
  type    = string
  default = "5432"
}

variable "db_sslmode" {
  type    = string
  default = "require"
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "internal_api_key" {
  type      = string
  sensitive = true
}

variable "redis_url" {
  type        = string
  description = "Optional Upstash / Redis URL. Leave empty if not using cache."
  default     = ""
  sensitive   = true
}
