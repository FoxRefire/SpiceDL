"""
Main REST API server for SpiceDL download service
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from download_manager import DownloadManager
from config_manager import ConfigManager
import threading
import sys
import os

# Only import gui if not in headless mode
gui = None
if os.environ.get("SPICEDL_HEADLESS") != "1":
    try:
        import gui
    except ImportError as e:
        print(f"Warning: GUI module not available: {e}")
        gui = None

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize managers
config_manager = ConfigManager()
download_manager = DownloadManager(
    download_folder=config_manager.get("download_folder")
)

# Dependencies check is now handled in app.py to avoid duplicate dialogs
# Print dependency status for logging
missing = download_manager.get_missing_dependencies()
if missing:
    print(f"Warning: Missing dependencies: {', '.join(missing)}")
else:
    print("All dependencies found:")
    if download_manager.spotdl_command:
        print(f"  spotDL: {' '.join(download_manager.spotdl_command)}")
    if download_manager.ffmpeg_command:
        print(f"  ffmpeg: {download_manager.ffmpeg_command}")
    if download_manager.yt_dlp_command:
        print(f"  yt-dlp: {download_manager.yt_dlp_command}")


@app.route("/download", methods=["POST"])
def download():
    """Start a download from Spotify URL"""
    try:
        # Check dependencies before starting download
        missing = download_manager.get_missing_dependencies()
        if missing:
            missing_list = ", ".join(missing)
            return jsonify({
                "error": f"Missing required dependencies: {missing_list}. Please install them before downloading."
            }), 400
        
        data = request.get_json()
        if not data or "url" not in data:
            return jsonify({"error": "Missing 'url' parameter"}), 400
        
        spotify_url = data["url"]
        if not spotify_url or not isinstance(spotify_url, str):
            return jsonify({"error": "Invalid URL"}), 400
        
        # Validate Spotify URL format
        if not (spotify_url.startswith("https://open.spotify.com/") or 
                spotify_url.startswith("http://open.spotify.com/")):
            return jsonify({"error": "Invalid Spotify URL format"}), 400
        
        download_id = download_manager.start_download(spotify_url)
        
        return jsonify({
            "success": True,
            "download_id": download_id,
            "message": "Download started"
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/status", methods=["GET"])
def status():
    """Get download status"""
    try:
        download_id = request.args.get("id")
        status_data = download_manager.get_status(download_id)
        
        return jsonify(status_data), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/cancel", methods=["POST"])
def cancel():
    """Cancel a download"""
    try:
        data = request.get_json()
        if not data or "id" not in data:
            return jsonify({"error": "Missing 'id' parameter"}), 400
        
        download_id = data["id"]
        success = download_manager.cancel_download(download_id)
        
        if success:
            return jsonify({"success": True, "message": "Download cancelled"}), 200
        else:
            return jsonify({"error": "Download not found or cannot be cancelled"}), 404
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok"}), 200


@app.route("/open-settings", methods=["POST"])
def open_settings():
    """Open GUI settings window"""
    try:
        if gui is None:
            return jsonify({
                "error": "GUI is not available in headless mode"
            }), 503
        
        def on_config_changed():
            """Callback when config is changed"""
            # Update download manager folder if needed
            from pathlib import Path
            new_folder = config_manager.get("download_folder")
            if new_folder:
                download_manager.download_folder = Path(new_folder).resolve()
                download_manager.download_folder.mkdir(parents=True, exist_ok=True)
        
        # Show settings window in a separate thread
        gui.show_settings(config_manager, on_config_changed)
        
        return jsonify({
            "success": True,
            "message": "Settings window opened"
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/open-download-folder", methods=["POST"])
def open_download_folder():
    """Open download folder in file manager"""
    try:
        import platform
        import subprocess
        
        folder_path = download_manager.download_folder.resolve()
        
        # Ensure folder exists
        folder_path.mkdir(parents=True, exist_ok=True)
        
        # Open folder based on platform
        system = platform.system()
        if system == "Windows":
            subprocess.Popen(["explorer", str(folder_path)])
        elif system == "Darwin":  # macOS
            subprocess.Popen(["open", str(folder_path)])
        else:  # Linux and others
            subprocess.Popen(["xdg-open", str(folder_path)])
        
        return jsonify({
            "success": True,
            "message": f"Opened download folder: {folder_path}",
            "path": str(folder_path)
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def run_server(host=None, port=None):
    """Run the Flask server"""
    host = host or config_manager.get("host", "127.0.0.1")
    port = port or config_manager.get("port", 5985)
    
    print(f"Starting server on {host}:{port}")
    app.run(host=host, port=port, debug=False, use_reloader=False)


if __name__ == "__main__":
    run_server()


