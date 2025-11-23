#!/bin/bash
# Build script for FPM (Deb and Rpm packages)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="spicedl2-api"
VERSION="${VERSION:-1.0.0}"
ARCH="${ARCH:-amd64}"

# Build directory
BUILD_DIR="${SCRIPT_DIR}/build/fpm"
PACKAGE_DIR="${BUILD_DIR}/package"
INSTALL_PREFIX="/usr/local"

# Clean previous builds
rm -rf "${BUILD_DIR}"
mkdir -p "${PACKAGE_DIR}${INSTALL_PREFIX}/bin"
mkdir -p "${PACKAGE_DIR}${INSTALL_PREFIX}/lib/${PROJECT_NAME}"
mkdir -p "${PACKAGE_DIR}/etc/${PROJECT_NAME}"

# Copy application files
cp -r "${SCRIPT_DIR}"/*.py "${PACKAGE_DIR}${INSTALL_PREFIX}/lib/${PROJECT_NAME}/"
cp "${SCRIPT_DIR}/config.json" "${PACKAGE_DIR}/etc/${PROJECT_NAME}/config.json.example" 2>/dev/null || true

# Create launcher script
cat > "${PACKAGE_DIR}${INSTALL_PREFIX}/bin/${PROJECT_NAME}" << 'EOF'
#!/bin/bash
APP_DIR="/usr/local/lib/spicedl2-api"
cd "$APP_DIR"

# Check if dependencies are installed, install if needed
if ! python3 -c "import flask" 2>/dev/null; then
    echo "Installing dependencies..."
    python3 -m pip install --user -r "$APP_DIR/requirements.txt" || {
        echo "Warning: Failed to install dependencies. Please install manually:"
        echo "  pip install -r $APP_DIR/requirements.txt"
    }
fi

exec python3 -m app "$@"
EOF
chmod +x "${PACKAGE_DIR}${INSTALL_PREFIX}/bin/${PROJECT_NAME}"

# Copy requirements.txt to package for installation reference
cp "${SCRIPT_DIR}/requirements.txt" "${PACKAGE_DIR}${INSTALL_PREFIX}/lib/${PROJECT_NAME}/requirements.txt"

# Verify files exist before building
echo "Verifying package structure..."
ls -la "${PACKAGE_DIR}${INSTALL_PREFIX}/bin/${PROJECT_NAME}" || exit 1
ls -la "${PACKAGE_DIR}${INSTALL_PREFIX}/lib/${PROJECT_NAME}/" || exit 1

# Build DEB package
if command -v fpm &> /dev/null; then
    echo "Building DEB package..."
    cd "${BUILD_DIR}"
    fpm -s dir \
        -t deb \
        -n "${PROJECT_NAME}" \
        -v "${VERSION}" \
        -a "${ARCH}" \
        --description "spiceDL2 API Server" \
        --maintainer "spiceDL2 Team" \
        --depends "python3" \
        --depends "python3-pip" \
        --depends "python3-venv" \
        -C "${PACKAGE_DIR}" \
        usr/ \
        etc/
    
    echo "DEB package built successfully!"
else
    echo "Warning: fpm not found. Install with: gem install fpm"
fi

# Build RPM package
if command -v fpm &> /dev/null; then
    echo "Building RPM package..."
    cd "${BUILD_DIR}"
    fpm -s dir \
        -t rpm \
        -n "${PROJECT_NAME}" \
        -v "${VERSION}" \
        -a "${ARCH}" \
        --description "spiceDL2 API Server" \
        --maintainer "spiceDL2 Team" \
        --depends "python3" \
        --depends "python3-pip" \
        -C "${PACKAGE_DIR}" \
        usr/ \
        etc/
    
    echo "RPM package built successfully!"
else
    echo "Warning: fpm not found. Install with: gem install fpm"
fi

echo "Build complete! Packages are in ${BUILD_DIR}"

