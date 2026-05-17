# Runners List Infrastructure

Infrastructure as Code for the Runners List platform using Terraform.

## Quick Start

### Manual Trigger (Recommended)
1. Go to **GitHub** → **Actions** tab
2. Select **Terraform Infrastructure**
3. Click **Run workflow**
4. Choose `api_enabled` = `true` or `false`

### Via Git Push
Any push to `main` will trigger `terraform apply`.

---

## Local Development

### Prerequisites
- Terraform 1.6+
- AWS CLI configured

### Commands

```bash
cd infra/terraform

# Initialize
terraform init

# Set secrets (or use TF_VAR_ env vars)
export TF_VAR_db_host="your-supabase-host"
export TF_VAR_db_user="postgres.your-project-ref"
export TF_VAR_db_password="your-password"
export TF_VAR_jwt_secret="your-jwt-secret"
export TF_VAR_internal_api_key="your-api-key"

# Plan
terraform plan

# Apply
terraform apply
```

---

## Toggle API On/Off

### Via GitHub (GitOps)
1. Go to **Actions** → **Run workflow**
2. Set `api_enabled` = `false` to stop, `true` to start

### Via CLI
```bash
terraform apply -var="api_enabled=false"  # Stop
terraform apply -var="api_enabled=true"   # Start
```

---

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `SUPABASE_DB_HOST` | Database host |
| `SUPABASE_DB_USER` | Database user |
| `SUPABASE_DB_PASSWORD` | Database password |
| `JWT_SECRET` | JWT signing key |
| `INTERNAL_API_KEY` | Scraper API key |

---

## File Structure

```
infra/
├── .github/workflows/terraform.yml  # CI/CD
├── .gitignore                        # Ignore aws-ecs/ and state
└── terraform/
    ├── main.tf          # Provider
    ├── variables.tf     # Inputs
    ├── vpc.tf           # Networking
    ├── ecr.tf           # Container registry
    ├── ecs.tf           # ECS cluster/service
    └── outputs.tf       # Outputs
```

---

## Importing Existing Resources

If you have manually created AWS resources, import them:

```bash
# Get your account ID
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

# Import resources
terraform import aws_ecr_repository.api runners-list-api
terraform import aws_ecs_cluster.main arn:aws:ecs:ap-southeast-1:$ACCOUNT:cluster/runners-list-cluster
```
