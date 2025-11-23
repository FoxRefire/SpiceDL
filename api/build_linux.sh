#!/bin/bash
# Build script for Linux packages (.deb and .rpm) using FPM
set -e

# Configuration
APP_NAME="spotdl-api"
VERSION="${VERSION:-1.0.0}"
ARCH="${ARCH:-amd64}"
BUILD_DIR="build"
DIST_DIR="dist"
PACKAGE_DIR="${BUILD_DIR}/package"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building ${APP_NAME} v${VERSION} for Linux...${NC}"

# Clean previous builds
rm -rf "${BUILD_DIR}" "${DIST_DIR}"
mkdir -p "${BUILD_DIR}" "${DIST_DIR}" "${PACKAGE_DIR}"

# Create virtual environment
echo -e "${YELLOW}Creating virtual environment...${NC}"
python3 -m venv "${BUILD_DIR}/venv"
source "${BUILD_DIR}/venv/bin/activate"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# Install spotdl if not available
if ! command -v spotdl &> /dev/null; then
    echo -e "${YELLOW}Installing spotdl...${NC}"
    pip install spotdl
fi

# Create package structure
echo -e "${YELLOW}Creating package structure...${NC}"
PACKAGE_ROOT="${PACKAGE_DIR}/${APP_NAME}"
mkdir -p "${PACKAGE_ROOT}/usr/bin"
mkdir -p "${PACKAGE_ROOT}/usr/lib/${APP_NAME}"
mkdir -p "${PACKAGE_ROOT}/usr/share/${APP_NAME}"
mkdir -p "${PACKAGE_ROOT}/etc/${APP_NAME}"
mkdir -p "${PACKAGE_ROOT}/usr/share/applications"
mkdir -p "${PACKAGE_ROOT}/usr/share/pixmaps"

# Copy application files
echo -e "${YELLOW}Copying application files...${NC}"
cp -r *.py "${PACKAGE_ROOT}/usr/lib/${APP_NAME}/"
if [ -f config.json ]; then
    cp config.json "${PACKAGE_ROOT}/etc/${APP_NAME}/config.json"
else
    # Create default config.json
    cat > "${PACKAGE_ROOT}/etc/${APP_NAME}/config.json" << 'EOF'
{
  "download_folder": "~/Music/spotDL",
  "port": 5985,
  "host": "127.0.0.1"
}
EOF
fi

# Create launcher script
cat > "${PACKAGE_ROOT}/usr/bin/${APP_NAME}" << 'EOF'
#!/bin/bash
# spotDL API launcher script
export PYTHONPATH="/usr/lib/spotdl-api:$PYTHONPATH"
cd /usr/lib/spotdl-api
exec python3 app.py "$@"
EOF
chmod +x "${PACKAGE_ROOT}/usr/bin/${APP_NAME}"

# Create desktop file
cat > "${PACKAGE_ROOT}/usr/share/applications/${APP_NAME}.desktop" << EOF
[Desktop Entry]
Name=spotDL API
Comment=spotDL API Server
Exec=/usr/bin/${APP_NAME}
Icon=spotdl-api
Terminal=false
Type=Application
Categories=AudioVideo;Network;
EOF

# Create systemd service file
mkdir -p "${PACKAGE_ROOT}/etc/systemd/system"
cat > "${PACKAGE_ROOT}/etc/systemd/system/${APP_NAME}.service" << EOF
[Unit]
Description=spotDL API Server
After=network.target

[Service]
Type=simple
User=spotdl
ExecStart=/usr/bin/${APP_NAME}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Install FPM if not available
if ! command -v fpm &> /dev/null; then
    echo -e "${YELLOW}Installing FPM...${NC}"
    gem install fpm
fi

# Build .deb package
echo -e "${GREEN}Building .deb package...${NC}"
fpm -s dir \
    -t deb \
    -n "${APP_NAME}" \
    -v "${VERSION}" \
    -a "${ARCH}" \
    --description "spotDL API Server for downloading music from Spotify" \
    --maintainer "spotDL Team" \
    --vendor "spotDL" \
    --url "https://github.com/spotDL/spotify-downloader" \
    --license "MIT" \
    --depends "python3" \
    --depends "python3-pip" \
    --depends "ffmpeg" \
    -C "${PACKAGE_ROOT}" \
    -p "${DIST_DIR}/${APP_NAME}_${VERSION}_${ARCH}.deb" \
    .

# Build .rpm package
echo -e "${GREEN}Building .rpm package...${NC}"
fpm -s dir \
    -t rpm \
    -n "${APP_NAME}" \
    -v "${VERSION}" \
    -a "${ARCH}" \
    --description "spotDL API Server for downloading music from Spotify" \
    --maintainer "spotDL Team" \
    --vendor "spotDL" \
    --url "https://github.com/spotDL/spotify-downloader" \
    --license "MIT" \
    --depends "python3" \
    --depends "python3-pip" \
    --depends "ffmpeg" \
    -C "${PACKAGE_ROOT}" \
    -p "${DIST_DIR}/${APP_NAME}-${VERSION}-1.${ARCH}.rpm" \
    .

echo -e "${GREEN}Build complete! Packages are in ${DIST_DIR}/${NC}"
ls -lh "${DIST_DIR}"

