# ==============================================================================
# SECRET MANAGER — Encrypted secret storage
# ==============================================================================
# Why Secret Manager instead of plain Cloud Run environment variables?
#
#   Plain env vars in Cloud Run are stored in GCP's backend and visible to
#   anyone with "run.services.get" IAM permission (console, gcloud).
#   Secret Manager adds:
#     - Encryption at rest with CMEK support
#     - Audit logs for every access
#     - Fine-grained IAM (roles/secretmanager.secretAccessor per secret)
#     - Version history + rollback
#
# Cost: $0.06 per secret per month, first 6 secrets = $0.36/mo — negligible.
# To stay at truly $0: skip Secret Manager and put vars directly in Cloud Run.
#
# This file creates the secret *names* (shells). Actual values are populated
# separately — either manually via gcloud or by CI on first run:
#
#   echo -n "value" | gcloud secrets versions add SECRET_NAME --data-file=-
# ==============================================================================

locals {
  secrets = {
    db_host          = var.db_host
    db_user          = var.db_user
    db_password      = var.db_password
    jwt_secret       = var.jwt_secret
    internal_api_key = var.internal_api_key
  }
}

resource "google_secret_manager_secret" "api" {
  for_each  = local.secrets
  secret_id = "${var.project_name}-${replace(each.key, "_", "-")}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

# Add the secret value as version 1 via Terraform.
# Terraform stores the value in its state file — acceptable for a hobby project.
# For production, use `ignore_changes = [secret_data]` + populate via gcloud.
resource "google_secret_manager_secret_version" "api" {
  for_each = local.secrets

  secret      = google_secret_manager_secret.api[each.key].id
  secret_data = each.value
}
