# novelsync-frontend

React, TypeScript, and Firebase frontend for NovelSync. This repo contains the Vite app, Firebase Functions, and the deployment workflow that publishes hosting, functions, Firestore rules, indexes, and storage rules.

## Overview

This repo contains the main user-facing NovelSync product. It covers the writing experience, story organization, AI-assisted editing flows, reader/community surfaces, wallet-based tipping, and the Firebase-backed services that support those features. The frontend is built as a Vite React app, while server-side product logic that lives close to Firebase runs from the `functions/` directory.

## Features

- Rich text story editor for long-form writing
- Story, chapter, character, place, and plot management
- AI-powered brainstorming, enhancement, and chat workflows
- **BYOK (Bring Your Own Key)** — users supply their own Gemini, Claude, or OpenAI key via Profile → AI Provider; platform quota is bypassed and keys are encrypted at rest with AES-256-GCM
- Community features such as discovery, profiles, and engagement surfaces
- Wallet connection and on-chain author tipping
- Firebase Auth, Firestore, Storage, and Cloud Functions integration
- Local emulator support for offline and development workflows
- Hosting and backend deployment through GitHub Actions and Terraform-backed infrastructure
- Local scripts for Anvil-based contract wiring and end-to-end tipping checks

## Quick start

```bash
yarn install
yarn dev
```

For local environment setup, emulator usage, and contract wiring, start with [docs/quickstart.md](./docs/quickstart.md).

## Docs

- [Docs index](./docs/README.md)
- [Quickstart](./docs/quickstart.md)
- [Setup](./docs/setup.md)
- [Local runbook](./docs/runbook.md)
- [Deployment](./docs/deployment.md)

## How it fits into NovelSync

- `novelsync-frontend`: web app, Firebase functions, and deployment surface
- `../novelsync-agents`: AI story-agent backend
- `../contracts`: smart contract repo for author tipping

## Repo layout

- `src/`: React app
- `functions/`: Firebase Functions source
- `terraform/`: infra and secret wiring used by deploy automation
- `scripts/`: local blockchain helper scripts

## Core commands

- `yarn dev`
- `yarn build`
- `yarn build:analyze`
- `yarn preview`
- `yarn lint`
- `yarn start:emulator`

## Notes

The checked-in `start:agent` script currently points at `cd python && python server.py`, but this repo does not contain that directory. Run the agent service from the sibling `../novelsync-agents` repo instead.

## Tech stack

- React 19, TypeScript, and Vite
- Firebase Hosting, Firestore, Auth, Storage, and Functions
- Wagmi and Viem for wallet and contract interaction
- Tailwind and component primitives for UI development
- Terraform and GitHub Actions for deployment automation
