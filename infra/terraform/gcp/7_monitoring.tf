# ==============================================================================
# CLOUD MONITORING — Alerting
# ==============================================================================
# One alert: if the Cloud Run 5xx error rate exceeds 5% for 5 minutes,
# send an email notification.
#
# Cloud Run emits built-in request metrics automatically — no agent needed.
# Cloud Monitoring is free for the first 150 MB of metric data/mo.
#
# Concepts:
#   - Alert policy: "when should I be woken up?"
#   - Notification channel: "how?"
#   - MQL (Monitoring Query Language): filter + aggregate metric time series
# ==============================================================================

variable "alert_email" {
  description = "Email address to receive Cloud Run error rate alerts."
  type        = string
  default     = ""
}

# Only create the notification channel if an email is provided
resource "google_monitoring_notification_channel" "email" {
  count        = var.alert_email != "" ? 1 : 0
  display_name = "${var.project_name} alert email"
  type         = "email"

  labels = {
    email_address = var.alert_email
  }
}

resource "google_monitoring_alert_policy" "error_rate" {
  count        = var.alert_email != "" ? 1 : 0
  display_name = "${var.project_name} Cloud Run 5xx error rate"
  combiner     = "OR"

  conditions {
    display_name = "5xx rate > 5% for 5 minutes"

    condition_threshold {
      # Cloud Run request count metric, filtered to 5xx responses
      filter = <<-EOT
        resource.type = "cloud_run_revision"
        AND resource.labels.service_name = "${var.project_name}-api"
        AND metric.type = "run.googleapis.com/request_count"
        AND metric.labels.response_code_class = "5xx"
      EOT

      # Compare the 5xx count against the total request count as a ratio
      denominator_filter = <<-EOT
        resource.type = "cloud_run_revision"
        AND resource.labels.service_name = "${var.project_name}-api"
        AND metric.type = "run.googleapis.com/request_count"
      EOT

      comparison      = "COMPARISON_GT"
      threshold_value = 0.05 # 5%
      duration        = "300s" # 5 minutes

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }

      denominator_aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [
    for ch in google_monitoring_notification_channel.email : ch.name
  ]

  alert_strategy {
    notification_rate_limit {
      period = "300s" # Don't spam: max one alert per 5 minutes
    }
  }

  documentation {
    content = <<-EOT
      ## Runners List API — elevated 5xx error rate

      Cloud Run is returning more than 5% server errors.

      **Investigate:**
      1. Check Cloud Logging: `resource.type="cloud_run_revision" severity>=ERROR`
      2. Look for recent deployments in the api repo's Actions tab
      3. Check Supabase status: https://status.supabase.com
      4. Roll back: `gcloud run services update-traffic runners-list-api --to-revisions PREVIOUS=100`
    EOT
  }

  depends_on = [google_project_service.apis]
}
