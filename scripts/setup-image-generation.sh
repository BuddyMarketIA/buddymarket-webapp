#!/bin/bash

echo "🖼️  Setting up Recipe Image Generation Project..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo -e "${BLUE}📋 Configuration${NC}"
echo "Format: 1080x1080 (square)"
echo "Style: Mixed (professional + lifestyle)"
echo "Total recipes: ~17,000"
echo "Generation: Sequential with 2s delays"
echo ""

# Create directories
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p scripts
mkdir -p logs
mkdir -p temp

# Create log file
LOG_FILE="logs/image-generation-$(date +%Y%m%d-%H%M%S).log"
touch "$LOG_FILE"

echo -e "${GREEN}✅ Log file: $LOG_FILE${NC}"
echo ""

# Display next steps
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Review RECIPE_IMAGE_GENERATION_PROJECT.md for full documentation"
echo "2. Run the generation script:"
echo ""
echo -e "${YELLOW}   node scripts/generate-recipe-images.mjs${NC}"
echo ""
echo "3. Monitor progress:"
echo ""
echo -e "${YELLOW}   cat /tmp/recipe-images-progress.json | jq .${NC}"
echo ""
echo "4. Expected duration: ~9.4 hours for 17,000 recipes"
echo "5. Can be paused with Ctrl+C and resumed later"
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
