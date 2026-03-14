# Repository Guidelines

## Multi-Repo Overview

NovelSync is split across three repositories:

- **novelsync-frontend** (this repo): React/TypeScript frontend + Firebase Cloud Functions.
- **novelsync-agents** (`../novelsync-agents`): Python FastAPI service hosting AI story agents, deployed to Google Cloud Run.
- **contracts** (`../contracts`): Solidity smart contracts (TippingPlatform) built with Foundry.

## Project Structure & Module Organization

### novelsync-frontend (this repo)

- Frontend app code lives in `src/` (React + TypeScript + Vite).
- Route-level pages are under `src/routes/` (e.g. `src/routes/Story/`, `src/routes/Auth/`).
- Shared UI and reusable components are in `src/components/`; app-wide providers in `src/contexts/`; API/data access in `src/services/`.
- Blockchain interaction helpers are in `src/blockchain/`.
- Static assets are in `public/`; production output is generated in `dist/`.
- Firebase Cloud Functions source lives in `functions/src/`; built output in `functions/lib/`.
- Infra/config files live at repo root (`firebase.json`, `firestore.rules`, `tailwind.config.js`, `vite.config.ts`).

### novelsync-agents

- FastAPI server entry point: `server.py`.
- Agent implementations are under `agents/storyAgent/`.
- Optional local image generation module lives in `image-generation/`.
- Infrastructure-as-code is in `terraform/`; CI/CD workflows in `.github/workflows/`.
- Python dependencies: `requirements.txt` (full, includes ML libs) and `requirements-prod.txt` (Cloud Run-optimised, no ML libs).
- See `DEPLOYMENT.md` for full GCP + Terraform + GitHub Actions deployment guide.

### contracts

- Solidity source: `src/TippingPlatform.sol`.
- Tests: `test/TippingPlatform.t.sol` (Foundry).
- Deploy script: `script/Deploy.s.sol`.
- OpenZeppelin dependency managed via Bun; Foundry config in `foundry.toml`.
- ABI output lands in `out/`.

## Build, Test, and Development Commands

### novelsync-frontend

- `yarn dev`: start local Vite dev server.
- `yarn build`: run TypeScript project build (`tsc -b`) and produce production bundle.
- `yarn build:analyze`: build with bundle visualizer output.
- `yarn preview`: serve built `dist/` locally.
- `yarn lint`: run ESLint on `.ts/.tsx` with zero warnings allowed.
- `yarn start:emulator`: start Firebase emulators (calls `functions/` build then `firebase emulators:start`).

### novelsync-agents

- `python server.py`: run FastAPI server locally (default port 8000).
- `pip install -r requirements.txt`: install all deps including ML libs (local dev).
- `pip install -r requirements-prod.txt`: install Cloud Run deps only.
- `pytest`: run agent tests (see `pytest.ini`).
- Deployments are handled by GitHub Actions on push to `main` (Terraform + Cloud Run).

### contracts

- `forge build` / `bun run build`: compile contracts.
- `forge test` / `bun run test`: run Foundry test suite.
- `forge test --gas-report`: run tests with gas reporting.
- `forge coverage`: generate coverage report.
- `bun run deploy`: dry-run deploy via `script/Deploy.s.sol` (requires `.env` with `PRIVATE_KEY`, `RPC_URL`).
- `bun run deploy:broadcast`: broadcast deploy transaction on-chain.

## Coding Style & Naming Conventions

- **Frontend/Functions**: TypeScript, 2-space indentation, semicolon-free style.
  - Components and route files: `PascalCase` (e.g., `CreateStory.tsx`).
  - Hooks: `useXxx` naming (e.g., `useReaderSettings.ts`).
  - Services and context modules: `XxxService.ts[x]`, `XxxContext.tsx`.
  - Use `@/` alias for `src` imports when practical.
- **Agents**: Python, follow existing module structure; use Pydantic models for request/response schemas.
- **Contracts**: Solidity; follow OpenZeppelin patterns; keep NatSpec comments on public functions.

## Testing Guidelines

- **Frontend**: no test framework configured. Minimum validation: `yarn lint`, `yarn build`, and manual `yarn dev` verification.
- **Agents**: `pytest` (see `pytest.ini` in repo root). Run `pip install -r requirements.txt` first.
- **Contracts**: `forge test` (Foundry). Add tests in `test/` co-located with the contract under test.
- If adding frontend tests, prefer co-located `*.test.ts(x)` files and document the new command in `package.json`.

## Commit & Pull Request Guidelines

- Recent commits are short, imperative, lowercase (`fix build errors`, `add text parser`).
- Avoid vague messages like `try again`; use clear summaries such as `fix StoryTipModal amount parsing`.
- PRs should include:
  - concise scope and rationale,
  - the repo(s) affected (frontend / agents / contracts),
  - linked issue/task (if available),
  - screenshots/videos for UI changes,
  - verification steps (commands run and pages tested).

## Security & Configuration Tips

- Copy `.env.example` for local setup; never commit secrets in `.env` or `terraform.tfvars`.
- Keep Firebase rule changes (`firestore.rules`, `storage.rules`) explicit in PR notes due to production impact.
- **Agents**: API keys (Google AI Studio) must be stored in GCP Secret Manager and as GitHub Actions secrets — never in code or Terraform files. See `DEPLOYMENT.md`.
- **Contracts**: `PRIVATE_KEY` and `RPC_URL` go in `contracts/.env` only; never commit them.
