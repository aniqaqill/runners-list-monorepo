# ==============================================================================
# CLOUD RUN — Serverless container runtime
# ==============================================================================
# Contrast with ECS Fargate in archive/aws/3_compute.tf:
#
#   ECS Fargate (old)                  Cloud Run (new)
#   ─────────────────────────────────  ─────────────────────────────────────
#   Always-on task → ~$5/mo            Scale-to-zero → $0 when idle
#   Public IP changes on redeploy       Stable HTTPS URL (*.run.app)
#   Manual IP sync to Vercel + scraper  No IP sync needed at all
#   Security groups + VPC required      Fully managed — no VPC needed
#   CloudWatch disabled to save cost    Cloud Logging included free
#   Long-lived AWS keys in GH secrets   OIDC via WIF — no keys
#
# Scale-to-zero explained:
#   When no requests arrive for ~15 minutes, Cloud Run terminates all instances.
#   Cost: $0. On the next request, a new instance starts in ~1-2s (cold start).
#   For a daily-cron scraper + ISR frontend, cold starts are fine.
# ==============================================================================

locals {
  image_url = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.api.repository_id}/${var.project_name}-api:latest"

  # Secrets pulled from Secret Manager and exposed as environment variables
  secret_env_vars = {
    DB_HOST          = "db-host"
    DB_USER          = "db-user"
    DB_PASSWORD      = "db-password"
    JWT_SECRET       = "jwt-secret"
    INTERNAL_API_KEY = "internal-api-key"
  }
}

resource "google_cloud_run_v2_service" "api" {
  name     = "${var.project_name}-api"
  location = var.gcp_region

  # Allow unauthenticated traffic (public API)
  # IAM policy below grants allUsers invoker permission
  ingress = "INGRESS_TRAFFIC_ALL"

  template {
    # Runtime SA: least-privilege identity for the running container
    service_account = google_service_account.runtime.email

    # Scale-to-zero: min=0 means no instances when idle → $0 cost
    # max=2 is enough for hobby; Cloud Run handles bursts automatically
    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instances
    }

    containers {
      # Image is updated by CI/CD (gcloud run deploy --image ...), not Terraform
      # On first apply, this will fail unless you push an image first.
      # Tip: push a placeholder (gcr.io/cloudrun/hello) then let CI replace it.
      image = local.image_url

      ports {
        container_port = var.container_port
      }

      # Non-secret static config
      env {
        name  = "DB_NAME"
        value = "postgres"
      }
      env {
        name  = "DB_PORT"
        value = "5432"
      }
      env {
        name  = "PORT"
        value = tostring(var.container_port)
      }

      # Secret-backed environment variables
      # Each secret is mounted from Secret Manager → env var at runtime
      dynamic "env" {
        for_each = local.secret_env_vars
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.api[lower(replace(env.key, "_", "-")) == replace(lower(env.key), "_", "-") ? lower(replace(env.key, "_", "-")) : lower(replace(env.key, "_", "-"))].secret_id
              version = "latest"
            }
          }
        }
      }

      # Liveness probe: Cloud Run restarts the container if this fails
      liveness_probe {
        http_get {
          path = "/health"
          port = var.container_port
        }
        initial_delay_seconds = 5
        period_seconds        = 30
        failure_threshold     = 3
      }

      # Startup probe: waits for the app to be ready before sending traffic
      startup_probe {
        http_get {
          path = "/ready"
          port = var.container_port
        }
        initial_delay_seconds = 2
        period_seconds        = 5
        failure_threshold     = 10
        timeout_seconds       = 3
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.api,
  ]
}

# Allow anyone to call the Cloud Run service (public API)
resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  project  = google_cloud_run_v2_service.api.project
  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
