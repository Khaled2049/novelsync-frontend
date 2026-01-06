# Local Development Guide

This guide covers setting up the complete NovelSync development environment with all three repositories working together.

## Prerequisites

- Node.js 22+
- Docker & Docker Compose
- Firebase CLI: `npm install -g firebase-tools`
- Google AI Studio API Key
- (Optional) Python 3.11+ if you want to run the agent service natively

## Repository Structure

NovelSync is split into three repositories:

1. **novelsync-frontend** (this repo) - React frontend + Firebase Functions
2. **novelsync-agents** - Python FastAPI service for AI agents
3. **novelsync-contracts** - Solidity smart contracts (optional for local dev)

## Setup Instructions

### 1. Clone All Repositories

If you're setting this up from GitHub:

```bash
cd ~/Code
git clone git@github.com:YOUR_ORG/novelsync-frontend.git
git clone git@github.com:YOUR_ORG/novelsync-agents.git
git clone git@github.com:YOUR_ORG/novelsync-contracts.git  # Optional
```

### 2. Install Frontend Dependencies

```bash
cd novelsync-frontend
npm install
cd functions
npm install
cd ..
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

- **Required:**
  - `GOOGLE_AI_STUDIO_API_KEY` - Get from https://ai.google.dev/

- **Firebase Config (Public):**
  - Get from Firebase Console → Project Settings → Your Apps
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGE_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_MEASUREMENT_ID`

- **Thirdweb Config (for tipping feature):**
  - `VITE_THIRDWEB_CLIENT_ID`
  - `VITE_TIPPING_CONTRACT_ADDRESS`
  - `VITE_USDC_TOKEN_ADDRESS`

## Running the Development Environment

You need to run three services in separate terminals:

### Terminal 1: Python Agent (Docker)

```bash
cd novelsync-frontend
docker-compose -f docker-compose.simple.yml up python-agent
```

Wait for the health check to pass. You should see:
```
python-agent_1  | INFO:     Application startup complete.
```

Verify it's running:
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

### Terminal 2: Firebase Emulator

```bash
cd novelsync-frontend
firebase emulators:start
```

Wait for all emulators to start. You should see:
```
✔  All emulators ready!
┌───────────┬────────────────┬─────────────────────────────────┐
│ Emulator  │ Host:Port      │ View in Emulator UI             │
├───────────┼────────────────┼─────────────────────────────────┤
│ Functions │ localhost:5001 │ http://localhost:4000/functions │
│ Firestore │ localhost:8080 │ http://localhost:4000/firestore │
│ Auth      │ localhost:9099 │ http://localhost:4000/auth      │
│ Storage   │ localhost:9199 │ http://localhost:4000/storage   │
└───────────┴────────────────┴─────────────────────────────────┘
```

### Terminal 3: Frontend (Vite Dev Server)

```bash
cd novelsync-frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Access Points

Once all services are running:

- **Frontend:** http://localhost:5173
- **Firebase Emulator UI:** http://localhost:4000
- **Firestore Emulator:** localhost:8080
- **Functions Emulator:** http://localhost:5001
- **Auth Emulator:** http://localhost:9099
- **Storage Emulator:** http://localhost:9199
- **Python Agent:** http://localhost:8000
- **Python Agent Health:** http://localhost:8000/health

## Alternative: Quick Start Script

Use the provided script to start all services:

```bash
cd novelsync-frontend
./scripts/dev.sh
```

To stop all services:

```bash
./scripts/stop.sh
```

## Troubleshooting

### Python Agent Can't Connect to Firestore Emulator

**Symptom:** Python agent logs show connection errors to Firestore

**Solution:**
1. Verify Firebase emulator is running: `firebase emulators:list`
2. Check Docker logs: `docker-compose -f docker-compose.simple.yml logs python-agent`
3. Verify `FIRESTORE_EMULATOR_HOST=host.docker.internal:8080` in docker-compose.yml

### Functions Can't Call Python Agent

**Symptom:** Error in Functions logs: "Cannot connect to Python agent"

**Solution:**
1. Verify Python agent is running: `curl http://localhost:8000/health`
2. Check Functions emulator logs for connection attempts
3. Verify `agentService.ts` uses `http://localhost:8000` in emulator mode

### Frontend Can't Connect to Emulators

**Symptom:** Firebase SDK errors in browser console

**Solution:**
1. Check `src/config/firebase.ts` - should auto-detect development mode
2. Verify emulators are running: `firebase emulators:list`
3. Check browser console for specific error messages
4. Ensure you're using `http://localhost:5173` (not 127.0.0.1)

### Docker Can't Reach Host Services

**Symptom:** Python agent can't connect to Firestore emulator on host

**Solution:**
1. Verify `host.docker.internal` works:
   ```bash
   docker-compose -f docker-compose.simple.yml exec python-agent ping host.docker.internal
   ```
2. If it doesn't work, find your machine's IP:
   ```bash
   ip addr show
   ```
3. Update `docker-compose.simple.yml` to use your actual IP instead of `host.docker.internal`

### Port Already in Use

**Symptom:** Error starting service: "port 8000 is already allocated"

**Solution:**
1. Find process using the port:
   ```bash
   lsof -i :8000  # or :5001, :8080, etc.
   ```
2. Kill the process:
   ```bash
   kill -9 <PID>
   ```
3. Or stop all Docker containers:
   ```bash
   docker-compose -f docker-compose.simple.yml down
   ```

## Development Workflow

### Creating a Story

1. Open http://localhost:5173
2. Sign in (Auth Emulator - use any email/password)
3. Click "New Story"
4. Fill in details
5. Data is saved to Firestore Emulator

### Testing AI Generation

1. Open a story
2. Click "Brainstorm Ideas" or "Generate Chapter"
3. Frontend → Functions → Python Agent → Google AI Studio
4. Check browser console and terminal logs to see the request flow

### Viewing Firestore Data

1. Open http://localhost:4000
2. Click "Firestore" tab
3. Browse collections: `stories`, `users`, `contexts`

## Running Tests

### Frontend Tests

```bash
cd novelsync-frontend
npm run test
```

### Functions Tests

```bash
cd novelsync-frontend/functions
npm run test
```

### Python Agent Tests

```bash
cd novelsync-agents
pytest
```

## Clean Up

### Stop All Services

```bash
# Stop Docker
cd novelsync-frontend
docker-compose -f docker-compose.simple.yml down

# Stop Firebase emulator: Ctrl+C in terminal

# Stop Vite dev server: Ctrl+C in terminal
```

### Clear Emulator Data

```bash
cd novelsync-frontend
firebase emulators:start --clear
```

### Reset Everything

```bash
# Remove Docker containers and volumes
docker-compose -f docker-compose.simple.yml down -v

# Remove node_modules (will need to npm install again)
rm -rf node_modules functions/node_modules

# Remove Firebase emulator data
rm -rf ~/.cache/firebase/emulators
```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## Additional Resources

- [Firebase Emulator Documentation](https://firebase.google.com/docs/emulator-suite)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Documentation](https://vitejs.dev/)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Check service logs (browser console, terminal output)
3. Verify all environment variables are set correctly
4. Ensure all ports are available
5. Try restarting all services
