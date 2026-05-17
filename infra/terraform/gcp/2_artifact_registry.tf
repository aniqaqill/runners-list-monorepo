# ==============================================================================
# ARTIFACT REGISTRY — Private Docker image storage
# ==============================================================================
# Equivalent to AWS ECR. Stores the Docker images built by CI/CD.
#
# Free tier: first 0.5 GiB/month per project is free.
# At this scale (one small Go binary image ~20 MB) we stay well within free.
#
# Format: Docker (as opposed to Maven, npm, Python — AR supports many formats)
# ==============================================================================

resource "google_artifact_registry_repository" "api" {
  provider = google

  location      = var.gcp_region
  repository_id = "${var.project_name}-api"
  description   = "Docker images for the Runners List Go API"
  format        = "DOCKER"

  # Clean up old images automatically so storage stays near zero.
  # Keeps only the 5 most recent tagged images (same policy as the AWS ECR one).
  cleanup_policies {
    id     = "keep-5-tagged"
    action = "KEEP"
    most_recent_versions {
      keep_count = 5
    }
  }

  depends_on = [google_project_service.apis]
}

output "artifact_registry_url" {
  description = "Full registry hostname — use as Docker registry in CI: docker push <url>/runners-list-api:<tag>"
  value       = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.api.repository_id}"
}
