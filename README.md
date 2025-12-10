<p align="center">
  <img width="180" src="https://github.com/user-attachments/assets/117928ee-70e7-46fb-8df9-87f59aa377f6">
  <h1 align="center">SpiceDL</h1>
  <div align="center">Spicetify extension that downloads music using SpotDL</div>
</p>

## Features

### Spicetify Extension
- 🎵 Adds "Download with SpiceDL" button to track, album, and playlist context menus
- 📊 Download status page (accessible from profile menu)
- ⚙️ Extension settings page for API configuration
- 🌍 Multi-language support (English, Japanese, Spanish, Italian, French, Russian, Chinese)
- 🔄 Real-time download progress tracking
- Integrates with SpiceDL API server to manage downloads

### API Server
- 🚀 REST API to receive Spotify URLs and download using spotDL
- 📈 Download progress tracking
- 🖥️ GUI settings window (download folder, port settings, etc.)
- 🔔 System tray icon (multi-platform support: Windows, macOS, Linux)

## Prerequisites

- [Spicetify](https://spicetify.app/) installed and configured
- Python 3.7+ (for API server)
- Node.js and npm (for building the extension)
- [spotDL](https://spotdl.readthedocs.io/) (will be installed automatically)

## Installation

### Method 1: Install via Spicetify Marketplace (Recommended)

1. Open Spicetify Marketplace
2. Search for "SpiceDL"
3. Click "Install"

### Method 2: Manual Installation

#### 1. API Server Setup

See [api/README.md](./api/README.md) for detailed setup instructions.

```bash
cd api
pip install -r requirements.txt
pip install spotdl
python app.py
```

The API server will start and show a system tray icon. Right-click the icon to access settings.

#### 2. Install Spicetify Extension

```bash
# Clone the repository
git clone https://github.com/FoxRefire/SpiceDL.git
cd SpiceDL

# Install dependencies
npm install

# Build the extension
npm run build

# Apply to Spicetify
spicetify apply
```

## Usage

### Starting the API Server

1. Run `python app.py` in the `api` directory
2. An icon will appear in the system tray
3. Right-click the icon and select "Settings" to change settings (download folder, port, etc.)

**Note:** The API server must be running for the extension to work.

### Using the Spicetify Extension

1. **Start a download:**
   - Right-click on any track, album, or playlist in Spotify
   - Select "Download with SpiceDL" (or "Download Album/Playlist with SpiceDL")
   - The download will start automatically

2. **Check download status:**
   - Click on your profile menu in Spotify
   - Select "Download Status"
   - View all active, completed, and failed downloads
   - Cancel downloads if needed

3. **Configure settings:**
   - Click on your profile menu in Spotify
   - Select "SpiceDL Settings"
   - Configure API server host and port (default: `127.0.0.1:5985`)

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

## Screenshots

_Add screenshots of the extension in action here_

## Troubleshooting

### Extension not working
- Make sure the API server is running (`python api/app.py`)
- Check that the API server port matches the extension settings (default: 5985)
- Verify Spicetify is properly installed: `spicetify --version`

### Downloads not starting
- Ensure spotDL is installed: `pip install spotdl`
- Check API server logs for errors
- Verify the download folder is writable

### API server won't start
- Check if port 5985 is already in use
- Verify Python dependencies are installed: `pip install -r api/requirements.txt`
- On Linux, ensure system tray is available (some desktop environments may not support it)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](./LICENSE) file for details
