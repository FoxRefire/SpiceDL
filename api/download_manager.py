"""
Download manager for spotDL integration
"""
import subprocess
import threading
import os
import json
from typing import Dict, Optional
from datetime import datetime
from pathlib import Path


class DownloadManager:
    """Manages spotDL downloads and tracks their progress"""
    
    def __init__(self, download_folder: str = "./downloads"):
        self.download_folder = Path(download_folder)
        self.download_folder.mkdir(parents=True, exist_ok=True)
        self.downloads: Dict[str, Dict] = {}
        self.lock = threading.Lock()
    
    def start_download(self, spotify_url: str) -> str:
        """
        Start a download for a Spotify URL
        Returns download ID
        """
        download_id = f"dl_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        
        with self.lock:
            self.downloads[download_id] = {
                "id": download_id,
                "url": spotify_url,
                "status": "starting",
                "progress": 0,
                "message": "Initializing download...",
                "started_at": datetime.now().isoformat(),
                "completed_at": None,
                "error": None,
                "process": None
            }
        
        # Start download in a separate thread
        thread = threading.Thread(
            target=self._download_worker,
            args=(download_id, spotify_url),
            daemon=True
        )
        thread.start()
        
        return download_id
    
    def _download_worker(self, download_id: str, spotify_url: str):
        """Worker thread that executes spotDL download"""
        try:
            with self.lock:
                self.downloads[download_id]["status"] = "downloading"
                self.downloads[download_id]["message"] = "Starting spotDL..."
            
            # Build spotDL command
            cmd = [
                "spotdl",
                spotify_url,
                "--output", str(self.download_folder),
                "--format", "mp3"
            ]
            
            # Start process
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            with self.lock:
                self.downloads[download_id]["process"] = process
            
            # Read output line by line to track progress
            output_lines = []
            for line in process.stdout:
                output_lines.append(line)
                # Try to parse progress from spotDL output
                # spotDL output format may vary, so we'll track it generically
                if "Downloading" in line or "downloading" in line.lower():
                    with self.lock:
                        self.downloads[download_id]["message"] = line.strip()
                elif "%" in line:
                    # Try to extract percentage
                    try:
                        percent = int(line.split("%")[0].split()[-1])
                        with self.lock:
                            self.downloads[download_id]["progress"] = min(percent, 100)
                    except:
                        pass
            
            # Wait for process to complete
            return_code = process.wait()
            
            with self.lock:
                if return_code == 0:
                    self.downloads[download_id]["status"] = "completed"
                    self.downloads[download_id]["progress"] = 100
                    self.downloads[download_id]["message"] = "Download completed successfully"
                    self.downloads[download_id]["completed_at"] = datetime.now().isoformat()
                else:
                    self.downloads[download_id]["status"] = "failed"
                    self.downloads[download_id]["message"] = f"Download failed with code {return_code}"
                    self.downloads[download_id]["error"] = "\n".join(output_lines[-10:])  # Last 10 lines
                    self.downloads[download_id]["completed_at"] = datetime.now().isoformat()
        
        except Exception as e:
            with self.lock:
                self.downloads[download_id]["status"] = "failed"
                self.downloads[download_id]["message"] = f"Error: {str(e)}"
                self.downloads[download_id]["error"] = str(e)
                self.downloads[download_id]["completed_at"] = datetime.now().isoformat()
    
    def get_status(self, download_id: Optional[str] = None) -> Dict:
        """
        Get download status
        If download_id is None, returns all downloads
        """
        with self.lock:
            if download_id:
                return self.downloads.get(download_id, {"error": "Download not found"})
            else:
                return {
                    "downloads": list(self.downloads.values()),
                    "total": len(self.downloads)
                }
    
    def cancel_download(self, download_id: str) -> bool:
        """Cancel a running download"""
        with self.lock:
            if download_id not in self.downloads:
                return False
            
            download = self.downloads[download_id]
            if download["status"] in ["starting", "downloading"]:
                process = download.get("process")
                if process:
                    try:
                        process.terminate()
                        process.wait(timeout=5)
                    except:
                        process.kill()
                
                download["status"] = "cancelled"
                download["message"] = "Download cancelled"
                download["completed_at"] = datetime.now().isoformat()
                return True
        
        return False


