#!/bin/bash
set -e

echo "================================"
echo "Next Level Real Estate AI Agents"
echo "Setup Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check Node.js version
print_info "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js version OK: $(node -v)"

# Check if Docker is running
print_info "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi
print_success "Docker is running"

# Check if .env exists
if [ ! -f .env ]; then
    print_info "Creating .env file from .env.example..."
    cp .env.example .env
    print_success ".env file created"
    echo ""
    print_error "Please edit .env and add your API keys:"
    echo "  - ANTHROPIC_API_KEY"
    echo "  - OPENAI_API_KEY"
    echo ""
    exit 1
fi

# Verify API keys are set
print_info "Verifying API keys in .env..."
source .env
if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "sk-ant-api03-..." ]; then
    print_error "ANTHROPIC_API_KEY not set in .env"
    exit 1
fi
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "sk-..." ]; then
    print_error "OPENAI_API_KEY not set in .env"
    exit 1
fi
print_success "API keys configured"

# Start infrastructure services
print_info "Starting infrastructure services (Kafka, Redis, Qdrant, MongoDB)..."
cd ..
docker compose up -d kafka redis qdrant mongodb
sleep 5
print_success "Infrastructure services started"

# Install shared dependencies
print_info "Installing shared infrastructure dependencies..."
cd agents/shared
npm install
npm run build
print_success "Shared infrastructure built"

# Install and build each agent
AGENTS=("architect" "conversation" "sales" "realty")

for agent in "${AGENTS[@]}"; do
    print_info "Installing $agent agent..."
    cd ../$agent
    npm install
    npm run build
    print_success "$agent agent built"
done

cd ..

echo ""
echo "================================"
print_success "Setup complete!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Start all agents:"
echo "   cd agents && npm run start:all"
echo ""
echo "2. Or start individual agents in separate terminals:"
echo "   Terminal 1: cd agents/architect && npm run dev"
echo "   Terminal 2: cd agents/conversation && npm run dev"
echo "   Terminal 3: cd agents/sales && npm run dev"
echo "   Terminal 4: cd agents/realty && npm run dev"
echo ""
echo "3. View metrics and traces:"
echo "   OpenTelemetry: http://localhost:4317"
echo "   Qdrant Admin: http://localhost:6333/dashboard"
echo ""
echo "4. Check agent health:"
echo "   curl http://localhost:3001/health (architect)"
echo "   curl http://localhost:3002/health (conversation)"
echo "   curl http://localhost:3003/health (sales)"
echo "   curl http://localhost:3004/health (realty)"
echo ""
