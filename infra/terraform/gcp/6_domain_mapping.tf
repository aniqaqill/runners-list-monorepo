# ==============================================================================
# CUSTOM DOMAIN MAPPING (Phase 4 / optional)
# ==============================================================================
# Maps a custom domain to the Cloud Run service. Cloud Run manages the TLS
# certificate automatically (no ACM, no cert-manager needed).
#
# Prerequisites:
#   1. Verify domain ownership in GCP Search Console or via TXT record.
#   2. Add the CNAME record to Cloudflare DNS pointing to ghs.googlehosted.com.
#   3. Set var.custom_domain in your terraform.tfvars.
#
# This resource is commented out until Phase 4 to avoid plan failures when the
# domain is not yet verified.
# ==============================================================================

variable "custom_domain" {
  description = "Custom domain for the API (e.g. api.runnerslist.my). Leave empty to skip."
  type        = string
  default     = ""
}

# Uncomment when you have a verified domain:
#
# resource "google_cloud_run_domain_mapping" "api" {
#   count    = var.custom_domain != "" ? 1 : 0
#   location = var.gcp_region
#   name     = var.custom_domain
#
#   metadata {
#     namespace = var.gcp_project_id
#   }
#
#   spec {
#     route_name = google_cloud_run_v2_service.api.name
#   }
# }
#
# output "domain_mapping_dns" {
#   description = "DNS records to add in Cloudflare after domain mapping is created"
#   value       = try(google_cloud_run_domain_mapping.api[0].status[0].resource_records, [])
# }
