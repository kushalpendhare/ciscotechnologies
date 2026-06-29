# Migration Guide: On-Prem K8s → AWS ECS/Fargate

This guide explains the migration path from your current ESXi/K8s setup to cloud-native AWS, and exactly what changes where.

## Overview

| Layer | On-Prem (Current) | AWS (Target) | What Changes |
|-------|-------------------|--------------|--------------|
| **Compute** | K8s Deployments (self-hosted) | ECS Fargate (serverless) | No more pod manifests; define task definitions + services |
| **Container Registry** | GHCR (GitHub) | ECR (AWS) | Push images to ECR instead of GHCR |
| **Database** | Self-hosted Postgres pod | RDS Postgres (managed) | Connection string changes; no backup responsibility |
| **Networking** | ESXi VMs + K8s Services | VPC + ALB | ALB replaces Nginx; no more manual K8s Service creation |
| **Secrets** | K8s Secrets (base64, not encrypted) | AWS Secrets Manager | Credentials stored encrypted at rest; ECS injects at runtime |
| **Monitoring** | Prometheus/Grafana in K8s | CloudWatch + CloudWatch Container Insights | Same Prometheus still works; add CloudWatch for AWS-native dashboards |
| **CI/CD** | Jenkins → GitHub → GHCR → K8s | Jenkins → GitHub → ECR → ECS | Pipeline target changes from `kubectl apply` to `ecs update-service` |

---

## Prerequisites

- AWS account with terraform user (access key configured locally)
- Terraform installed locally (`terraform version`)
- Helm installed on K8s master (you already did this)
- Docker CLI configured to push to ECR

---

## Step 1: One-time AWS Setup (remote state + S3 bucket)

Before running terraform for the first time, create the S3 bucket and DynamoDB table for remote state:

```bash
# Create S3 bucket for Terraform state (bucket names must be globally unique)
aws s3 mb s3://cisco-terraform-state-$(date +%s) --region us-east-1

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name cisco-terraform-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

Then edit `terraform/backend.tf` and set the actual bucket name:

```hcl
bucket = "cisco-terraform-state-YOUR_UNIQUE_ID"
```

---

## Step 2: Prepare Docker images in ECR

First, push your existing images (built in Jenkins) to ECR instead of GHCR.

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Example: tag and push API image from your current GHCR
docker pull ghcr.io/kushalpendhare/cisco-api:latest
docker tag ghcr.io/kushalpendhare/cisco-api:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cisco/api:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cisco/api:latest

# Same for frontend
docker pull ghcr.io/kushalpendhare/cisco-frontend:latest
docker tag ghcr.io/kushalpendhare/cisco-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cisco/frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cisco/frontend:latest
```

Update `terraform/environments/dev/terraform.tfvars` with the actual image URIs:

```hcl
api_image      = "123456789.dkr.ecr.us-east-1.amazonaws.com/cisco/api:latest"
frontend_image = "123456789.dkr.ecr.us-east-1.amazonaws.com/cisco/frontend:latest"
```

---

## Step 3: Prepare Terraform variables

Edit `terraform/environments/dev/terraform.tfvars` and replace:
- `CHANGE_ME_API_IMAGE_URI` → your actual ECR API image URI
- `CHANGE_ME_FRONTEND_IMAGE_URI` → your actual ECR frontend image URI
- `CHANGE_ME_STRONG_PASSWORD` → a strong RDS password
- Salesforce credentials (keep as-is if same)

**⚠️ WARNING:** Add `terraform.tfvars` to `.gitignore` — never commit credentials to Git!

```bash
echo "environments/*/terraform.tfvars" >> .gitignore
git add .gitignore && git commit -m "security: ignore tfvars with credentials"
```

---

## Step 4: Run Terraform

```bash
cd terraform/environments/dev

# Initialize Terraform (downloads modules, sets up backend)
terraform init

# Preview what will be created (always review before apply)
terraform plan -out=tfplan

# Apply (creates VPC, RDS, ECS cluster, ALB, services, etc.)
terraform apply tfplan
```

**This will take ~10-15 minutes.** Terraform will output the ALB DNS name at the end:

```
Outputs:
alb_dns_name = "cisco-alb-1234567890.us-east-1.elb.amazonaws.com"
ecr_api_repository_url = "123456789.dkr.ecr.us-east-1.amazonaws.com/cisco/api"
rds_endpoint = "cisco-db.c123456.us-east-1.rds.amazonaws.com:5432"
```

Save these outputs — you'll need them in the next steps.

---

## Step 5: Initialize RDS database

Your RDS Postgres is now running, but it's empty. You need to run your `db/init.sql` against it:

```bash
# Get RDS connection details from terraform outputs
RDS_HOST=$(terraform output -raw db_host)
RDS_PORT=$(terraform output -raw db_port)

# Run init script
psql -h $RDS_HOST -p $RDS_PORT -U ciscoAdmin -d ciscotech -f ../../db/init.sql
# Will prompt for password (use what you set in tfvars)
```

(Or use your favorite SQL client — DBeaver, pgAdmin, etc. — to connect and run the SQL manually)

---

## Step 6: Point your domain to ALB

Get the ALB DNS name from Terraform outputs and create a CNAME record:

```
ciscotechnologies.com  CNAME  cisco-alb-1234567890.us-east-1.elb.amazonaws.com
```

Wait ~5 min for DNS propagation, then test:

```bash
curl https://ciscotechnologies.com/api/health
# Should return 200 OK if everything is working
```

---

## Step 7: Update Jenkins pipeline for AWS deployment

Replace the Ansible-based K8s deployment stages with ECS deployment:

**Old pipeline (K8s):**
```groovy
stage('Deploy to UAT') {
  steps {
    sh "ansible-playbook -i .../inventory deploy.yml"
  }
}
```

**New pipeline (AWS):**
```groovy
stage('Deploy to ECS') {
  steps {
    sh """
      aws ecs update-service \
        --cluster cisco-cluster \
        --service cisco-api-service \
        --region us-east-1 \
        --force-new-deployment
    """
  }
}
```

(Jenkins already has AWS CLI installed if it's running on an AWS instance; if not, install via `pip install awscli`)

---

## What stays the same?

- **Git workflow** — still push to GitHub, webhook still triggers Jenkins
- **Image building** — Docker build stage unchanged (just pushes to ECR instead of GHCR)
- **Application code** — no changes to Flask/React; `app.py` and `AdminPortal.jsx` work as-is
- **Prometheus/Grafana** — can stay on K8s cluster, or we can move to CloudWatch (optional)

---

## What's different?

| Old | New | Why |
|-----|-----|-----|
| `kubectl scale deployment api --replicas=3` | Managed by ECS auto-scaling (CPU/memory triggers) | Automatic, no manual scaling |
| `kubectl apply -f deployment.yaml` | Terraform (IaC) for infrastructure, Jenkins for app updates | Declarative, version-controlled |
| Manual K8s manifest YAML | Task definitions defined in Terraform | Single source of truth |
| Pod logs via `kubectl logs` | CloudWatch Logs (auto-aggregated) | Centralized, queryable |
| K8s Service IP (internal cluster DNS) | ALB (public, managed) | Load balancing handled by AWS |
| Self-managed backups or PVCs | RDS snapshots (automated, 7-day retention) | Managed by AWS, always available |

---

## Monitoring changes

### Old (K8s):
- Prometheus scrapes pods directly at `:9090`
- Prometheus + Grafana running in `monitoring` namespace
- Manual port-forward to access Grafana

### New (AWS):
- ECS automatically sends metrics to CloudWatch
- Enable CloudWatch Container Insights (already done in `ecs/main.tf`)
- Prometheus still scrapes API at `/metrics`, but now through ALB
- Optional: CloudWatch + Prometheus both report the same data

**No code changes needed** — Prometheus instrumentation in Flask (`prometheus_patch.py`) keeps working.

---

## Cost estimate (with $100 credits)

| Component | Cost/month |
|-----------|-----------|
| NAT Gateway | $32 |
| ECS Fargate (2x 0.25vCPU × 512MB tasks) | $25 |
| RDS db.t3.micro | $30 |
| ALB | $16 |
| Data transfer (out) | ~$1-3 |
| **Total** | **~$104-110** |

**You'll run out of free credits in 1 month of constant use.** Options:
- Stop services when not testing (ECS can scale to 0)
- Downgrade to db.t3.micro with single-AZ (already done)
- Use AWS free tier (first 12 months): RDS + NAT partially covered

---

## Rollback to K8s (if needed)

Your on-prem K8s cluster is still running. To roll back:

1. Switch DNS CNAME back to Cloudflare Tunnel IP
2. Revert Jenkins pipeline to `ansible-playbook deploy.yml`
3. Scale down ECS services to 0 in AWS console (stops billing)
4. Keep Terraform state for reference

---

## Next steps after successful migration

Once AWS stack is stable:

1. **Lambda for chatbot** — serverless function that calls your API endpoints
2. **EventBridge** — event-driven workflows (e.g., SF case created → trigger Lambda → send alert)
3. **SQS** — decouple chatbot requests from API rate limits
4. **Terraform for prod environment** — copy `environments/dev` → `environments/prod`, adjust values
5. **CloudFront + S3** — serve frontend assets from CDN (cheaper than ALB for static files)

---

## Troubleshooting

**Tasks not starting?**
```bash
aws ecs describe-tasks \
  --cluster cisco-cluster \
  --tasks <task-id> \
  --region us-east-1
```
Check `stoppedReason` for details.

**Can't connect to RDS?**
```bash
# Verify security group allows port 5432 from ECS
aws ec2 describe-security-groups \
  --group-ids <ecs-sg-id> \
  --region us-east-1
```

**ALB not routing to backend?**
```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <tg-arn> \
  --region us-east-1
```

---

## Questions?

This is a major infrastructure change. If something fails during `terraform apply`, the error message usually tells you exactly what — security group doesn't exist, IAM permission missing, etc. Google the error + "Terraform" and 99% of issues have solutions on Stack Overflow.

Good luck! 🚀
