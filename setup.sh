#!/bin/bash

# Setup and run Node App with DAO Service locally

set -e

echo "=========================================="
echo "NodeApp + DAO Service Local Setup"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install Node.js first."
  exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo ""
  echo "📝 Creating .env file..."
  cp .env.example .env
  echo "✅ .env file created. Update it with your database credentials if running against real DB."
fi

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
  echo ""
  echo "📥 Installing PM2 globally..."
  npm install -g pm2
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "To start the services, run:"
echo ""
echo "  Option 1 - Start both services (recommended):"
echo "    npm run start:both"
echo ""
echo "  Option 2 - Start services separately in different terminals:"
echo "    Terminal 1: npm run start:dao"
echo "    Terminal 2: npm run start"
echo ""
echo "  Option 3 - Start individually:"
echo "    npm start              # Start NodeApp"
echo "    node daoService.js     # Start DAO Service"
echo ""
echo "Testing endpoints:"
echo "  Health Check:  curl http://localhost:3000/health"
echo "  Get Users:     curl http://localhost:3000/users"
echo "  Create User:   curl -X POST http://localhost:3000/users -H 'Content-Type: application/json' -d '{\"name\":\"John\"}'"
echo "  DAO Health:    curl http://localhost:3001/health"
echo ""
