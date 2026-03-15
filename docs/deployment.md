# Deployment

`novelsync-frontend` deploys through a single GitHub Actions workflow at `.github/workflows/deploy.yml`.

## What the workflow deploys

On push to `main` or manual dispatch, the workflow:

1. runs Terraform from `terraform/`
2. syncs runtime secrets into GCP Secret Manager
3. builds the Vite frontend with build-time `VITE_*` secrets
4. downloads the built `dist/`
5. writes `functions/.env` with `AGENT_SERVICE_URL`
6. deploys:
   - Firebase Hosting
   - Cloud Functions
   - Firestore rules
   - Firestore indexes
   - Storage rules
7. verifies the hosting URL

## Infra split

- Terraform manages infra and secret wiring under `terraform/`
- Firebase CLI handles hosting, functions, rules, and indexes

## Required GitHub secrets

### WIF and GCP

- `WIF_PROVIDER`
- `WIF_SERVICE_ACCOUNT`

### Runtime secrets synced to Secret Manager

- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `MAGIC_LINK_REDIRECT_URL`
- `REPLICATE_API_TOKEN`

### Build-time frontend secrets

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGE_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_RPC_URL`
- `VITE_USDC_TOKEN_ADDRESS`
- `VITE_TIPPING_CONTRACT_ADDRESS`
- `VITE_CHAIN_ID`
- `VITE_MAX_AI_USAGE`
- `VITE_APP_NAME`

## Local manual deploy

```bash
yarn build
firebase deploy --only hosting,functions,firestore:rules,firestore:indexes,storage --project=story-6f89f
```

## Terraform

Useful local commands:

```bash
cd terraform
terraform init
terraform plan
```

The workflow expects a GCS-backed Terraform state and uses Workload Identity Federation for keyless auth.
