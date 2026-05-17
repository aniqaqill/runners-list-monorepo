# ==============================================================================
# VARIABLES - All configurable inputs for your infrastructure
# ==============================================================================
# These are the "knobs" you can turn to customize your setup.
# Required variables have no default and MUST be provided.
# Optional variables have defaults and can be left as-is.
# ==============================================================================

# ------------------------------------------------------------------------------
# REQUIRED VARIABLES (must be set via environment or tfvars)
# ------------------------------------------------------------------------------

variable "db_host" {
  description = "Supabase database host (e.g., aws-0-ap-southeast-1.pooler.supabase.com)"
  type        = string
}

variable "db_user" {
  description = "Supabase database user (e.g., postgres.your-project-ref)"
  type        = string
}

variable "db_password" {
  description = "Supabase database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret key for signing JWT tokens (generate with: openssl rand -base64 32)"
  type        = string
  sensitive   = true
}

variable "internal_api_key" {
  description = "API key for scraper authentication (generate with: openssl rand -hex 24)"
  type        = string
  sensitive   = true
}

# ------------------------------------------------------------------------------
# CORE SETTINGS (rarely need to change)
# ------------------------------------------------------------------------------

variable "project_name" {
  description = "Name prefix for all resources"
  type        = string
  default     = "runners-list"
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-southeast-1" # Singapore
}

# ------------------------------------------------------------------------------
# COST CONTROL - The most important variable!
# ------------------------------------------------------------------------------

variable "api_enabled" {
  description = <<-EOT
    Toggle API on/off to control costs:
    - true  = API running (~$5/month)
    - false = API stopped ($0/month)
    
    Use: terraform apply -var="api_enabled=false" to disable
  EOT
  type        = bool
  default     = true
}

# ------------------------------------------------------------------------------
# CONTAINER SETTINGS (adjust if API needs more resources)
# ------------------------------------------------------------------------------

variable "container_cpu" {
  description = "CPU units for container (256 = 0.25 vCPU, 512 = 0.5 vCPU)"
  type        = number
  default     = 256 # Minimum, good for low traffic
}

variable "container_memory" {
  description = "Memory in MB for container (512, 1024, 2048, etc.)"
  type        = number
  default     = 512 # Minimum, good for Go API
}

variable "container_port" {
  description = "Port the API listens on inside the container"
  type        = number
  default     = 8080
}

# ------------------------------------------------------------------------------
# NETWORKING (usually don't need to change)
# ------------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "IP address range for the VPC"
  type        = string
  default     = "10.0.0.0/16" # 65,536 IP addresses
}

variable "availability_zones" {
  description = "AWS availability zones for redundancy"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}
