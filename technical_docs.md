# Technical Documentation: Runners List Platform

## 1. System Architecture

### Production Stack (January 2026)

```mermaid
graph LR
    subgraph "Data Layer"
        A[(Supabase PostgreSQL)] 
    end
    
    subgraph "API Layer"
        B[Go API] --> A
    end
    
    subgraph "Presentation Layer"
        C[Next.js on Vercel] --> B
    end
    
    subgraph "Data Ingestion"
        D[Python Scraper] -->|POST /internal/sync| B
    end
    
    E((User)) --> C
```

### Infrastructure Components

| Component | Service | Region | Details |
|-----------|---------|--------|---------|
| API | AWS ECS Fargate | ap-southeast-1 | 0.25 vCPU, 512MB RAM, Spot instances |
| Database | Supabase | ap-southeast-2 | Transaction Pooler on port 5432 |
| Frontend | Vercel | Edge | ISR with 60s revalidation |
| Container Registry | AWS ECR | ap-southeast-1 | Stores Docker images |
| CI/CD | GitHub Actions | - | Auto-deploy on push to main |

---

## 2. API Specification

### Base URL
```
http://<DYNAMIC_IP>:8080/api/v1
```

> **Note:** IP changes on each deployment. Use the Zero-Cost automation to sync.

### Endpoints

#### GET /events
Returns all events sorted by date.

**Response:**
```json
{
  "data": [
    {
      "ID": 1,
      "name": "KL Marathon",
      "location": "Dataran Merdeka",
      "state": "Kuala Lumpur",
      "distance": "42km",
      "date": "2026-10-04T00:00:00Z",
      "registration_url": "https://example.com"
    }
  ],
  "error": false
}
```

#### POST /internal/sync
Bulk upsert events from scraper.

**Headers:**
- `X-Internal-Token: <INTERNAL_API_KEY>`

**Request Body:**
```json
{
  "events": [
    {
      "name": "Event Name",
      "location": "City, State",
      "state": "State",
      "distance": "21km",
      "date": "2026-12-01",
      "registration_url": "https://example.com"
    }
  ]
}
```

---

## 3. Deployment Pipeline

### CI/CD Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant ECR as AWS ECR
    participant ECS as AWS ECS
    participant Scraper as Scraper Repo
    participant Vercel as Vercel

    Dev->>GH: Push to main
    GH->>ECR: Build & Push Docker Image
    GH->>ECS: Deploy New Task Definition
    ECS-->>GH: Return New Public IP
    GH->>Scraper: Update API_URL Secret
    GH->>Vercel: Update NEXT_PUBLIC_API_URL
    Note over Vercel: Requires manual redeploy<br/>for NEXT_PUBLIC vars
```

### Workflow Files

| File | Repository | Purpose |
|------|------------|---------|
| `api/.github/workflows/deploy-aws.yml` | runners-list-api | Deploy API + sync secrets |
| `scraper/.github/workflows/scraper.yml` | runners-list-scraper | Daily cron at 8:00 AM UTC |
| `infra/.github/workflows/terraform.yml` | runners-list-infra | GitOps for infrastructure |

---

## 4. Zero-Cost IP Automation

Since ECS Fargate assigns dynamic IPs, the deployment workflow automatically:

1. **Fetches the new IP** using AWS CLI:
   ```bash
   TASK_ARN=$(aws ecs list-tasks --cluster runners-list-cluster ...)
   ENI_ID=$(aws ecs describe-tasks --tasks $TASK_ARN ...)
   PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID ...)
   ```

2. **Updates Scraper secret** using GitHub CLI:
   ```bash
   gh secret set API_URL --body "$NEW_URL" --repo aniqaqill/runners-list-scraper
   ```

3. **Updates Vercel env var** using Vercel API:
   ```bash
   curl -X POST/PATCH "https://api.vercel.com/v9/projects/$PROJECT_ID/env" \
     -H "Authorization: Bearer $VERCEL_TOKEN" \
     -d '{"key": "NEXT_PUBLIC_API_URL", "value": "$FRONTEND_URL"}'
   ```

---

## 5. Database Schema

### Events Table

```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    state VARCHAR(100),
    distance VARCHAR(50),
    date TIMESTAMP,
    description TEXT,
    registration_url VARCHAR(500)
);

-- Unique constraint for upsert
CREATE UNIQUE INDEX idx_events_name_date ON events(name, date);
```

### Connection String Format
```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
```

---

## 6. Frontend Integration

### Data Fetching

```typescript
// src/utils/loadEvents.ts
export const loadEvents = async (): Promise<Event[]> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (apiUrl) {
    const res = await fetch(`${apiUrl}/events`, { next: { revalidate: 60 } });
    if (res.ok) {
      const response = await res.json();
      return response.data || response;
    }
  }
  
  return []; // Fallback to empty
};
```

### Environment Variables (Vercel)

| Variable | Example Value |
|----------|---------------|
| `NEXT_PUBLIC_API_URL` | `http://54.169.0.238:8080/api/v1` |

---

## 7. Security

### Authentication

| Endpoint | Method |
|----------|--------|
| Public endpoints | None |
| `/internal/sync` | `X-Internal-Token` header |
| Protected routes | JWT Bearer token |

### Secrets Management

- All secrets stored in GitHub Repository Secrets
- Never committed to code
- Rotated regularly

---

## 8. Monitoring & Debugging

### CloudWatch Logs (Currently Disabled)

To re-enable for debugging:
1. Update `task-definition.json` with logConfiguration
2. Grant `CloudWatchLogsFullAccess` to `ecsTaskExecutionRole`
3. Redeploy

### Health Check

```bash
curl http://<IP>:8080/api/v1/
# Expected: {"message": "API is running"}
```

### View ECS Task Status

```bash
aws ecs describe-services \
  --cluster runners-list-cluster \
  --services runners-list-service
```

---

## 9. Cost Optimization

| Optimization | Savings |
|--------------|---------|
| Fargate Spot instances | 70% vs on-demand |
| CloudWatch logs disabled | ~$5/month |
| Single task (no ALB) | ~$18/month |
| Supabase free tier | 100% |

**Total Monthly Cost: ~$5**

---

## 10. Terraform GitOps

### Infrastructure as Code

All AWS infrastructure is managed via Terraform in the `runners-list-infra` repository.

### Terraform Files

| File | Purpose |
|------|---------|
| `terraform.tfvars` | **Settings (source of truth)** |
| `_provider.tf` | AWS provider configuration |
| `_variables.tf` | Variable definitions |
| `1_network.tf` | VPC, subnets, internet gateway, security group |
| `2_container.tf` | Container registry with lifecycle policy |
| `3_compute.tf` | ECS cluster, service, task definition |
| `outputs.tf` | Resource IDs exported after apply |
| `BEST_PRACTICES.md` | Workflow and dos/don'ts guide |

### Toggle API On/Off

**The Proper Way (Code as Source of Truth):**
1. Edit `terraform.tfvars`:
   ```hcl
   api_enabled = false  # OFF
   api_enabled = true   # ON
   ```
2. Commit and push to git
3. GitHub Actions applies automatically

**Emergency CLI (local only):**
```bash
cd infra/terraform
export TF_VAR_db_host="x" TF_VAR_db_user="x" TF_VAR_db_password="x" TF_VAR_jwt_secret="x" TF_VAR_internal_api_key="x"
terraform apply
git add -f terraform.tfstate && git push  # Sync state back
```

### Lifecycle Protection

All networking resources have `lifecycle { ignore_changes = all }` to prevent Terraform from modifying or destroying existing infrastructure.

---

## 11. Future Enhancements

### Completed ✅
- [x] Terraform GitOps for infrastructure
- [x] Toggle API on/off via terraform.tfvars
- [x] Code as source of truth (no runtime overrides)

### Short Term
- [ ] Add AWS Budget alerts ($10 threshold)
- [ ] Enable CloudWatch logs selectively
- [ ] S3 backend for Terraform state (team-friendly)

### Medium Term
- [ ] Add Application Load Balancer for stable URL
- [ ] Configure custom domain with Route53
- [ ] Add API response caching with Redis

### Long Term
- [ ] Add mobile app (React Native)
- [ ] Implement event notifications
