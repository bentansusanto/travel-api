#!/bin/bash

# Travel API - Prepare for Deployment
# This script prepares the project for upload to VPS

echo "🚀 Preparing Travel API for Deployment"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the travel-api directory"
    exit 1
fi

echo "1️⃣  Checking project structure..."
if [ -d "src" ] && [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✅ Project structure looks good${NC}"
else
    echo -e "${RED}❌ Missing required files${NC}"
    exit 1
fi
echo ""

echo "2️⃣  Running security check..."
if [ -f "check-env-security.sh" ]; then
    chmod +x check-env-security.sh
    ./check-env-security.sh
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Security issues found. Please fix before deployment.${NC}"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Security check script not found${NC}"
fi
echo ""

echo "3️⃣  Cleaning up..."
# Remove node_modules if exists
if [ -d "node_modules" ]; then
    echo "   Removing node_modules..."
    rm -rf node_modules
fi

# Remove dist if exists
if [ -d "dist" ]; then
    echo "   Removing dist..."
    rm -rf dist
fi

# Remove logs if exists
if [ -d "logs" ]; then
    echo "   Removing logs..."
    rm -rf logs
fi

echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

echo "4️⃣  Creating deployment package..."

# Get project name
PROJECT_NAME=$(basename "$PWD")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ZIP_NAME="${PROJECT_NAME}_${TIMESTAMP}.zip"

# Create zip excluding unnecessary files
zip -r "../${ZIP_NAME}" . \
    -x "*.git*" \
    -x "*node_modules*" \
    -x "*dist*" \
    -x "*logs*" \
    -x "*.env" \
    -x "*.DS_Store" \
    -x "*coverage*" \
    -x "*.log" \
    2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Package created: ../${ZIP_NAME}${NC}"

    # Show file size
    SIZE=$(ls -lh "../${ZIP_NAME}" | awk '{print $5}')
    echo "   File size: ${SIZE}"

    # Show full path
    FULL_PATH=$(cd .. && pwd)/${ZIP_NAME}
    echo "   Full path: ${FULL_PATH}"
else
    echo -e "${RED}❌ Failed to create package${NC}"
    exit 1
fi
echo ""

echo "5️⃣  Deployment checklist:"
echo "   - [ ] Upload ${ZIP_NAME} to VPS via aaPanel File Manager"
echo "   - [ ] Extract to /www/wwwroot/travel-api"
echo "   - [ ] Create .env file with production credentials"
echo "   - [ ] Run: chmod 600 .env"
echo "   - [ ] Run: pnpm install --prod"
echo "   - [ ] Run: pnpm build"
echo "   - [ ] Run: pm2 start ecosystem.config.js"
echo ""

echo "========================================"
echo -e "${GREEN}🎉 Ready for deployment!${NC}"
echo ""
echo "Next steps:"
echo "1. Upload ${ZIP_NAME} to your VPS"
echo "2. Follow the deployment guide: DEPLOYMENT_CHECKLIST.md"
echo ""
echo "Package location: ${FULL_PATH}"
echo "========================================"
