"""
Main REST API server for spotDL download service
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from download_manager import DownloadManager
from config_manager import ConfigManager
import threading
import sys
import os
import gui

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize managers
config_manager = ConfigManager()
download_manager = DownloadManager(
    download_folder=config_manager.get("download_folder")
)

# Check if spotDL is available on startup
if download_manager.spotdl_command is None:
    print("警告: spotDLが見つかりません。")
    print("以下のコマンドでインストールしてください:")
    print("  pip install spotdl")
    print("または")
    print("  pip install git+https://github.com/spotDL/spotify-downloader.git")
else:
    print(f"spotDLコマンドが見つかりました: {' '.join(download_manager.spotdl_command)}")


@app.route("/download", methods=["POST"])
def download():
    """Start a download from Spotify URL"""
    try:
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


def run_server(host=None, port=None):
    """Run the Flask server"""
    host = host or config_manager.get("host", "127.0.0.1")
    port = port or config_manager.get("port", 5985)
    
    print(f"Starting server on {host}:{port}")
    app.run(host=host, port=port, debug=False, use_reloader=False)


if __name__ == "__main__":
    run_server()


