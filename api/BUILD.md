# Build Guide

This directory contains scripts to build SpiceDL API for various platforms.

## Supported Build Formats

- **DEB**: Debian/Ubuntu package (using FPM)
- **RPM**: Red Hat/CentOS/Fedora package (using FPM)
- **EXE**: Windows executable (using Nuitka)
- **APP**: macOS application bundle (using Py2App)

## Prerequisites

### All Platforms
- Python 3.11 or higher
- pip

### DEB/RPM Build (Linux)
```bash
# Install FPM
sudo apt-get install ruby ruby-dev build-essential
sudo gem install fpm
```

### EXE Build (Windows)
```bash
# Install Nuitka
pip install nuitka
```

### APP Build (macOS)
```bash
# Install Py2App
pip install py2app
```

## Build Methods

### DEB/RPM Package Build

```bash
cd api
chmod +x build_fpm.sh
./build_fpm.sh
```

You can specify version and architecture using environment variables:

```bash
VERSION=1.0.0 ARCH=amd64 ./build_fpm.sh
```

Built packages are generated in the `build/fpm/` directory.

### Windows EXE Build

```bash
cd api
python nuitka_build.py
```

Built EXE is generated in the `build/nuitka/dist/` directory.

### macOS App Bundle Build

```bash
cd api
chmod +x build_py2app.sh
./build_py2app.sh
```

Built App bundle is generated in the `build/py2app/dist/` directory.

## Automated Build with GitHub Actions

`.github/workflows/build.yml` is configured and automatically builds on the following triggers:

1. **Tag Push**: Pushing a tag in `v*` format builds for all platforms
2. **Manual Run**: You can manually run the workflow from the GitHub Actions UI

### Creating a Release

Pushing a tag automatically creates a GitHub release and uploads the built packages:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Troubleshooting

### FPM Build Errors

- Verify that Ruby and FPM are properly installed
- If dependencies are missing, install them according to the error message

### Nuitka Build Errors

- Make sure Nuitka is the latest version: `pip install --upgrade nuitka`
- Verify that all required modules are included
- On Windows, Visual C++ Build Tools may be required

### Py2App Build Errors

- Only runs on macOS
- Verify that PySide6 dependencies are properly installed
- If adding an icon file (.icns), update the `iconfile` option in `setup.py`

## Customization

### Changing Version Information

You can change version information in each build script:

- **FPM**: `VERSION` variable in `build_fpm.sh`
- **Nuitka**: Specify directly in `nuitka_build.py`
- **Py2App**: `version` and `CFBundleVersion` in `setup.py`

### Adding Icons

- **Windows**: Place `icon.ico` file in the `api/` directory
- **macOS**: Place `icon.icns` file in the `api/` directory and update `iconfile` in `setup.py`
