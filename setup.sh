#!/bin/bash
# Setup Script for Virtual Event Ticketing Platform

echo "═══════════════════════════════════════════════════════════════"
echo "Virtual Event Ticketing Platform - Setup Script"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${BLUE}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"
echo ""

# Check npm
echo -e "${BLUE}Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi
echo -e "${GREEN}✓ npm version: $(npm -v)${NC}"
echo ""

# Backend Setup
echo -e "${BLUE}═══ BACKEND SETUP ═══${NC}"
echo "Installing backend dependencies..."
cd backend
npm install

if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env created. Please update with your MongoDB URI${NC}"
    echo ""
    echo "Edit backend/.env and update:"
    echo "  MONGO_URI=your_mongodb_connection_string"
    echo "  JWT_SECRET=your_secret_key"
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi

echo -e "${GREEN}✓ Backend dependencies installed${NC}"
cd ..
echo ""

# Frontend Setup
echo -e "${BLUE}═══ FRONTEND SETUP ═══${NC}"
echo "Installing frontend dependencies..."
cd frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..
echo ""

# Summary
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo "✓ Setup complete!"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Ensure MongoDB is running (local or update MONGO_URI in backend/.env)"
echo "2. Start backend:    cd backend && npm run dev"
echo "3. Start frontend:   cd frontend && npm start"
echo ""
echo -e "${BLUE}Default URLs:${NC}"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo "  API:      http://localhost:5000/api"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  - README.md for complete guide"
echo "  - QUICKSTART.md for quick setup"
echo "  - ARCHITECTURE.md for technical details"
echo ""
echo "═══════════════════════════════════════════════════════════════"
