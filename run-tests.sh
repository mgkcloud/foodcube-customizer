#!/bin/bash

# Kill any existing processes on port 5173
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start the development server on port 5173
VITE_PORT=5173 npm run dev &
DEV_SERVER_PID=$!

# Wait for the server to start
echo "Waiting for dev server to start..."
sleep 10

# Run the tests
echo "Running Playwright tests..."
npx playwright test

# Capture the exit code
EXIT_CODE=$?

# Kill the development server
echo "Shutting down dev server..."
kill $DEV_SERVER_PID

# Exit with the test exit code
exit $EXIT_CODE 