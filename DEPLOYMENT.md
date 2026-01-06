# Deployment Guide

This guide explains how to set up CI/CD for NovelSync using GitHub Actions.

## Overview

The project consists of three main components:
1. **Frontend** - React app deployed to Firebase Hosting
2. **Firebase Functions** - TypeScript functions deployed to Firebase
3. **Python Agents** - FastAPI service deployed to Cloud Run

## Prerequisites

1. **GitHub Repository** with Actions enabled
2. **Firebase Project** (`novelsync-f82ec`)
3. **Google Cloud Project** (same as Firebase project) - Only needed for Firestore and Cloud Run
4. **Google AI Studio API Key** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **Note**: Vertex AI is **not required** - the service uses Google AI Studio REST API directly

## Required GitHub Secrets

**⚠️ Important**: See [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md) for detailed guidance on secret management and security best practices.

### Firebase Secrets
- `FIREBASE_SERVICE_ACCOUNT_NOVELSYNC_F82EC` - Firebase service account JSON (for Firebase Hosting and Functions)
- `BOOKS_API_KEY` - Google Books API key (⚠️ **Server-side only** - used in Firebase Functions, never exposed to client)

### Google Cloud Secrets
- `GCP_SA_KEY` - Google Cloud Service Account JSON with the following permissions:
  - **For Firebase Functions**: Firebase Functions Admin (or Cloud Functions Admin)
  - **For Cloud Run**: Cloud Run Admin, Service Account User, Storage Admin (for container registry)
  - Artifact Registry Admin (if using Artifact Registry)

### API Keys (Server-Side Only)
- `GOOGLE_AI_STUDIO_API_KEY` - Google AI Studio API key for AI generation tasks (used in Cloud Run, never exposed to client)

### Firebase Client Configuration (Build-Time Injection)
These are injected as `VITE_*` variables during build. They are safe to expose in the client bundle (Firebase design), but stored as secrets for build-time injection:
- `FIREBASE_API_KEY` - Firebase API key (injected as `VITE_FIREBASE_API_KEY`)
- `FIREBASE_AUTH_DOMAIN` - Firebase Auth domain (injected as `VITE_FIREBASE_AUTH_DOMAIN`)
- `FIREBASE_PROJECT_ID` - Firebase project ID (injected as `VITE_FIREBASE_PROJECT_ID`)
- `FIREBASE_STORAGE_BUCKET` - Firebase storage bucket (injected as `VITE_FIREBASE_STORAGE_BUCKET`)
- `FIREBASE_MESSAGE_SENDER_ID` - Firebase messaging sender ID (injected as `VITE_FIREBASE_MESSAGE_SENDER_ID`)
- `FIREBASE_APP_ID` - Firebase app ID (injected as `VITE_FIREBASE_APP_ID`)
- `FIREBASE_MEASUREMENT_ID` - Firebase Analytics measurement ID (injected as `VITE_FIREBASE_MEASUREMENT_ID`)


## Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each secret listed above

### Getting Firebase Service Account

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Generate service account key
firebase projects:list
# Select your project and get the service account email
# Then go to Google Cloud Console → IAM & Admin → Service Accounts
# Create or use existing service account and download JSON key
```

### Getting Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Create a new service account or use existing
4. Grant the following roles:
   - **Firebase Functions Admin** (or **Cloud Functions Admin**) - Required for Firebase Functions deployment
   - **Cloud Run Admin** - Required for Cloud Run deployment
   - **Service Account User** - Required for Cloud Run
   - **Storage Admin** - Required for container registry
5. Create a JSON key and download it
6. Add the entire JSON content as `GCP_SA_KEY` secret

**Note**: The same service account can be used for both Firebase Functions and Cloud Run deployments if it has all required roles.

## Workflow Files

### `.github/workflows/firebase-hosting-merge.yml`
Deploys frontend to Firebase Hosting when changes are pushed to `main` branch.

**Triggers:**
- Push to `main` branch

**Steps:**
1. Setup Node.js 22 with Yarn cache
2. Install dependencies using `yarn install --frozen-lockfile`
3. Build frontend using `yarn build`
4. Deploy to Firebase Hosting live channel

**Environment Variables:**
- Firebase client configuration is passed as `VITE_*` environment variables during build
- These are safe to expose in the client bundle (Firebase design)
- **Never** pass sensitive API keys as `VITE_*` variables

### `.github/workflows/firebase-hosting-pull-request.yml`
Creates preview deployments for pull requests.

**Triggers:**
- Pull requests (only for PRs from the same repository)

**Features:**
- Preview deployments expire after 7 days
- Uses concurrency group to cancel in-progress deployments
- Requires `checks: write` and `pull-requests: write` permissions

**Steps:**
1. Setup Node.js 22 with Yarn cache
2. Install dependencies using `yarn install --frozen-lockfile`
3. Build frontend using `yarn build`
4. Deploy preview to Firebase Hosting

### `.github/workflows/firebase-functions.yml`
Deploys Firebase Functions when changes are pushed to `main` or `develop` branches.

**Triggers:**
- Push to `main` or `develop` branches
- Changes in `functions/**` directory
- Changes to `.github/workflows/firebase-functions.yml`
- Changes to `firebase.json`
- Manual workflow dispatch

**Steps:**
1. Setup Node.js 22 with npm cache
2. Install dependencies using `npm ci`
3. Run linter (continues on error)
4. Build functions using `npm run build`
5. Verify build output exists
6. Setup Firebase CLI
7. Setup Google Cloud SDK
8. Authenticate using Google Cloud service account (`GCP_SA_KEY`)
9. Deploy to Firebase Functions with `--non-interactive` flag

**Authentication:**
- Uses `google-github-actions/auth@v2` with `GCP_SA_KEY` secret
- Service account needs Firebase Functions Admin role

### `.github/workflows/cloud-run-agents.yml`
Builds and deploys Python agents to Cloud Run.

**Triggers:**
- Push to `main` or `develop` branches
- Changes in `functions/agents/**` directory
- Changes to `functions/Dockerfile`
- Changes to `.github/workflows/cloud-run-agents.yml`
- Manual workflow dispatch

**Steps:**
1. Setup Python 3.11
2. Authenticate to Google Cloud using `google-github-actions/auth@v2`
3. Setup Cloud SDK using `google-github-actions/setup-gcloud@v2`
4. Configure Docker for Google Container Registry
5. Build and push Docker image using `gcloud builds submit`
6. Tag image as `latest`
7. Deploy to Cloud Run with environment variables and resource limits
8. Display service URL with instructions for updating Firebase Functions

**Cloud Run Configuration:**
- Memory: 1Gi
- CPU: 1
- Timeout: 540 seconds
- Max instances: 5
- Min instances: 0
- Region: us-central1

### `.github/workflows/ci.yml`
Runs linting and code quality checks on pull requests and pushes.

**Triggers:**
- Pull requests to `main` or `develop`
- Push to `main` or `develop` branches

**Steps:**
1. **Lint Firebase Functions:**
   - Setup Node.js 22 with npm cache
   - Install dependencies using `npm ci`
   - Run linter using `npm run lint`
   - Build functions using `npm run build`

2. **Lint Python Agents:**
   - Setup Python 3.11
   - Install dependencies (flake8, black, and requirements.txt)
   - Check code formatting with black (continues on error)
   - Lint with flake8 for specific error codes: E9, F63, F7, F82 (continues on error)

## Deployment Process

**Note**: Workflow files themselves are included in the path filters, so changes to workflow files will trigger their respective deployments. This allows you to update deployment configurations and test them immediately.

### Automatic Deployment

1. **Push to main branch**
   - Frontend: Automatically deployed via `firebase-hosting-merge.yml` (live channel)
   - Functions: Deployed via `firebase-functions.yml` (if `functions/**` changes)
   - Agents: Deployed via `cloud-run-agents.yml` (if `python/agents/**` or `python/Dockerfile` changes)
   - CI: Linting and tests run via `ci.yml`

2. **Push to develop branch**
   - Functions: Deployed via `firebase-functions.yml` (if `functions/**` changes)
   - Agents: Deployed via `cloud-run-agents.yml` (if `python/agents/**` or `python/Dockerfile` changes)
   - CI: Linting and tests run via `ci.yml`

3. **Pull Request**
   - Frontend: Preview deployment via `firebase-hosting-pull-request.yml` (expires in 7 days)
   - CI: Linting and tests run via `ci.yml`

### Manual Deployment

You can manually trigger deployments from the GitHub Actions tab:
1. Go to **Actions** tab in your repository
2. Select the workflow you want to run
3. Click **Run workflow**

## Environment Variables

### Cloud Run Service (Python Agents)

The following environment variables are set automatically during deployment:
- `GOOGLE_CLOUD_PROJECT` - Set to `novelsync-f82ec` (required for Firestore access)
- `GOOGLE_AI_STUDIO_API_KEY` - From GitHub secrets (`GOOGLE_AI_STUDIO_API_KEY`) - **Default AI provider**
- `GOOGLE_AI_STUDIO_MODEL` - Set to `gemini-2.0-flash-exp` (free tier, configurable)

**Note**: The service uses **Google AI Studio API** (REST API with API key) as the default AI provider. Vertex AI is **not required** and is not used in production.

**Resource Configuration:**
- Memory: 1Gi
- CPU: 1
- Timeout: 540 seconds (9 minutes)
- Max instances: 5
- Min instances: 0 (scales to zero when not in use)

### Firebase Functions

Set environment variables in Firebase Console:
1. Go to Firebase Console → Functions
2. Select your function
3. Go to **Configuration** → **Environment variables**
4. Add the following:
   - `AGENT_SERVICE_URL` - Cloud Run service URL (e.g., `https://story-agent-xxxxx.run.app`)
   - `BOOKS_API_KEY` - Google Books API key (⚠️ **Server-side only**, used by Books API proxy)

Or use Firebase CLI:
```bash
firebase functions:config:set agent_service.url="https://story-agent-xxxxx.run.app"
firebase functions:config:set books_api.key="your-books-api-key"
```

**⚠️ Security Note**: `BOOKS_API_KEY` must be set in Firebase Functions environment variables (server-side only). The frontend uses a backend proxy endpoint (`/searchBooks` and `/getBookDetails`) that protects the API key.

## Verifying Deployment

### Check Firebase Functions
```bash
firebase functions:list
firebase functions:log
```

### Check Cloud Run Service
```bash
gcloud run services list --region us-central1
gcloud run services describe story-agent --region us-central1
```

### Test Agent Service
```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe story-agent --region us-central1 --format 'value(status.url)')

# Test health endpoint
curl $SERVICE_URL/health
```

**Note**: After each Cloud Run deployment, the workflow automatically displays the service URL and provides instructions for updating the `AGENT_SERVICE_URL` in Firebase Functions. You can find this in the GitHub Actions workflow output.

## Troubleshooting

### Firebase Functions Deployment Fails
- Verify `GCP_SA_KEY` secret is valid JSON
- Check service account has Firebase Functions Admin (or Cloud Functions Admin) role
- Verify Firebase project ID matches (`novelsync-f82ec`)
- Check function build logs in GitHub Actions
- Ensure `id-token: write` permission is set in workflow (required for `google-github-actions/auth@v2`)

### Cloud Run Deployment Fails
- Verify `GCP_SA_KEY` secret is valid JSON
- Check service account has required permissions
- Verify Docker build completes successfully
- Check Cloud Run logs: `gcloud run services logs read story-agent --region us-central1`

### Agent Service Not Responding
- Verify `GOOGLE_AI_STUDIO_API_KEY` is set correctly in Cloud Run
- Check Cloud Run service is running: `gcloud run services list`
- Verify `AGENT_SERVICE_URL` is set in Firebase Functions (the workflow outputs the URL after deployment)
- Check agent service logs for errors: `gcloud run services logs read story-agent --region us-central1`
- Verify the service URL matches what's configured in Firebase Functions

## Using Google AI Studio API

The Python agents use **Google AI Studio API** as the default AI provider in production. This uses the REST API with API keys and does **not require Vertex AI**.

**Key Points:**
- ✅ **No Vertex AI needed** - Uses Google AI Studio REST API directly
- ✅ **No Vertex AI API enablement required** - Just need the API key
- ✅ **Simpler setup** - No GCP service account authentication needed for AI calls
- ✅ **Free tier available** - `gemini-2.0-flash-exp` model is free tier friendly

The service automatically uses Google AI Studio when `GOOGLE_AI_STUDIO_API_KEY` is set (which is the default in production).

## Local Development

For local development, see `functions/LOCAL_DEVELOPMENT.md`.

# Google AI Studio Model Selection Guide

## Free Tier Models

### Recommended: `gemini-2.0-flash-exp` (Experimental)
- **Free Tier**: Unlimited input/output tokens (within free tier limits)
- **Best for**: Most use cases, cost-effective
- **Status**: Experimental (may change)
- **Use case**: General AI generation tasks, story writing, brainstorming

### Alternative: `gemini-1.5-flash`
- **Free Tier**: Limited requests per minute (RPM)
- **Best for**: Production use when you need stable API
- **Status**: Stable
- **Use case**: When experimental models aren't suitable

## Paid Tier Models

### `gemini-1.5-pro`
- **Cost**: Higher than flash models
- **Best for**: Complex reasoning, longer context
- **Use case**: Advanced analysis, complex story generation

### `gemini-2.0-flash-thinking-exp`
- **Cost**: Higher than standard flash
- **Best for**: Tasks requiring reasoning
- **Use case**: Complex brainstorming, plot development

## Current Configuration

The project is configured to use **`gemini-2.0-flash-exp`** by default, which is optimal for staying within the free tier.

### To Change the Model

1. **In Cloud Run** (production):
   - Update the `GOOGLE_AI_STUDIO_MODEL` environment variable
   - Or modify `.github/workflows/cloud-run-agents.yml`

2. **In Local Development**:
   - Set environment variable: `export GOOGLE_AI_STUDIO_MODEL=gemini-1.5-flash`
   - Or update `.env` file in `functions/agents/storyAgent/`

3. **In Code**:
   - Default is set in `functions/agents/storyAgent/llm_provider.py`

## Free Tier Limits

As of 2024, Google AI Studio free tier includes:
- **Gemini 2.0 Flash-Lite**: Unlimited tokens (within reasonable usage)
- **Other models**: Rate limits apply (requests per minute)

**Important**: Always check the [official pricing page](https://ai.google.dev/pricing) for the most current limits and pricing.

## Monitoring Usage

To monitor your API usage:
1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Check your API usage dashboard
3. Set up billing alerts if needed

## Recommendations

- **For development/testing**: Use `gemini-2.0-flash-exp` (free tier)
- **For production**: Consider `gemini-1.5-flash` for stability, or `gemini-2.0-flash-exp` if you want to stay in free tier
- **For complex tasks**: Upgrade to `gemini-1.5-pro` if needed (paid)



## Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google AI Studio](https://makersuite.google.com/)

