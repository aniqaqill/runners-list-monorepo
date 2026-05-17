# ==============================================================================
# PROJECT APIs — Enable the GCP services we need
# ==============================================================================
# GCP requires you to explicitly enable APIs before using them.
# This is equivalent to AWS having services that are just "available" — GCP
# keeps them off by default to prevent accidental billing.
#
# Run once: terraform apply (idempotent; safe to re-run)
# ==============================================================================

locals {
  required_apis = [
    "run.googleapis.com",              # Cloud Run
    "artifactregistry.googleapis.com", # Docker image registry
    "secretmanager.googleapis.com",    # Secret Manager
    "iam.googleapis.com",              # IAM / Workload Identity
    "iamcredentials.googleapis.com",   # WIF token exchange
  ]
}

resource "google_project_service" "apis" {
  for_each = toset(local.required_apis)

  project            = var.gcp_project_id
  service            = each.value
  disable_on_destroy = false # Don't turn APIs off when Terraform destroys resources
}
