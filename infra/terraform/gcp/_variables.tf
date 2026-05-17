# ==============================================================================
# VARIABLES
# ==============================================================================

# ── GCP Identity ──────────────────────────────────────────────────────────────

variable "gcp_project_id" {
  description = "GCP project ID (e.g. runners-list-prod). Create at console.cloud.google.com."
  type        = string
}

variable "gcp_region" {
  description = "GCP region. asia-southeast1 = Singapore, closest to Malaysia."
  type        = string
  default     = "asia-southeast1"
}

variable "project_name" {
  description = "Short slug used as prefix for all resource names."
  type        = string
  default     = "runners-list"
}

# ── GitHub identity (Workload Identity Federation) ────────────────────────────

variable "github_org" {
  description = "GitHub organisation or username that owns the API repo."
  type        = string
  # e.g. "aniqaqill"
}

variable "github_repo" {
  description = "GitHub repo name for the API (used in WIF subject claim)."
  type        = string
  default     = "runners-list-api"
}

# ── Secrets (sensitive) ────────────────────────────────────────────────────────
# These are passed via TF_VAR_* environment variables in CI (never in tfvars).
# Terraform stores them in Secret Manager; the actual values are set manually
# via gcloud or the CI pipeline on first run.

variable "db_host" {
  description = "Supabase Postgres host (e.g. aws-0-ap-southeast-1.pooler.supabase.com)"
  type        = string
  sensitive   = true
}

variable "db_user" {
  description = "Supabase Postgres user"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Supabase Postgres password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret (generate: openssl rand -base64 32)"
  type        = string
  sensitive   = true
}

variable "internal_api_key" {
  description = "Internal API key for scraper (generate: openssl rand -hex 24)"
  type        = string
  sensitive   = true
}

# ── Cloud Run tuning ──────────────────────────────────────────────────────────

variable "api_enabled" {
  description = "Set to false to scale Cloud Run to 0 manually (traffic-based scale-to-zero already handles this automatically)."
  type        = bool
  default     = true
}

variable "container_port" {
  description = "Port the API listens on inside the container."
  type        = number
  default     = 8080
}

variable "max_instances" {
  description = "Maximum Cloud Run instances. 2 is more than enough for hobby traffic."
  type        = number
  default     = 2
}
