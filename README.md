# ScribeOS

A full-featured AI-powered novel writing platform built with React, Firebase, and Web3. Writers can create, organize, and share stories with tools for plot development, character management, AI-assisted writing, and community engagement.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Radix UI
- **Editor:** TipTap (ProseMirror-based rich text editor)
- **Backend:** Firebase (Firestore, Auth, Storage, Functions)
- **AI:** Google Generative AI for brainstorming, text enhancement, and image generation
- **Web3:** Wagmi + Viem for ETH/USDC tipping with Foundry contract artifacts
- **Charts:** Recharts for tension curve visualization and statistics

## Features

### Writing & Editor

- Rich text editor with formatting, images, links, and color support
- Multi-chapter stories (up to 50 chapters, 5000 words each)
- Real-time autosave to Firestore
- Zoom controls and page-view reading mode

### Plot Development

- Multiple plot lines per story
- Plot events with story beats (exposition, inciting incident, rising action, midpoint, climax, falling action, resolution)
- Tension level tracking (1-10) with visual tension curve charts
- Event dependencies (causes, requires, blocks, enables, contradicts)
- Time constraints for chronological ordering
- 7 classic plot templates (Overcoming the Monster, Rags to Riches, Quest, etc.)

### Character & Location Management

- Character profiles with name, age, backstory, affiliations, and notes
- Place/location management with descriptions
- Associate characters and locations with plot events

### AI-Powered Tools

- Brainstorming for characters, plots, places, and themes
- Text enhancement and improvement suggestions
- Image generation from descriptions
- AI writing assistant chat
- Configurable usage quotas with rate limiting

### Community

- Discover and browse published stories
- Like, rate, and comment on stories
- Follow authors and view profiles
- Book clubs and book lists
- Competitions and announcements

### Web3 Tipping

- Wallet connection via injected wallets (MetaMask, etc.)
- Tip authors with ETH/USDC on configured EVM chain
- Transaction history and earnings tracking

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project (or use emulators for local development)

### Installation

```bash
git clone https://github.com/Khaled2049/novelsync-frontend.git
cd novelsync-frontend
yarn install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Application
VITE_APP_NAME=ScribeOS

# Firebase
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGE_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Web3
VITE_CHAIN_ID=31337
VITE_ANVIL_RPC_URL=http://127.0.0.1:8545
VITE_SEPOLIA_RPC_URL=https://rpc.sepolia.org
VITE_MAINNET_RPC_URL=https://ethereum-rpc.publicnode.com
VITE_USDC_TOKEN_ADDRESS_ANVIL=0x...
VITE_USDC_TOKEN_ADDRESS_SEPOLIA=0x...
VITE_USDC_TOKEN_ADDRESS_MAINNET=0x...
VITE_TIPPING_CONTRACT_ADDRESS_ANVIL=0x...
VITE_TIPPING_CONTRACT_ADDRESS_SEPOLIA=0x...
VITE_TIPPING_CONTRACT_ADDRESS_MAINNET=0x...

# AI
VITE_MAX_AI_USAGE=1000
GOOGLE_AI_STUDIO_API_KEY=your-google-ai-studio-key
```

### Web3 Network Switching (Anvil / Sepolia)

Switching is config-only through `.env`.

`VITE_CHAIN_ID` selects the active chain:

- `31337` = local Anvil
- `11155111` = Sepolia
- `1` = Ethereum mainnet

#### Local Anvil profile

```env
VITE_CHAIN_ID=31337
VITE_ANVIL_RPC_URL=http://127.0.0.1:8545
VITE_TIPPING_CONTRACT_ADDRESS_ANVIL=0xYourAnvilTippingContract
VITE_USDC_TOKEN_ADDRESS_ANVIL=0xYourAnvilUSDC
```

#### Sepolia profile

```env
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://your-sepolia-rpc-url
VITE_TIPPING_CONTRACT_ADDRESS_SEPOLIA=0xYourSepoliaTippingContract
VITE_USDC_TOKEN_ADDRESS_SEPOLIA=0xYourSepoliaUSDC
```

Notes:

- Per-chain values are preferred (`*_ANVIL`, `*_SEPOLIA`, `*_MAINNET`).
- Legacy fallback keys still work: `VITE_RPC_URL`, `VITE_TIPPING_CONTRACT_ADDRESS`, `VITE_USDC_TOKEN_ADDRESS`.
- After changing `.env`, restart `yarn dev`.

### Running Locally

```bash
# Start the dev server
yarn dev

# Start Firebase emulators (optional, for offline development)
yarn start:emulator

# Start the AI agent server (optional)
yarn start:agent
```

The app will be available at `http://localhost:5173`.

### Building for Production

```bash
yarn build

# Preview the production build
yarn preview

# Analyze bundle size
yarn build:analyze
```

## Project Structure

```
src/
├── api/            # External API calls (brainstorm, chat, text enhancement)
├── components/     # Reusable UI components
│   ├── ui/         # Base components (button, card, dialog, tabs, etc.)
│   ├── plot/       # Plot timeline, event editor, tension curves
│   ├── characters/ # Character management
│   ├── places/     # Location management
│   ├── chat/       # AI chat assistant
│   ├── explore/    # Story discovery and browse
│   └── navbar/     # Navigation bar
├── config/         # Firebase, rate limits, SEO config
├── contexts/       # React Context providers (Auth, Theme, AI, Chat, Web3)
├── hooks/          # Custom hooks (autosave, editor state, wallet, pagination)
├── routes/         # Page components
│   ├── Auth/       # Sign in, sign up, password reset
│   ├── Story/      # Story creation, viewing, management
│   ├── Home/       # Landing page
│   ├── Library/    # Personal library
│   ├── BookClub/   # Book clubs
│   ├── Profile/    # User profiles
│   └── Settings/   # User settings
├── services/       # Firebase and business logic (Stories, Plot, Characters, etc.)
├── types/          # TypeScript interfaces
└── utils/          # Utility functions
```

## Scripts

| Command               | Description                         |
| --------------------- | ----------------------------------- |
| `yarn dev`            | Start development server            |
| `yarn build`          | TypeScript check + production build |
| `yarn build:analyze`  | Build with bundle size analysis     |
| `yarn preview`        | Preview production build            |
| `yarn lint`           | Run ESLint                          |
| `yarn start:emulator` | Start Firebase emulators            |
| `yarn start:agent`    | Start AI agent server               |

## Deployment

The project is configured for Firebase Hosting. The `firebase.json` and `.firebaserc` files are included in the repo.

```bash
# Build and deploy
yarn build
firebase deploy
```

## License

MIT
