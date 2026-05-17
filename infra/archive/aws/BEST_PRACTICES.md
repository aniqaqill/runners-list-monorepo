# Terraform IaC - Best Practices & Workflow Guide

A practical guide for managing your infrastructure code.

---

## File Roles

| File | What It Is | When to Edit |
|------|------------|--------------|
| `terraform.tfvars` | Your settings | To change config (api_enabled, cpu, etc.) |
| `_variables.tf` | Input definitions | To add NEW configurable options |
| `1_network.tf` | Network code | Rarely - only for network changes |
| `2_container.tf` | ECR code | Rarely - registry settings |
| `3_compute.tf` | ECS code | To change container config |
| `outputs.tf` | Export values | To add new outputs |

---

## Daily Workflow

### Enable/Disable API

```bash
# Edit terraform.tfvars
api_enabled = true   # Enable
api_enabled = false  # Disable

# Commit and push
git add terraform.tfvars
git commit -m "enable api" 
git push origin main
# Workflow runs and applies automatically
```

### Make Infrastructure Changes

```
1. Edit .tf or .tfvars files locally
2. Run: terraform plan (preview changes)
3. Review the plan carefully
4. Commit and push to git
5. GitHub Actions applies the changes
```

---

## When to Update Secrets

### Add New Secrets to GitHub

**When:** You need a NEW secret the code doesn't have yet.

```bash
# 1. Add variable to _variables.tf
variable "new_secret" {
  type      = string
  sensitive = true
}

# 2. Use it in your code (e.g., 3_compute.tf)
environment = [
  { name = "NEW_SECRET", value = var.new_secret }
]

# 3. Add to workflow (.github/workflows/terraform.yml)
env:
  TF_VAR_new_secret: ${{ secrets.NEW_SECRET }}

# 4. Add to GitHub repo settings → Secrets → Actions
```

### Rotate Existing Secrets

**When:** Security rotation or suspected compromise.

1. Generate new secret value
2. Update in GitHub repo secrets
3. Push any commit to trigger workflow
4. Workflow redeploys with new secret

---

## Terraform Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `terraform init` | Download providers | After cloning or provider changes |
| `terraform plan` | Preview changes | **Always before apply** |
| `terraform apply` | Make changes | After reviewing plan |
| `terraform state list` | Show managed resources | Debugging |
| `terraform output` | Show values | Get resource IDs |

### Local Apply (Emergency Only)

```bash
# Set secrets
export TF_VAR_db_host="..."
export TF_VAR_db_user="..."
export TF_VAR_db_password="..."
export TF_VAR_jwt_secret="..."
export TF_VAR_internal_api_key="..."

# Apply
terraform apply

# Push state back to git
git add -f terraform.tfstate
git commit -m "manual apply"
git push origin main
```

---

## DOs ✅

| Do | Why |
|----|-----|
| Always run `terraform plan` first | See what will change before changing |
| Review plan output carefully | Catch unwanted destroys |
| Commit tfvars changes to git | Code = source of truth |
| Use descriptive commit messages | Track why changes were made |
| Keep secrets in GitHub Secrets | Never commit secrets to code |
| Push state after local apply | Keep state in sync |

---

## DON'Ts ❌

| Don't | Why |
|-------|-----|
| Don't edit state file manually | Corrupts state, breaks everything |
| Don't delete resources in AWS console | State gets out of sync |
| Don't commit secrets to code | Security risk |
| Don't ignore plan warnings | May destroy resources |
| Don't run apply without plan | Surprises await |
| Don't create resources manually | Terraform won't know about them |

---

## Common Scenarios

### "I made changes in AWS Console"

**Problem:** Terraform state is now out of sync.

**Fix:**
```bash
terraform refresh  # Update state from AWS
terraform plan     # See drift
# Either revert console changes OR update .tf to match
```

### "Terraform wants to destroy something"

**Problem:** Code differs from state.

**Fix:**
1. Check if you accidentally deleted code
2. If intentional, review and proceed
3. If not, restore the code from git history

### "State is locked"

**Problem:** Another process is running.

**Fix:**
```bash
# Kill stuck terraform
pkill -9 terraform

# Or force unlock (use carefully)
terraform force-unlock <LOCK_ID>
```

### "Resource already exists"

**Problem:** Created manually, not in state.

**Fix:**
```bash
terraform import <resource_address> <resource_id>
```

---

## Security Checklist

- [ ] Secrets only in GitHub Secrets, never in code
- [ ] State file contains sensitive data - private repo only
- [ ] Rotate secrets periodically
- [ ] Review IAM permissions (least privilege)
- [ ] Check for drift regularly

---

## Quick Reference

```bash
# Enable API
sed -i 's/api_enabled = false/api_enabled = true/' terraform.tfvars
git add . && git commit -m "enable api" && git push

# Disable API  
sed -i 's/api_enabled = true/api_enabled = false/' terraform.tfvars
git add . && git commit -m "disable api" && git push

# Check current state
terraform output

# See what Terraform manages
terraform state list
```
