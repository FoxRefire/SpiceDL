#!/bin/bash
# Post-build optimization script for macOS App bundle

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_BUNDLE="${1:-${SCRIPT_DIR}/build/py2app/dist/SpiceDL API.app}"

if [ ! -d "$APP_BUNDLE" ]; then
    echo "Error: App bundle not found: $APP_BUNDLE"
    exit 1
fi

echo "Optimizing App bundle: $APP_BUNDLE"

# Path to PySide6 in the app bundle
PYTHON_LIB="${APP_BUNDLE}/Contents/Resources/lib/python3.11"
PYSIDE6_DIR="${PYTHON_LIB}/PySide6"
QT_DIR="${PYSIDE6_DIR}/Qt"
PYTHON_FRAMEWORK="${APP_BUNDLE}/Contents/Frameworks/Python.framework"

if [ -d "$PYSIDE6_DIR" ]; then
    echo "Aggressively removing unnecessary PySide6 files..."
    
    # Remove development tools (Assistant, Designer, Linguist)
    echo "Removing development tools..."
    rm -rf "${PYSIDE6_DIR}/Assistant.app" 2>/dev/null || true
    rm -rf "${PYSIDE6_DIR}/Designer.app" 2>/dev/null || true
    rm -rf "${PYSIDE6_DIR}/Linguist.app" 2>/dev/null || true
    
    # Remove huge QtWebEngineCore framework (130M+)
    echo "Removing QtWebEngineCore framework..."
    rm -rf "${QT_DIR}/lib/QtWebEngineCore.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtWebEngine.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtWebEngineWidgets.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtWebEngineQuick.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtWebEngineQuickDelegatesQml.framework" 2>/dev/null || true
    
    # Remove other large frameworks
    echo "Removing large unnecessary frameworks..."
    rm -rf "${QT_DIR}/lib/QtPdf.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtPdfQuick.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtPdfWidgets.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtShaderTools.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtGraphs.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtGraphsWidgets.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtRemoteObjects.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtRemoteObjectsQml.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtScxml.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtScxmlQml.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtSerialBus.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtSpatialAudio.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtStateMachine.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtStateMachineQml.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtTextToSpeech.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtVirtualKeyboard.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtVirtualKeyboardQml.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtVirtualKeyboardSettings.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtWebChannel.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtWebChannelQuick.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtWebView.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtWebViewQuick.framework" 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtHttpServer.framework" 2>/dev/null || true
    
    # Remove all Qt3D frameworks
    echo "Removing Qt3D frameworks..."
    rm -rf "${QT_DIR}/lib/Qt3D"*.framework 2>/dev/null || true
    
    # Remove all QtQuick3D frameworks
    echo "Removing QtQuick3D frameworks..."
    rm -rf "${QT_DIR}/lib/QtQuick3D"*.framework 2>/dev/null || true
    
    # Remove all QtQuickControls2 frameworks
    echo "Removing QtQuickControls2 frameworks..."
    rm -rf "${QT_DIR}/lib/QtQuickControls2"*.framework 2>/dev/null || true
    
    # Remove all QtQuick* frameworks (except QtQuick itself if needed, but we don't use it)
    echo "Removing QtQuick frameworks..."
    rm -rf "${QT_DIR}/lib/QtQuick"*.framework 2>/dev/null || true
    rm -rf "${QT_DIR}/lib/QtQml"*.framework 2>/dev/null || true
    
    # Remove Qt plugins directory entirely (keep only platform plugins if needed)
    PLUGINS_DIR="${QT_DIR}/plugins"
    if [ -d "$PLUGINS_DIR" ]; then
        echo "Removing Qt plugins (keeping only platforms)..."
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
                  QtHelp QtDesigner QtUiTools QtPdf QtPdfQuick QtPdfWidgets QtShaderTools \
                  QtGraphs QtGraphsWidgets QtRemoteObjects QtScxml QtSerialBus QtSpatialAudio \
                  QtStateMachine QtTextToSpeech QtVirtualKeyboard QtWebChannel QtWebView \
                  QtHttpServer QtConcurrent QtDBus; do
        find "$PYSIDE6_DIR" -type d -name "$module" -exec rm -rf {} + 2>/dev/null || true
        find "$PYSIDE6_DIR" -type f -name "${module}*" -delete 2>/dev/null || true
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

# Optimize Python framework
if [ -d "$PYTHON_FRAMEWORK" ]; then
    echo "Optimizing Python framework..."
    # Remove include directories (not needed at runtime)
    find "$PYTHON_FRAMEWORK" -type d -name "include" -exec rm -rf {} + 2>/dev/null || true
    # Remove _CodeSignature directories
    find "$PYTHON_FRAMEWORK" -type d -name "_CodeSignature" -exec rm -rf {} + 2>/dev/null || true
    # Remove Resources directories (usually empty)
    find "$PYTHON_FRAMEWORK" -type d -name "Resources" -exec rm -rf {} + 2>/dev/null || true
fi

# Remove PySide6 include directories
if [ -d "${PYSIDE6_DIR}/include" ]; then
    echo "Removing PySide6 include directories..."
    rm -rf "${PYSIDE6_DIR}/include" 2>/dev/null || true
fi

# Remove PySide6 scripts (deployment scripts, not needed)
if [ -d "${PYSIDE6_DIR}/scripts" ]; then
    echo "Removing PySide6 scripts..."
    rm -rf "${PYSIDE6_DIR}/scripts" 2>/dev/null || true
fi

# Remove PySide6 typesystems (not needed at runtime)
if [ -d "${PYSIDE6_DIR}/typesystems" ]; then
    echo "Removing PySide6 typesystems..."
    rm -rf "${PYSIDE6_DIR}/typesystems" 2>/dev/null || true
fi

# Remove PySide6 doc
if [ -d "${PYSIDE6_DIR}/doc" ]; then
    echo "Removing PySide6 documentation..."
    rm -rf "${PYSIDE6_DIR}/doc" 2>/dev/null || true
fi

# Remove PySide6 lib/cmake (build files, not needed)
if [ -d "${PYSIDE6_DIR}/lib" ]; then
    echo "Removing PySide6 build files..."
    rm -rf "${PYSIDE6_DIR}/lib" 2>/dev/null || true
fi

# Remove Qt metatypes (not needed at runtime)
if [ -d "${QT_DIR}/metatypes" ]; then
    echo "Removing Qt metatypes..."
    rm -rf "${QT_DIR}/metatypes" 2>/dev/null || true
fi

# Remove Qt libexec
if [ -d "${QT_DIR}/libexec" ]; then
    echo "Removing Qt libexec..."
    rm -rf "${QT_DIR}/libexec" 2>/dev/null || true
fi

# Calculate and display size
SIZE=$(du -sh "$APP_BUNDLE" | cut -f1)
echo "Optimization complete! App bundle size: $SIZE"

