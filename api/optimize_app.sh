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
QT_DIR="${PYSIDE6_DIR}/Qt"

if [ -d "$PYSIDE6_DIR" ]; then
    echo "Aggressively removing unnecessary PySide6 files..."
    
    # Remove Qt plugins directory entirely (keep only platform plugins if needed)
    PLUGINS_DIR="${QT_DIR}/plugins"
    if [ -d "$PLUGINS_DIR" ]; then
        echo "Removing Qt plugins..."
        # Keep only platform plugins (cocoa for macOS)
        if [ -d "$PLUGINS_DIR/platforms" ]; then
            mkdir -p "${PLUGINS_DIR}_backup/platforms"
            cp -r "$PLUGINS_DIR/platforms"/* "${PLUGINS_DIR}_backup/platforms/" 2>/dev/null || true
        fi
        rm -rf "$PLUGINS_DIR" 2>/dev/null || true
        if [ -d "${PLUGINS_DIR}_backup" ]; then
            mv "${PLUGINS_DIR}_backup" "$PLUGINS_DIR"
        fi
    fi
    
    # Remove ALL translation files
    TRANSLATIONS_DIR="${QT_DIR}/translations"
    if [ -d "$TRANSLATIONS_DIR" ]; then
        echo "Removing all translation files..."
        rm -rf "$TRANSLATIONS_DIR" 2>/dev/null || true
    fi
    
    # Remove QML files
    QML_DIR="${QT_DIR}/qml"
    if [ -d "$QML_DIR" ]; then
        echo "Removing QML files..."
        rm -rf "$QML_DIR" 2>/dev/null || true
    fi
    
    # Remove resources (keep only essential)
    RESOURCES_DIR="${QT_DIR}/resources"
    if [ -d "$RESOURCES_DIR" ]; then
        echo "Removing Qt resources..."
        # Keep only essential resources, remove others
        find "$RESOURCES_DIR" -type f ! -name "*.rcc" -delete 2>/dev/null || true
    fi
    
    # Remove PySide6 module files we don't need
    echo "Removing unnecessary PySide6 modules..."
    for module in QtWebEngine QtWebEngineWidgets QtWebEngineCore QtMultimedia QtMultimediaWidgets \
                  QtQuick QtQuickWidgets QtQml Qt3D Qt3DCore Qt3DRender Qt3DInput Qt3DLogic \
                  Qt3DAnimation Qt3DExtras QtCharts QtDataVisualization QtLocation QtPositioning \
                  QtSensors QtSerialPort QtSql QtSvg QtSvgWidgets QtTest QtXml QtXmlPatterns \
                  QtBluetooth QtNfc QtWebSockets QtNetwork QtOpenGL QtOpenGLWidgets QtPrintSupport \
                  QtHelp QtDesigner QtUiTools; do
        find "$PYSIDE6_DIR" -type d -name "$module" -exec rm -rf {} + 2>/dev/null || true
        find "$PYSIDE6_DIR" -type f -name "${module}*" -delete 2>/dev/null || true
    done
    
    # Remove .so/.dylib files for excluded modules
    echo "Removing unnecessary Qt libraries..."
    for lib in QtWebEngine QtWebEngineCore QtMultimedia QtQuick QtQml Qt3D QtCharts \
               QtLocation QtSensors QtSerialPort QtSql QtSvg QtBluetooth QtNfc \
               QtWebSockets QtNetwork QtOpenGL QtPrintSupport QtHelp QtDesigner QtUiTools; do
        find "$QT_DIR" -type f -name "lib${lib}*.dylib" -delete 2>/dev/null || true
        find "$QT_DIR" -type f -name "${lib}*.so" -delete 2>/dev/null || true
    done
    
    # Remove examples and demos
    echo "Removing examples and demos..."
    find "$PYSIDE6_DIR" -type d -name "examples" -exec rm -rf {} + 2>/dev/null || true
    find "$PYSIDE6_DIR" -type d -name "demos" -exec rm -rf {} + 2>/dev/null || true
    find "$PYSIDE6_DIR" -type d -name "example*" -exec rm -rf {} + 2>/dev/null || true
    
    # Remove __pycache__ directories
    echo "Removing Python cache files..."
    find "$PYSIDE6_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find "$PYSIDE6_DIR" -type f -name "*.pyc" -delete 2>/dev/null || true
    find "$PYSIDE6_DIR" -type f -name "*.pyo" -delete 2>/dev/null || true
    
    # Remove .pyi stub files (not needed at runtime)
    echo "Removing type stub files..."
    find "$PYSIDE6_DIR" -type f -name "*.pyi" -delete 2>/dev/null || true
fi

# Remove Python test files from all packages
if [ -d "$PYTHON_LIB" ]; then
    echo "Removing test files..."
    find "$PYTHON_LIB" -type d -name "test" -exec rm -rf {} + 2>/dev/null || true
    find "$PYTHON_LIB" -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
    find "$PYTHON_LIB" -type f -name "*_test.py" -delete 2>/dev/null || true
    find "$PYTHON_LIB" -type f -name "test_*.py" -delete 2>/dev/null || true
    find "$PYTHON_LIB" -type f -name "*test*.py" ! -name "*test*" -delete 2>/dev/null || true
fi

# Remove Flask test files
if [ -d "$PYTHON_LIB/flask" ]; then
    echo "Removing Flask test files..."
    find "$PYTHON_LIB/flask" -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
    find "$PYTHON_LIB/flask" -type f -name "*test*.py" -delete 2>/dev/null || true
fi

# Remove Werkzeug test files
if [ -d "$PYTHON_LIB/werkzeug" ]; then
    echo "Removing Werkzeug test files..."
    find "$PYTHON_LIB/werkzeug" -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
    find "$PYTHON_LIB/werkzeug" -type f -name "*test*.py" -delete 2>/dev/null || true
fi

# Strip binaries more aggressively
echo "Stripping binaries..."
find "$APP_BUNDLE" -type f \( -name "*.dylib" -o -name "*.so" -o -perm +111 \) -exec strip -x {} + 2>/dev/null || true

# Remove all .pyc and .pyo files
echo "Removing all Python cache files..."
find "$APP_BUNDLE" -type f -name "*.pyc" -delete 2>/dev/null || true
find "$APP_BUNDLE" -type f -name "*.pyo" -delete 2>/dev/null || true
find "$APP_BUNDLE" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

# Remove documentation files
echo "Removing documentation files..."
find "$APP_BUNDLE" -type f -name "*.md" -delete 2>/dev/null || true
find "$APP_BUNDLE" -type f -name "*.txt" ! -name "*.py" -delete 2>/dev/null || true
find "$APP_BUNDLE" -type f -name "LICENSE*" -delete 2>/dev/null || true
find "$APP_BUNDLE" -type f -name "README*" -delete 2>/dev/null || true

# Remove .pyi type stub files
echo "Removing type stub files..."
find "$APP_BUNDLE" -type f -name "*.pyi" -delete 2>/dev/null || true

# Calculate and display size
SIZE=$(du -sh "$APP_BUNDLE" | cut -f1)
echo "Optimization complete! App bundle size: $SIZE"

