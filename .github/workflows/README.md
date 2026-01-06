# GitHub Actions Workflows

This directory contains CI/CD workflows for the NovelSync project.

## Workflows

### `firebase-functions.yml`
Deploys Firebase Functions when changes are detected in the `functions/` directory.

**When it runs:**
- Push to `main` or `develop` branches
- Changes in `functions/**` directory
- Changes to `.github/workflows/firebase-functions.yml` or `firebase.json`
- Manual trigger via workflow_dispatch

**What it does:**
1. Checks out code
2. Sets up Node.js 22 with npm cache
3. Installs dependencies using `npm ci`
4. Runs linter (continues on error)
5. Builds functions using `npm run build`
6. Verifies build output exists
7. Sets up Firebase CLI
8. Sets up Google Cloud SDK
9. Authenticates using `google-github-actions/auth@v2` with `GCP_SA_KEY`
10. Deploys to Firebase Functions

**Required Secrets:**
- `GCP_SA_KEY` - Google Cloud service account JSON with Firebase Functions Admin role

**Authentication:**
- Uses `google-github-actions/auth@v2` with Google Cloud service account (not FIREBASE_TOKEN)
- Requires `id-token: write` permission for Workload Identity Federation

### `cloud-run-agents.yml`
Builds and deploys Python agents to Google Cloud Run.

**When it runs:**
- Push to `main` or `develop` branches
- Changes in `python/agents/` or `python/Dockerfile`
- Manual trigger via workflow_dispatch

**What it does:**
1. Checks out code
2. Sets up Python 3.11
3. Authenticates to Google Cloud
4. Builds Docker image
5. Pushes to Container Registry
6. Deploys to Cloud Run with environment variables

**Required Secrets:**
- `GCP_SA_KEY` - Google Cloud service account JSON
- `GOOGLE_AI_STUDIO_API_KEY` - Google AI Studio API key

### `ci.yml`
Runs linting and code quality checks on pull requests.

**When it runs:**
- Pull requests to `main` or `develop`
- Push to `main` or `develop` branches

**What it does:**
1. Lints Firebase Functions (TypeScript/ESLint)
2. Lints Python agents (flake8, black)

### `firebase-hosting-merge.yml` (existing)
Deploys frontend to Firebase Hosting on merge to main.

### `firebase-hosting-pull-request.yml` (existing)
Creates preview deployments for pull requests.

## Setting Up Secrets

See `DEPLOYMENT.md` for detailed instructions on setting up GitHub secrets.

## Troubleshooting

### Workflow fails at authentication
- Verify secrets are set correctly in GitHub repository settings
- Check that service account has required permissions

### Build fails
- Check logs in the Actions tab
- Verify dependencies are up to date
- Check for syntax errors in code

### Deployment fails
- Verify Firebase/Google Cloud project IDs match
- Check service account permissions
- Review deployment logs

