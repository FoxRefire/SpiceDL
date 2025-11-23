#!/bin/bash
# Build script for macOS .app bundle using Py2App
set -e

# Configuration
APP_NAME="spotdl-api"
VERSION="${VERSION:-1.0.0}"
BUILD_DIR="build"
DIST_DIR="dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building ${APP_NAME} v${VERSION} for macOS...${NC}"

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: This script must be run on macOS${NC}"
    exit 1
fi

# Clean previous builds
rm -rf "${BUILD_DIR}" "${DIST_DIR}"
mkdir -p "${BUILD_DIR}" "${DIST_DIR}"

# Create virtual environment
echo -e "${YELLOW}Creating virtual environment...${NC}"
python3 -m venv "${BUILD_DIR}/venv"
source "${BUILD_DIR}/venv/bin/activate"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt
pip install py2app

# Install spotdl if not available
if ! command -v spotdl &> /dev/null; then
    echo -e "${YELLOW}Installing spotdl...${NC}"
    pip install spotdl
fi

# Build with Py2App
echo -e "${GREEN}Building .app bundle...${NC}"
python3 setup_macos.py py2app

echo -e "${GREEN}Build complete! App bundle is in ${DIST_DIR}/${NC}"
ls -lh "${DIST_DIR}"

