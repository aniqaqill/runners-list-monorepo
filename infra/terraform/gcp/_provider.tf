# ==============================================================================
# GCP PROVIDER CONFIGURATION
# ==============================================================================
# Contrast with the AWS provider in archive/aws/_provider.tf:
#   AWS:  region = "ap-southeast-1"
#   GCP:  project = "...", region = "asia-southeast1"
#
# Auth in CI: Workload Identity Federation (no long-lived keys).
# Auth locally: `gcloud auth application-default login`
# ==============================================================================

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

provider "google-beta" {
  project = var.gcp_project_id
  region  = var.gcp_region
}
