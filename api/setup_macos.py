"""
Py2App setup file for macOS .app bundle
"""
from setuptools import setup
from pathlib import Path

APP = ['app.py']
APP_NAME = 'spotDL API'  # This will be used as the app bundle name

# Include config.json if it exists
from pathlib import Path
DATA_FILES = []
config_json = Path('config.json')
if config_json.exists():
    DATA_FILES.append(('', [str(config_json)]))

OPTIONS = {
    'argv_emulation': True,
    'packages': [
        'flask',
        'flask_cors',
        'PySide6',
        'PySide6.QtCore',
        'PySide6.QtGui',
        'PySide6.QtWidgets',
    ],
    'includes': [
        'main',
        'config_manager',
        'download_manager',
        'gui',
        'tray_app',
    ],
    'excludes': [
        'matplotlib',
        'numpy',
        'pandas',
        'scipy',
    ],
    'iconfile': None,  # Add icon path here if you have one
    'plist': {
        'CFBundleName': 'spotDL API',
        'CFBundleDisplayName': 'spotDL API',
        'CFBundleGetInfoString': 'spotDL API Server',
        'CFBundleIdentifier': 'com.spotdl.api',
        'CFBundleVersion': '1.0.0',
        'CFBundleShortVersionString': '1.0.0',
        'NSHumanReadableCopyright': 'Copyright © 2024',
        'NSHighResolutionCapable': True,
        'LSUIElement': False,  # Set to True to hide from dock
    },
}

setup(
    app=APP,
    data_files=DATA_FILES,
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
)

