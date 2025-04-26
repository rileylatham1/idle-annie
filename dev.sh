#!/bin/bash

echo "🌀 Starting Spotify Explorer..."

echo "📦 Installing dependencies..."
# Install Python dependencies
uv pip install -r spotify-backend-service/requirements.txt
source ./venv/bin/activate

# Start gRPC server in background
cd spotify-backend-service
echo "▶️ Starting gRPC server..."
python main.py &
cd ..

# Start FastAPI proxy in background
cd spotify-backend-service
source ./venv/bin/activate
echo "🌐 Starting FastAPI proxy server..."
uvicorn proxy:app --reload &
cd ..

# Start frontend app
echo "🎨 Starting frontend app..."
yarn install
yarn dev