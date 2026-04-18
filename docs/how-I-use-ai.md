# How NovelSync uses AI (keys, prod vs local, models)

This page describes how story AI, cover generation, and related APIs are wired across **novelsync-frontend** (Firebase Cloud Functions + Vite app) and **novelsync-agents** (Python FastAPI service on Cloud Run or localhost).

## Architecture: Functions do not call Gemini directly

For chat, brainstorm, text enhancement, chapter generation, and similar flows, **Cloud Functions proxy to the Python agent service**. They use `callAgent` / `callAgentWithRetry` in `functions/src/agentService.ts`.

- **`AGENT_SERVICE_URL`** — base URL of the agent service (`defineString`, default `http://localhost:8000`).
- **Production** — URL points at **Cloud Run**; Functions attach a **Google identity token** to authenticate with Cloud Run (skipped when the URL contains `localhost`).
- **Emulator / local** — `process.env.FUNCTIONS_EMULATOR === "true"`; same default `http://localhost:8000` if unset, no IAM token.

The **Google AI Studio API key and Gemini model name live in novelsync-agents**, not in the Functions bundle.

### Agent HTTP API

All agent calls go to a single endpoint:

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/agent/execute` | Run an agent action |
| `GET` | `/health` | Health check |

Request shape: `{ "action": "<ActionName>", "parameters": { … } }`.
Response shape: `{ "success": true/false, "data": …, "error": { "code", "message" } }`.

`callAgent` enforces a **300-second (5 min) abort timeout**. `callAgentWithRetry` wraps it with **3 attempts and exponential backoff** (1 s → 2 s → 4 s).

### Available actions

| Action | Description |
|--------|-------------|
| `generateStory` | Generate a full story (first chapter or all) |
| `generateChapter` | Generate a specific chapter |
| `brainstormIdeas` | Generate ideas for characters / plots / places / themes |
| `brainstormCharacter` | Generate a detailed character profile |
| `brainstormPlot` | Generate plot element suggestions |
| `generateNextLines` | Suggest 3 next-line continuations at cursor position |
| `chatWithContext` | Story-context RAG chat with conversation history |
| `enhanceText` | Rewrite selected text (`expand` / `dialogue` / `rewrite`) |
| `enhanceWizardInput` | Enhance creation wizard fields (`premise` / `character` / `place` / `conflict` / `blueprint`) |
| `generateStoryChoices` | Co-write: generate branching choices (`opening` / `continuation` / `ending`) |

## novelsync-agents: LLM provider and env vars

`agents/storyAgent/llm_provider.py` selects the provider via environment variables. **Priority order** (first match wins):

1. `USE_MOCK=true` → **MockProvider** (hardcoded responses, no API calls)
2. `USE_OLLAMA=true` → **OllamaProvider** (local LLM)
3. `GOOGLE_AI_STUDIO_API_KEY` set → **GoogleAIStudioProvider** (Gemini via REST)
4. *(fallback)* → **OllamaProvider** with defaults

| Variable | Role |
|----------|------|
| `USE_MOCK` | If `true`, use mock provider (no real AI calls — for testing). |
| `USE_OLLAMA` | If `true`, use Ollama instead of Google AI Studio. |
| `OLLAMA_BASE_URL` | Ollama API base URL (default `http://localhost:11434`). |
| `OLLAMA_MODEL` | Model name for Ollama (default `phi4-mini`). |
| `GOOGLE_AI_STUDIO_API_KEY` | If set (and Ollama/Mock not selected), uses **Google AI Studio** REST API (Gemini). |
| `GOOGLE_AI_STUDIO_MODEL` | Model id for Gemini (default `gemini-2.5-flash`). |

`server.py` loads `.env` from the agents repo root. Outside production (`ENVIRONMENT != "production"`), it defaults **`FIRESTORE_EMULATOR_HOST=localhost:8080`** when unset so local Firestore matches the Firebase emulator.

### Full environment variable reference (novelsync-agents)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CLOUD_PROJECT` | **Yes** | — | GCP project ID (required for Firestore access) |
| `GOOGLE_AI_STUDIO_API_KEY` | No* | — | Google AI Studio API key; *required in prod unless using Ollama |
| `GOOGLE_AI_STUDIO_MODEL` | No | `gemini-2.5-flash` | Gemini model name |
| `USE_MOCK` | No | `false` | Enable mock LLM provider |
| `USE_OLLAMA` | No | `false` | Enable Ollama provider |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` | Ollama API base URL |
| `OLLAMA_MODEL` | No | `phi4-mini` | Ollama model name |
| `ENVIRONMENT` | No | — | Set to `production` to disable emulator defaults and enable IAM |
| `FIRESTORE_EMULATOR_HOST` | No | `localhost:8080`† | Firestore emulator address (†auto-set in non-production) |
| `FIREBASE_AUTH_EMULATOR_HOST` | No | — | Auth emulator address |
| `ENABLE_LOCAL_IMAGE_GENERATION` | No | `true` | Load the local image-generation module; set `false` in production |
| `PORT` | No | `8000` | HTTP server port |

## Production

### Cloud Run (novelsync-agents)

- **`GOOGLE_AI_STUDIO_API_KEY`** — injected from **GCP Secret Manager** (see agents repo Terraform).
- **`GOOGLE_AI_STUDIO_MODEL`** — non-secret env on the service (Terraform variable `google_ai_studio_model`, default `gemini-2.5-flash`).
- **`ENVIRONMENT=production`** — disables emulator defaults and enables IAM auth.
- **`ENABLE_LOCAL_IMAGE_GENERATION=false`** — disables the optional local image-gen module (keeps the Docker image slim; uses Replicate instead).
- **Docker image** — always built for `linux/amd64` (avoids arch mismatch on Apple Silicon CI runners).

### Firebase Functions

- CI writes **`functions/.env`** with **`AGENT_SERVICE_URL=<Cloud Run URL>`** (Terraform output `backend_service_url`) before deploy.
- Functions call the agent over HTTPS and use **GoogleAuth** to obtain an **ID token** for Cloud Run when the URL is not localhost.

## Local development and emulator

1. **Run novelsync-agents** (e.g. `python server.py`, default port 8000).
2. Copy **`novelsync-agents/.env.example`** to **`.env`** and set **`GOOGLE_CLOUD_PROJECT`** and **`GOOGLE_AI_STUDIO_API_KEY`** (and optionally **`GOOGLE_AI_STUDIO_MODEL`**).
3. Start **Firebase emulators**; emulated Functions use **`AGENT_SERVICE_URL`** defaulting to **`http://localhost:8000`** unless you override it in **`functions/.env`**.

**Alternatives to Google AI Studio locally:**
- Set `USE_OLLAMA=true` + `OLLAMA_BASE_URL` / `OLLAMA_MODEL` to use a local model via Ollama.
- Set `USE_MOCK=true` to skip all AI calls (useful for UI/flow testing).

Root **`novelsync-frontend/.env`** is mainly **Vite** (`VITE_*`). The example file may list **`GOOGLE_AI_STUDIO_API_KEY`** as a reminder that the **Python service** needs that secret locally; it is not consumed by the React app for Gemini calls.

## Other AI-related integrations

| Feature | Where | Secrets / config |
|---------|--------|------------------|
| **Cover images** | `functions/src/generateCoverImage.ts` | **Replicate** — `REPLICATE_API_TOKEN` (Firebase `defineSecret`; synced via deploy workflow). Model name is chosen in that function (e.g. Flux). |
| **Books search** | `functions/src/booksApi.ts` | **`BOOKS_API_KEY`** in Functions environment. |
| **Local image generation** | `novelsync-agents/image-generation/` | Disabled in production via `ENABLE_LOCAL_IMAGE_GENERATION=false`; requires ML deps (`requirements.txt`, omitted in `requirements-prod.txt`). |

## Frontend usage and quotas

- **`VITE_MAX_AI_USAGE`** — client-side daily quota display / checks (`AiUsageContext`); actual enforcement for AI HTTP endpoints is in Functions (e.g. `aiUsageService.ts`).
- **Whisper / Transformers.js** in the browser — local models; not the same as server-side Gemini keys.

## Security best-practice audit

This section reviews what is in place and what gaps exist, based on the actual code.

### What is done well

| Practice | Evidence |
|----------|----------|
| **Secrets in Secret Manager** | `GOOGLE_AI_STUDIO_API_KEY` injected via GCP Secret Manager at Cloud Run runtime; `REPLICATE_API_TOKEN`, `SMTP_USER/PASS`, `EMAIL_FROM`, `MAGIC_LINK_REDIRECT_URL` all use Firebase `defineSecret` — never plain env vars. |
| **Firebase Auth verified server-side** | Every AI endpoint is wrapped with `requireAuth` or `requireStoryOwnership` from `authService.ts`, which calls `admin.auth().verifyIdToken()`. Client-side token checks are not relied upon. |
| **Horizontal privilege enforcement** | `requireStoryOwnership` fetches the story from Firestore and checks `storyData.userId === userId` before dispatching to the agent. A user cannot call AI actions on another user's story. |
| **Server-side quota enforcement** | `checkAndIncrementAiUsage` is called at the top of every AI Function before the agent call, and returns HTTP 429 when the limit is hit. The `VITE_MAX_AI_USAGE` client-side check is a UX convenience, not the gate. |
| **Functions CORS restricted** | `corsConfig.ts` allows only `https://story-6f89f.web.app` plus localhost — exact-match, no wildcards. |
| **Cloud Run auth via identity tokens** | Functions obtain a GCP identity token (via `GoogleAuth.getIdTokenClient`) and attach it as `Authorization: Bearer` to every Cloud Run request. Cloud Run itself requires a valid Google identity. |
| **Keyless CI/CD** | GitHub Actions uses Workload Identity Federation (OIDC). No service account JSON keys are stored in GitHub secrets or in the repo. |
| **Secrets never committed** | `.env` and `terraform.tfvars` are in `.gitignore`. `.env.example` contains only placeholder values. |

### Gaps and recommendations

#### 1. `BOOKS_API_KEY` stored as a plain environment variable — **low/medium risk**

`booksApi.ts` reads the key with `process.env.BOOKS_API_KEY`, meaning it is stored in Firebase Functions configuration (visible in the Firebase Console), not in Secret Manager.

**Fix:** Migrate to `defineSecret`:
```ts
// functions/src/booksApi.ts
import { defineSecret } from "firebase-functions/params";
const booksApiKey = defineSecret("BOOKS_API_KEY");
```
Then reference `booksApiKey.value()` inside the handler, and add it to the `secrets` array of the `onRequest` call. This moves it into Secret Manager alongside the other keys.

---

#### 2. Cloud Run CORS is `allow_origins=["*"]` — **accepted risk, worth documenting**

`server.py` sets `allow_origins=["*"]`. This is not a practical problem today because Cloud Run requires a valid Google identity token, so no browser ever talks directly to it. CORS headers are only meaningful to browsers, and no browser holds a Cloud Run identity token.

However, if the Cloud Run URL were ever made unauthenticated (e.g., for a public health-check endpoint), the wildcard would be a real gap.

**Recommendation:** Either tighten it to the Firebase Functions service account identity (not straightforward with CORS), or add a code comment explicitly documenting this trade-off so it is not accidentally removed. The current setup is safe as long as Cloud Run authentication remains required.

---

#### 3. `localhost` origins are always included in production CORS — **negligible risk**

`corsConfig.ts` always includes `http://localhost:5173` and `http://localhost:3000`, even in production. The comment correctly notes that auth is the real protection. CORS is a browser-only mechanism and does not protect against curl or server-to-server calls.

In practice this is fine, but for hygiene, you could condition it on `process.env.NODE_ENV`:
```ts
const allowedOrigins = process.env.NODE_ENV === "production"
  ? productionOrigins
  : [...productionOrigins, ...developmentOrigins];
```

---

#### 4. No server-side message length limit — **low risk, cost/availability concern**

`sendChatMessage.ts` validates that `message` is a non-empty string but does not enforce a maximum length. A valid authenticated user could send a very large message, which would: (a) be forwarded to the Python agent, (b) increase token costs, and (c) potentially cause a timeout if the model processes an unusually large context.

**Fix:** Add a max-length check after the existing validation:
```ts
if (message.length > 4000) {
  response.status(400).json({ error: "message must be 4000 characters or fewer" });
  return;
}
```

---

#### 5. Internal error details leaked in 500 responses — **low risk**

Several endpoints return `error instanceof Error ? error.message : String(error)` directly in the `details` field of HTTP 500 responses. In production this can expose internal implementation details (Firestore paths, agent service URLs, stack frames).

**Fix:** Log the full error server-side (already done) and return a generic message to the client:
```ts
details: "An unexpected error occurred. Please try again."
```

---

### Summary

| Item | Status |
|------|--------|
| Secrets in Secret Manager / defineSecret | ✅ Yes (except `BOOKS_API_KEY`) |
| Server-side Firebase Auth on all AI endpoints | ✅ Yes |
| Story ownership enforced server-side | ✅ Yes |
| AI quota enforced server-side (not just client) | ✅ Yes |
| Functions CORS restricted to known origins | ✅ Yes |
| Cloud Run protected by Google identity tokens | ✅ Yes |
| Keyless CI/CD (Workload Identity Federation) | ✅ Yes |
| `BOOKS_API_KEY` uses `defineSecret` | ❌ No — plain env var |
| Server-side message length limit | ❌ No |
| Internal errors not exposed to clients | ⚠️ Partial — details field leaks error messages |
| Cloud Run CORS locked down | ⚠️ Wildcard, safe only while IAM auth is required |

## Related repos

- **novelsync-agents** — `README.md`, `.env.example`, `AGENTS.md`, `terraform/`, `docs/deployment.md`.
- **novelsync-frontend** — `functions/src/agentService.ts`, `docs/deployment.md`, `.github/workflows/deploy.yml`.
