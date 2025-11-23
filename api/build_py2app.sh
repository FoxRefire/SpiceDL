#!/bin/bash
# Build script for Py2App (macOS App bundle)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${SCRIPT_DIR}/build/py2app"
DIST_DIR="${BUILD_DIR}/dist"

# Clean previous builds
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# Check if py2app is installed
if ! python3 -c "import py2app" 2>/dev/null; then
    echo "Installing py2app..."
    python3 -m pip install py2app
fi

# Build the app with optimization
cd "${SCRIPT_DIR}"
python3 setup.py py2app --optimize=2 --strip

# Move to build directory
if [ -d "dist" ]; then
    mv dist "${DIST_DIR}"
fi
if [ -d "build" ] && [ -d "build/bdist.macosx-*" ]; then
    mv build/bdist.macosx-* "${BUILD_DIR}/" 2>/dev/null || true
fi

# Run post-build optimization
if [ -f "${SCRIPT_DIR}/optimize_app.sh" ]; then
    echo "Running post-build optimization..."
    chmod +x "${SCRIPT_DIR}/optimize_app.sh"
    APP_BUNDLE=$(find "${DIST_DIR}" -name "*.app" -type d | head -1)
    if [ -n "$APP_BUNDLE" ]; then
        "${SCRIPT_DIR}/optimize_app.sh" "$APP_BUNDLE"
    fi
fi

echo "Build complete! App bundle is in ${DIST_DIR}"

