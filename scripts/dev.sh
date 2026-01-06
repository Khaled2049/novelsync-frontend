#!/bin/bash
# Complete development environment startup script for NovelSync

set -e

echo "🚀 Starting NovelSync Development Environment..."

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "❌ Error: .env file not found"
  echo "📝 Copy .env.example to .env and configure your API keys:"
  echo "   cp .env.example .env"
  echo "   # Then edit .env with your API keys"
  exit 1
fi

# Check if novelsync-agents directory exists
if [ ! -d "../novelsync-agents" ]; then
  echo "❌ Error: novelsync-agents repository not found"
  echo "📁 Expected location: ../novelsync-agents"
  echo "   Make sure all three repos (novelsync-frontend, novelsync-agents, novelsync-contracts) are in the same parent directory"
  exit 1
fi

# Start Python agent
echo "🐍 Starting Python Agent (Docker)..."
docker-compose -f docker-compose.simple.yml up -d python-agent

# Wait for agent to be healthy
echo "⏳ Waiting for Python Agent to be healthy..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Python Agent is healthy"
    break
  fi
  attempt=$((attempt + 1))
  echo -n "."
  sleep 1
done
echo ""

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Python Agent failed to start within 30 seconds"
  echo "📋 Checking logs..."
  docker-compose -f docker-compose.simple.yml logs python-agent
  exit 1
fi

# Start Firebase emulator in background
echo "🔥 Starting Firebase Emulator..."
firebase emulators:start &
FIREBASE_PID=$!
echo "📊 Firebase Emulator PID: $FIREBASE_PID"

# Wait for Firebase emulator to be ready
echo "⏳ Waiting for Firebase Emulator to start..."
sleep 8

# Check if Firebase emulator started successfully
if ! kill -0 $FIREBASE_PID 2>/dev/null; then
  echo "❌ Firebase Emulator failed to start"
  exit 1
fi

echo "✅ Firebase Emulator is running"

# Start frontend
echo "⚛️  Starting Frontend (Vite)..."
echo ""
echo "=========================================="
echo "🎉 All services started successfully!"
echo "=========================================="
echo ""
echo "Access points:"
echo "  Frontend:           http://localhost:5173"
echo "  Emulator UI:        http://localhost:4000"
echo "  Python Agent:       http://localhost:8000"
echo "  Functions:          http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

npm run dev

# Cleanup on exit
trap "echo '🛑 Stopping services...'; kill $FIREBASE_PID 2>/dev/null; docker-compose -f docker-compose.simple.yml down; echo '✅ All services stopped'" EXIT INT TERM
