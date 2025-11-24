# SpiceDL API Server

Multi-platform Spotify download API server

## Features

- REST API to receive Spotify URLs and download using spotDL
- Download progress tracking
- GUI settings window (download folder, port settings, etc.)
- System tray icon

## Setup

### 1. Install spotDL

First, you need to install spotDL:

```bash
# Install via pip
pip install spotdl

# Or install the latest version
pip install git+https://github.com/spotDL/spotify-downloader.git
```

### 2. Install Python Dependencies

```bash
cd api
pip install -r requirements.txt
```

## Usage

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Starting the Server

```bash
python app.py
```

When started:
- An icon will appear in the system tray
- Right-click the icon and select "Settings" to change settings
- The API server starts at `http://127.0.0.1:5985` by default

### API Endpoints

#### POST /download
Send a Spotify URL to start a download

```bash
curl -X POST http://127.0.0.1:5985/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://open.spotify.com/track/..."}'
```

Response:
```json
{
  "success": true,
  "download_id": "dl_20240101_120000_123456",
  "message": "Download started"
}
```

#### GET /status
Get download progress

```bash
# Get status of all downloads
curl http://127.0.0.1:5985/status

# Get status of a specific download
curl http://127.0.0.1:5985/status?id=dl_20240101_120000_123456
```

Response:
```json
{
  "id": "dl_20240101_120000_123456",
  "url": "https://open.spotify.com/track/...",
  "status": "downloading",
  "progress": 45,
  "message": "Downloading...",
  "started_at": "2024-01-01T12:00:00",
  "completed_at": null,
  "error": null
}
```

#### POST /cancel
Cancel a download

```bash
curl -X POST http://127.0.0.1:5985/cancel \
  -H "Content-Type: application/json" \
  -d '{"id": "dl_20240101_120000_123456"}'
```

#### GET /health
Health check

```bash
curl http://127.0.0.1:5985/health
```

## Configuration

Settings are saved in the `config.json` file. You can change them from the GUI or edit directly.

```json
{
  "download_folder": "/path/to/downloads",
  "port": 5985,
  "host": "127.0.0.1"
}
```

## Supported Platforms

- Windows
- macOS
- Linux

## Notes

- spotDL must be properly installed
- Write permissions are required for the download folder
- The settings window may appear on first launch
