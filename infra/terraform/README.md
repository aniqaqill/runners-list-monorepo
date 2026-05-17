# Runners List Infrastructure

Terraform Infrastructure as Code for the Runners List API.

## Quick Start

### Enable/Disable API

Edit `terraform.tfvars`:
```hcl
api_enabled = false  # API off ($0)
api_enabled = true   # API on (~$5/month)
```

Then commit and push - workflow applies automatically.

## File Structure

| File | Purpose |
|------|---------|
| `terraform.tfvars` | **Your settings** (source of truth) |
| `_provider.tf` | AWS provider configuration |
| `_variables.tf` | Variable definitions |
| `1_network.tf` | VPC, subnets, security group |
| `2_container.tf` | ECR repository |
| `3_compute.tf` | ECS cluster, service, task |
| `outputs.tf` | Exported values |
| `BEST_PRACTICES.md` | Workflow guide |

## How It Works

```
terraform.tfvars → git push → GitHub Actions → terraform apply → AWS
```

**Code is the source of truth.** Change settings in tfvars, push, done.

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `SUPABASE_DB_HOST` | Database host |
| `SUPABASE_DB_USER` | Database user |
| `SUPABASE_DB_PASSWORD` | Database password |
| `JWT_SECRET` | JWT signing key |
| `INTERNAL_API_KEY` | Scraper API key |

## Commands

```bash
terraform plan      # Preview changes
terraform apply     # Apply changes (local only)
terraform output    # Show values
```

## Cost

| API State | Monthly Cost |
|-----------|--------------|
| Off (`api_enabled = false`) | ~$0.50 |
| On (`api_enabled = true`) | ~$5-10 |
