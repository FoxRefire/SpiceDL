<p align="center">
  <img width="180" src="https://github.com/user-attachments/assets/117928ee-70e7-46fb-8df9-87f59aa377f6">
  <h1 align="center">SpiceDL</h1>
  <div align="center">Spicetify extension that downloads music using SpotDL</div>
</p>

## Installation

### 1. Install extension
Install SpiceDL from Spicetify marketplace or [releases](https://github.com/FoxRefire/SpiceDL/releases/download/1.0/spicedl.js)

### 2. Install backend API
* [Windows](https://github.com/FoxRefire/SpiceDL/releases/download/2.0/api-windows.exe)
* [Mac](https://github.com/FoxRefire/SpiceDL/releases/download/2.0/api-mac.zip)
* [Python(Linux/Windows/Mac)](https://github.com/FoxRefire/SpiceDL/releases/download/2.0/api-python-multiplatform.zip)

You can execute python backend by running following commands
```bash
cd api-python-multiplatform
pip install -r requirements.txt
pip install spotdl
python app.py
```

Or click standalone prebuilt package for your platform.

The API server will start and show a system tray icon. Right-click the icon to access settings.

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

## Usage

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

## Screenshots
<img width="256" src="https://github.com/user-attachments/assets/d0a6e21a-99fa-4074-b8e2-2359327d74bb" />
<img width="256" src="https://github.com/user-attachments/assets/12fe2682-fe9b-467a-b400-987ed276bad0" />
<img width="256" src="https://github.com/user-attachments/assets/aa1c16c7-2e5b-4e8b-ba76-9d3a47b52435" />


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
