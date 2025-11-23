"""
Download manager for spotDL integration
"""
import subprocess
import threading
import os
import json
import shutil
import sys
import re
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
        self.spotdl_command = self._find_spotdl_command()
    
    def _find_spotdl_command(self) -> list:
        """
        Find spotDL command. Try multiple methods:
        1. 'spotdl' command in PATH
        2. 'python -m spotdl'
        3. 'python3 -m spotdl'
        """
        # Try 'spotdl' command directly
        spotdl_path = shutil.which("spotdl")
        if spotdl_path:
            return ["spotdl"]
        
        # Try 'python -m spotdl'
        python_path = shutil.which("python")
        if python_path:
            try:
                result = subprocess.run(
                    [python_path, "-m", "spotdl", "--version"],
                    capture_output=True,
                    timeout=5
                )
                if result.returncode == 0:
                    return [python_path, "-m", "spotdl"]
            except:
                pass
        
        # Try 'python3 -m spotdl'
        python3_path = shutil.which("python3")
        if python3_path:
            try:
                result = subprocess.run(
                    [python3_path, "-m", "spotdl", "--version"],
                    capture_output=True,
                    timeout=5
                )
                if result.returncode == 0:
                    return [python3_path, "-m", "spotdl"]
            except:
                pass
        
        # Try using sys.executable (current Python interpreter)
        try:
            result = subprocess.run(
                [sys.executable, "-m", "spotdl", "--version"],
                capture_output=True,
                timeout=5
            )
            if result.returncode == 0:
                return [sys.executable, "-m", "spotdl"]
        except:
            pass
        
        # If nothing works, return None (will raise error later)
        return None
    
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
                "process": None,
                "total_tracks": None,
                "completed_tracks": 0
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
            
            # Check if spotDL command is available
            if self.spotdl_command is None:
                raise FileNotFoundError(
                    "spotDLが見つかりません。以下のコマンドでインストールしてください:\n"
                    "  pip install spotdl\n"
                    "または\n"
                    "  pip install git+https://github.com/spotDL/spotify-downloader.git"
                )
            
            # Get list of files before download
            files_before = set()
            if self.download_folder.exists():
                files_before = set(f.name for f in self.download_folder.iterdir() if f.is_file())
            
            # Build spotDL command with --simple-tui for better progress tracking
            cmd = self.spotdl_command + [
                "download",
                spotify_url,
                "--output", str(self.download_folder),
                "--format", "mp3",
                "--simple-tui",
            ]
            
            # Log the command being executed
            print(f"Executing spotDL command: {' '.join(cmd)}")
            print(f"Download folder: {self.download_folder}")
            
            # Start process
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,  # Combine stderr into stdout
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            with self.lock:
                self.downloads[download_id]["process"] = process
                # Initialize track counters
                self.downloads[download_id]["total_tracks"] = None
                self.downloads[download_id]["completed_tracks"] = 0
            
            # Read output line by line to track progress
            output_lines = []
            
            for line in process.stdout:
                if line:
                    output_lines.append(line)
                    line_stripped = line.strip()
                    print(f"spotDL: {line_stripped}")
                    
                    # Parse progress from --simple-tui output
                    # Format examples: "Downloading 1/10", "Downloaded 5/10", etc.
                    # Also look for patterns like "[1/10]" or "(1/10)"
                    progress_match = re.search(r'(\d+)/(\d+)', line_stripped)
                    if progress_match:
                        completed = int(progress_match.group(1))
                        total = int(progress_match.group(2))
                        with self.lock:
                            self.downloads[download_id]["completed_tracks"] = completed
                            self.downloads[download_id]["total_tracks"] = total
                            if total > 0:
                                self.downloads[download_id]["progress"] = min(int((completed / total) * 100), 100)
                            self.downloads[download_id]["message"] = f"Downloading {completed}/{total} tracks"
                    
                    # Try to parse progress from spotDL output
                    if "Downloading" in line or "downloading" in line.lower() or "Fetching" in line or "Converting" in line:
                        with self.lock:
                            if not progress_match:  # Only update message if we didn't already update it
                                self.downloads[download_id]["message"] = line_stripped
                    elif "%" in line and not progress_match:
                        try:
                            percent = int(line.split("%")[0].split()[-1])
                            with self.lock:
                                self.downloads[download_id]["progress"] = min(percent, 100)
                        except:
                            pass
                    elif "error" in line.lower() or "failed" in line.lower() or "exception" in line.lower():
                        with self.lock:
                            current_error = self.downloads[download_id].get("error", "")
                            if line_stripped not in current_error:
                                self.downloads[download_id]["error"] = (current_error + "\n" + line_stripped).strip()
            
            # Wait for process to complete
            return_code = process.wait()
            
            # Get full output
            full_output = "\n".join(output_lines)
            
            # Wait a bit for file system to sync
            import time
            time.sleep(1)
            
            # Check if files were actually created
            files_after = set()
            if self.download_folder.exists():
                files_after = set(f.name for f in self.download_folder.iterdir() if f.is_file())
            
            new_files = files_after - files_before
            
            with self.lock:
                if return_code == 0:
                    # Check if files were actually created
                    if new_files:
                        self.downloads[download_id]["status"] = "completed"
                        self.downloads[download_id]["progress"] = 100
                        file_list = ", ".join(list(new_files)[:5])  # Show first 5 files
                        if len(new_files) > 5:
                            file_list += f" and {len(new_files) - 5} more"
                        self.downloads[download_id]["message"] = f"Download completed successfully. Files: {file_list}"
                        self.downloads[download_id]["completed_at"] = datetime.now().isoformat()
                        self.downloads[download_id]["downloaded_files"] = list(new_files)
                    else:
                        # Process returned 0 but no files were created
                        self.downloads[download_id]["status"] = "failed"
                        self.downloads[download_id]["message"] = "Download completed but no files were created"
                        self.downloads[download_id]["error"] = full_output if full_output else "No output from spotDL. Check if spotDL is properly installed and configured."
                        self.downloads[download_id]["completed_at"] = datetime.now().isoformat()
                        print(f"Warning: spotDL returned 0 but no files were created in {self.download_folder}")
                        print(f"Full output: {full_output}")
                else:
                    self.downloads[download_id]["status"] = "failed"
                    self.downloads[download_id]["message"] = f"Download failed with code {return_code}"
                    self.downloads[download_id]["error"] = full_output if full_output else f"Process exited with code {return_code}"
                    self.downloads[download_id]["completed_at"] = datetime.now().isoformat()
                    print(f"Error: spotDL failed with return code {return_code}")
                    print(f"Full output: {full_output}")
        
        except FileNotFoundError as e:
            # spotDL command not found
            with self.lock:
                self.downloads[download_id]["status"] = "failed"
                error_msg = str(e)
                self.downloads[download_id]["message"] = "spotDLが見つかりません"
                self.downloads[download_id]["error"] = error_msg
                self.downloads[download_id]["completed_at"] = datetime.now().isoformat()
        except Exception as e:
            with self.lock:
                self.downloads[download_id]["status"] = "failed"
                error_msg = str(e)
                self.downloads[download_id]["message"] = f"エラー: {error_msg}"
                self.downloads[download_id]["error"] = error_msg
                self.downloads[download_id]["completed_at"] = datetime.now().isoformat()
    
    def get_status(self, download_id: Optional[str] = None) -> Dict:
        """
        Get download status
        If download_id is None, returns all downloads
        """
        def _serialize_download(download: Dict) -> Dict:
            """Convert download dict to JSON-serializable format"""
            serialized = download.copy()
            # Remove process object (not JSON serializable)
            if "process" in serialized:
                process = serialized.pop("process")
                # Add process status info if available
                if process is not None:
                    try:
                        # Check if process is still running
                        poll_result = process.poll()
                        serialized["process_running"] = poll_result is None
                        if poll_result is not None:
                            serialized["process_return_code"] = poll_result
                    except:
                        serialized["process_running"] = False
                else:
                    serialized["process_running"] = False
            return serialized
        
        with self.lock:
            if download_id:
                download = self.downloads.get(download_id)
                if download is None:
                    return {"error": "Download not found"}
                return _serialize_download(download)
            else:
                return {
                    "downloads": [_serialize_download(dl) for dl in self.downloads.values()],
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


