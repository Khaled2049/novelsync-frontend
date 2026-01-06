#!/bin/bash
# Stop all NovelSync development services

set -e

echo "🛑 Stopping NovelSync Development Environment..."

# Stop Docker services
echo "🐳 Stopping Docker services..."
cd "$(dirname "$0")/.."
docker-compose -f docker-compose.simple.yml down

# Kill any remaining processes
echo "🔥 Stopping Firebase emulator..."
pkill -f "firebase emulators" || true

echo "⚛️  Stopping Vite dev server..."
pkill -f "vite" || true

# Kill processes on specific ports
echo "🧹 Cleaning up processes on ports..."
for port in 8000 5001 8080 9099 9199 5173 4000; do
  pid=$(lsof -ti :$port 2>/dev/null || true)
  if [ ! -z "$pid" ]; then
    echo "  Killing process on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null || true
  fi
done

echo "✅ All services stopped"
echo ""
echo "To start again, run: ./scripts/dev.sh"
