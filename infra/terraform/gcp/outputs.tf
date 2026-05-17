# ==============================================================================
# OUTPUTS
# ==============================================================================

output "cloud_run_url" {
  description = "Stable HTTPS URL of the Cloud Run service. Set NEXT_PUBLIC_API_URL to <url>/api/v1 and update scraper API_URL."
  value       = google_cloud_run_v2_service.api.uri
}

output "cloud_run_service_name" {
  description = "Cloud Run service name (used in gcloud run deploy --service flag)"
  value       = google_cloud_run_v2_service.api.name
}

output "artifact_registry_repo" {
  description = "Artifact Registry repository URL for docker push"
  value       = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.api.repository_id}"
}

# ── Quick-start commands ──────────────────────────────────────────────────────
# After first `terraform apply`:
#
# 1. Authenticate Docker to push images:
#    gcloud auth configure-docker ${var.gcp_region}-docker.pkg.dev
#
# 2. Build and push the API image:
#    docker build -t <artifact_registry_repo>/runners-list-api:latest ./api
#    docker push <artifact_registry_repo>/runners-list-api:latest
#
# 3. Re-deploy Cloud Run to pick up the image:
#    gcloud run deploy runners-list-api \
#      --image <artifact_registry_repo>/runners-list-api:latest \
#      --region ${var.gcp_region}
#
# 4. Set NEXT_PUBLIC_API_URL in Vercel to <cloud_run_url>/api/v1
#    (This is a one-time manual step — never changes again!)
#
# 5. Set API_URL in scraper repo secrets to <cloud_run_url>/api/v1/internal/sync
#    (Same — never changes again after this!)
