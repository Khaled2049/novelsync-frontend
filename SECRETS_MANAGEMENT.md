# Secrets Management Guide

This document explains how to properly manage secrets and environment variables in the NovelSync project, following security best practices.

## ⚠️ Critical Security Principle

**NEVER expose sensitive API keys or secrets in client-side code (VITE_ variables).** All `VITE_*` variables are bundled into the client JavaScript and are visible to anyone who inspects the bundle.

## Understanding Environment Variables

### Client-Side Variables (VITE_*)

**These are bundled into the client JavaScript and are PUBLICLY VISIBLE.**

- ✅ **Safe to expose**: Firebase public config (API keys, project IDs, etc.)
- ❌ **NEVER expose**: API keys, service account keys, database credentials, or any sensitive data

**Firebase Configuration:**
Firebase is designed to work client-side. These values are safe to expose:
- `VITE_FIREBASE_API_KEY` - Firebase API key (public, designed for client use)
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase Auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGE_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase Analytics measurement ID

**Other Safe Client Config:**
- `VITE_FIREBASE_FUNCTIONS_REGION` - Firebase Functions region (public info)
- `VITE_FIREBASE_PROJECT_ID` - Project ID (public info)
- `VITE_TIPPING_CONTRACT_ADDRESS` - Smart contract address (public on blockchain)
- `VITE_USDC_TOKEN_ADDRESS` - Token contract address (public on blockchain)
- `VITE_CHAIN_ID` - Blockchain network ID (public info)
- `VITE_THIRDWEB_CLIENT_ID` - ThirdWeb client ID (public, designed for client use)
- `VITE_MAX_AI_USAGE` - Application configuration (not sensitive)

### Server-Side Variables (process.env)

**These are only accessible in server-side code (Firebase Functions, Cloud Run).**

- ✅ **Must be secrets**: API keys, service account keys, database credentials
- ✅ **Can be config**: Non-sensitive configuration values

## GitHub Secrets vs Variables

### GitHub Secrets (Repository Secrets)

**Use for sensitive data that should never be exposed:**

1. **FIREBASE_SERVICE_ACCOUNT_NOVELSYNC_F82EC**
   - Firebase service account JSON
   - Used for Firebase Hosting and Functions deployment
   - **Location**: GitHub Secrets → Actions

2. **GCP_SA_KEY**
   - Google Cloud Service Account JSON
   - Used for Cloud Run and Firebase Functions deployment
   - **Location**: GitHub Secrets → Actions

3. **GOOGLE_AI_STUDIO_API_KEY**
   - Google AI Studio API key
   - Used by Python agents (server-side only)
   - **Location**: GitHub Secrets → Actions
   - **Also set in**: Cloud Run environment variables

4. **BOOKS_API_KEY** ⚠️ **CRITICAL CHANGE**
   - Google Books API key
   - **MUST be server-side only** (Firebase Functions)
   - **Location**: GitHub Secrets → Actions
   - **Also set in**: Firebase Functions environment variables
   - **DO NOT** expose in client bundle

5. **Firebase Client Config** (for build-time injection)
   - `FIREBASE_API_KEY` - Used during build, injected as `VITE_FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN` - Used during build, injected as `VITE_FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID` - Used during build, injected as `VITE_FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET` - Used during build, injected as `VITE_FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGE_SENDER_ID` - Used during build, injected as `VITE_FIREBASE_MESSAGE_SENDER_ID`
   - `FIREBASE_APP_ID` - Used during build, injected as `VITE_FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID` - Used during build, injected as `VITE_FIREBASE_MEASUREMENT_ID`
   - **Location**: GitHub Secrets → Actions
   - **Note**: These are safe to expose in client bundle (Firebase design), but stored as secrets for build-time injection

### GitHub Variables (Repository Variables)

**Use for non-sensitive configuration that can be visible in workflow logs:**

Currently, all configuration is stored as secrets. If you have non-sensitive values that don't need to be hidden, you can use Variables instead.

**Example use cases for Variables:**
- Default region names
- Default timeout values
- Feature flags (if not sensitive)

## Local Development (.env files)

### Root `.env` (Frontend)

Create `.env` in the project root for local frontend development:

```bash
# Firebase Configuration (safe to expose in client)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGE_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Functions Configuration
VITE_FIREBASE_FUNCTIONS_REGION=us-central1

# Blockchain Configuration (public addresses)
TIPPING_CONTRACT_ADDRESS=0x...
USDC_TOKEN_ADDRESS=0x...
CHAIN_ID=11155111
THIRDWEB_CLIENT_ID=your-thirdweb-client-id

# Application Configuration
MAX_AI_USAGE=10
```

**⚠️ Important**: Never commit `.env` files to git. They are already in `.gitignore`.

### `functions/.env` (Firebase Functions)

For Firebase Functions local development, set environment variables:

```bash
# Books API Key (server-side only)
BOOKS_API_KEY=your-books-api-key

# Agent Service URL (for local development)
AGENT_SERVICE_URL=http://localhost:8000

# Firebase Emulator (optional)
FUNCTIONS_EMULATOR=true
```

**Note**: Firebase Functions can also use `firebase functions:config:set` for production:
```bash
firebase functions:config:set books_api.key="your-key"
```

### `python/.env` (Python Agents)

For Python agents local development:

```bash
# Google Cloud Project
GOOGLE_CLOUD_PROJECT=your-project-id

# Google AI Studio API Key (server-side only)
GOOGLE_AI_STUDIO_API_KEY=your-api-key

# AI Model Configuration
GOOGLE_AI_STUDIO_MODEL=gemini-2.0-flash-exp

# Firebase Emulators (for local development)
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

# Agent Server Port
PORT=8000

# Optional: Use Ollama for local AI
USE_OLLAMA=false
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Optional: Use mock mode
USE_MOCK=false
```

## Environment Variable Flow

### Frontend Build (GitHub Actions)

```
GitHub Secrets (FIREBASE_API_KEY, etc.)
    ↓
GitHub Actions Workflow (env: VITE_FIREBASE_API_KEY)
    ↓
Vite Build Process
    ↓
Client Bundle (publicly visible)
```

**Important**: Only Firebase config and other safe values should follow this path.

### Backend Services

```
GitHub Secrets (GOOGLE_AI_STUDIO_API_KEY, BOOKS_API_KEY)
    ↓
GitHub Actions Workflow
    ↓
Cloud Run / Firebase Functions Environment Variables
    ↓
Server-Side Code Only (never exposed to client)
```

## Security Checklist

- [x] ✅ `BOOKS_API_KEY` moved to backend proxy (Firebase Functions)
- [x] ✅ Frontend uses backend proxy instead of direct API calls
- [x] ✅ All Firebase config uses `VITE_` prefix consistently
- [x] ✅ GitHub workflows use `VITE_` prefix for client variables
- [x] ✅ `GOOGLE_AI_STUDIO_API_KEY` only used server-side (Cloud Run)
- [x] ✅ Service account keys only in GitHub Secrets
- [ ] ⚠️ Verify no other API keys are exposed in client code
- [ ] ⚠️ Review all `import.meta.env` usage for sensitive data

## Common Mistakes to Avoid

### ❌ DON'T: Expose API Keys in VITE_ Variables

```typescript
// ❌ BAD - API key exposed in client bundle
const apiKey = import.meta.env.VITE_BOOKS_API_KEY;
```

### ✅ DO: Use Backend Proxy

```typescript
// ✅ GOOD - API key stays on server
const response = await axiosInstance.get("/searchBooks", { params: { q: query } });
```

### ❌ DON'T: Store Secrets in Client Code

```typescript
// ❌ BAD - Hardcoded secret
const SECRET_KEY = "sk-1234567890abcdef";
```

### ✅ DO: Use Environment Variables (Server-Side)

```typescript
// ✅ GOOD - Server-side only
const apiKey = process.env.BOOKS_API_KEY;
```

## Migration Guide

If you have existing code exposing secrets:

1. **Identify exposed secrets**: Search for `import.meta.env` usage
2. **Create backend proxy**: Move API calls to Firebase Functions
3. **Update frontend**: Use backend proxy instead of direct API calls
4. **Remove VITE_ prefix**: Remove from client-side code
5. **Update workflows**: Ensure secrets are only used server-side
6. **Rotate keys**: If keys were exposed, rotate them immediately

## Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Functions Environment Variables](https://firebase.google.com/docs/functions/config-env)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)

## Questions?

If you're unsure whether a value should be exposed:
1. **Can it be used maliciously?** → Keep it secret
2. **Is it designed for client-side use?** (like Firebase config) → Safe to expose
3. **Is it public information?** (like contract addresses) → Safe to expose
4. **When in doubt, keep it secret** → Use a backend proxy
