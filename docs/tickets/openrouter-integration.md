# Integrate OpenRouter for platform (non-BYOK) AI usage

## Context

NovelSync currently supports AI features (chat, brainstorm, text enhancement,
chapter generation, etc.) through two paths:

- **BYOK (bring your own key)**: users store an encrypted API key
  (`users/{uid}.aiSettings`) for one of `gemini` | `claude` | `openai`.
  `checkAiAccess` (`functions/src/aiSettings.ts:237`) detects this and always
  allows the call, bypassing quota.
- **Platform quota**: when no BYOK key exists, `checkAiAccess` falls through
  to `consumePlatformDailyQuota` (aiSettings.ts:265), a transactional daily
  counter (`aiUsage` / `lastAiUsageDate`, limit = `MAX_AI_USAGE`, default 100/day).

In both cases, `checkAiAccess` returns a `ProviderConfig` object
(`{provider, api_key, model}`) that gets forwarded as-is to an external
Python agent service via `callAgentWithRetry`
(`functions/src/agentService.ts:76`, `POST ${AGENT_SERVICE_URL}/agent/execute`).
That service (repo: `novelsync-agents`) is where the actual
provider SDK calls happen — this repo never talks to OpenAI/Anthropic/Gemini
directly (the one exception is `generateCoverImage.ts`, which calls Replicate
directly for cover art and is unrelated to this ticket).

Today, platform (non-BYOK) users implicitly get whatever model the agent
service defaults to — there's no admin-controlled way to choose or change it
without touching agent-side code paths per provider.

## Goal

Route platform (non-BYOK) AI calls through OpenRouter instead of a
hardcoded single provider, so that:

- A single `OPENROUTER_API_KEY` replaces the need to provision/maintain
  separate provider keys for platform-paid usage.
- The **admin** (not the end user) controls which model powers platform
  usage, via a static config value that's edited and redeployed — no
  runtime/user-facing model picker, no Firestore-backed toggle, no admin UI.
- Swapping the platform model (e.g. `anthropic/claude-3.5-haiku` →
  `google/gemini-flash-1.5`) is a one-line config change + redeploy, not a
  new integration.

## Cost Considerations

OpenRouter charges a markup (~5%) on top of the underlying provider's raw
per-token price. The savings this ticket enables come from **being able to
pick a cheaper model** for platform usage, not from OpenRouter itself — if
the admin-configured model matches whatever's used today, routing it
through OpenRouter is a small net cost increase, not a decrease. Model
choice should be made with this markup in mind (e.g. weigh a cheaper
raw-price model against a more expensive one that's already markup-free
via a direct integration).

## Non-Goals

- **No frontend changes.** Free users don't see or choose a model; the
  frontend already doesn't pass `model` on platform-tier AI calls
  (`src/api/ai.ts`) and that stays true.
- **No changes to the BYOK path.** `getUserAiSettings` / `checkAiAccess`'s
  BYOK branch (aiSettings.ts:102-125, :240-241) is unaffected — BYOK users
  keep hitting their own provider directly, at their own cost, with no
  OpenRouter markup.
- No per-user or per-request model selection for platform users (that's a
  possible future iteration, not in scope here).
- No changes to quota logic (`consumeDailyBudget` / `MAX_AI_USAGE`) — it
  still gates by call count before a `ProviderConfig` is even built.

## Proposed Approach

1. Add `OPENROUTER_API_KEY` as a Firebase secret (same pattern as the
   existing `REPLICATE_API_TOKEN` used in `generateCoverImage.ts`).
2. Add a static platform-model config, e.g. a `PLATFORM_MODEL` constant
   (`{ provider: "openrouter", model: "<openrouter-model-id>" }`) — likely
   in `functions/src/aiSettings.ts` or a new small config file next to it.
3. In `checkAiAccess`, on the non-BYOK branch, return that static
   `ProviderConfig` (with `api_key: OPENROUTER_API_KEY`) instead of leaving
   model resolution implicit — same shape already used by the BYOK branch,
   so `agentService.ts` doesn't need to change on this side.
4. In `novelsync-agents` (separate repo): add an `"openrouter"` branch to
   whatever does provider dispatch — set `base_url` to
   `https://openrouter.ai/api/v1` and use an OpenAI-compatible client
   (OpenRouter mirrors the OpenAI chat-completions schema), which may let
   this collapse with the existing `"openai"` branch rather than being
   fully separate.

## Acceptance Criteria

- [ ] Non-BYOK users' AI calls are served via OpenRouter using the
      admin-configured model, with zero visible change to the frontend.
- [ ] BYOK users are unaffected — same behavior, same direct-to-provider
      routing, no OpenRouter involvement.
- [ ] Changing the platform model is a single constant edit + redeploy,
      no schema/DB migration.
- [ ] Existing quota enforcement (`MAX_AI_USAGE`) still applies unchanged
      to platform users before an OpenRouter call is made.

## Open Questions

- Does `novelsync-agents` already have a generic "OpenAI-compatible client"
  path that OpenRouter can reuse, or does provider dispatch need a new
  branch from scratch?
- Any need to track OpenRouter's per-request cost/usage data (it exposes
  this) for future cost reconciliation, or is call-count quota sufficient
  for now?
