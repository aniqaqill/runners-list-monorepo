# ==============================================================================
# TERRAFORM BACKEND — GCS Remote State
# ==============================================================================
# Why remote state?
#   - Without this, terraform.tfstate lives on whoever's laptop ran `apply`.
#   - With GCS backend: state lives in a private bucket, is versioned, and
#     any CI/CD runner (or teammate) sees the same state.
#   - DynamoDB locking equivalent on GCP: GCS supports object versioning +
#     Terraform uses the backend's built-in locking via GCS.
#
# Bootstrap (one-time, run before `terraform init`):
#   gcloud storage buckets create gs://runners-list-tf-state \
#     --location=ASIA-SOUTHEAST1 \
#     --uniform-bucket-level-access
#   gcloud storage buckets update gs://runners-list-tf-state --versioning
# ==============================================================================

terraform {
  required_version = ">= 1.6"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  # Replace bucket name with your actual GCS bucket created during bootstrap
  backend "gcs" {
    bucket = "runners-list-tf-state"
    prefix = "terraform/state"
  }
}
