# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for spotDL API Windows executable
"""
import sys
from pathlib import Path

block_cipher = None

# Get the directory where this spec file is located
spec_dir = Path(SPECPATH)
api_dir = spec_dir

# Collect data files (config.json may not exist)
datas = []
config_json = api_dir / 'config.json'
if config_json.exists():
    datas.append((str(config_json), '.'))

a = Analysis(
    ['app.py'],
    pathex=[str(api_dir)],
    binaries=[],
    datas=datas,
    hiddenimports=[
        'flask',
        'flask_cors',
        'PySide6',
        'PySide6.QtCore',
        'PySide6.QtGui',
        'PySide6.QtWidgets',
        'threading',
        'json',
        'pathlib',
        'subprocess',
        'platform',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='spotdl-api',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Keep console for debugging, set to False for windowed app
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Add icon path here if you have one
)

