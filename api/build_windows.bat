@echo off
REM Build script for Windows .exe using PyInstaller
setlocal enabledelayedexpansion

set APP_NAME=spotdl-api
set VERSION=%1
if "%VERSION%"=="" set VERSION=1.0.0

echo Building %APP_NAME% v%VERSION% for Windows...

REM Create build directories
if not exist "build" mkdir build
if not exist "dist" mkdir dist

REM Create virtual environment
echo Creating virtual environment...
python -m venv build\venv
call build\venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

REM Install spotdl if not available
where spotdl >nul 2>&1
if errorlevel 1 (
    echo Installing spotdl...
    pip install spotdl
)

REM Build with PyInstaller
echo Building executable...
pyinstaller spotdl-api.spec --clean --noconfirm

echo Build complete! Executable is in dist\

