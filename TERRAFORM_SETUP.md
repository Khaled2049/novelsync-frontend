# Terraform & CI/CD Setup

CI/CD setup for NovelSync Frontend using Terraform and GitHub Actions with Workload Identity Federation (WIF) for keyless authentication.

## Architecture

```
GitHub Actions (WIF)
    |
GCP Service Account (github-actions)
    |--- Terraform (Infrastructure as Code)
    |       |--- API enablement
    |       |--- Secret Manager (SMTP, Replicate, etc.)
    |       |--- IAM bindings
    |       |--- Data sources (Cloud Run backend)
    |
    |--- Secret Manager (versions synced from GitHub secrets)
    |       |--- Accessed by App Engine default SA
    |
    |--- Firebase CLI (Deployment)
            |--- Hosting (static files)
            |--- Functions (TypeScript, with secrets)
            |--- Rules (Firestore, Storage)
```

### Hybrid Firebase + Terraform

**Terraform manages:** API enablement, Secret Manager, IAM bindings, state backend

**Firebase CLI manages:** Hosting, Functions, Firestore/Storage rules

Firebase Hosting/Functions are optimized for the Firebase CLI. Terraform handles infrastructure and IAM.

## Files

### Terraform (`terraform/`)

| File | Purpose |
|------|---------|
| `versions.tf` | Terraform >= 1.5.0, Google provider ~> 5.0 |
| `variables.tf` | Input variables (project_id, region, secret_names, etc.) |
| `backend.tf` | GCS state backend (`story-6f89f-terraform-state`) |
| `main.tf` | API enablement (7 APIs), Cloud Run data source |
| `secrets.tf` | Secret Manager secrets via `for_each`, import blocks for existing secrets |
| `iam.tf` | IAM bindings for App Engine SA and GitHub Actions SA |
| `firestore.tf` | Firestore configuration (extensible) |
| `outputs.tf` | Backend URL, service accounts, secrets list |

### GitHub Actions (`.github/workflows/`)

| File | Purpose |
|------|---------|
| `deploy.yml` | Production deployment: Terraform apply, build frontend, deploy Firebase |

## One-Time Setup

### 1. Create the GitHub Actions Service Account

Skip if you already have one from the backend setup.

```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions" \
  --project=story-6f89f
```

### 2. Set Up Workload Identity Federation

Skip if already configured for the backend.

```bash
# Create the Workload Identity Pool
gcloud iam workload-identity-pools create github-pool \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  --project=story-6f89f

# Create the OIDC Provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='Khaled2049/novelsync-frontend'" \
  --project=story-6f89f
```

If you already have a WIF pool from the backend, just add the frontend repo binding:

```bash
PROJECT_NUMBER=$(gcloud projects describe story-6f89f --format="value(projectNumber)")

gcloud iam service-accounts add-iam-policy-binding \
  github-actions@story-6f89f.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/Khaled2049/novelsync-frontend" \
  --project=story-6f89f
```

### 3. Create GCS Bucket for Terraform State

```bash
gcloud storage buckets create gs://story-6f89f-terraform-state \
  --project=story-6f89f \
  --location=us-central1 \
  --uniform-bucket-level-access

gcloud storage buckets update gs://story-6f89f-terraform-state \
  --versioning

gcloud storage buckets add-iam-policy-binding gs://story-6f89f-terraform-state \
  --member="serviceAccount:github-actions@story-6f89f.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### 4. Add GitHub Repository Secrets

Go to Settings > Secrets and variables > Actions and add:

**WIF Configuration:**

| Secret | Value |
|--------|-------|
| `WIF_PROVIDER` | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `WIF_SERVICE_ACCOUNT` | `github-actions@story-6f89f.iam.gserviceaccount.com` |

**Runtime Secrets** (synced to GCP Secret Manager by the workflow):

| Secret | Value |
|--------|-------|
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `EMAIL_FROM` | Sender email address |
| `MAGIC_LINK_REDIRECT_URL` | `https://story-6f89f.web.app` |
| `REPLICATE_API_TOKEN` | Replicate API token |

**Build-time Secrets** (injected as env vars during `yarn build`):

| Secret | Value |
|--------|-------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `story-6f89f.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `story-6f89f` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `story-6f89f.appspot.com` |
| `VITE_FIREBASE_MESSAGE_SENDER_ID` | Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Measurement ID |
| `VITE_THIRDWEB_CLIENT_ID` | Thirdweb client ID |
| `VITE_USDC_TOKEN_ADDRESS` | USDC token address |
| `VITE_TIPPING_CONTRACT_ADDRESS` | Tipping contract address |
| `VITE_CHAIN_ID` | Chain ID |
| `VITE_MAX_AI_USAGE` | Max AI usage |
| `VITE_APP_NAME` | App display name |

### 5. Test Terraform Locally

```bash
cd terraform
terraform init
terraform plan
```

Expected output: 7 API resources, 5 secrets (4 imported + 1 created), 6 IAM bindings, 5 project IAM members, 1 Cloud Run data source.

**Note:** The `novelsync-agents` Cloud Run service must be deployed before running Terraform, since `main.tf` reads it as a data source.

## Deploy Workflow

Triggered on push to `main` or manual dispatch. Three parallel/sequential jobs:

```
push to main
    |
    |--- terraform-apply (Terraform init/plan/apply, sync secrets)
    |--- build (yarn install, yarn build, upload artifact)
    |
    |--- deploy (needs both above: download artifact, firebase deploy, health check)
```

The workflow has concurrency control (`deploy-production` group) to prevent parallel deploys from racing on Terraform state.

## Secret Management

Secrets are managed in two layers:

1. **GitHub Secrets** - source of truth for secret values
2. **GCP Secret Manager** - runtime access for Cloud Functions

The workflow syncs GitHub secrets to GCP on each deploy, only adding a new version if the value changed. Old versions are destroyed to stay within the free tier (6 active versions).

Terraform creates the secret shells. Existing secrets (SMTP_USER, SMTP_PASS, EMAIL_FROM, MAGIC_LINK_REDIRECT_URL) are imported via `import` blocks in `secrets.tf`. New secrets (REPLICATE_API_TOKEN) are created by Terraform.

To add a new secret:
1. Add the name to `secret_names` in `terraform/variables.tf`
2. Add import block in `secrets.tf` if it already exists in GCP
3. Add `sync_secret` and `cleanup_secret` lines in `deploy.yml`
4. Add the GitHub repo secret

## IAM

### GitHub Actions Service Account

| Role | Purpose | Scope |
|------|---------|-------|
| `roles/firebase.admin` | Deploy hosting, functions, rules | Project |
| `roles/cloudfunctions.developer` | Deploy cloud functions | Project |
| `roles/secretmanager.secretVersionAdder` | Add new secret versions | Project |
| `roles/secretmanager.secretAccessor` | Read secrets for sync verification | Project |
| `roles/storage.objectAdmin` | Manage Terraform state | GCS bucket only |

### App Engine Default SA (Cloud Functions runtime)

| Role | Purpose | Scope |
|------|---------|-------|
| `roles/secretmanager.secretAccessor` | Read secrets at runtime | Per-secret |
| `roles/run.invoker` | Call Cloud Run backend | Backend service |

## Troubleshooting

### `Failed to configure the "gcs" backend`

GCS bucket doesn't exist or SA lacks access. See step 3 above.

### `Cloud Run service not found`

The `novelsync-agents` backend must be deployed before this Terraform can run.

### `Permission denied while calling Storage API`

```bash
gcloud storage buckets add-iam-policy-binding gs://story-6f89f-terraform-state \
  --member="serviceAccount:github-actions@story-6f89f.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### Functions can't access secrets

```bash
gcloud secrets get-iam-policy REPLICATE_API_TOKEN --project=story-6f89f
```

Verify the App Engine SA has `secretAccessor` on the secret.

### Functions can't invoke Cloud Run backend

```bash
gcloud run services get-iam-policy novelsync-agents --region=us-central1 --project=story-6f89f
```

Verify the App Engine SA has `run.invoker` on the service.

## Verification

```bash
# Check APIs
gcloud services list --enabled --project=story-6f89f | grep -E "firebase|functions|firestore|secretmanager"

# Check secrets
gcloud secrets list --project=story-6f89f

# Check GitHub Actions SA IAM
gcloud projects get-iam-policy story-6f89f \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions@*"

# Check frontend
curl -I https://story-6f89f.web.app

# Check function logs
gcloud functions logs read --project=story-6f89f --limit=20

# Check workflow runs
gh run list --repo Khaled2049/novelsync-frontend --limit 10
```

## Rollback

### Revert deployment

```bash
git revert HEAD
# Push triggers a new deploy with the reverted code
```

### Manual deploy

```bash
yarn build && firebase deploy --project=story-6f89f
```

### Destroy Terraform resources

```bash
cd terraform
terraform plan -destroy
terraform destroy
```
