# Deployment Setup

This guide covers how to deploy ScribeOS to Firebase Hosting using GitHub Actions CI/CD.

## Overview

The CI/CD pipeline has two deployment paths:

- **Pull requests** — deploys to a temporary Firebase preview channel and posts the preview URL as a PR comment
- **Push to `main`** — deploys to production (Firebase Hosting + Cloud Functions)

---

## Prerequisites

- A Firebase project (this repo is configured for `story-6f89f`; see **Using a different Firebase project** below if yours is different)
- The [Firebase CLI](https://firebase.google.com/docs/cli) installed locally
- A GitHub repository with admin access to configure secrets

---

## Step 1: Create a Firebase Service Account

The GitHub Actions workflow authenticates with Firebase using a service account key.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts) and select your Firebase project (same ID as in `.firebaserc`).

2. Click **Create Service Account**.
   - Name: `github-actions-deploy`
   - Roles (add all five):
     - **Firebase Hosting Admin** (`roles/firebasehosting.admin`) — for hosting deploys
     - **Cloud Functions Admin** (`roles/cloudfunctions.admin`) — for Functions deploys (or **Cloud Functions Developer** `roles/cloudfunctions.developer` if you prefer least privilege)
     - **Service Account User** (`roles/iam.serviceAccountUser`) — required so the deployer can “act as” the App Engine default service account when deploying Functions (avoids `Missing permissions ... iam.serviceAccounts.ActAs`).
     - **Firebase Extensions API** access — the CLI calls the Extensions API during deploy; without it you get `403 ... firebaseextensions.googleapis.com`. Grant **Firebase Extensions Developer** (`roles/firebaseextensions.developer`) on the project, or ensure the **Firebase Admin** role is present so the deploy can list extension instances.
     - **Secret Manager Secret Accessor** (`roles/secretmanager.secretAccessor`) — required so deploy can read secrets (e.g. `SMTP_PASS`) that your Functions use via `defineSecret()`. Grant this on the project, or per secret (see **Setting up SMTP_PASS** below).

3. **Grant the new account permission to use the App Engine default SA** (required for Functions deploy):
   - Go to [IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts) and open the **App Engine default service account** (e.g. `story-6f89f@appspot.gserviceaccount.com`).
   - Open the **Permissions** tab → **Grant access**.
   - Add principal: `github-actions-deploy@<your-project-id>.iam.gserviceaccount.com`.
   - Role: **Service Account User**.
   - Save.

4. On the **github-actions-deploy** service account, go to its **Keys** tab.

5. Click **Add Key > Create new key > JSON**.

6. Download the JSON key file. You will paste its entire contents into a GitHub secret in the next step.

> **Alternative:** You can run `firebase init hosting:github` in this repo and it will automatically create a service account and configure the GitHub secrets for you. This is the easiest approach if you have both the Firebase CLI and `gh` CLI installed.

---

## Step 2: Add GitHub Secrets

Go to your GitHub repository: **Settings > Secrets and variables > Actions > New repository secret**.

Add the following secrets:

### Required

| Secret | Description |
|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_STORY_6F89F` | The entire JSON content of the service account key file from Step 1. (If you used `firebase init hosting:github`, the CLI creates a secret named after your project, e.g. `FIREBASE_SERVICE_ACCOUNT_<PROJECT_ID>` in uppercase with hyphens.) |

### Environment Variables (Vite)

These are injected at build time so the frontend can connect to Firebase and other services:

| Secret | Description |
|--------|-------------|
| `VITE_APP_NAME` | Application name (e.g. `ScribeOS`) |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGE_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID |
| `VITE_THIRDWEB_CLIENT_ID` | Thirdweb client ID for wallet connection |
| `VITE_USDC_TOKEN_ADDRESS` | USDC token contract address |
| `VITE_TIPPING_CONTRACT_ADDRESS` | Tipping contract address |
| `VITE_CHAIN_ID` | Blockchain chain ID (e.g. `84532` for Base Sepolia) |
| `VITE_MAX_AI_USAGE` | Max AI usage quota (e.g. `1000`) |

You can find these values in your local `.env` file (or in Firebase Console → Project settings → Your apps for the Firebase config).

---

## Using a different Firebase project

If you use a **different** Firebase project (not `story-6f89f`), update:

1. **`.firebaserc`** — set `projects.default` to your project ID.
2. **`.github/workflows/firebase-hosting-merge.yml`** and **`.github/workflows/firebase-hosting-pull-request.yml`** — set `projectId` and the `firebaseServiceAccount` secret name (e.g. `FIREBASE_SERVICE_ACCOUNT_<YOUR_PROJECT_ID>` in uppercase with hyphens).
3. **Step 1** — create the service account in that project in Google Cloud Console.
4. **Step 2** — use config from that project for all `VITE_*` and the Firebase service account secret.

---

## Step 3: Verify the Workflow

Workflow files are `.github/workflows/firebase-hosting-merge.yml` (production) and `.github/workflows/firebase-hosting-pull-request.yml` (preview). Once secrets are configured:

1. Push a commit to `main` — triggers a production deploy.
2. Open a pull request against `main` — triggers a preview deploy with a comment containing the preview URL.

You can monitor workflow runs at: `https://github.com/<your-org>/novelsync-frontend/actions`

---

## Setting up SMTP_PASS (invite emails)

The invite Cloud Function uses `defineSecret("SMTP_PASS")` for the SMTP password. You must create this secret in Google Cloud and grant access to both the **deploy** and **runtime** service accounts, or you get `403 ... secretmanager.secrets.get denied`.

### 1. Create the secret

1. Open [Secret Manager](https://console.cloud.google.com/security/secret-manager) and select project **story-6f89f** (or your project).
2. Click **Create secret**.
3. **Name:** `SMTP_PASS` (exactly — the code expects this id).
4. **Secret value:** your SMTP password (e.g. Gmail app password).
5. Create the secret.

Or with gcloud (replace `YOUR_SMTP_PASSWORD` with the real value):

```bash
echo -n "YOUR_SMTP_PASSWORD" | gcloud secrets create SMTP_PASS --data-file=- --project=story-6f89f
```

### 2. Grant the deploy service account access

So `firebase deploy --only functions` can read the secret when wiring the function:

- **Option A (project-level):** In [IAM](https://console.cloud.google.com/iam-admin/iam), add role **Secret Manager Secret Accessor** to `github-actions-deploy@<project-id>.iam.gserviceaccount.com`.
- **Option B (per secret):** In Secret Manager → open secret **SMTP_PASS** → **Permissions** → **Grant access** → add principal `github-actions-deploy@<project-id>.iam.gserviceaccount.com` with role **Secret Manager Secret Accessor**.

### 3. Grant the runtime service account access

The function runs as the App Engine default service account. It needs read access to the secret at runtime:

1. In [Secret Manager](https://console.cloud.google.com/security/secret-manager), open the secret **SMTP_PASS**.
2. **Permissions** → **Grant access**.
3. Principal: `story-6f89f@appspot.gserviceaccount.com` (or your project’s App Engine default SA).
4. Role: **Secret Manager Secret Accessor**.
5. Save.

After this, deploy (and runtime) can access `SMTP_PASS`. Set the other invite config (e.g. `SMTP_HOST`, `SMTP_USER`, `EMAIL_FROM`, `MAGIC_LINK_REDIRECT_URL`) in Firebase Console → Functions → your function → Configuration (or via env/config).

---

## Manual Deployment

If you need to deploy without CI/CD:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Authenticate
firebase login

# Build the app
yarn build

# Deploy hosting only
firebase deploy --only hosting

# Deploy everything (hosting + Firestore rules + Storage rules + Functions)
firebase deploy
```

---

## Deploying Firestore & Storage Rules

The merge workflow deploys **hosting** and **Cloud Functions** on push to `main`. It does **not** deploy Firestore or Storage rules (to avoid accidental rule changes in CI). To deploy those manually:

```bash
# Firestore security rules
firebase deploy --only firestore:rules

# Storage security rules
firebase deploy --only storage:rules

# Cloud Functions
firebase deploy --only functions
```

To add Firestore/Storage rules to CI/CD, give the service account **Cloud Datastore User** and **Storage Admin** and add a step like `firebase deploy --only firestore:rules` / `--only storage:rules`.

---

## Project Configuration Reference

| File | Purpose |
|------|---------|
| `firebase.json` | Firebase services config (hosting, Firestore, Storage, Functions, emulators) |
| `.firebaserc` | Maps the `default` alias to your Firebase project ID (e.g. `story-6f89f`) |
| `firestore.rules` | Firestore security rules |
| `storage.rules` | Firebase Storage security rules |
| `.github/workflows/firebase-hosting-merge.yml` | Production deploy on push to `main` (hosting + **Functions**) |
| `.github/workflows/firebase-hosting-pull-request.yml` | Preview deploy on pull requests (hosting only) |
| `functions/` | Cloud Functions source; built and deployed by the merge workflow via `firebase deploy --only functions` |
