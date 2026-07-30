# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev              # Start Vite dev server
yarn build            # TypeScript check + Vite production build
yarn build:analyze    # Build with bundle analysis (opens stats.html)
yarn lint             # ESLint — fails on any warnings
yarn preview          # Preview production build locally
yarn start:emulator   # Start Firebase emulators (runs from functions/)
yarn kill-ports       # Kill ports used by Firebase emulators
```

There are no automated tests in this project.

## Path Aliases

`@/` maps to `./src/` (configured in both `vite.config.ts` and `tsconfig.json`). Always use `@/` for imports — never use deep relative paths like `../../../`.

## Architecture

### Stack
React 19 + TypeScript 5 + Vite 5. Firebase (Auth, Firestore, Functions, Storage) for backend. thirdweb/Wagmi for Ethereum wallet integration. TipTap for rich text editing. React Router v7 for routing.

### Entry Points
- `src/main.tsx` — Provider stack + all route definitions (code-split via `React.lazy`)
- `src/NavbarWrapper.tsx` — Layout shell wrapping all non-auth routes

### Provider Stack (outermost → innermost)
`SEOProvider` → `Web3Provider` (Wagmi + React Query) → `ThemeProvider` → `AuthProvider` → `AiUsageProvider` → `ChatProvider`

### Routing
All routes are defined in `src/main.tsx` using React Router v7. Every route is lazy-loaded. Key route groups:
- `/create/:storyId` — writing workspace (children: `/characters`, `/plot`, `/places`)
- `/story/:id` — public reader view
- `/user-stories` — author dashboard
- `/explore`, `/book-clubs`, `/library` — discovery

### Data Layer

**Cloud Functions API** (`src/api/index.ts`): Custom HTTP client that auto-attaches the Firebase Auth bearer token. Dev base URL points to local emulator (`localhost:5001`). Throws `ApiError` on failure.

**Firestore Services** (`src/services/`): All Firestore reads/writes go through service modules. Key ones:
- `StoriesRepo.ts` — story/chapter CRUD; enforces `WORD_LIMIT = 5000` and `CHAPTER_LIMIT = 50`
- `StorageService.ts` — Firebase Storage uploads (covers, images)
- `ImageGenerationService.ts` — triggers AI image gen via Cloud Function

**Custom Hooks** (`src/hooks/`): `useAutosave()` handles periodic draft saves to Firestore. `useEditorState()` manages TipTap state. Web3 hooks (`useEarnings`, `useTippingContract`, `useWalletState`, `useTokenBalance`) wrap Wagmi.

### Firebase
Config in `src/config/firebase.ts`. Set `VITE_USE_EMULATORS=true` (default in dev) to connect to local emulators:
- Auth: 9099, Firestore: 8080, Functions: 5001, Storage: 9199

Firestore subcollection pattern: `stories/{id}/chapters`, `stories/{id}/chats/{id}/messages`.

### AI Features
- **Chat**: Real-time Firestore subcollection + Cloud Function (`/sendChatMessage`) with story-context RAG
- **Brainstorm / Text Enhancement**: API calls to Cloud Functions
- **Daily quota**: UI display uses `VITE_MAX_AI_USAGE` (default 100) and user profile fields (`aiUsage`, `lastAiUsageDate`). Server-side enforcement is in `functions/src/aiSettings.ts` (`checkAiAccess` → `consumePlatformDailyQuota`), controlled by `MAX_AI_USAGE` env var. Keep `VITE_MAX_AI_USAGE` aligned with `MAX_AI_USAGE`. BYOK users bypass quota.
- **Indexing budget**: write-triggered (re)embedding is metered separately from the chat quota via `consumeIndexingBudget` (`functions/src/usageBudget.ts`), controlled by `MAX_INDEX_USAGE` (default 300/day), stored on the user doc as `indexUsage`/`lastIndexUsageDate`. Counts one unit per debounced embedding pass (not per autosave). Applies to BYOK users too — indexing uses the platform embedder regardless. Deletes are never gated.
- **Per-user story cap**: `users.storyCount` is maintained by the `onStoryWrite` trigger (`functions/src/storyCountTrigger.ts`); `firestore.rules` blocks story creation past `MAX_STORIES_PER_USER` (literal `100` in rules — keep both in sync). Soft cap; the indexing budget is the hard cost ceiling.

### Web3
Wagmi config in `src/blockchain/config.ts`. Target chain from `VITE_CHAIN_ID` (default 31337 for local Anvil). Tipping contract ABI in `src/blockchain/abi/TippingPlatform.abi.json`. Wallet state machine: `DISCONNECTED → CONNECTING → CONNECTED → READY` (or `WRONG_NETWORK / ERROR`).

## Design System (Inkwell)

Use CSS variable–backed Tailwind tokens for all styling — never hardcode colors.

**Color tokens:** `ns-bg`, `ns-surface`, `ns-surface-hover`, `ns-elevated`, `ns-ink`, `ns-ink-secondary`, `ns-ink-muted`, `ns-accent`, `ns-accent-hover`, `ns-accent-deep`, `ns-accent-subtle`, `ns-gold`, `ns-border`, `ns-border-strong`, `ns-destructive`

**Typography:**
- `font-heading` — Cormorant (serif, titles)
- `font-body` — Crimson Pro (serif, prose)
- `font-ui` — Hanken Grotesk (sans, UI labels)

**Other tokens:** `shadow-ns`, `shadow-ns-lg`, `rounded-ns`, `rounded-ns-lg` — use the `ns-*` prefixed variants, not raw Tailwind equivalents.

Light theme: warm parchment (`#FDFCF9`) bg, sealing-wax red accent (`#B91C1C`). Dark theme: deep charcoal (`#0E0E0D`) bg, vivid vermillion accent (`#EF4444`).

## Components Structure

`src/components/` is organized by domain:
- `ui/` — Radix UI primitives (shadcn/ui, do not modify)
- `editor/` — TipTap editor, slash commands, AI writing tools
- `layout/` — Navbar, Footer, SidebarPanel (+ `navbar/` subdir)
- `story/` — StoryMetadata, StoriesHeader (+ `characters/`, `places/` subdirs)
- `plot/` — Plot timeline and event editing
- `community/` — Comments, votes, reporting
- `web3/` — Wallet connect, fee cards, transaction status
- `common/` — Shared utilities (Modal, ConfirmDialog, ThemeToggle, Icons, etc.)
- `chat/` — Chatbot and floating chat button
- `explore/` — Discovery page sections
- `seo/` — SEOHead, StructuredData
- `pages/` — Static page content (PrivacyPolicy, TermsOfUse)

Each folder has an `index.ts` barrel file.

## Environment Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGE_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_USE_EMULATORS          # default true in dev
VITE_MAX_AI_USAGE           # default 100 (daily quota display — server enforces MAX_AI_USAGE)
VITE_CHAIN_ID               # default 31337 (local Anvil)
VITE_AGENT_MCP_URL          # agents service base URL for the /mcp-connect consent page (default http://localhost:8000)
```
