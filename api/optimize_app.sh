#!/bin/bash
# Post-build optimization script for macOS App bundle

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_BUNDLE="${1:-${SCRIPT_DIR}/build/py2app/dist/spiceDL2 API.app}"

if [ ! -d "$APP_BUNDLE" ]; then
    echo "Error: App bundle not found: $APP_BUNDLE"
    exit 1
fi

echo "Optimizing App bundle: $APP_BUNDLE"

# Path to PySide6 in the app bundle
PYTHON_LIB="${APP_BUNDLE}/Contents/Resources/lib/python3.11"
PYSIDE6_DIR="${PYTHON_LIB}/PySide6"

if [ -d "$PYSIDE6_DIR" ]; then
    echo "Removing unnecessary PySide6 files..."
    
    # Remove Qt plugins (keep only essential ones)
    PLUGINS_DIR="${PYSIDE6_DIR}/Qt/plugins"
    if [ -d "$PLUGINS_DIR" ]; then
        # Keep only platform plugins and basic image formats
        find "$PLUGINS_DIR" -type d -name "*webengine*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*multimedia*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*quick*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*qml*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*3d*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*charts*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*location*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*sensors*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*serial*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*sql*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*svg*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*bluetooth*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*nfc*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*opengl*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*print*" -exec rm -rf {} + 2>/dev/null || true
        find "$PLUGINS_DIR" -type d -name "*designer*" -exec rm -rf {} + 2>/dev/null || true
    fi
    
    # Remove translation files (keep only English if needed)
    TRANSLATIONS_DIR="${PYSIDE6_DIR}/Qt/translations"
    if [ -d "$TRANSLATIONS_DIR" ]; then
        # Remove all translations (or keep only en if needed)
        find "$TRANSLATIONS_DIR" -type f ! -name "*en*" -delete 2>/dev/null || true
    fi
    
    # Remove QML files
    QML_DIR="${PYSIDE6_DIR}/Qt/qml"
    if [ -d "$QML_DIR" ]; then
        rm -rf "$QML_DIR" 2>/dev/null || true
    fi
    
    # Remove examples and demos
    find "$PYSIDE6_DIR" -type d -name "examples" -exec rm -rf {} + 2>/dev/null || true
    find "$PYSIDE6_DIR" -type d -name "demos" -exec rm -rf {} + 2>/dev/null || true
    
    # Remove __pycache__ directories
    find "$PYSIDE6_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find "$PYSIDE6_DIR" -type f -name "*.pyc" -delete 2>/dev/null || true
fi

# Remove Python test files
if [ -d "$PYTHON_LIB" ]; then
    find "$PYTHON_LIB" -type d -name "test" -exec rm -rf {} + 2>/dev/null || true
    find "$PYTHON_LIB" -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
    find "$PYTHON_LIB" -type f -name "*_test.py" -delete 2>/dev/null || true
    find "$PYTHON_LIB" -type f -name "test_*.py" -delete 2>/dev/null || true
fi

# Strip binaries
echo "Stripping binaries..."
find "$APP_BUNDLE" -type f -perm +111 -exec strip {} + 2>/dev/null || true

# Remove .pyc and .pyo files
echo "Removing Python cache files..."
find "$APP_BUNDLE" -type f -name "*.pyc" -delete 2>/dev/null || true
find "$APP_BUNDLE" -type f -name "*.pyo" -delete 2>/dev/null || true
find "$APP_BUNDLE" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

echo "Optimization complete!"

