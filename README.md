# SpiceDL

Spicetify extension and API server for downloading music from Spotify

## Features

### Spicetify Extension
- Adds "Download with SpiceDL" button to track and album context menus
- Download status page (accessible from profile menu)
- Integrates with SpiceDL API server to manage downloads

### API Server
- REST API to receive Spotify URLs and download using spotDL
- Download progress tracking
- GUI settings window (download folder, port settings, etc.)
- System tray icon (multi-platform support)

## Setup

### 1. API Server Setup

See [api/README.md](./api/README.md) for details.

```bash
cd api
pip install -r requirements.txt
pip install spotdl
python app.py
```

### 2. Build Spicetify Extension

```bash
npm install
npm run build
```

### 3. Apply to Spicetify

```bash
spicetify apply
```

## Usage

### Starting the API Server

1. Run `python app.py` in the `api` directory
2. An icon will appear in the system tray
3. Right-click the icon and select "Settings" to change settings

### Using the Spicetify Extension

1. Right-click on tracks or albums in Spotify
2. Select "Download with SpiceDL"
3. Download will start
4. Select "Download Status" from the profile menu to check progress

## Documentation

- [API Documentation](./api/API_DOCUMENTATION.md) - Detailed API usage
- [API README](./api/README.md) - API server setup and usage

## Tech Stack

- **Spicetify Creator** - Spicetify extension development
- **TypeScript/React** - Extension UI
- **Python/Flask** - REST API server
- **spotDL** - Music download from Spotify
- **pystray** - System tray icon
- **PySide6** - Settings GUI

## Development

### Extension Development

```bash
npm run watch  # Watch for file changes and auto-build
```

### API Server Development

```bash
cd api
python main.py  # Start in development mode (no GUI)
```

## License

MIT
