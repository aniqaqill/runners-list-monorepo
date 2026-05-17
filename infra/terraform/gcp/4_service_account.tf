# ==============================================================================
# SERVICE ACCOUNTS + WORKLOAD IDENTITY FEDERATION
# ==============================================================================
# Two service accounts are created:
#
#   1. runtime-sa   — Identity assumed by Cloud Run at runtime.
#                     Granted: Secret Manager accessor.
#                     Principle of least privilege: it can ONLY read secrets.
#
#   2. ci-sa        — Identity impersonated by GitHub Actions via WIF.
#                     Granted: Artifact Registry writer + Cloud Run deployer.
#                     No long-lived key: GitHub OIDC token is exchanged for a
#                     short-lived GCP access token via WIF.
#
# Workload Identity Federation (WIF) replaces long-lived service account keys.
# How it works:
#   GitHub generates a short-lived OIDC JWT for each workflow run.
#   GCP's WIF pool validates the JWT's issuer, audience, and subject claims.
#   If valid, GCP issues a short-lived access token for the mapped SA.
#
# AWS equivalent: IAM OIDC provider + role trust policy.
# ==============================================================================

# ── Runtime Service Account ───────────────────────────────────────────────────

resource "google_service_account" "runtime" {
  account_id   = "${var.project_name}-runtime"
  display_name = "Runners List API runtime identity"
}

# Allow the runtime SA to read secrets
resource "google_project_iam_member" "runtime_secret_accessor" {
  project = var.gcp_project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.runtime.email}"
}

# ── CI Service Account ────────────────────────────────────────────────────────

resource "google_service_account" "ci" {
  account_id   = "${var.project_name}-ci"
  display_name = "Runners List CI/CD deploy identity"
}

# CI SA can push images to Artifact Registry
resource "google_project_iam_member" "ci_artifact_writer" {
  project = var.gcp_project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.ci.email}"
}

# CI SA can deploy new revisions to Cloud Run
resource "google_project_iam_member" "ci_run_deployer" {
  project = var.gcp_project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.ci.email}"
}

# CI SA can use the runtime SA as the Cloud Run service identity
# (required when deploying: you tell Cloud Run to run as runtime-sa)
resource "google_service_account_iam_member" "ci_can_act_as_runtime" {
  service_account_id = google_service_account.runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ci.email}"
}

# ── Workload Identity Federation Pool + Provider ──────────────────────────────

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "${var.project_name}-github-pool"
  display_name              = "GitHub Actions pool"
  description               = "Allows GitHub Actions workflows to authenticate as GCP service accounts without static keys"

  depends_on = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC"

  # GitHub's OIDC issuer URL
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  # Map the GitHub OIDC claims to GCP attributes.
  # google.subject becomes the "sub" claim from GitHub's JWT.
  # attribute.repository is a custom attribute we can use in conditions.
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }

  # Only tokens from your specific repo are accepted (security boundary)
  attribute_condition = "attribute.repository == '${var.github_org}/${var.github_repo}'"
}

# Bind: GitHub Actions workflow on the main branch → CI service account
# Subject format: repo:<org>/<repo>:ref:refs/heads/main
resource "google_service_account_iam_member" "wif_binding" {
  service_account_id = google_service_account.ci.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_org}/${var.github_repo}"
}

# ── Outputs used by CI workflow ───────────────────────────────────────────────

output "workload_identity_provider" {
  description = "WIF provider resource name — paste into GHA as WORKLOAD_IDENTITY_PROVIDER secret"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "ci_service_account_email" {
  description = "CI SA email — paste into GHA as GCP_SA_EMAIL secret"
  value       = google_service_account.ci.email
}
