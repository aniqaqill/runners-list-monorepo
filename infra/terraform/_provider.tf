# ==============================================================================
# TERRAFORM PROVIDER CONFIGURATION
# ==============================================================================
# This file configures which cloud provider (AWS) Terraform will use
# and sets the region where resources will be created.
# ==============================================================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# AWS Provider - All resources will be created in Singapore (ap-southeast-1)
provider "aws" {
  region = var.aws_region

  # Tags applied to ALL resources automatically
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}
