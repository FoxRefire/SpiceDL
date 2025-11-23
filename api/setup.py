"""
Setup script for Py2App (macOS App bundle)
"""
from setuptools import setup

APP = ['app.py']
DATA_FILES = [
    ('', ['config.json']),
]
OPTIONS = {
    'argv_emulation': True,
    'packages': [
        'flask',
        'flask_cors',
        'PySide6',
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
    'excludes': [
        'tkinter',
        'matplotlib',
        'numpy',
        'pandas',
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

