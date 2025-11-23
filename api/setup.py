"""
Setup script for Py2App (macOS App bundle)
"""
from setuptools import setup

APP = ['app.py']
DATA_FILES = [
    ('', ['config.json']),
]
OPTIONS = {
    'argv_emulation': False,  # Disable to reduce size
    'optimize': 2,  # Maximum optimization
    'strip': True,  # Strip debug symbols
    'semi_standalone': False,  # Fully standalone (but we'll optimize)
    'packages': [
        'flask',
        'flask_cors',
        'config_manager',
        'download_manager',
        'gui',
        'tray_app',
        'main',
    ],
    'includes': [
        'flask',
        'flask_cors',
        'PySide6.QtCore',
        'PySide6.QtWidgets',
        'PySide6.QtGui',
    ],
    'resources': [],  # Don't include unnecessary resources
    'frameworks': [],  # Don't bundle unnecessary frameworks
    'site_packages': False,  # Don't include entire site-packages
    'alias': False,  # Don't create aliases
    'no_chdir': False,  # Allow directory changes
    'excludes': [
        # Standard library modules not needed
        'tkinter',
        'matplotlib',
        'numpy',
        'pandas',
        'scipy',
        'pytest',
        'unittest',
        'doctest',
        'pdb',
        'pydoc',
        'email',
        'http',
        'urllib3',
        'certifi',
        'charset_normalizer',
        'idna',
        # PySide6 modules not needed
        'PySide6.QtWebEngine',
        'PySide6.QtWebEngineWidgets',
        'PySide6.QtWebEngineCore',
        'PySide6.QtMultimedia',
        'PySide6.QtMultimediaWidgets',
        'PySide6.QtQuick',
        'PySide6.QtQuickWidgets',
        'PySide6.QtQml',
        'PySide6.Qt3D',
        'PySide6.Qt3DCore',
        'PySide6.Qt3DRender',
        'PySide6.Qt3DInput',
        'PySide6.Qt3DLogic',
        'PySide6.Qt3DAnimation',
        'PySide6.Qt3DExtras',
        'PySide6.QtCharts',
        'PySide6.QtDataVisualization',
        'PySide6.QtLocation',
        'PySide6.QtPositioning',
        'PySide6.QtSensors',
        'PySide6.QtSerialPort',
        'PySide6.QtSql',
        'PySide6.QtSvg',
        'PySide6.QtSvgWidgets',
        'PySide6.QtTest',
        'PySide6.QtXml',
        'PySide6.QtXmlPatterns',
        'PySide6.QtBluetooth',
        'PySide6.QtNfc',
        'PySide6.QtWebSockets',
        'PySide6.QtNetwork',
        'PySide6.QtOpenGL',
        'PySide6.QtOpenGLWidgets',
        'PySide6.QtPrintSupport',
        'PySide6.QtHelp',
        'PySide6.QtDesigner',
        'PySide6.QtUiTools',
        # Flask modules not needed (but keep essential dependencies)
        'flask.cli',
        'flask.testing',
        'werkzeug.debug',
        'werkzeug.testing',
        # Other unnecessary modules
        'distutils',
        'setuptools',
        'pkg_resources',
        'IPython',
        'jupyter',
        'notebook',
    ],
    'iconfile': None,  # Add path to .icns file if available
    'plist': {
        'CFBundleName': 'spiceDL2 API',
        'CFBundleDisplayName': 'spiceDL2 API',
        'CFBundleGetInfoString': 'spiceDL2 API Server',
        'CFBundleIdentifier': 'com.spicedl2.api',
        'CFBundleVersion': '1.0.0',
        'CFBundleShortVersionString': '1.0.0',
        'NSHighResolutionCapable': True,
        'LSUIElement': False,  # Show in dock
        'PyRuntimeLocations': [],  # Don't bundle Python runtime if system Python is available
    },
}

setup(
    app=APP,
    data_files=DATA_FILES,
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
    name='spiceDL2 API',
    version='1.0.0',
    description='spiceDL2 API Server',
)

