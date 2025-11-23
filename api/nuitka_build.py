#!/usr/bin/env python3
"""
Build script for Nuitka (Windows EXE)
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path

def build_exe():
    """Build Windows EXE using Nuitka"""
    script_dir = Path(__file__).parent
    build_dir = script_dir / "build" / "nuitka"
    dist_dir = build_dir / "dist"
    
    # Clean previous builds
    if build_dir.exists():
        shutil.rmtree(build_dir)
    build_dir.mkdir(parents=True, exist_ok=True)
    
    # Main entry point
    main_script = script_dir / "app.py"
    
    # Check if Nuitka is installed
    try:
        import nuitka
    except ImportError:
        print("Nuitka not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "nuitka"])
    
    # Ensure dist directory exists
    dist_dir.mkdir(parents=True, exist_ok=True)
    
    # Build command
    cmd = [
        sys.executable, "-m", "nuitka",
        "--standalone",
        "--onefile",
        "--windows-console-mode=attach",  # Show console window
        "--include-module=flask",
        "--include-module=flask_cors",
        "--include-module=werkzeug",
        "--include-module=click",
        "--include-module=itsdangerous",
        "--include-module=jinja2",
        "--include-module=markupsafe",
        "--include-module=PySide6",
        "--include-module=PySide6.QtCore",
        "--include-module=PySide6.QtWidgets",
        "--include-module=PySide6.QtGui",
        "--include-module=config_manager",
        "--include-module=download_manager",
        "--include-module=gui",
        "--include-module=tray_app",
        "--include-module=main",
        "--enable-plugin=pyside6",  # For PySide6 support
        f"--output-dir={dist_dir}",
        "--output-filename=spicedl2-api.exe",
        "--assume-yes-for-downloads",
        str(main_script)
    ]
    
    # Add icon file if available
    icon_file = script_dir / "icon.ico"
    if icon_file.exists():
        cmd.insert(-1, f"--windows-icon-from-ico={icon_file}")
    
    # Add data files if needed
    config_file = script_dir / "config.json"
    if config_file.exists():
        cmd.extend([f"--include-data-file={config_file}={config_file.name}"])
    
    print(f"Building EXE with command: {' '.join(cmd)}")
    subprocess.check_call(cmd, cwd=str(script_dir))
    
    print(f"Build complete! EXE is in {dist_dir}")

if __name__ == "__main__":
    build_exe()

